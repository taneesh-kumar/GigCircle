package com.sih.cooperative.service;

import com.sih.cooperative.dto.PaymentResponse;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class DemoPaymentService {

    private final PaymentRepository paymentRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final EarningService earningService;
    private final InvoiceService invoiceService;
    private final NotificationService notificationService;

    public DemoPaymentService(PaymentRepository paymentRepository,
                              JobRepository jobRepository,
                              UserRepository userRepository,
                              EarningService earningService,
                              InvoiceService invoiceService,
                              NotificationService notificationService) {
        this.paymentRepository = paymentRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.earningService = earningService;
        this.invoiceService = invoiceService;
        this.notificationService = notificationService;
    }

    private User getAuthenticatedUser(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void validateCustomerAccess(Job job, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            return;
        }

        boolean isCustomer = job.getServiceRequest() != null &&
                job.getServiceRequest().getCustomer() != null &&
                job.getServiceRequest().getCustomer().getId().equals(currentUser.getId());

        if (!isCustomer) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the customer who requested the job can perform payment operations");
        }
    }

    /**
     * Initiate payment for a PAYMENT_REQUIRED job.
     * Idempotent: reuses the existing Payment record if already present.
     * On FAILED: resets to PENDING (retry).
     * On PENDING/SUCCESS: returns existing.
     */
    @Transactional
    public PaymentResponse initiatePayment(Long jobId, String userEmail) {
        User currentUser = getAuthenticatedUser(userEmail);

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        validateCustomerAccess(job, currentUser);

        if (job.getStatus() != JobStatus.PAYMENT_REQUIRED && job.getStatus() != JobStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Payment can only be initiated for jobs in PAYMENT_REQUIRED status (current: " + job.getStatus() + ")");
        }

        Optional<Payment> existingOpt = paymentRepository.findByJobId(jobId);
        if (existingOpt.isPresent()) {
            Payment existing = existingOpt.get();
            if (existing.getStatus() == PaymentStatus.FAILED) {
                // Reset failed payment for retry — reuse same Payment entity (keeps same ID)
                existing.setStatus(PaymentStatus.PENDING);
                existing.setFailureReason(null);
                return PaymentResponse.fromEntity(paymentRepository.save(existing));
            }
            // PENDING or SUCCESS: return as-is (idempotent)
            return PaymentResponse.fromEntity(existing);
        }

        ServiceRequest request = job.getServiceRequest();
        if (request == null || request.getCustomer() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Job missing customer details");
        }

        BigDecimal amount = request.getBudget() != null ? request.getBudget() : BigDecimal.ZERO;
        Payment payment = new Payment(job, request.getCustomer(), amount, PaymentStatus.PENDING);

        try {
            Payment saved = paymentRepository.save(payment);
            return PaymentResponse.fromEntity(saved);
        } catch (DataIntegrityViolationException ex) {
            // Concurrent creation race condition → fetch existing payment
            return paymentRepository.findByJobId(jobId)
                    .map(PaymentResponse::fromEntity)
                    .orElseThrow(() -> ex);
        }
    }

    /**
     * Simulate payment outcome (demo/test control).
     * On SUCCESS: finalizes the job → COMPLETED, generates Earning + Invoice + Notifications.
     * On FAILURE: updates payment status only; job remains PAYMENT_REQUIRED.
     */
    @Transactional
    public PaymentResponse simulatePayment(Long jobId, boolean shouldSucceed, String failureReason, String userEmail) {
        User currentUser = getAuthenticatedUser(userEmail);

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        validateCustomerAccess(job, currentUser);

        if (job.getStatus() != JobStatus.PAYMENT_REQUIRED && job.getStatus() != JobStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Payment can only be simulated for jobs in PAYMENT_REQUIRED status (current: " + job.getStatus() + ")");
        }

        // If already COMPLETED, just fetch the payment (already paid)
        if (job.getStatus() == JobStatus.COMPLETED) {
            return paymentRepository.findByJobId(jobId)
                    .map(PaymentResponse::fromEntity)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No payment found for completed job #" + jobId));
        }

        // Get or auto-create a PENDING payment (idempotent)
        Payment payment = paymentRepository.findByJobId(jobId)
                .orElseGet(() -> {
                    ServiceRequest request = job.getServiceRequest();
                    BigDecimal amount = (request != null && request.getBudget() != null) ? request.getBudget() : BigDecimal.ZERO;
                    User customer = request != null ? request.getCustomer() : currentUser;
                    Payment newPayment = new Payment(job, customer, amount, PaymentStatus.PENDING);
                    return paymentRepository.save(newPayment);
                });

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            // Already succeeded — idempotent
            return PaymentResponse.fromEntity(payment);
        }

        if (shouldSucceed) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setTransactionReference("DEMO-TXN-" + System.currentTimeMillis());
            payment.setFailureReason(null);
            Payment updated = paymentRepository.save(payment);

            // Finalize the job only after confirmed successful payment
            finalizeCompletedJob(job, currentUser);

            return PaymentResponse.fromEntity(updated);
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason(failureReason != null && !failureReason.isBlank() ? failureReason : "Demo payment declined");
            return PaymentResponse.fromEntity(paymentRepository.save(payment));
        }
    }

    /**
     * Finalize the job after successful payment:
     * - Job → COMPLETED
     * - Generate Earning (idempotent)
     * - Generate Invoice (idempotent)
     * - Send JOB_COMPLETED notifications to worker and customer
     */
    private void finalizeCompletedJob(Job job, User currentUser) {
        // Transition job to COMPLETED
        job.setStatus(JobStatus.COMPLETED);
        job.setCompletedAt(LocalDateTime.now());
        Job completedJob = jobRepository.save(job);

        // Generate Earning (idempotent — EarningService checks existence)
        try {
            earningService.generateEarningForCompletedJob(completedJob);
        } catch (Exception ex) {
            // Log but don't fail the payment — earning can be regenerated
        }

        // Generate Invoice (idempotent — InvoiceService checks existence)
        try {
            String systemEmail = completedJob.getServiceRequest().getCustomer().getEmail();
            invoiceService.getOrCreateInvoiceForJob(completedJob.getId(), systemEmail);
        } catch (Exception ex) {
            // Non-critical
        }

        // Notify customer: payment successful, job completed
        try {
            notificationService.createNotification(
                    completedJob.getServiceRequest().getCustomer(),
                    NotificationType.PAYMENT_SUCCESS,
                    "Payment Successful — Job Completed",
                    "Your payment was successful. Job #" + completedJob.getId() + " is now completed.",
                    "JOB",
                    completedJob.getId()
            );
        } catch (Exception ex) {
            // Non-critical
        }

        // Notify worker: payment received, job completed
        try {
            notificationService.createNotification(
                    completedJob.getWorker(),
                    NotificationType.PAYMENT_SUCCESS,
                    "Payment Received — Job Completed",
                    "The customer has paid. Job #" + completedJob.getId() + " is now completed.",
                    "JOB",
                    completedJob.getId()
            );
        } catch (Exception ex) {
            // Non-critical
        }
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentForJob(Long jobId, String userEmail) {
        User currentUser = getAuthenticatedUser(userEmail);

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        validateCustomerAccess(job, currentUser);

        Payment payment = paymentRepository.findByJobId(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No payment found for job #" + jobId));

        return PaymentResponse.fromEntity(payment);
    }
}
