package com.sih.cooperative;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.cooperative.dto.AdminVerificationReviewRequest;
import com.sih.cooperative.dto.CreateWorkerProfileRequest;
import com.sih.cooperative.dto.SubmitVerificationDocumentRequest;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.*;
import com.sih.cooperative.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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

import com.sih.cooperative.repository.PaymentRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class WorkerVerificationWorkflowAcceptanceTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkerVerificationRepository verificationRepository;

    @Autowired
    private VerificationDocumentRepository documentRepository;

    @Autowired
    private WorkerProfileRepository workerProfileRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    private User worker;
    private User admin;
    private User customer;

    private String workerToken;
    private String adminToken;
    private String customerToken;

    @BeforeEach
    void setUp() {
        paymentRepository.deleteAll();
        notificationRepository.deleteAll();
        invoiceRepository.deleteAll();
        documentRepository.deleteAll();
        verificationRepository.deleteAll();
        workerProfileRepository.deleteAll();
        userRepository.deleteAll();

        worker = new User();
        worker.setName("E2E Worker");
        worker.setEmail("e2e_worker@test.com");
        worker.setPassword(passwordEncoder.encode("Password123!"));
        worker.setPhone("9876543210");
        worker.setRole(Role.WORKER);
        worker = userRepository.save(worker);

        admin = new User();
        admin.setName("E2E Admin");
        admin.setEmail("e2e_admin@test.com");
        admin.setPassword(passwordEncoder.encode("Password123!"));
        admin.setPhone("9876543211");
        admin.setRole(Role.ADMIN);
        admin = userRepository.save(admin);

        customer = new User();
        customer.setName("E2E Customer");
        customer.setEmail("e2e_customer@test.com");
        customer.setPassword(passwordEncoder.encode("Password123!"));
        customer.setPhone("9876543212");
        customer.setRole(Role.CUSTOMER);
        customer = userRepository.save(customer);

        workerToken = "Bearer " + jwtTokenProvider.generateToken(worker);
        adminToken = "Bearer " + jwtTokenProvider.generateToken(admin);
        customerToken = "Bearer " + jwtTokenProvider.generateToken(customer);
    }

    @Test
    @DisplayName("Full Lifecycle: NOT_SUBMITTED -> PENDING_REVIEW -> CHANGES_REQUIRED -> PENDING_REVIEW -> VERIFIED -> SUSPENDED -> VERIFIED")
    void testFullHappyPathLifecycle() throws Exception {
        // Create worker profile so badge endpoint can be read
        CreateWorkerProfileRequest profileReq = new CreateWorkerProfileRequest(
                "E2E Worker Bio",
                5,
                new BigDecimal("500.00"),
                Set.of("Wiring"),
                Set.of(ServiceCategory.ELECTRICAL),
                true,
                "City",
                10,
                16.5,
                80.6,
                "Street",
                "City"
        );
        mockMvc.perform(post("/api/worker/profile")
                        .header("Authorization", workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileReq)))
                .andExpect(status().isCreated());

        // 1. Initial State (No Verification Record) -> isVerified = false
        mockMvc.perform(get("/api/worker/profile")
                        .header("Authorization", workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isVerified").value(false));

        // 2. Create verification record & submit document
        mockMvc.perform(post("/api/worker/verification")
                        .header("Authorization", workerToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("NOT_SUBMITTED"));

        SubmitVerificationDocumentRequest doc1 = new SubmitVerificationDocumentRequest(
                VerificationDocumentType.GOVERNMENT_ID, "docs/gov_id_v1.pdf"
        );
        mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(doc1)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/worker/verification/resubmit")
                        .header("Authorization", workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING_REVIEW"));

        // Verify Admin notification created
        List<Notification> adminNotifs = notificationRepository.findByRecipientIdOrderByCreatedAtDescIdDesc(admin.getId());
        assertFalse(adminNotifs.isEmpty());
        assertEquals(NotificationType.VERIFICATION_SUBMITTED, adminNotifs.get(0).getType());

        // 3. Admin requests changes
        WorkerVerification verification = verificationRepository.findByWorker(worker).orElseThrow();
        AdminVerificationReviewRequest requestChangesReq = new AdminVerificationReviewRequest();
        requestChangesReq.setReason("Government ID image is blurry. Please upload a clear copy.");

        mockMvc.perform(post("/api/admin/verifications/" + verification.getId() + "/request-changes")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestChangesReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CHANGES_REQUIRED"));

        // Verify Worker notification created
        List<Notification> workerNotifs = notificationRepository.findByRecipientIdOrderByCreatedAtDescIdDesc(worker.getId());
        assertFalse(workerNotifs.isEmpty());
        assertEquals(NotificationType.VERIFICATION_CHANGES_REQUIRED, workerNotifs.get(0).getType());

        // 4. Worker uploads updated doc and resubmits verification
        SubmitVerificationDocumentRequest doc2 = new SubmitVerificationDocumentRequest(
                VerificationDocumentType.GOVERNMENT_ID, "docs/gov_id_v2.pdf"
        );
        mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(doc2)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/worker/verification/resubmit")
                        .header("Authorization", workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING_REVIEW"));

        // 5. Admin approves verification
        mockMvc.perform(post("/api/admin/verifications/" + verification.getId() + "/approve")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VERIFIED"));

        // Verify Worker badge is now TRUE
        mockMvc.perform(get("/api/worker/profile")
                        .header("Authorization", workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isVerified").value(true));

        workerNotifs = notificationRepository.findByRecipientIdOrderByCreatedAtDescIdDesc(worker.getId());
        assertEquals(NotificationType.VERIFICATION_APPROVED, workerNotifs.get(0).getType());

        // 6. Admin suspends worker verification
        AdminVerificationReviewRequest suspendReq = new AdminVerificationReviewRequest();
        suspendReq.setReason("Expired document detected upon annual audit");

        mockMvc.perform(post("/api/admin/verifications/" + verification.getId() + "/suspend")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(suspendReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));

        // Verify Worker badge is back to FALSE
        mockMvc.perform(get("/api/worker/profile")
                        .header("Authorization", workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isVerified").value(false));

        workerNotifs = notificationRepository.findByRecipientIdOrderByCreatedAtDescIdDesc(worker.getId());
        assertEquals(NotificationType.VERIFICATION_SUSPENDED, workerNotifs.get(0).getType());

        // 7. Admin reinstates worker verification (SUSPENDED -> VERIFIED)
        mockMvc.perform(post("/api/admin/verifications/" + verification.getId() + "/reinstate")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VERIFIED"));

        // Verify Worker badge is TRUE again
        mockMvc.perform(get("/api/worker/profile")
                        .header("Authorization", workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isVerified").value(true));

        workerNotifs = notificationRepository.findByRecipientIdOrderByCreatedAtDescIdDesc(worker.getId());
        assertEquals(NotificationType.VERIFICATION_REINSTATED, workerNotifs.get(0).getType());
    }

    @Test
    @DisplayName("Reject Path: PENDING_REVIEW -> REJECTED")
    void testRejectionPath() throws Exception {
        mockMvc.perform(post("/api/worker/verification")
                        .header("Authorization", workerToken))
                .andExpect(status().isCreated());

        SubmitVerificationDocumentRequest doc = new SubmitVerificationDocumentRequest(
                VerificationDocumentType.GOVERNMENT_ID, "docs/fake_id.pdf"
        );
        mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(doc)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/worker/verification/resubmit")
                        .header("Authorization", workerToken))
                .andExpect(status().isOk());

        WorkerVerification verification = verificationRepository.findByWorker(worker).orElseThrow();

        AdminVerificationReviewRequest rejectReq = new AdminVerificationReviewRequest();
        rejectReq.setReason("Fraudulent document provided");

        mockMvc.perform(post("/api/admin/verifications/" + verification.getId() + "/reject")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));

        List<Notification> workerNotifs = notificationRepository.findByRecipientIdOrderByCreatedAtDescIdDesc(worker.getId());
        assertEquals(NotificationType.VERIFICATION_REJECTED, workerNotifs.get(0).getType());
    }

    @Test
    @DisplayName("Invalid Transitions & RBAC Isolation")
    void testInvalidTransitionsAndSecurity() throws Exception {
        // 1. Admin trying to approve non-existent or un-submitted verification
        mockMvc.perform(post("/api/admin/verifications/999999/approve")
                        .header("Authorization", adminToken))
                .andExpect(status().isNotFound());

        // 2. Worker trying to access admin endpoint -> 403 Forbidden
        mockMvc.perform(get("/api/admin/verifications")
                        .header("Authorization", workerToken))
                .andExpect(status().isForbidden());

        // 3. Customer trying to resubmit verification -> 403 Forbidden
        mockMvc.perform(post("/api/worker/verification/resubmit")
                        .header("Authorization", customerToken))
                .andExpect(status().isForbidden());

        // 4. Create and Submit verification as worker
        mockMvc.perform(post("/api/worker/verification")
                        .header("Authorization", workerToken))
                .andExpect(status().isCreated());

        SubmitVerificationDocumentRequest doc = new SubmitVerificationDocumentRequest(
                VerificationDocumentType.GOVERNMENT_ID, "docs/valid_id.pdf"
        );
        mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(doc)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/worker/verification/resubmit")
                        .header("Authorization", workerToken))
                .andExpect(status().isOk());

        WorkerVerification verification = verificationRepository.findByWorker(worker).orElseThrow();

        // 5. Try to reinstate non-suspended profile -> 400 Bad Request
        mockMvc.perform(post("/api/admin/verifications/" + verification.getId() + "/reinstate")
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest());

        // 6. Try to suspend non-verified profile -> 400 Bad Request
        AdminVerificationReviewRequest suspendReq = new AdminVerificationReviewRequest();
        suspendReq.setReason("Suspend test");
        mockMvc.perform(post("/api/admin/verifications/" + verification.getId() + "/suspend")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(suspendReq)))
                .andExpect(status().isBadRequest());

        // Approve it first
        mockMvc.perform(post("/api/admin/verifications/" + verification.getId() + "/approve")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk());

        // 7. Try to approve already VERIFIED profile -> 400 Bad Request
        mockMvc.perform(post("/api/admin/verifications/" + verification.getId() + "/approve")
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest());

        // 8. Try to resubmit already VERIFIED profile -> 400 Bad Request
        mockMvc.perform(post("/api/worker/verification/resubmit")
                        .header("Authorization", workerToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Private File Storage Endpoint Access Control")
    void testPrivateStorageAccessControl() throws Exception {
        mockMvc.perform(post("/api/worker/verification")
                        .header("Authorization", workerToken))
                .andExpect(status().isCreated());

        SubmitVerificationDocumentRequest docReq = new SubmitVerificationDocumentRequest(
                VerificationDocumentType.GOVERNMENT_ID, "docs/my_id.pdf"
        );
        MvcResult docRes = mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docReq)))
                .andExpect(status().isCreated()).andReturn();

        Long docId = objectMapper.readTree(docRes.getResponse().getContentAsString()).get("id").asLong();

        // Worker previews own document -> 200 OK
        mockMvc.perform(get("/api/worker/verification/documents/" + docId + "/preview")
                        .header("Authorization", workerToken))
                .andExpect(status().isOk());

        // Customer attempts preview on worker endpoint -> 403 Forbidden
        mockMvc.perform(get("/api/worker/verification/documents/" + docId + "/preview")
                        .header("Authorization", customerToken))
                .andExpect(status().isForbidden());
    }
}
