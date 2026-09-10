package com.sih.cooperative;

import com.sih.cooperative.dto.*;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.*;
import com.sih.cooperative.service.DisputeService;
import com.sih.cooperative.service.WorkerVerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class AdminGovernanceIntegrationTest {

    @Autowired
    private DisputeService disputeService;

    @Autowired
    private WorkerVerificationService workerVerificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private DisputeRepository disputeRepository;

    @Autowired
    private DisputeHistoryRepository disputeHistoryRepository;

    @Autowired
    private WorkerVerificationRepository workerVerificationRepository;

    @Autowired
    private AdminActivityRepository adminActivityRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private User admin;
    private User customer;
    private User worker;
    private Job testJob;

    @BeforeEach
    public void setUp() {
        notificationRepository.deleteAll();
        disputeHistoryRepository.deleteAll();
        disputeRepository.deleteAll();
        workerVerificationRepository.deleteAll();
        jobRepository.deleteAll();
        serviceRequestRepository.deleteAll();
        adminActivityRepository.deleteAll();
        userRepository.deleteAll();

        admin = new User("Admin Steward", "admin.gov@gigcircle.com", "9000000001", "encodedpass", Role.ADMIN);
        admin.setStatus(AccountStatus.ACTIVE);
        admin = userRepository.save(admin);

        customer = new User("Customer User", "customer.gov@gigcircle.com", "9000000002", "encodedpass", Role.CUSTOMER);
        customer.setStatus(AccountStatus.ACTIVE);
        customer = userRepository.save(customer);

        worker = new User("Worker User", "worker.gov@gigcircle.com", "9000000003", "encodedpass", Role.WORKER);
        worker.setStatus(AccountStatus.ACTIVE);
        worker = userRepository.save(worker);

        ServiceRequest request = new ServiceRequest(customer, ServiceCategory.PLUMBING, "Leaking pipe repair", "Panaji, Goa", new BigDecimal("500.00"), LocalDateTime.now());
        request = serviceRequestRepository.save(request);

        testJob = new Job(request, worker, JobStatus.IN_PROGRESS);
        testJob = jobRepository.save(testJob);
    }

    @Test
    public void testAdminCanQueryPaginatedDisputesWithFilters() {
        CreateDisputeRequest req = new CreateDisputeRequest(testJob.getId(), DisputeReason.QUALITY_ISSUE, "Plumbing pipe leaking again");
        disputeService.createDispute(req, customer.getEmail());

        PageResponse<DisputeDetailResponse> pageRes = disputeService.getDisputesPaginatedForAdmin(
                DisputeStatus.OPEN,
                "plumbing",
                0,
                10,
                admin.getEmail()
        );

        assertNotNull(pageRes);
        assertEquals(1, pageRes.getContent().size());
        assertEquals(DisputeStatus.OPEN, pageRes.getContent().get(0).getStatus());
        assertEquals(0, pageRes.getPage());
        assertEquals(1, pageRes.getTotalElements());
    }

    @Test
    public void testNonAdminCannotQueryAdminDisputes() {
        assertThrows(ResponseStatusException.class, () -> {
            disputeService.getDisputesPaginatedForAdmin(null, null, 0, 10, customer.getEmail());
        });

        assertThrows(ResponseStatusException.class, () -> {
            disputeService.getDisputesPaginatedForAdmin(null, null, 0, 10, worker.getEmail());
        });
    }

    @Test
    public void testAdminDisputeStatusTransitionsAndAuditLogging() {
        CreateDisputeRequest req = new CreateDisputeRequest(testJob.getId(), DisputeReason.COMMUNICATION_ISSUE, "Worker un-responsive");
        DisputeDetailResponse created = disputeService.createDispute(req, customer.getEmail());

        DisputeDetailResponse underReview = disputeService.adminReviewDispute(created.getId(), admin.getEmail());
        assertEquals(DisputeStatus.UNDER_REVIEW, underReview.getStatus());

        AdminResolutionRequest resReq = new AdminResolutionRequest("Reviewed call logs. Dispute resolved in favor of customer.");
        DisputeDetailResponse resolved = disputeService.adminResolveDispute(created.getId(), resReq, admin.getEmail());
        assertEquals(DisputeStatus.RESOLVED, resolved.getStatus());
        assertEquals("Reviewed call logs. Dispute resolved in favor of customer.", resolved.getResolutionNotes());

        List<AdminActivity> activities = adminActivityRepository.findAll();
        assertFalse(activities.isEmpty());
        assertTrue(activities.stream().anyMatch(a -> a.getActionType().contains("RESOLVED")));
    }

    @Test
    public void testAdminCanQueryPaginatedWorkerVerifications() {
        WorkerVerification verification = new WorkerVerification(worker, VerificationStatus.PENDING_REVIEW);
        workerVerificationRepository.save(verification);

        PageResponse<WorkerVerificationResponse> pageRes = workerVerificationService.getAdminVerificationsPaginated(
                VerificationStatus.PENDING_REVIEW,
                "worker",
                0,
                10,
                admin.getEmail()
        );

        assertNotNull(pageRes);
        assertEquals(1, pageRes.getContent().size());
        assertEquals(VerificationStatus.PENDING_REVIEW, pageRes.getContent().get(0).getStatus());
    }

    @Test
    public void testAdminApproveAndRejectWorkerVerificationWithReason() {
        WorkerVerification verification = new WorkerVerification(worker, VerificationStatus.PENDING_REVIEW);
        verification = workerVerificationRepository.save(verification);

        AdminVerificationReviewRequest rejectReq = new AdminVerificationReviewRequest("Gov ID document unreadable");
        WorkerVerificationResponse rejected = workerVerificationService.rejectVerification(verification.getId(), rejectReq, admin.getEmail());

        assertEquals(VerificationStatus.REJECTED, rejected.getStatus());
        assertEquals("Gov ID document unreadable", rejected.getRejectionReason());
    }

    @Test
    public void testRejectWorkerVerificationRequiresNonBlankReason() {
        WorkerVerification verification = new WorkerVerification(worker, VerificationStatus.PENDING_REVIEW);
        verification = workerVerificationRepository.save(verification);

        Long verificationId = verification.getId();
        assertThrows(ResponseStatusException.class, () -> {
            workerVerificationService.rejectVerification(verificationId, new AdminVerificationReviewRequest("  "), admin.getEmail());
        });
    }
}
