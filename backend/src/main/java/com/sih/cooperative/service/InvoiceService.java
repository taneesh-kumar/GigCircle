package com.sih.cooperative.service;

import com.sih.cooperative.config.EarningsConfig;
import com.sih.cooperative.dto.InvoiceResponse;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.InvoiceRepository;
import com.sih.cooperative.repository.JobRepository;
import com.sih.cooperative.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final EarningsConfig earningsConfig;
    private final NotificationService notificationService;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          JobRepository jobRepository,
                          UserRepository userRepository,
                          EarningsConfig earningsConfig,
                          NotificationService notificationService) {
        this.invoiceRepository = invoiceRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.earningsConfig = earningsConfig;
        this.notificationService = notificationService;
    }

    private User getAuthenticatedUser(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void validateUserAccess(Job job, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            return;
        }

        boolean isCustomer = job.getServiceRequest() != null &&
                job.getServiceRequest().getCustomer() != null &&
                job.getServiceRequest().getCustomer().getId().equals(currentUser.getId());

        boolean isWorker = job.getWorker() != null &&
                job.getWorker().getId().equals(currentUser.getId());

        if (!isCustomer && !isWorker) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to invoice");
        }
    }

    private synchronized String generateUniqueInvoiceNumber() {
        int currentYear = Year.now().getValue();
        String prefix = "GC-" + currentYear + "-";
        
        long count = invoiceRepository.count();
        long sequenceNumber = count + 1;

        while (true) {
            String candidate = String.format("%s%06d", prefix, sequenceNumber);
            if (!invoiceRepository.existsByInvoiceNumber(candidate)) {
                return candidate;
            }
            sequenceNumber++;
        }
    }

    @Transactional
    public InvoiceResponse getOrCreateInvoiceForJob(Long jobId, String userEmail) {
        User currentUser = getAuthenticatedUser(userEmail);

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        validateUserAccess(job, currentUser);

        // Idempotency check: Return existing invoice if present
        Optional<Invoice> existingInvoice = invoiceRepository.findByJobId(jobId);
        if (existingInvoice.isPresent()) {
            return InvoiceResponse.fromEntity(existingInvoice.get());
        }

        // Must have assigned worker and valid customer
        if (job.getWorker() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot generate invoice for job without assigned worker");
        }

        ServiceRequest request = job.getServiceRequest();
        if (request == null || request.getCustomer() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Job must have a valid customer");
        }

        if (request.getBudget() == null || request.getBudget().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Service request budget must be greater than zero");
        }

        // Authoritative financial totals calculation
        BigDecimal totalAmount = request.getBudget().setScale(2, RoundingMode.HALF_UP);
        BigDecimal feePercentage = earningsConfig.getPlatformFeePercentage();
        BigDecimal platformFee = totalAmount
                .multiply(feePercentage)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal serviceCharge = totalAmount.subtract(platformFee).setScale(2, RoundingMode.HALF_UP);
        BigDecimal taxAmount = BigDecimal.ZERO.setScale(2);
        BigDecimal discountAmount = BigDecimal.ZERO.setScale(2);

        String paymentStatus = job.getStatus() == JobStatus.COMPLETED ? "COMPLETED" : "PENDING";
        String paymentReference = "INV-REF-" + jobId;
        LocalDateTime paidAt = job.getCompletedAt();

        String serviceName = request.getCategory() != null ? request.getCategory().name() : "Service Request";
        String serviceDescription = request.getDescription();
        String invoiceNumber = generateUniqueInvoiceNumber();

        Invoice invoice = new Invoice(
                invoiceNumber,
                job,
                request.getCustomer(),
                job.getWorker(),
                serviceName,
                serviceDescription,
                serviceCharge,
                platformFee,
                taxAmount,
                discountAmount,
                totalAmount,
                paymentStatus,
                paymentReference,
                LocalDateTime.now(),
                paidAt
        );

        try {
            Invoice savedInvoice = invoiceRepository.save(invoice);

            // Safe notification attempt (notification failure does not fail transaction)
            try {
                notificationService.createNotification(
                        request.getCustomer(),
                        NotificationType.PAYMENT_REQUIRED, // Or general notification
                        "Invoice Generated",
                        "Invoice " + savedInvoice.getInvoiceNumber() + " has been generated for Job #" + job.getId() + ".",
                        "INVOICE",
                        savedInvoice.getId()
                );
            } catch (Exception ex) {
                // Ignore notification failures
            }

            return InvoiceResponse.fromEntity(savedInvoice);
        } catch (DataIntegrityViolationException ex) {
            // Concurrent creation race condition -> fetch existing invoice created concurrently
            return invoiceRepository.findByJobId(jobId)
                    .map(InvoiceResponse::fromEntity)
                    .orElseThrow(() -> ex);
        }
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceForJob(Long jobId, String userEmail) {
        User currentUser = getAuthenticatedUser(userEmail);

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        validateUserAccess(job, currentUser);

        Invoice invoice = invoiceRepository.findByJobId(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice not found for this job"));

        return InvoiceResponse.fromEntity(invoice);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long invoiceId, String userEmail) {
        User currentUser = getAuthenticatedUser(userEmail);

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice not found"));

        validateUserAccess(invoice.getJob(), currentUser);

        return InvoiceResponse.fromEntity(invoice);
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getMyInvoices(String userEmail) {
        User currentUser = getAuthenticatedUser(userEmail);

        List<Invoice> invoices;
        if (currentUser.getRole() == Role.CUSTOMER) {
            invoices = invoiceRepository.findByCustomerIdOrderByCreatedAtDesc(currentUser.getId());
        } else if (currentUser.getRole() == Role.WORKER) {
            invoices = invoiceRepository.findByWorkerIdOrderByCreatedAtDesc(currentUser.getId());
        } else if (currentUser.getRole() == Role.ADMIN) {
            invoices = invoiceRepository.findAllByOrderByCreatedAtDesc();
        } else {
            invoices = List.of();
        }

        return invoices.stream().map(InvoiceResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getAdminInvoices(String adminEmail) {
        User currentUser = getAuthenticatedUser(adminEmail);
        if (currentUser.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin privileges required");
        }

        return invoiceRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(InvoiceResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
