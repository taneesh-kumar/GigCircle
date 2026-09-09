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
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

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

    public AdminOperationsService(UserRepository userRepository,
                                  WorkerProfileRepository workerProfileRepository,
                                  ServiceRequestRepository serviceRequestRepository,
                                  JobRepository jobRepository,
                                  RatingRepository ratingRepository,
                                  EarningRepository earningRepository,
                                  AdminActivityRepository adminActivityRepository,
                                  NotificationService notificationService,
                                  WorkerVerificationRepository workerVerificationRepository) {
        this.userRepository = userRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.serviceRequestRepository = serviceRequestRepository;
        this.jobRepository = jobRepository;
        this.ratingRepository = ratingRepository;
        this.earningRepository = earningRepository;
        this.adminActivityRepository = adminActivityRepository;
        this.notificationService = notificationService;
        this.workerVerificationRepository = workerVerificationRepository;
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

        long totalRequests = serviceRequestRepository.count();
        long openRequests = serviceRequestRepository.countByStatus(ServiceRequestStatus.OPEN);
        long cancelledRequests = serviceRequestRepository.countByStatus(ServiceRequestStatus.CANCELLED);

        long assignedRequests = jobRepository.count();
        long completedJobs = jobRepository.countByStatus(JobStatus.COMPLETED);

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
                totalRequests,
                openRequests,
                assignedRequests,
                completedJobs,
                cancelledRequests,
                totalRatings,
                avgRating,
                totalGross,
                totalFees,
                totalWorkerEarnings
        );
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
}
