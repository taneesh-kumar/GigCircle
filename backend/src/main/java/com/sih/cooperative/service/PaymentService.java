package com.sih.cooperative.service;

import com.sih.cooperative.config.EarningsConfig;
import com.sih.cooperative.dto.*;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.JobRepository;
import com.sih.cooperative.repository.PaymentRepository;
import com.sih.cooperative.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final EarningsConfig earningsConfig;
    private final NotificationService notificationService;
    private final EarningService earningService;

    public PaymentService(PaymentRepository paymentRepository,
                          JobRepository jobRepository,
                          UserRepository userRepository,
                          EarningsConfig earningsConfig,
                          NotificationService notificationService,
                          EarningService earningService) {
        this.paymentRepository = paymentRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.earningsConfig = earningsConfig;
        this.notificationService = notificationService;
        this.earningService = earningService;
    }

    private User getAuthenticatedCustomer(String email) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole() != Role.CUSTOMER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only customers can initiate payments");
        }

        return user;
    }

    private User getAuthenticatedAdmin(String email) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin privileges required");
        }

        return user;
    }

    private String generateSimulatedTxnRef() {
        String randomSuffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "SIM-TXN-" + randomSuffix;
    }

    @Transactional(readOnly = true)
    public PaymentSummaryResponse getPaymentSummary(Long jobId, String customerEmail) {
        User customer = getAuthenticatedCustomer(customerEmail);

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (!job.getServiceRequest().getCustomer().getId().equals(customer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to job payment details");
        }

        ServiceRequest request = job.getServiceRequest();
        BigDecimal serviceAmount = request.getBudget().setScale(2, RoundingMode.HALF_UP);
        BigDecimal feePercentage = earningsConfig.getPlatformFeePercentage();
        BigDecimal platformFee = serviceAmount
                .multiply(feePercentage)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        BigDecimal totalAmount = serviceAmount.add(platformFee).setScale(2, RoundingMode.HALF_UP);

        Optional<Payment> existingSuccessPayment = paymentRepository.findFirstByJobIdAndStatusOrderByCreatedAtDesc(jobId, PaymentStatus.SUCCESS);

        PaymentSummaryResponse summary = new PaymentSummaryResponse();
        summary.setJobId(jobId);
        summary.setServiceCategory(request.getCategory());
        summary.setServiceDescription(request.getDescription());
        if (job.getWorker() != null) {
            summary.setWorkerName(job.getWorker().getName());
        }
        summary.setServiceAmount(serviceAmount);
        summary.setPlatformFee(platformFee);
        summary.setFeePercentage(feePercentage);
        summary.setTotalAmount(totalAmount);
        summary.setCurrency("INR");
        summary.setAlreadyPaid(existingSuccessPayment.isPresent());
        if (existingSuccessPayment.isPresent()) {
            summary.setExistingPaymentStatus(existingSuccessPayment.get().getStatus());
            summary.setExistingTransactionReference(existingSuccessPayment.get().getTransactionReference());
        }

        return summary;
    }

    @Transactional
    public PaymentResponse processPayment(CreatePaymentRequest request, String customerEmail) {
        User customer = getAuthenticatedCustomer(customerEmail);

        Job job = jobRepository.findById(request.getJobId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (!job.getServiceRequest().getCustomer().getId().equals(customer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: job belongs to another customer");
        }

        // Idempotency: Reject if already paid
        if (paymentRepository.existsByJobIdAndStatus(job.getId(), PaymentStatus.SUCCESS) || job.getStatus() == JobStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This job has already been paid.");
        }

        // Job must be in payable status (PAYMENT_REQUIRED, IN_PROGRESS, ACCEPTED)
        if (job.getStatus() != JobStatus.PAYMENT_REQUIRED && job.getStatus() != JobStatus.IN_PROGRESS && job.getStatus() != JobStatus.ACCEPTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment is not available for this job state.");
        }

        // Determine Authoritative Amounts
        BigDecimal serviceAmount = job.getServiceRequest().getBudget().setScale(2, RoundingMode.HALF_UP);
        BigDecimal feePercentage = earningsConfig.getPlatformFeePercentage();
        BigDecimal platformFee = serviceAmount
                .multiply(feePercentage)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = serviceAmount.add(platformFee).setScale(2, RoundingMode.HALF_UP);

        String txnRef = generateSimulatedTxnRef();
        PaymentMethod method = request.getPaymentMethod();
        PaymentStatus status = PaymentStatus.SUCCESS;
        String methodDetails;
        String failureReason = null;

        // Deterministic Simulation Engine
        if (method == PaymentMethod.UPI) {
            String upi = (request.getUpiId() != null && !request.getUpiId().isBlank()) ? request.getUpiId().trim() : "customer@upi";
            methodDetails = upi;
            if (upi.toLowerCase().contains("fail") || upi.equalsIgnoreCase("test-failure@upi")) {
                status = PaymentStatus.FAILED;
                failureReason = "Simulated UPI authorization declined.";
            }
        } else if (method == PaymentMethod.CARD) {
            String rawCard = (request.getCardNumber() != null) ? request.getCardNumber().replaceAll("\\s+", "") : "4242";
            String last4 = rawCard.length() >= 4 ? rawCard.substring(rawCard.length() - 4) : "4242";
            methodDetails = "Card ending in " + last4;

            if (rawCard.endsWith("0002") || rawCard.toLowerCase().contains("fail")) {
                status = PaymentStatus.FAILED;
                failureReason = "Simulated card authorization declined.";
            }
        } else if (method == PaymentMethod.CASH) {
            methodDetails = "Cash on completion";
            status = PaymentStatus.SUCCESS;
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment method");
        }

        Payment payment = new Payment(
                job,
                customer,
                serviceAmount,
                platformFee,
                totalAmount,
                method,
                methodDetails,
                status,
                txnRef
        );
        payment.setFailureReason(failureReason);

        Payment savedPayment = paymentRepository.save(payment);

        // State Machine Gate: Payment Success automatically marks Job COMPLETED
        if (status == PaymentStatus.SUCCESS) {
            job.setStatus(JobStatus.COMPLETED);
            if (job.getCompletedAt() == null) {
                job.setCompletedAt(LocalDateTime.now());
            }
            Job savedJob = jobRepository.save(job);

            try {
                earningService.generateEarningForCompletedJob(savedJob);
            } catch (Exception ex) {
                notificationService.createAdminNotification(
                        NotificationType.LEDGER_ERROR,
                        "Ledger calculation requires attention",
                        "The earnings calculation for Job #" + savedJob.getId() + " could not be completed. Please review the job ledger.",
                        "JOB",
                        savedJob.getId()
                );
            }

            notificationService.createNotification(
                    customer,
                    NotificationType.PAYMENT_SUCCESS,
                    "Payment Successful",
                    "Payment of ₹" + totalAmount + " was successful for Job #" + job.getId() + " (" + txnRef + "). The job is now completed.",
                    "PAYMENT",
                    savedPayment.getId()
            );

            if (job.getWorker() != null) {
                notificationService.createNotification(
                        job.getWorker(),
                        NotificationType.PAYMENT_SUCCESS,
                        "Payment Received",
                        "Customer payment of ₹" + totalAmount + " confirmed for Job #" + job.getId() + ". Job completed successfully.",
                        "JOB",
                        job.getId()
                );
            }
        } else {
            notificationService.createNotification(
                    customer,
                    NotificationType.PAYMENT_FAILED,
                    "Payment Failed",
                    "Simulated payment of ₹" + totalAmount + " for Job #" + job.getId() + " failed (" + failureReason + "). You can retry anytime.",
                    "PAYMENT",
                    savedPayment.getId()
            );
        }

        return PaymentResponse.fromEntity(savedPayment);
    }

    @Transactional
    public PaymentResponse cancelPayment(Long paymentId, String customerEmail) {
        User customer = getAuthenticatedCustomer(customerEmail);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        if (!payment.getCustomer().getId().equals(customer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to payment");
        }

        if (payment.getStatus() == PaymentStatus.SUCCESS || payment.getStatus() == PaymentStatus.REFUNDED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Completed payments cannot be cancelled. Use refund instead.");
        }

        payment.setStatus(PaymentStatus.CANCELLED);
        payment.setFailureReason("Cancelled by customer");
        Payment saved = paymentRepository.save(payment);

        return PaymentResponse.fromEntity(saved);
    }

    @Transactional
    public PaymentResponse refundPayment(Long paymentId, String customerEmail) {
        User customer = getAuthenticatedCustomer(customerEmail);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        if (!payment.getCustomer().getId().equals(customer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to payment");
        }

        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only successful payments can be refunded");
        }

        payment.setStatus(PaymentStatus.REFUNDED);
        payment.setRefundAmount(payment.getAmount());
        payment.setRefundedAt(LocalDateTime.now());

        Payment saved = paymentRepository.save(payment);

        notificationService.createNotification(
                customer,
                NotificationType.PAYMENT_REFUNDED,
                "Simulated Payment Refunded",
                "Your simulated payment of ₹" + saved.getRefundAmount() + " for Job #" + payment.getJob().getId() + " has been refunded.",
                "PAYMENT",
                saved.getId()
        );

        return PaymentResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getCustomerPayments(String customerEmail) {
        User customer = getAuthenticatedCustomer(customerEmail);
        return paymentRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                .stream()
                .map(PaymentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentDetail(Long paymentId, String customerEmail) {
        User customer = getAuthenticatedCustomer(customerEmail);
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        if (!payment.getCustomer().getId().equals(customer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to payment");
        }

        return PaymentResponse.fromEntity(payment);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getAdminPayments(String adminEmail) {
        getAuthenticatedAdmin(adminEmail);
        return paymentRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(PaymentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminPaymentSummaryResponse getAdminPaymentSummary(String adminEmail) {
        getAuthenticatedAdmin(adminEmail);
        long total = paymentRepository.count();
        long success = paymentRepository.countByStatus(PaymentStatus.SUCCESS);
        long failed = paymentRepository.countByStatus(PaymentStatus.FAILED);
        long refunded = paymentRepository.countByStatus(PaymentStatus.REFUNDED);
        BigDecimal volume = paymentRepository.sumTotalSuccessfulAmount();
        BigDecimal platformFees = paymentRepository.sumTotalSuccessfulPlatformFee();

        return new AdminPaymentSummaryResponse(
                total,
                success,
                failed,
                refunded,
                volume,
                platformFees
        );
    }
}
