package com.sih.cooperative.service;

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

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DisputeService {

    private static final Logger log = LoggerFactory.getLogger(DisputeService.class);

    private static final List<DisputeStatus> ACTIVE_STATUSES = Arrays.asList(
            DisputeStatus.OPEN,
            DisputeStatus.UNDER_REVIEW,
            DisputeStatus.ACTION_REQUIRED
    );

    private final DisputeRepository disputeRepository;
    private final DisputeHistoryRepository disputeHistoryRepository;
    private final DisputeEvidenceRepository disputeEvidenceRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final AdminActivityRepository adminActivityRepository;
    private final NotificationService notificationService;

    public DisputeService(DisputeRepository disputeRepository,
                          DisputeHistoryRepository disputeHistoryRepository,
                          DisputeEvidenceRepository disputeEvidenceRepository,
                          JobRepository jobRepository,
                          UserRepository userRepository,
                          AdminActivityRepository adminActivityRepository,
                          NotificationService notificationService) {
        this.disputeRepository = disputeRepository;
        this.disputeHistoryRepository = disputeHistoryRepository;
        this.disputeEvidenceRepository = disputeEvidenceRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.adminActivityRepository = adminActivityRepository;
        this.notificationService = notificationService;
    }

    private User getAuthenticatedUser(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private Dispute getDisputeById(Long disputeId) {
        return disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dispute not found"));
    }

    private DisputeDetailResponse mapToDetailResponse(Dispute dispute) {
        List<DisputeHistoryResponse> history = disputeHistoryRepository.findByDisputeIdOrderByCreatedAtAsc(dispute.getId())
                .stream().map(DisputeHistoryResponse::fromEntity).collect(Collectors.toList());
        List<DisputeEvidenceResponse> evidence = disputeEvidenceRepository.findByDisputeIdOrderByCreatedAtAsc(dispute.getId())
                .stream().map(DisputeEvidenceResponse::fromEntity).collect(Collectors.toList());

        return DisputeDetailResponse.fromEntity(dispute, history, evidence);
    }

    private void createAuditAndNotification(User actor, Dispute dispute, DisputeStatus oldStatus, DisputeStatus newStatus, String comment, String notificationTitle, String notificationMessage) {
        // Create DisputeHistory
        DisputeHistory history = new DisputeHistory(dispute, actor, oldStatus, newStatus, comment);
        disputeHistoryRepository.save(history);

        // If actor is Admin, log AdminActivity
        if (actor.getRole() == Role.ADMIN) {
            AdminActivity activity = new AdminActivity(
                    actor.getId(),
                    actor.getRole(),
                    "DISPUTE_" + newStatus.name(),
                    "Dispute",
                    dispute.getId(),
                    "Admin transitioned dispute #" + dispute.getId() + " from " + (oldStatus != null ? oldStatus.name() : "NONE") + " to " + newStatus.name() + ": " + comment
            );
            adminActivityRepository.save(activity);
        }

        // Notify intended recipients (other participant or both participants for admin actions)
        try {
            if (actor.getRole() == Role.ADMIN) {
                // Notify both customer and worker
                notificationService.createNotification(dispute.getRaisedBy(), NotificationType.SERVICE_REQUEST_CREATED, notificationTitle, notificationMessage, "Dispute", dispute.getId());
                notificationService.createNotification(dispute.getAgainstUser(), NotificationType.SERVICE_REQUEST_CREATED, notificationTitle, notificationMessage, "Dispute", dispute.getId());
            } else {
                // Notify opposing party
                User recipient = dispute.getRaisedBy().getId().equals(actor.getId()) ? dispute.getAgainstUser() : dispute.getRaisedBy();
                notificationService.createNotification(recipient, NotificationType.SERVICE_REQUEST_CREATED, notificationTitle, notificationMessage, "Dispute", dispute.getId());
            }
        } catch (Exception e) {
            log.error("Failed to send notification for dispute #{}: {}", dispute.getId(), e.getMessage());
        }
    }

    // ==========================================
    // CUSTOMER / WORKER PARTICIPANT ENDPOINTS
    // ==========================================

    @Transactional
    public DisputeDetailResponse createDispute(CreateDisputeRequest request, String currentUserEmail) {
        User creator = getAuthenticatedUser(currentUserEmail);

        if (creator.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admins cannot raise participant disputes");
        }

        Job job = jobRepository.findById(request.getJobId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (job.getWorker() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot raise dispute on job without an assigned worker");
        }

        User customer = job.getServiceRequest() != null ? job.getServiceRequest().getCustomer() : null;
        User workerUser = job.getWorker();

        boolean isCustomer = customer != null && customer.getId().equals(creator.getId());
        boolean isWorker = workerUser != null && workerUser.getId().equals(creator.getId());

        if (!isCustomer && !isWorker) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Only job customer or assigned worker can raise a dispute");
        }

        User againstUser = isCustomer ? workerUser : customer;

        // Check active dispute application-level
        if (disputeRepository.existsByJobIdAndStatusIn(job.getId(), ACTIVE_STATUSES)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An active dispute already exists for this job");
        }

        Dispute dispute = new Dispute(job, creator, againstUser, request.getReason(), request.getDescription().trim());
        try {
            dispute = disputeRepository.save(dispute);
        } catch (DataIntegrityViolationException e) {
            log.warn("Concurrent dispute creation conflict for job #{}: {}", job.getId(), e.getMessage());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An active dispute already exists for this job");
        }

        // Audit & History & Notification
        createAuditAndNotification(creator, dispute, null, DisputeStatus.OPEN, "Dispute created: " + request.getDescription().trim(),
                "New Dispute Raised", "A dispute has been raised regarding Job #" + job.getId());

        return mapToDetailResponse(dispute);
    }

    @Transactional(readOnly = true)
    public List<DisputeDetailResponse> getMyDisputes(String currentUserEmail) {
        User user = getAuthenticatedUser(currentUserEmail);
        List<Dispute> disputes = disputeRepository.findByUserIdInvolvingOrderByCreatedAtDesc(user.getId());
        return disputes.stream().map(this::mapToDetailResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DisputeDetailResponse getDisputeForJob(Long jobId, String currentUserEmail) {
        User user = getAuthenticatedUser(currentUserEmail);
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        User customer = job.getServiceRequest() != null ? job.getServiceRequest().getCustomer() : null;
        User workerUser = job.getWorker();

        boolean isCustomer = customer != null && customer.getId().equals(user.getId());
        boolean isWorker = workerUser != null && workerUser.getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isCustomer && !isWorker && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Not authorized to view dispute for this job");
        }

        Dispute dispute = disputeRepository.findFirstByJobIdAndStatusInOrderByCreatedAtDesc(jobId, Arrays.asList(DisputeStatus.values()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No dispute found for this job"));

        return mapToDetailResponse(dispute);
    }

    @Transactional(readOnly = true)
    public DisputeDetailResponse getDisputeById(Long disputeId, String currentUserEmail) {
        User user = getAuthenticatedUser(currentUserEmail);
        Dispute dispute = getDisputeById(disputeId);

        boolean isRaisedBy = dispute.getRaisedBy().getId().equals(user.getId());
        boolean isAgainst = dispute.getAgainstUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isRaisedBy && !isAgainst && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Not authorized to view this dispute");
        }

        return mapToDetailResponse(dispute);
    }

    @Transactional
    public DisputeDetailResponse respondToDispute(Long disputeId, DisputeResponseRequest request, String currentUserEmail) {
        User responder = getAuthenticatedUser(currentUserEmail);

        if (responder.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admins must use admin response endpoints");
        }

        Dispute dispute = getDisputeById(disputeId);

        boolean isRaisedBy = dispute.getRaisedBy().getId().equals(responder.getId());
        boolean isAgainst = dispute.getAgainstUser().getId().equals(responder.getId());

        if (!isRaisedBy && !isAgainst) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Not a participant in this dispute");
        }

        if (dispute.getStatus() == DisputeStatus.RESOLVED || dispute.getStatus() == DisputeStatus.DISMISSED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot respond to a closed dispute");
        }

        createAuditAndNotification(responder, dispute, dispute.getStatus(), dispute.getStatus(), request.getMessage().trim(),
                "New Dispute Response", "A response was added to dispute #" + dispute.getId());

        return mapToDetailResponse(dispute);
    }

    // ==========================================
    // ADMIN DISPUTE ENDPOINTS
    // ==========================================

    @Transactional(readOnly = true)
    public List<DisputeDetailResponse> getAllDisputesForAdmin(DisputeStatus statusFilter, String adminEmail) {
        User admin = getAuthenticatedUser(adminEmail);
        if (admin.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }

        List<Dispute> disputes = (statusFilter != null)
                ? disputeRepository.findByStatusOrderByCreatedAtDesc(statusFilter)
                : disputeRepository.findAllByOrderByCreatedAtDesc();

        return disputes.stream().map(this::mapToDetailResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<DisputeDetailResponse> getDisputesPaginatedForAdmin(
            DisputeStatus statusFilter,
            String search,
            int page,
            int size,
            String adminEmail
    ) {
        User admin = getAuthenticatedUser(adminEmail);
        if (admin.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }

        int targetPage = Math.max(0, page);
        int targetSize = (size <= 0 || size > 100) ? 15 : size;
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(targetPage, targetSize, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));

        org.springframework.data.jpa.domain.Specification<Dispute> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();

            if (statusFilter != null) {
                predicates.add(cb.equal(root.get("status"), statusFilter));
            }

            if (search != null && !search.trim().isEmpty()) {
                String searchLike = "%" + search.trim().toLowerCase() + "%";
                jakarta.persistence.criteria.Join<Object, Object> raisedBy = root.join("raisedBy", jakarta.persistence.criteria.JoinType.LEFT);
                jakarta.persistence.criteria.Join<Object, Object> againstUser = root.join("againstUser", jakarta.persistence.criteria.JoinType.LEFT);
                jakarta.persistence.criteria.Join<Object, Object> job = root.join("job", jakarta.persistence.criteria.JoinType.LEFT);
                jakarta.persistence.criteria.Join<Object, Object> req = job.join("serviceRequest", jakarta.persistence.criteria.JoinType.LEFT);

                jakarta.persistence.criteria.Predicate p1 = cb.like(cb.lower(raisedBy.get("name")), searchLike);
                jakarta.persistence.criteria.Predicate p2 = cb.like(cb.lower(againstUser.get("name")), searchLike);
                jakarta.persistence.criteria.Predicate p3 = cb.like(cb.lower(req.get("category")), searchLike);
                jakarta.persistence.criteria.Predicate p4 = cb.like(cb.lower(req.get("description")), searchLike);

                predicates.add(cb.or(p1, p2, p3, p4));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        org.springframework.data.domain.Page<Dispute> disputePage = disputeRepository.findAll(spec, pageable);
        List<DisputeDetailResponse> content = disputePage.getContent().stream()
                .map(this::mapToDetailResponse)
                .collect(Collectors.toList());

        return new PageResponse<>(
                content,
                disputePage.getNumber(),
                disputePage.getSize(),
                disputePage.getTotalElements(),
                disputePage.getTotalPages(),
                disputePage.isFirst(),
                disputePage.isLast()
        );
    }

    @Transactional
    public DisputeDetailResponse adminRequestResponse(Long disputeId, AdminRequestResponseRequest request, String adminEmail) {
        User admin = getAuthenticatedUser(adminEmail);
        if (admin.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }

        Dispute dispute = getDisputeById(disputeId);
        if (dispute.getStatus() == DisputeStatus.RESOLVED || dispute.getStatus() == DisputeStatus.DISMISSED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot request response on a closed dispute");
        }

        DisputeStatus oldStatus = dispute.getStatus();
        dispute.setStatus(DisputeStatus.ACTION_REQUIRED);
        disputeRepository.save(dispute);

        createAuditAndNotification(admin, dispute, oldStatus, DisputeStatus.ACTION_REQUIRED, "Admin action required: " + request.getMessage().trim(),
                "Action Required on Dispute", "Admin requested action/response on dispute #" + dispute.getId());

        return mapToDetailResponse(dispute);
    }

    @Transactional
    public DisputeDetailResponse adminReviewDispute(Long disputeId, String adminEmail) {
        User admin = getAuthenticatedUser(adminEmail);
        if (admin.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }

        Dispute dispute = getDisputeById(disputeId);
        if (dispute.getStatus() == DisputeStatus.RESOLVED || dispute.getStatus() == DisputeStatus.DISMISSED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot review a closed dispute");
        }

        DisputeStatus oldStatus = dispute.getStatus();
        dispute.setStatus(DisputeStatus.UNDER_REVIEW);
        disputeRepository.save(dispute);

        createAuditAndNotification(admin, dispute, oldStatus, DisputeStatus.UNDER_REVIEW, "Dispute moved under review by admin",
                "Dispute Under Review", "Dispute #" + dispute.getId() + " is now under admin review");

        return mapToDetailResponse(dispute);
    }

    @Transactional
    public DisputeDetailResponse adminResolveDispute(Long disputeId, AdminResolutionRequest request, String adminEmail) {
        User admin = getAuthenticatedUser(adminEmail);
        if (admin.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }

        Dispute dispute = getDisputeById(disputeId);
        if (dispute.getStatus() == DisputeStatus.RESOLVED || dispute.getStatus() == DisputeStatus.DISMISSED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dispute is already closed");
        }

        DisputeStatus oldStatus = dispute.getStatus();
        LocalDateTime now = LocalDateTime.now();

        dispute.setStatus(DisputeStatus.RESOLVED);
        dispute.setResolutionNotes(request.getResolutionNote().trim());
        dispute.setResolvedBy(admin);
        dispute.setResolvedAt(now);
        disputeRepository.save(dispute);

        createAuditAndNotification(admin, dispute, oldStatus, DisputeStatus.RESOLVED, "Resolved: " + request.getResolutionNote().trim(),
                "Dispute Resolved", "Dispute #" + dispute.getId() + " has been resolved by admin");

        return mapToDetailResponse(dispute);
    }

    @Transactional
    public DisputeDetailResponse adminDismissDispute(Long disputeId, AdminDismissRequest request, String adminEmail) {
        User admin = getAuthenticatedUser(adminEmail);
        if (admin.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }

        Dispute dispute = getDisputeById(disputeId);
        if (dispute.getStatus() == DisputeStatus.RESOLVED || dispute.getStatus() == DisputeStatus.DISMISSED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dispute is already closed");
        }

        DisputeStatus oldStatus = dispute.getStatus();
        LocalDateTime now = LocalDateTime.now();

        dispute.setStatus(DisputeStatus.DISMISSED);
        dispute.setResolutionNotes(request.getDismissalNote().trim());
        dispute.setResolvedBy(admin);
        dispute.setResolvedAt(now);
        disputeRepository.save(dispute);

        createAuditAndNotification(admin, dispute, oldStatus, DisputeStatus.DISMISSED, "Dismissed: " + request.getDismissalNote().trim(),
                "Dispute Dismissed", "Dispute #" + dispute.getId() + " has been dismissed by admin");

        return mapToDetailResponse(dispute);
    }
}
