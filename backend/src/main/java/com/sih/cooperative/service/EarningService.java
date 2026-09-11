package com.sih.cooperative.service;

import com.sih.cooperative.config.*;
import com.sih.cooperative.dto.*;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EarningService {

    private static final Logger log = LoggerFactory.getLogger(EarningService.class);

    private final EarningRepository earningRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final EarningsConfig earningsConfig;
    private final NotificationService notificationService;
    private final PaymentRepository paymentRepository;

    public EarningService(EarningRepository earningRepository,
                          JobRepository jobRepository,
                          UserRepository userRepository,
                          EarningsConfig earningsConfig,
                          NotificationService notificationService,
                          PaymentRepository paymentRepository) {
        this.earningRepository = earningRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.earningsConfig = earningsConfig;
        this.notificationService = notificationService;
        this.paymentRepository = paymentRepository;
    }

    private User getAuthenticatedUser(String email, Role requiredRole) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (requiredRole != null && user.getRole() != requiredRole) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: insufficient role privileges");
        }

        return user;
    }

    @Transactional
    public Earning generateEarningForCompletedJob(Job job) {
        if (job == null || job.getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid job is required to generate earnings");
        }

        if (job.getStatus() != JobStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Earning can only be generated for COMPLETED jobs");
        }

        // Idempotency check: if earning already exists, return existing
        if (earningRepository.existsByJobId(job.getId())) {
            return earningRepository.findByJobId(job.getId()).orElseThrow();
        }

        ServiceRequest request = job.getServiceRequest();
        if (request == null || request.getBudget() == null || request.getBudget().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Job must have a valid positive service request budget");
        }

        User worker = job.getWorker();
        User customer = request.getCustomer();

        if (worker == null || customer == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Job must be associated with valid worker and customer");
        }

        BigDecimal grossAmount = request.getBudget().setScale(2, RoundingMode.HALF_UP);
        BigDecimal feePercentage = earningsConfig.getPlatformFeePercentage();

        BigDecimal platformFee = grossAmount
                .multiply(feePercentage)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        BigDecimal workerEarning = grossAmount.subtract(platformFee).setScale(2, RoundingMode.HALF_UP);

        Earning earning = new Earning(
                job,
                worker,
                customer,
                grossAmount,
                platformFee,
                workerEarning,
                feePercentage,
                EarningStatus.AVAILABLE
        );

        try {
            Earning savedEarning = earningRepository.save(earning);

            // Segment 8 Notification
            notificationService.createNotification(
                    worker,
                    NotificationType.EARNING_GENERATED,
                    "Earning generated",
                    "Your earning of ₹" + workerEarning.toPlainString() + " has been added to your earnings ledger.",
                    "EARNING",
                    savedEarning.getId()
            );

            return savedEarning;
        } catch (DataIntegrityViolationException e) {
            log.warn("Concurrent duplicate earning creation prevented for job ID {}", job.getId());
            return earningRepository.findByJobId(job.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Earning already exists for this job"));
        }
    }

    @Transactional(readOnly = true)
    public List<EarningResponse> getWorkerEarnings(String workerEmail) {
        User worker = getAuthenticatedUser(workerEmail, Role.WORKER);
        return earningRepository.findByWorkerIdOrderByCreatedAtDesc(worker.getId())
                .stream()
                .map(EarningResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkerEarningsSummary getWorkerEarningsSummary(String workerEmail) {
        User worker = getAuthenticatedUser(workerEmail, Role.WORKER);
        Long workerId = worker.getId();

        BigDecimal gross = earningRepository.sumGrossAmountByWorkerId(workerId);
        BigDecimal fee = earningRepository.sumPlatformFeeByWorkerId(workerId);
        BigDecimal workerTotal = earningRepository.sumWorkerEarningByWorkerId(workerId);
        BigDecimal available = earningRepository.sumAvailableWorkerEarningByWorkerId(workerId);
        long count = earningRepository.countByWorkerId(workerId);

        gross = (gross != null) ? gross : BigDecimal.ZERO;
        fee = (fee != null) ? fee : BigDecimal.ZERO;
        workerTotal = (workerTotal != null) ? workerTotal : BigDecimal.ZERO;
        available = (available != null) ? available : BigDecimal.ZERO;

        return new WorkerEarningsSummary(
                workerId,
                gross.setScale(2, RoundingMode.HALF_UP),
                fee.setScale(2, RoundingMode.HALF_UP),
                workerTotal.setScale(2, RoundingMode.HALF_UP),
                available.setScale(2, RoundingMode.HALF_UP),
                count
        );
    }

    @Transactional(readOnly = true)
    public EarningResponse getWorkerEarningById(Long earningId, String workerEmail) {
        User worker = getAuthenticatedUser(workerEmail, Role.WORKER);
        Earning earning = earningRepository.findById(earningId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Earning record not found"));

        if (!earning.getWorker().getId().equals(worker.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: earning record belongs to another worker");
        }

        return EarningResponse.fromEntity(earning);
    }

    @Transactional(readOnly = true)
    public EarningResponse getCustomerJobEarning(Long jobId, String customerEmail) {
        User customer = getAuthenticatedUser(customerEmail, Role.CUSTOMER);
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (!job.getServiceRequest().getCustomer().getId().equals(customer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: job belongs to another customer");
        }

        Earning earning = earningRepository.findByJobId(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Earning record not found for this job"));

        return EarningResponse.fromEntity(earning);
    }

    @Transactional(readOnly = true)
    public PlatformRevenueSummary getPlatformRevenueSummary(String adminEmail) {
        getAuthenticatedUser(adminEmail, Role.ADMIN);

        BigDecimal gross = earningRepository.sumAllGrossAmount();
        BigDecimal fees = earningRepository.sumAllPlatformFee();
        BigDecimal workerTotal = earningRepository.sumAllWorkerEarning();
        BigDecimal availableTotal = earningRepository.sumAllAvailableWorkerEarning();
        long count = earningRepository.count();

        gross = (gross != null) ? gross : BigDecimal.ZERO;
        fees = (fees != null) ? fees : BigDecimal.ZERO;
        workerTotal = (workerTotal != null) ? workerTotal : BigDecimal.ZERO;
        availableTotal = (availableTotal != null) ? availableTotal : BigDecimal.ZERO;

        long totalSuccessful = paymentRepository.countByStatus(PaymentStatus.SUCCESS);
        long totalPending = paymentRepository.countByStatus(PaymentStatus.PENDING);
        long totalFailed = paymentRepository.countByStatus(PaymentStatus.FAILED);

        long upiCount = paymentRepository.countByPaymentMethod("UPI");
        long cardCount = paymentRepository.countByPaymentMethod("CARD");
        long walletCount = paymentRepository.countByPaymentMethod("COOPERATIVE_WALLET");

        return new PlatformRevenueSummary(
                gross.setScale(2, RoundingMode.HALF_UP),
                fees.setScale(2, RoundingMode.HALF_UP),
                workerTotal.setScale(2, RoundingMode.HALF_UP),
                count,
                availableTotal.setScale(2, RoundingMode.HALF_UP),
                totalSuccessful,
                totalPending,
                totalFailed,
                upiCount,
                cardCount,
                walletCount
        );
    }

    @Transactional(readOnly = true)
    public List<EarningResponse> getPlatformEarningsLedger(String adminEmail) {
        getAuthenticatedUser(adminEmail, Role.ADMIN);
        return earningRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(EarningResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
