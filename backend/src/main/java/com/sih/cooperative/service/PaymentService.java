package com.sih.cooperative.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.cooperative.dto.CompletePaymentRequest;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.*;
import com.sih.cooperative.dto.PaymentRequest;
import com.sih.cooperative.dto.PaymentResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);
    private static final BigDecimal PLATFORM_FEE_PERCENTAGE = new BigDecimal("10.00");

    private final PaymentRepository paymentRepository;
    private final JobRepository jobRepository;
    private final EarningRepository earningRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public PaymentService(PaymentRepository paymentRepository,
                          JobRepository jobRepository,
                          EarningRepository earningRepository,
                          UserRepository userRepository,
                          NotificationService notificationService,
                          ObjectMapper objectMapper) {
        this.paymentRepository = paymentRepository;
        this.jobRepository = jobRepository;
        this.earningRepository = earningRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    private User getAuthenticatedCustomer(String email, Role requiredRole) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (requiredRole != null && user.getRole() != requiredRole) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return user;
    }

    private String generateMerchantOrderId(Long jobId) {
        return "GC-" + jobId + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateDemoTransactionId() {
        String hex = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "SIM-TXN-" + hex;
    }

    /**
     * Initiates a demo payment for a COMPLETED job.
     * Creates a PENDING payment record with a deterministic demo transaction ID.
     * Does NOT call PhonePe or any external gateway.
     */
    @Transactional
    public PaymentResponse initiatePayment(String customerEmail, PaymentRequest request) {
        User customer = getAuthenticatedCustomer(customerEmail, Role.CUSTOMER);

        Job job = jobRepository.findById(request.getJobId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (job.getServiceRequest() == null ||
            job.getServiceRequest().getCustomer() == null ||
            !job.getServiceRequest().getCustomer().getId().equals(customer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: this job does not belong to you");
        }

        if (job.getStatus() != JobStatus.COMPLETED && job.getStatus() != JobStatus.PAYMENT_REQUIRED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only COMPLETED or PAYMENT_REQUIRED jobs can be paid for");
        }

        // If a PAID/SUCCESS payment already exists for this job, return it (already paid)
        if (paymentRepository.existsByJobId(job.getId())) {
            Payment existing = paymentRepository.findByJobId(job.getId()).orElseThrow();
            if (existing.getPaymentStatus().isPaid()) {
                return PaymentResponse.fromEntity(existing);
            }
            // If it exists but is PENDING, allow resuming (return it)
            if (existing.getPaymentStatus() == PaymentStatus.PENDING) {
                return PaymentResponse.fromEntity(existing);
            }
            // If it exists but is FAILED, allow a fresh retry
        }

        Earning earning = earningRepository.findByJobId(job.getId())
                .orElseGet(() -> generateEarningForJob(job, customer));

        String merchantOrderId = generateMerchantOrderId(job.getId());
        String transactionId = generateDemoTransactionId();

        Payment payment = new Payment(
                job, customer, earning,
                earning.getGrossAmount(), earning.getPlatformFee(), earning.getWorkerEarning(),
                "PENDING", PaymentStatus.PENDING, transactionId
        );
        payment.setMerchantOrderId(merchantOrderId);
        payment.setPaymentInstrument("PENDING");
        Payment savedPayment = paymentRepository.save(payment);

        notificationService.createNotification(
                customer, NotificationType.PAYMENT_INITIATED,
                "Payment initiated",
                "Your payment of Rs." + earning.getGrossAmount().toPlainString() + " has been initiated.",
                "PAYMENT", savedPayment.getId()
        );

        notificationService.createAdminNotification(
                NotificationType.PAYMENT_INITIATED,
                "Payment initiated",
                customer.getName() + " initiated a payment of Rs." + earning.getGrossAmount().toPlainString() + " (Tnx: " + merchantOrderId + ").",
                "PAYMENT", savedPayment.getId()
        );

        logger.info("Demo payment initiated: paymentId={}, transactionId={}", savedPayment.getId(), transactionId);

        return PaymentResponse.fromEntity(savedPayment);
    }

    @Transactional
    public Payment ensurePendingPaymentForJob(Job job) {
        if (paymentRepository.existsByJobId(job.getId())) {
            return paymentRepository.findByJobId(job.getId()).orElseThrow();
        }
        User customer = job.getServiceRequest() != null ? job.getServiceRequest().getCustomer() : null;
        if (customer == null) return null;

        Earning earning = earningRepository.findByJobId(job.getId())
                .orElseGet(() -> generateEarningForJob(job, customer));
        String merchantOrderId = generateMerchantOrderId(job.getId());
        String transactionId = generateDemoTransactionId();
        Payment payment = new Payment(
                job, customer, earning,
                earning.getGrossAmount(), earning.getPlatformFee(), earning.getWorkerEarning(),
                "PENDING", PaymentStatus.PENDING, transactionId
        );
        payment.setMerchantOrderId(merchantOrderId);
        payment.setPaymentInstrument("PENDING");
        return paymentRepository.save(payment);
    }

    /**
     * Completes a demo payment using the selected payment method.
     * Marks the payment PAID, generates the transaction ID (if not already set),
     * updates earning status, and sets the job payment status.
     */
    @Transactional
    public PaymentResponse completePayment(String customerEmail, Long paymentId, CompletePaymentRequest request) {
        User customer = getAuthenticatedCustomer(customerEmail, Role.CUSTOMER);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        if (!payment.getCustomer().getId().equals(customer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        if (payment.getPaymentStatus() == PaymentStatus.PAID || payment.getPaymentStatus() == PaymentStatus.SUCCESS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Payment already completed");
        }

        if (payment.getPaymentStatus() == PaymentStatus.FAILED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Payment already failed; please initiate a new payment");
        }

        if (payment.getPaymentStatus() != PaymentStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment is not in a pending state");
        }

        // Validate and set payment method
        PaymentMethod method;
        try {
            method = PaymentMethod.from(request.getPaymentMethod());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment method: " + request.getPaymentMethod());
        }

        // Store UPI ID if provided
        if (method == PaymentMethod.UPI && request.getUpiId() != null && !request.getUpiId().isBlank()) {
            payment.setPaymentInstrument(request.getUpiId().trim());
        } else {
            payment.setPaymentInstrument(method.name());
        }

        // Generate transaction ID if not already set
        if (payment.getTransactionId() == null || payment.getTransactionId().isBlank()) {
            payment.setTransactionId(generateDemoTransactionId());
        }

        payment.setPaymentMethod(method.name());
        payment.setPaymentStatus(PaymentStatus.PAID);
        payment.setPaidAt(LocalDateTime.now());

        // Update earning status
        Earning earning = payment.getEarning();
        if (earning != null && earning.getStatus() == EarningStatus.PENDING) {
            earning.setStatus(EarningStatus.AVAILABLE);
            earningRepository.save(earning);
        }

        // Update job payment status
        Job job = payment.getJob();
        if (job != null) {
            job.setPaymentStatus(PaymentStatus.PAID);
        }

        paymentRepository.save(payment);
        if (job != null) {
            jobRepository.save(job);
        }

        notificationService.createNotification(
                payment.getCustomer(), NotificationType.PAYMENT_COMPLETED,
                "Payment successful",
                "Your payment of Rs." + payment.getAmount().toPlainString() + " is confirmed. Tnx: " + payment.getTransactionId(),
                "PAYMENT", payment.getId()
        );

        User worker = payment.getJob().getWorker();
        if (worker != null) {
            notificationService.createNotification(
                    worker, NotificationType.PAYMENT_COMPLETED,
                    "Payment received",
                    "A payment of Rs." + payment.getWorkerEarning().toPlainString() + " has been received for your completed job.",
                    "PAYMENT", payment.getId()
            );
        }

        notificationService.createAdminNotification(
                NotificationType.PAYMENT_COMPLETED,
                "Payment confirmed",
                payment.getCustomer().getName() + " confirmed payment of Rs." + payment.getAmount().toPlainString() + " (Tnx: " + payment.getTransactionId() + ").",
                "PAYMENT", payment.getId()
        );

        logger.info("Demo payment completed: paymentId={}, transactionId={}, method={}", payment.getId(), payment.getTransactionId(), method.name());

        return PaymentResponse.fromEntity(payment);
    }



    /**
     * Internal: mark payment as FAILED and notify customer.
     */
    @Transactional
    public void failPaymentInternal(Payment payment) {
        if (payment.getPaymentStatus() == PaymentStatus.FAILED) {
            return;
        }

        payment.setPaymentStatus(PaymentStatus.FAILED);
        paymentRepository.save(payment);

        notificationService.createNotification(
                payment.getCustomer(), NotificationType.SYSTEM_ERROR,
                "Payment failed",
                "Your payment attempt failed. Please try again.",
                "PAYMENT", payment.getId()
        );

        logger.info("Payment failed: paymentId={}, merchantOrderId={}", payment.getId(), payment.getMerchantOrderId());
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getCustomerPaymentHistory(String customerEmail) {
        User customer = getAuthenticatedCustomer(customerEmail, Role.CUSTOMER);
        return paymentRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                .stream().map(PaymentResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByJob(String customerEmail, Long jobId) {
        User customer = getAuthenticatedCustomer(customerEmail, Role.CUSTOMER);

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (job.getServiceRequest() == null ||
            !job.getServiceRequest().getCustomer().getId().equals(customer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        return paymentRepository.findByJobId(jobId)
                .map(PaymentResponse::fromEntity)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No payment found for this job"));
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(String customerEmail, Long paymentId) {
        User customer = getAuthenticatedCustomer(customerEmail, Role.CUSTOMER);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        if (!payment.getCustomer().getId().equals(customer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        return PaymentResponse.fromEntity(payment);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getAllPayments(String adminEmail) {
        getAuthenticatedCustomer(adminEmail, Role.ADMIN);
        return paymentRepository.findAll()
                .stream().map(PaymentResponse::fromEntity).collect(Collectors.toList());
    }

    private Earning generateEarningForJob(Job job, User customer) {
        if (job.getStatus() != JobStatus.COMPLETED && job.getStatus() != JobStatus.PAYMENT_REQUIRED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Earning can only be generated for completed or payment-required jobs");
        }
        if (earningRepository.existsByJobId(job.getId())) {
            return earningRepository.findByJobId(job.getId()).orElseThrow();
        }
        ServiceRequest request = job.getServiceRequest();
        User worker = job.getWorker();
        if (worker == null || request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Job must have valid worker and request");
        }
        BigDecimal grossAmount = request.getBudget().setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal platformFee = grossAmount.multiply(new BigDecimal("0.10")).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal workerEarning = grossAmount.subtract(platformFee).setScale(2, java.math.RoundingMode.HALF_UP);
        Earning earning = new Earning(job, worker, customer, grossAmount, platformFee, workerEarning,
                new BigDecimal("10.00"), EarningStatus.AVAILABLE);
        return earningRepository.save(earning);
    }
}