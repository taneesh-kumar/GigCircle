package com.sih.cooperative;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.cooperative.dto.AdminVerificationReviewRequest;
import com.sih.cooperative.dto.RegisterRequest;
import com.sih.cooperative.dto.SubmitVerificationDocumentRequest;
import com.sih.cooperative.dto.UpdateVerificationDocumentRequest;
import com.sih.cooperative.entity.Role;
import com.sih.cooperative.entity.User;
import com.sih.cooperative.entity.VerificationDocumentType;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class WorkerVerificationApiIntegrationTest {

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
    private com.sih.cooperative.repository.NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminToken;
    private String worker1Token;
    private String worker2Token;
    private String customerToken;

    private User worker1User;
    @SuppressWarnings("unused")
    private User worker2User;

    @BeforeEach
    void setUp() throws Exception {
        notificationRepository.deleteAll();
        verificationDocumentRepository.deleteAll();
        workerVerificationRepository.deleteAll();
        workerProfileRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Admin setup
        User adminUser = new User("System Admin", "admin@gigcircle.com", "9000000000", passwordEncoder.encode("AdminPass123!"), Role.ADMIN);
        userRepository.save(adminUser);

        MvcResult adminLoginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@gigcircle.com\",\"password\":\"AdminPass123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        adminToken = objectMapper.readTree(adminLoginResult.getResponse().getContentAsString()).get("token").asText();

        // 2. Worker 1 setup
        RegisterRequest wkr1Req = new RegisterRequest("Worker One", "worker1@test.com", "9111111111", "Password123!", Role.WORKER);
        MvcResult wkr1Result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wkr1Req)))
                .andExpect(status().isCreated())
                .andReturn();
        worker1Token = objectMapper.readTree(wkr1Result.getResponse().getContentAsString()).get("token").asText();
        worker1User = userRepository.findByEmail("worker1@test.com").orElseThrow();

        // 3. Worker 2 setup
        RegisterRequest wkr2Req = new RegisterRequest("Worker Two", "worker2@test.com", "9222222222", "Password123!", Role.WORKER);
        MvcResult wkr2Result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wkr2Req)))
                .andExpect(status().isCreated())
                .andReturn();
        worker2Token = objectMapper.readTree(wkr2Result.getResponse().getContentAsString()).get("token").asText();
        worker2User = userRepository.findByEmail("worker2@test.com").orElseThrow();

        // 4. Customer setup
        RegisterRequest custReq = new RegisterRequest("Customer One", "customer1@test.com", "9333333333", "Password123!", Role.CUSTOMER);
        MvcResult custResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(custReq)))
                .andExpect(status().isCreated())
                .andReturn();
        customerToken = objectMapper.readTree(custResult.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    public void testWorkerCreatesVerificationAndManagesDocuments() throws Exception {
        // Create verification record
        mockMvc.perform(post("/api/worker/verification")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("NOT_SUBMITTED"))
                .andExpect(jsonPath("$.workerId").value(worker1User.getId()));

        // Cannot create duplicate verification record
        mockMvc.perform(post("/api/worker/verification")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isBadRequest());

        // Submit document
        SubmitVerificationDocumentRequest docReq = new SubmitVerificationDocumentRequest(
                VerificationDocumentType.GOVERNMENT_ID, "uploads/id_card.pdf");

        MvcResult docResult = mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", "Bearer " + worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.documentType").value("GOVERNMENT_ID"))
                .andExpect(jsonPath("$.fileReference").value("uploads/id_card.pdf"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn();

        Long docId = objectMapper.readTree(docResult.getResponse().getContentAsString()).get("id").asLong();

        // Update document
        UpdateVerificationDocumentRequest updateReq = new UpdateVerificationDocumentRequest(
                VerificationDocumentType.GOVERNMENT_ID, "uploads/id_card_v2.pdf");

        mockMvc.perform(put("/api/worker/verification/documents/" + docId)
                        .header("Authorization", "Bearer " + worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileReference").value("uploads/id_card_v2.pdf"));

        // Fetch worker verification details
        mockMvc.perform(get("/api/worker/verification")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.documents", hasSize(1)))
                .andExpect(jsonPath("$.documents[0].fileReference").value("uploads/id_card_v2.pdf"));
    }

    @Test
    public void testWorkerResubmissionAndDocumentValidation() throws Exception {
        // Resubmitting without creation / documents -> auto-creates or fails on missing docs
        mockMvc.perform(post("/api/worker/verification")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isCreated());

        // Cannot resubmit without documents
        mockMvc.perform(post("/api/worker/verification/resubmit")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isBadRequest());

        // Submit document
        SubmitVerificationDocumentRequest docReq = new SubmitVerificationDocumentRequest(
                VerificationDocumentType.GOVERNMENT_ID, "uploads/gov_id.pdf");
        mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", "Bearer " + worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docReq)))
                .andExpect(status().isCreated());

        // Now resubmit successfully
        mockMvc.perform(post("/api/worker/verification/resubmit")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING_REVIEW"))
                .andExpect(jsonPath("$.submittedAt").value(notNullValue()));

        // Cannot resubmit while review is already pending
        mockMvc.perform(post("/api/worker/verification/resubmit")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testSecurityAndAccessControl() throws Exception {
        // Worker cannot access Admin APIs
        mockMvc.perform(get("/api/admin/verifications")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isForbidden());

        // Customer cannot access Admin APIs
        mockMvc.perform(get("/api/admin/verifications")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        // Worker 1 setup with document
        mockMvc.perform(post("/api/worker/verification")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isCreated());

        SubmitVerificationDocumentRequest docReq = new SubmitVerificationDocumentRequest(
                VerificationDocumentType.GOVERNMENT_ID, "uploads/w1_id.pdf");
        MvcResult docResult = mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", "Bearer " + worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docReq)))
                .andExpect(status().isCreated())
                .andReturn();
        Long w1DocId = objectMapper.readTree(docResult.getResponse().getContentAsString()).get("id").asLong();

        // Worker 2 cannot modify Worker 1's document
        UpdateVerificationDocumentRequest updateReq = new UpdateVerificationDocumentRequest(
                VerificationDocumentType.GOVERNMENT_ID, "uploads/hacked.pdf");
        mockMvc.perform(put("/api/worker/verification/documents/" + w1DocId)
                        .header("Authorization", "Bearer " + worker2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testAdminVerificationWorkflow() throws Exception {
        // Setup worker verification and submit
        mockMvc.perform(post("/api/worker/verification")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isCreated());

        SubmitVerificationDocumentRequest docReq = new SubmitVerificationDocumentRequest(
                VerificationDocumentType.GOVERNMENT_ID, "uploads/gov_id.pdf");
        mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", "Bearer " + worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docReq)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/worker/verification/resubmit")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isOk());

        // Admin lists verifications
        MvcResult listResult = mockMvc.perform(get("/api/admin/verifications?status=PENDING_REVIEW")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].workerId").value(worker1User.getId()))
                .andReturn();

        Long verificationId = objectMapper.readTree(listResult.getResponse().getContentAsString()).get(0).get("id").asLong();

        // Admin request changes without reason -> 400 Bad Request
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/request-changes")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        // Admin request changes with reason
        AdminVerificationReviewRequest changesReq = new AdminVerificationReviewRequest("ID is unclear");
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/request-changes")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(changesReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CHANGES_REQUIRED"))
                .andExpect(jsonPath("$.rejectionReason").value("ID is unclear"));

        // Worker resubmits
        mockMvc.perform(post("/api/worker/verification/resubmit")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING_REVIEW"));

        // Admin approves
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VERIFIED"))
                .andExpect(jsonPath("$.verifiedAt").value(notNullValue()))
                .andExpect(jsonPath("$.documents[0].status").value("APPROVED"));

        // Admin suspends verified worker
        AdminVerificationReviewRequest suspendReq = new AdminVerificationReviewRequest("Compliance policy violation");
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/suspend")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(suspendReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));

        // Admin reinstates (approves) suspended worker
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VERIFIED"));
    }

    @Test
    public void testAdminRejectionAndInvalidTransitions() throws Exception {
        // Setup worker verification and submit
        mockMvc.perform(post("/api/worker/verification")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isCreated());

        SubmitVerificationDocumentRequest docReq = new SubmitVerificationDocumentRequest(
                VerificationDocumentType.GOVERNMENT_ID, "uploads/fake_id.pdf");
        mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", "Bearer " + worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docReq)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/worker/verification/resubmit")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isOk());

        Long verificationId = workerVerificationRepository.findByWorkerId(worker1User.getId()).orElseThrow().getId();

        // Reject without reason -> 400 Bad Request
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/reject")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        // Reject with reason
        AdminVerificationReviewRequest rejectReq = new AdminVerificationReviewRequest("Fraudulent document provided");
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/reject")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionReason").value("Fraudulent document provided"));

        // Cannot approve a REJECTED verification directly without resubmission
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }
}
