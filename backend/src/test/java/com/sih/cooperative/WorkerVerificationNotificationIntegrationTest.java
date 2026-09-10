package com.sih.cooperative;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.cooperative.dto.AdminVerificationReviewRequest;
import com.sih.cooperative.dto.CreateWorkerProfileRequest;
import com.sih.cooperative.dto.RegisterRequest;
import com.sih.cooperative.dto.SubmitVerificationDocumentRequest;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.InvoiceRepository;
import com.sih.cooperative.repository.NotificationRepository;
import com.sih.cooperative.repository.UserRepository;
import com.sih.cooperative.repository.VerificationDocumentRepository;
import com.sih.cooperative.repository.WorkerProfileRepository;
import com.sih.cooperative.repository.WorkerVerificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class WorkerVerificationNotificationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkerVerificationRepository workerVerificationRepository;

    @Autowired
    private VerificationDocumentRepository verificationDocumentRepository;

    @Autowired
    private WorkerProfileRepository workerProfileRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminToken;
    private String workerToken;
    private User workerUser;
    private User adminUser;

    @BeforeEach
    void setUp() throws Exception {
        notificationRepository.deleteAll();
        invoiceRepository.deleteAll();
        verificationDocumentRepository.deleteAll();
        workerVerificationRepository.deleteAll();
        workerProfileRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Admin user
        adminUser = new User("Platform Admin", "admin_noti@gigcircle.com", "9000000000", passwordEncoder.encode("AdminPass123!"), Role.ADMIN);
        userRepository.save(adminUser);

        MvcResult adminLoginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin_noti@gigcircle.com\",\"password\":\"AdminPass123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        adminToken = objectMapper.readTree(adminLoginResult.getResponse().getContentAsString()).get("token").asText();

        // 2. Worker user
        RegisterRequest workerReg = new RegisterRequest("Worker Noti", "worker_noti@test.com", "9111111111", "Password123!", Role.WORKER);
        MvcResult workerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(workerReg)))
                .andExpect(status().isCreated())
                .andReturn();
        workerToken = objectMapper.readTree(workerResult.getResponse().getContentAsString()).get("token").asText();
        workerUser = userRepository.findByEmail("worker_noti@test.com").orElseThrow();

        // 3. Create worker profile
        CreateWorkerProfileRequest profileReq = new CreateWorkerProfileRequest(
                "Bio text", 3, new BigDecimal("350.00"), Set.of("Skills"), Set.of(ServiceCategory.ELECTRICAL), true, "City", 10, 16.5, 80.6, "Addr", "City"
        );
        mockMvc.perform(post("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileReq)))
                .andExpect(status().isCreated());
    }

    @Test
    public void testWorkerSubmissionNotifiesAdmin() throws Exception {
        // Submit document & verification
        mockMvc.perform(post("/api/worker/verification")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isCreated());

        SubmitVerificationDocumentRequest docReq = new SubmitVerificationDocumentRequest(VerificationDocumentType.GOVERNMENT_ID, "docs/id.pdf");
        mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docReq)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/worker/verification/resubmit")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk());

        // Verify notification delivered to admin
        List<Notification> adminNotis = notificationRepository.findByRecipientIdOrderByCreatedAtDescIdDesc(adminUser.getId())
                .stream()
                .filter(n -> n.getType() == NotificationType.VERIFICATION_SUBMITTED)
                .toList();
        assertEquals(1, adminNotis.size());
        Notification noti = adminNotis.get(0);
        assertEquals(NotificationType.VERIFICATION_SUBMITTED, noti.getType());
        assertEquals("New Verification Submitted", noti.getTitle());
        assertEquals("A worker verification has been submitted for review.", noti.getMessage());
        assertFalse(noti.getMessage().contains("docs/id.pdf"), "Notification must not expose storage paths");
    }

    @Test
    public void testAdminApproveNotifiesWorker() throws Exception {
        Long verificationId = preparePendingVerification();

        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        List<Notification> workerNotis = notificationRepository.findByRecipientIdOrderByCreatedAtDescIdDesc(workerUser.getId());
        assertEquals(1, workerNotis.size());
        Notification noti = workerNotis.get(0);
        assertEquals(NotificationType.VERIFICATION_APPROVED, noti.getType());
        assertEquals("Verification Approved", noti.getTitle());
        assertEquals("Your verification has been approved.", noti.getMessage());
    }

    @Test
    public void testAdminRequestChangesNotifiesWorker() throws Exception {
        Long verificationId = preparePendingVerification();

        AdminVerificationReviewRequest reviewReq = new AdminVerificationReviewRequest("Document image is blurry");
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/request-changes")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isOk());

        List<Notification> workerNotis = notificationRepository.findByRecipientIdOrderByCreatedAtDescIdDesc(workerUser.getId());
        assertEquals(1, workerNotis.size());
        Notification noti = workerNotis.get(0);
        assertEquals(NotificationType.VERIFICATION_CHANGES_REQUIRED, noti.getType());
        assertEquals("Changes Required", noti.getTitle());
        assertEquals("Your verification requires changes. Review the requested updates.", noti.getMessage());
    }

    @Test
    public void testAdminRejectNotifiesWorker() throws Exception {
        Long verificationId = preparePendingVerification();

        AdminVerificationReviewRequest reviewReq = new AdminVerificationReviewRequest("Invalid documents provided");
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/reject")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isOk());

        List<Notification> workerNotis = notificationRepository.findByRecipientIdOrderByCreatedAtDescIdDesc(workerUser.getId());
        assertEquals(1, workerNotis.size());
        Notification noti = workerNotis.get(0);
        assertEquals(NotificationType.VERIFICATION_REJECTED, noti.getType());
        assertEquals("Verification Rejected", noti.getTitle());
        assertEquals("Your verification has been rejected.", noti.getMessage());
    }

    @Test
    public void testAdminSuspendAndReinstateNotifications() throws Exception {
        Long verificationId = preparePendingVerification();

        // 1. Approve
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // 2. Suspend
        AdminVerificationReviewRequest suspendReq = new AdminVerificationReviewRequest("Safety policy review");
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/suspend")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(suspendReq)))
                .andExpect(status().isOk());

        // 3. Reinstate (Approve from suspended)
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/reinstate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        List<Notification> workerNotis = notificationRepository.findByRecipientIdOrderByCreatedAtDescIdDesc(workerUser.getId());
        assertEquals(3, workerNotis.size());

        // Latest notification is reinstatement
        assertEquals(NotificationType.VERIFICATION_REINSTATED, workerNotis.get(0).getType());
        assertEquals("Verification Reinstated", workerNotis.get(0).getTitle());
        assertEquals("Your verification has been reinstated.", workerNotis.get(0).getMessage());

        // Second notification is suspension
        assertEquals(NotificationType.VERIFICATION_SUSPENDED, workerNotis.get(1).getType());
        assertEquals("Verification Suspended", workerNotis.get(1).getTitle());
        assertEquals("Your verification has been suspended.", workerNotis.get(1).getMessage());

        // Initial notification is approval
        assertEquals(NotificationType.VERIFICATION_APPROVED, workerNotis.get(2).getType());
    }

    @Test
    public void testUnauthorizedAndInvalidActionsCreateNoNotifications() throws Exception {
        Long verificationId = preparePendingVerification();
        int initialCount = notificationRepository.findAll().size();

        // Worker trying to call admin approve -> 403 Forbidden
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/approve")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());

        // Admin approve invalid ID -> 404 Not Found
        mockMvc.perform(post("/api/admin/verifications/999999/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());

        // No new notifications generated from failed attempts
        assertEquals(initialCount, notificationRepository.findAll().size());
    }

    private Long preparePendingVerification() throws Exception {
        mockMvc.perform(post("/api/worker/verification")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isCreated());

        SubmitVerificationDocumentRequest docReq = new SubmitVerificationDocumentRequest(VerificationDocumentType.GOVERNMENT_ID, "docs/id.pdf");
        mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docReq)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/worker/verification/resubmit")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk());

        WorkerVerification ver = workerVerificationRepository.findByWorkerId(workerUser.getId()).orElseThrow();
        return ver.getId();
    }
}
