package com.sih.cooperative.service;

import com.sih.cooperative.dto.*;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

@Service
public class AdminOperationsService {

    private final UserRepository userRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final JobRepository jobRepository;
    private final RatingRepository ratingRepository;
    private final EarningRepository earningRepository;
    private final AdminActivityRepository adminActivityRepository;
    private final NotificationService notificationService;
    private final WorkerVerificationRepository workerVerificationRepository;
    private final DisputeRepository disputeRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;


    public AdminOperationsService(UserRepository userRepository,
                                  WorkerProfileRepository workerProfileRepository,
                                  ServiceRequestRepository serviceRequestRepository,
                                  JobRepository jobRepository,
                                  RatingRepository ratingRepository,
                                  EarningRepository earningRepository,
                                  AdminActivityRepository adminActivityRepository,
                                  NotificationService notificationService,
                                  WorkerVerificationRepository workerVerificationRepository,
                                  DisputeRepository disputeRepository,
                                  PaymentRepository paymentRepository,
                                  InvoiceRepository invoiceRepository) {
        this.userRepository = userRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.serviceRequestRepository = serviceRequestRepository;
        this.jobRepository = jobRepository;
        this.ratingRepository = ratingRepository;
        this.earningRepository = earningRepository;
        this.adminActivityRepository = adminActivityRepository;
        this.notificationService = notificationService;
        this.workerVerificationRepository = workerVerificationRepository;
        this.disputeRepository = disputeRepository;
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
    }


    private User getAuthenticatedAdmin(String adminEmail) {
        User user = userRepository.findByEmail(adminEmail.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Admin role required");
        }

        return user;
    }

    private void recordActivity(User admin, String actionType, String entityType, Long entityId, String description) {
        AdminActivity activity = new AdminActivity(
                admin.getId(),
                admin.getRole(),
                actionType,
                entityType,
                entityId,
                description
        );
        adminActivityRepository.save(activity);
    }

    @Transactional(readOnly = true)
    public PlatformOverviewSummary getPlatformOverview(String adminEmail) {
        getAuthenticatedAdmin(adminEmail);

        long totalUsers = userRepository.count();
        long totalCustomers = userRepository.countByRole(Role.CUSTOMER);
        long totalWorkers = userRepository.countByRole(Role.WORKER);

        long activeUsers = userRepository.countByStatus(AccountStatus.ACTIVE);
        long suspendedUsers = userRepository.countByStatus(AccountStatus.SUSPENDED);
        long deactivatedUsers = userRepository.countByStatus(AccountStatus.DEACTIVATED);

        long totalRequests = serviceRequestRepository.count();
        long openRequests = serviceRequestRepository.countByStatus(ServiceRequestStatus.OPEN);
        long cancelledRequests = serviceRequestRepository.countByStatus(ServiceRequestStatus.CANCELLED);

        long assignedRequests = jobRepository.count();
        long activeJobs = jobRepository.countByStatusIn(List.of(JobStatus.ACCEPTED, JobStatus.IN_PROGRESS, JobStatus.PAYMENT_REQUIRED));
        long completedJobs = jobRepository.countByStatus(JobStatus.COMPLETED);

        // Completion Rate Formula: (completedJobs / totalAssignedJobs) * 100
        BigDecimal completionRate = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        if (assignedRequests > 0) {
            completionRate = BigDecimal.valueOf(completedJobs)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(assignedRequests), 2, RoundingMode.HALF_UP);
        }

        // Cancellation Rate Formula: (cancelledRequests / totalServiceRequests) * 100
        BigDecimal cancellationRate = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        if (totalRequests > 0) {
            cancellationRate = BigDecimal.valueOf(cancelledRequests)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalRequests), 2, RoundingMode.HALF_UP);
        }

        long totalRatings = ratingRepository.count();
        Double avgRatingDouble = ratingRepository.findPlatformAverageScore();
        BigDecimal avgRating = avgRatingDouble != null ?
                BigDecimal.valueOf(avgRatingDouble).setScale(2, RoundingMode.HALF_UP) :
                BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        BigDecimal grossRaw = earningRepository.sumAllGrossAmount();
        BigDecimal feesRaw = earningRepository.sumAllPlatformFee();
        BigDecimal workerRaw = earningRepository.sumAllWorkerEarning();

        BigDecimal totalGross = (grossRaw != null ? grossRaw : BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalFees = (feesRaw != null ? feesRaw : BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalWorkerEarnings = (workerRaw != null ? workerRaw : BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        return new PlatformOverviewSummary(
                totalUsers,
                totalCustomers,
                totalWorkers,
                activeUsers,
                suspendedUsers,
                deactivatedUsers,
                totalRequests,
                openRequests,
                assignedRequests,
                activeJobs,
                completedJobs,
                cancelledRequests,
                completionRate,
                cancellationRate,
                totalRatings,
                avgRating,
                totalGross,
                totalFees,
                totalWorkerEarnings
        );
    }

    @Transactional(readOnly = true)
    public List<ServiceDemandResponse> getServiceDemand(String adminEmail) {
        getAuthenticatedAdmin(adminEmail);

        List<ServiceRequest> allRequests = serviceRequestRepository.findAll();
        long totalRequests = allRequests.size();

        if (totalRequests == 0) {
            return List.of();
        }

        List<Job> allJobs = jobRepository.findAll();

        Map<ServiceCategory, List<ServiceRequest>> requestsByCategory = allRequests.stream()
                .filter(r -> r.getCategory() != null)
                .collect(Collectors.groupingBy(ServiceRequest::getCategory));

        Map<Long, Job> jobsByRequestId = allJobs.stream()
                .collect(Collectors.toMap(j -> j.getServiceRequest().getId(), Function.identity(), (j1, j2) -> j1));

        return requestsByCategory.entrySet().stream()
                .map(entry -> {
                    ServiceCategory category = entry.getKey();
                    List<ServiceRequest> categoryRequests = entry.getValue();
                    long reqCount = categoryRequests.size();

                    long completedCount = 0;
                    BigDecimal grossVal = BigDecimal.ZERO;

                    for (ServiceRequest req : categoryRequests) {
                        Job job = jobsByRequestId.get(req.getId());
                        if (job != null && job.getStatus() == JobStatus.COMPLETED) {
                            completedCount++;
                            if (req.getBudget() != null) {
                                grossVal = grossVal.add(req.getBudget());
                            }
                        }
                    }

                    BigDecimal demandPct = BigDecimal.valueOf(reqCount)
                            .multiply(BigDecimal.valueOf(100))
                            .divide(BigDecimal.valueOf(totalRequests), 2, RoundingMode.HALF_UP);

                    return new ServiceDemandResponse(
                            category,
                            reqCount,
                            completedCount,
                            grossVal.setScale(2, RoundingMode.HALF_UP),
                            demandPct
                    );
                })
                .sorted((a, b) -> b.getRequestCount().compareTo(a.getRequestCount()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationalAlertResponse> getOperationalAlerts(String adminEmail) {
        getAuthenticatedAdmin(adminEmail);

        List<OperationalAlertResponse> alerts = new java.util.ArrayList<>();

        // 1. Open requests without worker assignment
        List<ServiceRequest> openReqs = serviceRequestRepository.findByStatusOrderByCreatedAtDesc(ServiceRequestStatus.OPEN);
        if (!openReqs.isEmpty()) {
            ServiceRequest newest = openReqs.get(0);
            alerts.add(new OperationalAlertResponse(
                    "UNASSIGNED_SERVICE_REQUESTS",
                    OperationalAlertResponse.AlertSeverity.WARNING,
                    openReqs.size() + " Open Service Request" + (openReqs.size() > 1 ? "s" : "") + " Awaiting Assignment",
                    "There are currently " + openReqs.size() + " service requests in OPEN status with no assigned worker.",
                    "SERVICE_REQUEST",
                    newest.getId(),
                    newest.getCreatedAt(),
                    (long) openReqs.size()
            ));
        }

        // 2. Pending worker verification reviews
        List<WorkerVerification> pendingVerifications = workerVerificationRepository.findByStatus(VerificationStatus.PENDING_REVIEW);
        if (!pendingVerifications.isEmpty()) {
            WorkerVerification newest = pendingVerifications.get(0);
            alerts.add(new OperationalAlertResponse(
                    "PENDING_WORKER_VERIFICATIONS",
                    OperationalAlertResponse.AlertSeverity.INFO,
                    pendingVerifications.size() + " Worker Verification" + (pendingVerifications.size() > 1 ? "s" : "") + " Pending Review",
                    pendingVerifications.size() + " worker verification documents are submitted and awaiting administrative review.",
                    "WORKER_VERIFICATION",
                    newest.getId(),
                    newest.getCreatedAt(),
                    (long) pendingVerifications.size()
            ));
        }


        // 3. Unresolved disputes
        List<Dispute> activeDisputes = disputeRepository.findAll().stream()
                .filter(d -> d.getStatus() == DisputeStatus.OPEN || d.getStatus() == DisputeStatus.UNDER_REVIEW || d.getStatus() == DisputeStatus.ACTION_REQUIRED)
                .collect(Collectors.toList());
        if (!activeDisputes.isEmpty()) {
            Dispute newest = activeDisputes.get(0);
            alerts.add(new OperationalAlertResponse(
                    "UNRESOLVED_DISPUTES",
                    OperationalAlertResponse.AlertSeverity.CRITICAL,
                    activeDisputes.size() + " Unresolved Dispute" + (activeDisputes.size() > 1 ? "s" : "") + " Require Attention",
                    activeDisputes.size() + " disputes are currently open or under administrative review.",
                    "DISPUTE",
                    newest.getId(),
                    newest.getCreatedAt(),
                    (long) activeDisputes.size()
            ));
        }

        // 4. Jobs awaiting payment
        List<Job> paymentRequiredJobs = jobRepository.findByStatusOrderByCreatedAtDesc(JobStatus.PAYMENT_REQUIRED);
        if (!paymentRequiredJobs.isEmpty()) {
            Job newest = paymentRequiredJobs.get(0);
            alerts.add(new OperationalAlertResponse(
                    "JOBS_AWAITING_PAYMENT",
                    OperationalAlertResponse.AlertSeverity.WARNING,
                    paymentRequiredJobs.size() + " Job" + (paymentRequiredJobs.size() > 1 ? "s" : "") + " Awaiting Customer Payment",
                    paymentRequiredJobs.size() + " completed jobs are awaiting customer payment settlement.",
                    "JOB",
                    newest.getId(),
                    newest.getCreatedAt(),
                    (long) paymentRequiredJobs.size()
            ));
        }

        // 5. Suspended/deactivated workers with active jobs
        List<Job> activeJobs = jobRepository.findByStatusInOrderByCreatedAtDesc(List.of(JobStatus.ACCEPTED, JobStatus.IN_PROGRESS, JobStatus.PAYMENT_REQUIRED));
        List<Job> jobsWithInactiveWorkers = activeJobs.stream()
                .filter(j -> j.getWorker() != null && j.getWorker().getStatus() != AccountStatus.ACTIVE)
                .collect(Collectors.toList());
        if (!jobsWithInactiveWorkers.isEmpty()) {
            Job newest = jobsWithInactiveWorkers.get(0);
            alerts.add(new OperationalAlertResponse(
                    "INACTIVE_WORKER_ACTIVE_ASSIGNMENT",
                    OperationalAlertResponse.AlertSeverity.CRITICAL,
                    jobsWithInactiveWorkers.size() + " Active Job" + (jobsWithInactiveWorkers.size() > 1 ? "s" : "") + " Assigned to Inactive Worker",
                    "Workers assigned to " + jobsWithInactiveWorkers.size() + " active jobs are currently suspended or deactivated.",
                    "JOB",
                    newest.getId(),
                    newest.getCreatedAt(),
                    (long) jobsWithInactiveWorkers.size()
            ));
        }

        return alerts;
    }

    @Transactional(readOnly = true)
    public List<AdminJobResponse> getJobsFiltered(String statusParam, String adminEmail) {
        getAuthenticatedAdmin(adminEmail);

        if (statusParam == null || statusParam.isBlank()) {
            return getJobs(adminEmail);
        }

        String normalizedStatus = statusParam.trim().toUpperCase();

        if ("ACTIVE".equals(normalizedStatus)) {
            List<Job> activeJobs = jobRepository.findByStatusInOrderByCreatedAtDesc(
                    List.of(JobStatus.ACCEPTED, JobStatus.IN_PROGRESS, JobStatus.PAYMENT_REQUIRED)
            );
            return activeJobs.stream().map(AdminJobResponse::fromEntity).collect(Collectors.toList());
        }

        try {
            JobStatus targetStatus = JobStatus.valueOf(normalizedStatus);
            List<Job> jobs = jobRepository.findByStatusOrderByCreatedAtDesc(targetStatus);
            return jobs.stream().map(AdminJobResponse::fromEntity).collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid job status filter value: " + statusParam);
        }
    }


    @Transactional(readOnly = true)
    public List<AdminUserResponse> getUsers(Role roleFilter, Boolean activeFilter, String search, String adminEmail) {
        getAuthenticatedAdmin(adminEmail);

        List<User> users = userRepository.findAllByOrderByCreatedAtDesc();

        return users.stream()
                .filter(u -> roleFilter == null || u.getRole() == roleFilter)
                .filter(u -> activeFilter == null || u.isActive() == activeFilter)
                .filter(u -> {
                    if (search == null || search.isBlank()) return true;
                    String q = search.toLowerCase().trim();
                    return u.getName().toLowerCase().contains(q) || u.getEmail().toLowerCase().contains(q);
                })
                .map(AdminUserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdminWorkerResponse> getWorkers(String adminEmail) {
        getAuthenticatedAdmin(adminEmail);

        List<WorkerProfile> profiles = workerProfileRepository.findAllByOrderByCreatedAtDesc();

        return profiles.stream()
                .map(p -> {
                    Long wId = p.getWorker().getId();
                    Double avgRating = ratingRepository.findAverageScoreByWorkerId(wId);
                    Long totalRatings = ratingRepository.countByWorkerId(wId);
                    boolean isVerified = workerVerificationRepository.existsByWorkerIdAndStatus(wId, VerificationStatus.VERIFIED);
                    AdminWorkerResponse resp = AdminWorkerResponse.fromEntity(p, avgRating, totalRatings);
                    if (resp != null) {
                        resp.setIsVerified(isVerified);
                    }
                    return resp;
                })
                .collect(Collectors.toList());
    }


    @Transactional
    public AdminWorkerResponse activateWorker(Long workerId, String adminEmail) {
        User admin = getAuthenticatedAdmin(adminEmail);

        WorkerProfile profile = workerProfileRepository.findByWorkerId(workerId)
                .orElseGet(() -> workerProfileRepository.findById(workerId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worker not found with ID: " + workerId)));

        User workerUser = profile.getWorker();
        if (workerUser == null || workerUser.getRole() != Role.WORKER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target user is not a worker");
        }

        workerUser.setStatus(AccountStatus.ACTIVE);
        userRepository.save(workerUser);

        recordActivity(admin, "WORKER_ACTIVATED", "WORKER", workerUser.getId(), "Activated worker account for " + workerUser.getEmail());

        try {
            notificationService.createNotification(
                    workerUser,
                    NotificationType.WORKER_ACTIVATED,
                    "Account Activated",
                    "Your worker account has been activated by platform administration. You are eligible for job matching.",
                    "WORKER_PROFILE",
                    profile.getId()
            );
        } catch (Exception ignored) {
        }

        Double avgRating = ratingRepository.findAverageScoreByWorkerId(workerUser.getId());
        Long totalRatings = ratingRepository.countByWorkerId(workerUser.getId());
        return AdminWorkerResponse.fromEntity(profile, avgRating, totalRatings);
    }

    @Transactional
    public AdminWorkerResponse deactivateWorker(Long workerId, String adminEmail) {
        User admin = getAuthenticatedAdmin(adminEmail);

        WorkerProfile profile = workerProfileRepository.findByWorkerId(workerId)
                .orElseGet(() -> workerProfileRepository.findById(workerId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worker not found with ID: " + workerId)));

        User workerUser = profile.getWorker();
        if (workerUser == null || workerUser.getRole() != Role.WORKER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target user is not a worker");
        }

        if (admin.getId().equals(workerUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Administrators cannot deactivate their own account.");
        }

        workerUser.setStatus(AccountStatus.DEACTIVATED);
        userRepository.save(workerUser);

        recordActivity(admin, "WORKER_DEACTIVATED", "WORKER", workerUser.getId(), "Deactivated worker account for " + workerUser.getEmail());

        try {
            notificationService.createNotification(
                    workerUser,
                    NotificationType.WORKER_DEACTIVATED,
                    "Account Deactivated",
                    "Your worker account has been deactivated by platform administration.",
                    "WORKER_PROFILE",
                    profile.getId()
            );
        } catch (Exception ignored) {
        }

        Double avgRating = ratingRepository.findAverageScoreByWorkerId(workerUser.getId());
        Long totalRatings = ratingRepository.countByWorkerId(workerUser.getId());
        return AdminWorkerResponse.fromEntity(profile, avgRating, totalRatings);
    }

    @Transactional
    public AdminUserResponse activateUser(Long userId, String adminEmail) {
        User admin = getAuthenticatedAdmin(adminEmail);
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with ID: " + userId));

        AccountStatus prevStatus = target.getStatus();
        target.setStatus(AccountStatus.ACTIVE);
        User saved = userRepository.save(target);

        recordActivity(admin, "USER_ACTIVATED", "USER", target.getId(),
                "Activated user " + target.getEmail() + " (Previous status: " + prevStatus + ")");

        return AdminUserResponse.fromEntity(saved);
    }

    @Transactional
    public AdminUserResponse deactivateUser(Long userId, String reason, String adminEmail) {
        User admin = getAuthenticatedAdmin(adminEmail);
        if (admin.getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Administrators cannot deactivate their own account.");
        }

        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with ID: " + userId));

        if (target.getRole() == Role.ADMIN) {
            long activeAdminCount = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.ADMIN && u.getStatus() == AccountStatus.ACTIVE)
                    .count();
            if (activeAdminCount <= 1) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot deactivate the final active administrator account.");
            }
        }

        if (reason == null || reason.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A non-blank reason is required for account deactivation.");
        }

        AccountStatus prevStatus = target.getStatus();
        target.setStatus(AccountStatus.DEACTIVATED);
        User saved = userRepository.save(target);

        recordActivity(admin, "USER_DEACTIVATED", "USER", target.getId(),
                "Deactivated user " + target.getEmail() + " (Previous status: " + prevStatus + "). Reason: " + reason.trim());

        return AdminUserResponse.fromEntity(saved);
    }

    @Transactional
    public AdminUserResponse suspendUser(Long userId, String reason, String adminEmail) {
        User admin = getAuthenticatedAdmin(adminEmail);
        if (admin.getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Administrators cannot suspend their own account.");
        }

        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with ID: " + userId));

        if (target.getRole() == Role.ADMIN) {
            long activeAdminCount = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.ADMIN && u.getStatus() == AccountStatus.ACTIVE)
                    .count();
            if (activeAdminCount <= 1) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot suspend the final active administrator account.");
            }
        }

        if (reason == null || reason.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A non-blank reason is required for account suspension.");
        }

        AccountStatus prevStatus = target.getStatus();
        target.setStatus(AccountStatus.SUSPENDED);
        User saved = userRepository.save(target);

        recordActivity(admin, "USER_SUSPENDED", "USER", target.getId(),
                "Suspended user " + target.getEmail() + " (Previous status: " + prevStatus + "). Reason: " + reason.trim());

        return AdminUserResponse.fromEntity(saved);
    }

    @Transactional
    public AdminUserResponse reactivateUser(Long userId, String adminEmail) {
        User admin = getAuthenticatedAdmin(adminEmail);
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with ID: " + userId));

        AccountStatus prevStatus = target.getStatus();
        target.setStatus(AccountStatus.ACTIVE);
        User saved = userRepository.save(target);

        recordActivity(admin, "USER_REACTIVATED", "USER", target.getId(),
                "Reactivated user " + target.getEmail() + " (Previous status: " + prevStatus + ")");

        return AdminUserResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<AdminServiceRequestResponse> getServiceRequests(String adminEmail) {
        getAuthenticatedAdmin(adminEmail);

        List<ServiceRequest> requests = serviceRequestRepository.findAllByOrderByCreatedAtDesc();
        List<Job> allJobs = jobRepository.findAll();
        Map<Long, Job> jobsByRequestId = allJobs.stream()
                .collect(Collectors.toMap(j -> j.getServiceRequest().getId(), Function.identity(), (j1, j2) -> j1));

        return requests.stream()
                .map(r -> AdminServiceRequestResponse.fromEntity(r, jobsByRequestId.get(r.getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdminJobResponse> getJobs(String adminEmail) {
        getAuthenticatedAdmin(adminEmail);

        List<Job> jobs = jobRepository.findAllByOrderByCreatedAtDesc();

        return jobs.stream()
                .map(AdminJobResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdminRatingResponse> getRatings(String adminEmail) {
        getAuthenticatedAdmin(adminEmail);

        List<Rating> ratings = ratingRepository.findAllByOrderByCreatedAtDesc();

        return ratings.stream()
                .map(AdminRatingResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdminActivityResponse> getActivity(String adminEmail) {
        getAuthenticatedAdmin(adminEmail);

        List<AdminActivity> activities = adminActivityRepository.findAllByOrderByCreatedAtDesc();

        return activities.stream()
                .map(AdminActivityResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminUserDetailResponse getUserDetail(Long userId, String adminEmail) {
        getAuthenticatedAdmin(adminEmail);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with ID: " + userId));

        AdminUserDetailResponse detail = new AdminUserDetailResponse();
        detail.setId(user.getId());
        detail.setName(user.getName());
        detail.setEmail(user.getEmail());
        detail.setPhone(user.getPhone());
        detail.setRole(user.getRole());
        detail.setActive(user.isActive());
        detail.setStatus(user.getStatus());
        detail.setCreatedAt(user.getCreatedAt());

        // Customer & Job metrics
        List<ServiceRequest> userRequests = serviceRequestRepository.findByCustomerIdOrderByCreatedAtDesc(user.getId());
        detail.setServiceRequestsCreatedCount((long) userRequests.size());
        detail.setOpenRequestsCount(userRequests.stream().filter(r -> r.getStatus() == ServiceRequestStatus.OPEN).count());
        detail.setCompletedRequestsCount(userRequests.stream().filter(r -> r.getStatus() != ServiceRequestStatus.OPEN && r.getStatus() != ServiceRequestStatus.CANCELLED).count());
        detail.setCancelledRequestsCount(userRequests.stream().filter(r -> r.getStatus() == ServiceRequestStatus.CANCELLED).count());

        List<Job> workerJobs = jobRepository.findByWorkerIdOrderByCreatedAtDesc(user.getId());
        detail.setJobsAssignedCount((long) workerJobs.size());
        detail.setJobsCompletedCount(workerJobs.stream().filter(j -> j.getStatus() == JobStatus.COMPLETED).count());
        detail.setActiveJobsCount(workerJobs.stream().filter(j -> j.getStatus() == JobStatus.ACCEPTED || j.getStatus() == JobStatus.IN_PROGRESS || j.getStatus() == JobStatus.PAYMENT_REQUIRED).count());

        // Ratings metrics
        List<Rating> submittedRatings = ratingRepository.findAll().stream().filter(r -> r.getCustomer().getId().equals(user.getId())).collect(Collectors.toList());
        detail.setRatingsSubmittedCount((long) submittedRatings.size());
        Long ratingsRecCount = ratingRepository.countByWorkerId(user.getId());
        detail.setRatingsReceivedCount(ratingsRecCount != null ? ratingsRecCount : 0L);
        detail.setAverageRatingReceived(ratingRepository.findAverageScoreByWorkerId(user.getId()));

        // Earnings metrics
        BigDecimal workerGross = earningRepository.sumGrossAmountByWorkerId(user.getId());
        BigDecimal workerEarnings = earningRepository.sumWorkerEarningByWorkerId(user.getId());
        BigDecimal workerPlatformFees = earningRepository.sumPlatformFeeByWorkerId(user.getId());

        detail.setTotalGrossVolume(workerGross != null ? workerGross : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        detail.setTotalWorkerEarnings(workerEarnings != null ? workerEarnings : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        detail.setTotalPlatformFees(workerPlatformFees != null ? workerPlatformFees : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));

        // Worker Profile details if applicable
        if (user.getRole() == Role.WORKER) {
            workerProfileRepository.findByWorkerId(user.getId()).ifPresent(profile -> {
                detail.setWorkerProfileId(profile.getId());
                detail.setBio(profile.getBio());
                detail.setExperienceYears(profile.getExperienceYears());
                detail.setHourlyRate(profile.getHourlyRate());
                detail.setSkills(profile.getSkills());
                detail.setServiceCategories(profile.getServiceCategories());
                detail.setAvailable(profile.isAvailable());
                detail.setServiceLocation(profile.getServiceLocation());
                detail.setServiceRadiusKm(profile.getServiceRadiusKm());
            });

            workerVerificationRepository.findByWorkerId(user.getId()).ifPresent(verif -> {
                detail.setVerificationStatus(verif.getStatus());
                detail.setVerificationSubmittedAt(verif.getSubmittedAt());
                detail.setVerificationReviewedAt(verif.getReviewedAt());
            });
        }

        // Audit & activity history
        List<AdminActivity> activities = adminActivityRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("USER", user.getId());
        if (user.getRole() == Role.WORKER && activities.isEmpty()) {
            activities = adminActivityRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("WORKER", user.getId());
        }
        detail.setRecentActivity(activities.stream().map(AdminActivityResponse::fromEntity).collect(Collectors.toList()));

        return detail;
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> getUsersPaginated(Role roleFilter, AccountStatus statusFilter, Boolean activeFilter, String search, int page, int size, String sort, String adminEmail) {
        getAuthenticatedAdmin(adminEmail);

        int safePage = Math.max(0, page);
        int safeSize = Math.min(100, Math.max(1, size));

        Pageable pageable = PageRequest.of(
                safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Specification<User> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

            if (roleFilter != null) {
                predicates.add(cb.equal(root.get("role"), roleFilter));
            }
            if (statusFilter != null) {
                predicates.add(cb.equal(root.get("status"), statusFilter));
            }
            if (activeFilter != null) {
                predicates.add(cb.equal(root.get("active"), activeFilter));
            }
            if (search != null && !search.isBlank()) {
                String q = "%" + search.toLowerCase().trim() + "%";
                jakarta.persistence.criteria.Predicate nameLike = cb.like(cb.lower(root.get("name")), q);
                jakarta.persistence.criteria.Predicate emailLike = cb.like(cb.lower(root.get("email")), q);
                predicates.add(cb.or(nameLike, emailLike));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<User> userPage = userRepository.findAll(spec, pageable);
        Page<AdminUserResponse> dtoPage = userPage.map(AdminUserResponse::fromEntity);

        return PageResponse.fromPage(dtoPage);
    }

    private void validateDateRange(java.time.LocalDate from, java.time.LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start date ('from') cannot be after end date ('to')");
        }
    }

    @Transactional(readOnly = true)
    public AdminFinancialSummaryResponse getFinancialSummary(java.time.LocalDate from, java.time.LocalDate to, String adminEmail) {
        getAuthenticatedAdmin(adminEmail);
        validateDateRange(from, to);

        Specification<Payment> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay()));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to.atTime(23, 59, 59)));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        List<Payment> payments = paymentRepository.findAll(spec);

        BigDecimal totalGrossVolume = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalPlatformFees = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalWorkerEarnings = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        BigDecimal completedAmount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal pendingAmount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal failedAmount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal refundedAmount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        long totalTxns = payments.size();
        long completedTxns = 0;
        long pendingTxns = 0;
        long failedTxns = 0;
        long refundedTxns = 0;

        for (Payment p : payments) {
            BigDecimal amt = p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO;
            BigDecimal fee = p.getPlatformFee() != null ? p.getPlatformFee() : BigDecimal.ZERO;
            BigDecimal serviceAmt = p.getServiceAmount() != null ? p.getServiceAmount() : amt.subtract(fee);

            if (p.getStatus() == PaymentStatus.SUCCESS) {
                completedTxns++;
                completedAmount = completedAmount.add(amt);
                totalGrossVolume = totalGrossVolume.add(amt);
                totalPlatformFees = totalPlatformFees.add(fee);
                totalWorkerEarnings = totalWorkerEarnings.add(serviceAmt);
            } else if (p.getStatus() == PaymentStatus.PENDING || p.getStatus() == PaymentStatus.PROCESSING) {
                pendingTxns++;
                pendingAmount = pendingAmount.add(amt);
            } else if (p.getStatus() == PaymentStatus.FAILED || p.getStatus() == PaymentStatus.CANCELLED) {
                failedTxns++;
                failedAmount = failedAmount.add(amt);
            } else if (p.getStatus() == PaymentStatus.REFUNDED) {
                refundedTxns++;
                BigDecimal refAmt = p.getRefundAmount() != null ? p.getRefundAmount() : amt;
                refundedAmount = refundedAmount.add(refAmt);
            }
        }

        return new AdminFinancialSummaryResponse(
                totalGrossVolume,
                totalPlatformFees,
                totalWorkerEarnings,
                completedAmount,
                pendingAmount,
                failedAmount,
                refundedAmount,
                totalTxns,
                completedTxns,
                pendingTxns,
                failedTxns,
                refundedTxns,
                from,
                to
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminFinancialTransactionResponse> getFinancialTransactions(
            int page, int size, String sort, PaymentStatus status, String search,
            java.time.LocalDate from, java.time.LocalDate to, Long customerId, Long workerId, String adminEmail) {

        getAuthenticatedAdmin(adminEmail);
        validateDateRange(from, to);

        int safePage = Math.max(0, page);
        int safeSize = Math.min(100, Math.max(1, size));

        Sort sortOrder = Sort.by(Sort.Direction.DESC, "createdAt");
        if ("amount".equalsIgnoreCase(sort)) {
            sortOrder = Sort.by(Sort.Direction.DESC, "amount");
        } else if ("status".equalsIgnoreCase(sort)) {
            sortOrder = Sort.by(Sort.Direction.ASC, "status");
        }

        Pageable pageable = PageRequest.of(safePage, safeSize, sortOrder);

        Specification<Payment> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (customerId != null) {
                predicates.add(cb.equal(root.get("customer").get("id"), customerId));
            }
            if (workerId != null) {
                predicates.add(cb.equal(root.get("job").get("worker").get("id"), workerId));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay()));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to.atTime(23, 59, 59)));
            }
            if (search != null && !search.isBlank()) {
                String q = "%" + search.toLowerCase().trim() + "%";
                jakarta.persistence.criteria.Predicate refLike = cb.like(cb.lower(root.get("transactionReference")), q);
                jakarta.persistence.criteria.Predicate customerLike = cb.like(cb.lower(root.get("customer").get("name")), q);
                jakarta.persistence.criteria.Predicate workerLike = cb.like(cb.lower(root.get("job").get("worker").get("name")), q);
                jakarta.persistence.criteria.Predicate titleLike = cb.like(cb.lower(root.get("job").get("serviceRequest").get("description")), q);
                predicates.add(cb.or(refLike, customerLike, workerLike, titleLike));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<Payment> paymentPage = paymentRepository.findAll(spec, pageable);

        Page<AdminFinancialTransactionResponse> dtoPage = paymentPage.map(p -> {
            AdminFinancialTransactionResponse res = new AdminFinancialTransactionResponse();
            res.setId(p.getId());
            res.setTransactionReference(p.getTransactionReference());
            res.setAmount(p.getAmount());
            res.setPlatformFee(p.getPlatformFee());
            res.setWorkerEarning(p.getServiceAmount() != null ? p.getServiceAmount() : p.getAmount().subtract(p.getPlatformFee()));
            res.setStatus(p.getStatus());
            res.setPaymentMethod(p.getPaymentMethod());
            res.setCreatedAt(p.getCreatedAt());
            res.setPaidAt(p.getPaidAt());

            if (p.getCustomer() != null) {
                res.setCustomerId(p.getCustomer().getId());
                res.setCustomerName(p.getCustomer().getName());
            }

            if (p.getJob() != null) {
                Job j = p.getJob();
                res.setJobId(j.getId());
                if (j.getServiceRequest() != null) {
                    res.setServiceRequestId(j.getServiceRequest().getId());
                    res.setJobTitle(j.getServiceRequest().getDescription());
                }
                if (j.getWorker() != null) {
                    res.setWorkerId(j.getWorker().getId());
                    res.setWorkerName(j.getWorker().getName());
                }

                invoiceRepository.findByJobId(j.getId()).ifPresent(inv -> {
                    res.setInvoiceId(inv.getId());
                    res.setInvoiceNumber(inv.getInvoiceNumber());
                });

                disputeRepository.findByJobIdOrderByCreatedAtDesc(j.getId()).stream().findFirst().ifPresent(disp -> {
                    res.setHasDispute(true);
                    res.setDisputeId(disp.getId());
                    res.setDisputeStatus(disp.getStatus().name());
                });
            }

            if (res.getHasDispute() == null) {
                res.setHasDispute(false);
            }

            return res;
        });

        return PageResponse.fromPage(dtoPage);
    }

    @Transactional(readOnly = true)
    public AdminFinancialTransactionDetailResponse getFinancialTransactionDetail(Long transactionId, String adminEmail) {
        getAuthenticatedAdmin(adminEmail);

        Payment p = paymentRepository.findById(transactionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found with ID: " + transactionId));

        AdminFinancialTransactionDetailResponse res = new AdminFinancialTransactionDetailResponse();
        res.setId(p.getId());
        res.setTransactionReference(p.getTransactionReference());
        res.setStatus(p.getStatus());
        res.setPaymentMethod(p.getPaymentMethod());
        res.setPaymentMethodDetails(p.getPaymentMethodDetails());
        res.setCurrency(p.getCurrency());
        res.setServiceAmount(p.getServiceAmount());
        res.setPlatformFee(p.getPlatformFee());
        res.setAmount(p.getAmount());
        res.setWorkerEarning(p.getServiceAmount() != null ? p.getServiceAmount() : p.getAmount().subtract(p.getPlatformFee()));
        res.setRefundAmount(p.getRefundAmount());
        res.setCreatedAt(p.getCreatedAt());
        res.setPaidAt(p.getPaidAt());
        res.setRefundedAt(p.getRefundedAt());
        res.setFailureReason(p.getFailureReason());

        if (p.getCustomer() != null) {
            res.setCustomerId(p.getCustomer().getId());
            res.setCustomerName(p.getCustomer().getName());
            res.setCustomerEmail(p.getCustomer().getEmail());
            res.setCustomerPhone(p.getCustomer().getPhone());
        }

        if (p.getJob() != null) {
            Job j = p.getJob();
            res.setJobId(j.getId());
            res.setJobStatus(j.getStatus() != null ? j.getStatus().name() : null);

            if (j.getServiceRequest() != null) {
                res.setServiceRequestId(j.getServiceRequest().getId());
                res.setJobTitle(j.getServiceRequest().getDescription());
            }

            if (j.getWorker() != null) {
                res.setWorkerId(j.getWorker().getId());
                res.setWorkerName(j.getWorker().getName());
                res.setWorkerEmail(j.getWorker().getEmail());
                res.setWorkerPhone(j.getWorker().getPhone());
            }

            invoiceRepository.findByJobId(j.getId()).ifPresent(inv -> {
                res.setInvoiceId(inv.getId());
                res.setInvoiceNumber(inv.getInvoiceNumber());
                res.setInvoiceDate(inv.getCreatedAt());
                res.setInvoiceStatus(inv.getPaymentStatus() != null ? inv.getPaymentStatus().name() : null);
            });

            disputeRepository.findByJobIdOrderByCreatedAtDesc(j.getId()).stream().findFirst().ifPresent(disp -> {
                res.setDisputeId(disp.getId());
                res.setDisputeReason(disp.getReason() != null ? disp.getReason().name() : null);
                res.setDisputeStatus(disp.getStatus() != null ? disp.getStatus().name() : null);
                res.setDisputeResolution(disp.getResolutionNotes());
            });

            List<AdminActivity> activities = adminActivityRepository.findAll().stream()
                    .filter(act -> ("PAYMENT".equalsIgnoreCase(act.getEntityType()) && p.getId().equals(act.getEntityId()))
                            || ("JOB".equalsIgnoreCase(act.getEntityType()) && j.getId().equals(act.getEntityId())))
                    .collect(Collectors.toList());

            res.setAuditLogs(activities.stream().map(AdminActivityResponse::fromEntity).collect(Collectors.toList()));
        } else {
            res.setAuditLogs(List.of());
        }

        return res;
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminActivityResponse> getActivityPaginated(
            String actionType, Long adminId, Long targetUserId, String search,
            java.time.LocalDate from, java.time.LocalDate to, int page, int size, String sort, String adminEmail) {

        getAuthenticatedAdmin(adminEmail);
        validateDateRange(from, to);

        int safePage = Math.max(0, page);
        int safeSize = Math.min(100, Math.max(1, size));

        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<AdminActivity> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

            if (actionType != null && !actionType.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("actionType")), actionType.trim().toUpperCase()));
            }
            if (adminId != null) {
                predicates.add(cb.equal(root.get("adminId"), adminId));
            }
            if (targetUserId != null) {
                predicates.add(cb.and(
                        cb.equal(cb.upper(root.get("entityType")), "USER"),
                        cb.equal(root.get("entityId"), targetUserId)
                ));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay()));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to.atTime(23, 59, 59)));
            }
            if (search != null && !search.isBlank()) {
                String q = "%" + search.toLowerCase().trim() + "%";
                jakarta.persistence.criteria.Predicate actionLike = cb.like(cb.lower(root.get("actionType")), q);
                jakarta.persistence.criteria.Predicate descLike = cb.like(cb.lower(root.get("description")), q);
                jakarta.persistence.criteria.Predicate entityLike = cb.like(cb.lower(root.get("entityType")), q);
                predicates.add(cb.or(actionLike, descLike, entityLike));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<AdminActivity> activityPage = adminActivityRepository.findAll(spec, pageable);
        Page<AdminActivityResponse> dtoPage = activityPage.map(AdminActivityResponse::fromEntity);

        return PageResponse.fromPage(dtoPage);
    }
}
