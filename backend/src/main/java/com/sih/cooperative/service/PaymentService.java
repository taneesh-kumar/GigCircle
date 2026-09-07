package com.sih.cooperative.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
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

    private final PaymentRepository paymentRepository;
    private final JobRepository jobRepository;
    private final EarningRepository earningRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final PhonePeService phonePeService;
    private final ObjectMapper objectMapper;

    public PaymentService(PaymentRepository paymentRepository,
                          JobRepository jobRepository,
                          EarningRepository earningRepository,
                          UserRepository userRepository,
                          NotificationService notificationService,
                          PhonePeService phonePeService,
                          ObjectMapper objectMapper) {
        this.paymentRepository = paymentRepository;
        this.jobRepository = jobRepository;
        this.earningRepository = earningRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.phonePeService = phonePeService;
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

    /**
     * Step 1: Customer initiates payment.
     * Creates a PENDING Payment record and calls PhonePe to get a checkout redirect URL.
     * Returns PaymentResponse with redirectUrl for the frontend to navigate to.
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

        if (job.getStatus() != JobStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only COMPLETED jobs can be paid for");
        }

        // If a SUCCESS payment already exists for this job, return it
        if (paymentRepository.existsByJobId(job.getId())) {
            Payment existing = paymentRepository.findByJobId(job.getId()).orElseThrow();
            if (existing.getPaymentStatus() == PaymentStatus.SUCCESS) {
                return PaymentResponse.fromEntity(existing);
            }
            // If it exists but is not SUCCESS (failed/pending), we can retry
        }

        Earning earning = earningRepository.findByJobId(job.getId())
                .orElseGet(() -> generateEarningForJob(job, customer));

        String merchantOrderId = generateMerchantOrderId(job.getId());

        // Store PhonePe's transaction ID in transactionId for backward compat
        Payment payment = new Payment(
                job, customer, earning,
                earning.getGrossAmount(), earning.getPlatformFee(), earning.getWorkerEarning(),
                "PHONEPE", PaymentStatus.PENDING, merchantOrderId
        );
        payment.setMerchantOrderId(merchantOrderId);
        payment.setPaymentInstrument("PENDING");
        Payment savedPayment = paymentRepository.save(payment);

        // Notify customer
        notificationService.createNotification(
                customer, NotificationType.PAYMENT_INITIATED,
                "Payment initiated",
                "Your payment of Rs." + earning.getGrossAmount().toPlainString() + " has been initiated.",
                "PAYMENT", savedPayment.getId()
        );

        // Notify admin
        notificationService.createAdminNotification(
                NotificationType.PAYMENT_INITIATED,
                "Payment initiated",
                customer.getName() + " initiated a payment of Rs." + earning.getGrossAmount().toPlainString() + " (Tnx: " + merchantOrderId + ").",
                "PAYMENT", savedPayment.getId()
        );

        // Call PhonePe to get the checkout URL
        try {
            String redirectUrl = phonePeService.initiatePayment(savedPayment, customer.getId());
            savedPayment.setRedirectUrl(redirectUrl);
            paymentRepository.save(savedPayment);
            logger.info("PhonePe payment initiated for paymentId={}, merchantOrderId={}",
                    savedPayment.getId(), merchantOrderId);
        } catch (Exception e) {
            logger.error("Failed to initiate PhonePe payment for paymentId={}", savedPayment.getId(), e);
            // Mark payment as failed since PhonePe couldn't be reached
            savedPayment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(savedPayment);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Unable to reach payment gateway. Please try again later.");
        }

        return PaymentResponse.fromEntity(savedPayment);
    }

    /**
     * Step 5/6: Handle PhonePe's server-to-server webhook callback.
     * This is the source-of-truth for payment status.
     * Also called internally by verifyPaymentStatus().
     */
    @Transactional
    public void handlePhonePeCallback(String merchantOrderId, String state, Object paymentInstrument) {
        Payment payment = paymentRepository.findByMerchantOrderId(merchantOrderId)
                .orElseThrow(() -> {
                    logger.warn("PhonePe callback: payment not found for merchantOrderId={}", merchantOrderId);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found");
                });

        if (payment.getPaymentStatus() == PaymentStatus.SUCCESS) {
            logger.info("PhonePe callback: payment already SUCCESS, ignoring duplicate for merchantOrderId={}", merchantOrderId);
            return;
        }

        // Store raw response for audit
        try {
            payment.setGatewayResponse(objectMapper.writeValueAsString(
                    Map.of("state", state != null ? state : "UNKNOWN",
                           "paymentInstrument", paymentInstrument != null ? paymentInstrument : Map.of())
            ));
        } catch (JsonProcessingException ignored) {}

        String instrumentType = phonePeService.extractPaymentInstrument(paymentInstrument);
        payment.setPaymentInstrument(instrumentType);

        if ("COMPLETED".equalsIgnoreCase(state)) {
            completePaymentInternal(payment);
        } else if ("FAILED".equalsIgnoreCase(state)) {
            failPaymentInternal(payment);
        } else {
            logger.info("PhonePe callback: non-terminal state '{}' for merchantOrderId={}, ignoring", state, merchantOrderId);
            paymentRepository.save(payment);
        }
    }

    /**
     * Verifies payment status via PhonePe API and updates our record.
     * Called by frontend polling or admin reconciliation.
     */
    @Transactional
    public PaymentResponse verifyPaymentStatus(String customerEmail, Long paymentId) {
        User customer = getAuthenticatedCustomer(customerEmail, Role.CUSTOMER);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        if (!payment.getCustomer().getId().equals(customer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        // If already in a terminal state, return as-is
        if (payment.getPaymentStatus() == PaymentStatus.SUCCESS ||
            payment.getPaymentStatus() == PaymentStatus.FAILED) {
            return PaymentResponse.fromEntity(payment);
        }

        // Call PhonePe to verify current status
        boolean isSuccess = phonePeService.verifyAndUpdatePaymentStatus(payment);

        if (isSuccess) {
            completePaymentInternal(payment);
        } else {
            // Check if it's actually failed or just pending
            // The verifyAndUpdatePaymentStatus already checked and logged
            paymentRepository.save(payment);
        }

        return PaymentResponse.fromEntity(payment);
    }

    /**
     * Internal: mark payment as SUCCESS, update earning, fire notifications.
     * Package-private — called by handlePhonePeCallback and verifyPaymentStatus.
     */
    @Transactional
    public void completePaymentInternal(Payment payment) {
        if (payment.getPaymentStatus() == PaymentStatus.SUCCESS) {
            return; // Idempotent
        }

        payment.setPaymentStatus(PaymentStatus.SUCCESS);
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // Update earning status
        Earning earning = payment.getEarning();
        if (earning != null && earning.getStatus() == EarningStatus.PENDING) {
            earning.setStatus(EarningStatus.AVAILABLE);
            earningRepository.save(earning);
        }

        // Notify customer
        notificationService.createNotification(
                payment.getCustomer(), NotificationType.PAYMENT_COMPLETED,
                "Payment successful",
                "Your payment of Rs." + payment.getAmount().toPlainString() + " is confirmed. Tnx: " + payment.getTransactionId(),
                "PAYMENT", payment.getId()
        );

        // Notify worker
        User worker = payment.getJob().getWorker();
        if (worker != null) {
            notificationService.createNotification(
                    worker, NotificationType.PAYMENT_COMPLETED,
                    "Payment received",
                    "A payment of Rs." + payment.getWorkerEarning().toPlainString() + " has been received for your completed job.",
                    "PAYMENT", payment.getId()
            );
        }

        // Notify admin
        notificationService.createAdminNotification(
                NotificationType.PAYMENT_COMPLETED,
                "Payment confirmed",
                payment.getCustomer().getName() + " confirmed payment of Rs." + payment.getAmount().toPlainString() + " (Tnx: " + payment.getTransactionId() + ").",
                "PAYMENT", payment.getId()
        );

        logger.info("Payment completed: paymentId={}, merchantOrderId={}", payment.getId(), payment.getMerchantOrderId());
    }

    /**
     * Internal: mark payment as FAILED and notify customer.
     */
    @Transactional
    public void failPaymentInternal(Payment payment) {
        if (payment.getPaymentStatus() == PaymentStatus.FAILED) {
            return; // Idempotent
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
        if (job.getStatus() != JobStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Earning can only be generated for COMPLETED jobs");
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
