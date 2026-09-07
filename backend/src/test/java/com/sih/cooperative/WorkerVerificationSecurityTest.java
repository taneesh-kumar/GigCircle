package com.sih.cooperative;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.cooperative.dto.AdminVerificationReviewRequest;
import com.sih.cooperative.dto.RegisterRequest;
import com.sih.cooperative.dto.SubmitVerificationDocumentRequest;
import com.sih.cooperative.entity.AdminActivity;
import com.sih.cooperative.entity.Role;
import com.sih.cooperative.entity.User;
import com.sih.cooperative.entity.VerificationDocumentType;
import com.sih.cooperative.repository.*;
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

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class WorkerVerificationSecurityTest {

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
    private AdminActivityRepository adminActivityRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminToken;
    private String worker1Token;
    private String worker2Token;
    private String customerToken;

    private User worker1User;
    private User worker2User;
    private User adminUser;

    @BeforeEach
    void setUp() throws Exception {
        adminActivityRepository.deleteAll();
        verificationDocumentRepository.deleteAll();
        workerVerificationRepository.deleteAll();
        workerProfileRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Admin setup
        adminUser = new User("System Admin", "admin@gigcircle.com", "9000000000", passwordEncoder.encode("AdminPass123!"), Role.ADMIN);
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
    public void testUnauthenticatedAccessReturns401() throws Exception {
        mockMvc.perform(get("/api/worker/verification"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/verifications"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testCustomerRoleBoundaryEnforcementReturns403() throws Exception {
        mockMvc.perform(get("/api/worker/verification")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/verifications")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testWorkerCannotCallAdminReviewEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/verifications")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/admin/verifications/1/approve")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testWorkerAccessesOnlyOwnVerificationAndDocuments() throws Exception {
        // Worker 1 creates verification & uploads doc
        mockMvc.perform(post("/api/worker/verification")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isCreated());

        SubmitVerificationDocumentRequest docReq1 = new SubmitVerificationDocumentRequest(
                VerificationDocumentType.GOVERNMENT_ID, "docs/worker1_id.pdf");
        MvcResult doc1Result = mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", "Bearer " + worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docReq1)))
                .andExpect(status().isCreated())
                .andReturn();
        Long w1DocId = objectMapper.readTree(doc1Result.getResponse().getContentAsString()).get("id").asLong();

        // Worker 1 previews own document -> OK
        mockMvc.perform(get("/api/worker/verification/documents/" + w1DocId + "/preview")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileReference").value("docs/worker1_id.pdf"));

        // Worker 2 cannot preview Worker 1's document -> Forbidden 403
        mockMvc.perform(get("/api/worker/verification/documents/" + w1DocId + "/preview")
                        .header("Authorization", "Bearer " + worker2Token))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testAdminDocumentPreviewAuthorization() throws Exception {
        // Worker 1 creates verification & uploads doc
        mockMvc.perform(post("/api/worker/verification")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isCreated());

        SubmitVerificationDocumentRequest docReq1 = new SubmitVerificationDocumentRequest(
                VerificationDocumentType.GOVERNMENT_ID, "docs/worker1_id.pdf");
        MvcResult doc1Result = mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", "Bearer " + worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docReq1)))
                .andExpect(status().isCreated())
                .andReturn();

        Long w1DocId = objectMapper.readTree(doc1Result.getResponse().getContentAsString()).get("id").asLong();
        Long w1VerificationId = workerVerificationRepository.findByWorkerId(worker1User.getId()).orElseThrow().getId();

        // Admin previews document -> OK
        mockMvc.perform(get("/api/admin/verifications/" + w1VerificationId + "/documents/" + w1DocId + "/preview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileReference").value("docs/worker1_id.pdf"));

        // Admin preview with mismatched verification ID -> 404
        mockMvc.perform(get("/api/admin/verifications/99999/documents/" + w1DocId + "/preview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testPathTraversalAndMalformedFileReferenceRejection() throws Exception {
        mockMvc.perform(post("/api/worker/verification")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isCreated());

        // Path traversal attempt -> 400 Bad Request
        SubmitVerificationDocumentRequest traversalReq = new SubmitVerificationDocumentRequest(
                VerificationDocumentType.GOVERNMENT_ID, "../../../etc/passwd");
        mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", "Bearer " + worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(traversalReq)))
                .andExpect(status().isBadRequest());

        // Blank reference -> 400 Bad Request
        SubmitVerificationDocumentRequest blankReq = new SubmitVerificationDocumentRequest(
                VerificationDocumentType.GOVERNMENT_ID, "   ");
        mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", "Bearer " + worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blankReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testReinstatementWorkflowAndExactAuditLogging() throws Exception {
        // 1. Worker submits verification
        mockMvc.perform(post("/api/worker/verification")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isCreated());

        SubmitVerificationDocumentRequest docReq = new SubmitVerificationDocumentRequest(
                VerificationDocumentType.GOVERNMENT_ID, "docs/gov_id.pdf");
        mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", "Bearer " + worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docReq)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/worker/verification/resubmit")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isOk());

        Long verificationId = workerVerificationRepository.findByWorkerId(worker1User.getId()).orElseThrow().getId();

        // 2. Admin Approves (Audit Log #1)
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VERIFIED"));

        // 3. Admin Suspends (Audit Log #2)
        AdminVerificationReviewRequest suspendReq = new AdminVerificationReviewRequest("Compliance review required");
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/suspend")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(suspendReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));

        // 4. Admin Reinstates / Approves Suspended Worker -> VERIFIED (Audit Log #3)
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VERIFIED"));

        // Verify exact audit logging count (3 admin activity entries)
        List<AdminActivity> activities = adminActivityRepository.findAll();
        assertEquals(3, activities.size());
        assertEquals("APPROVE_WORKER_VERIFICATION", activities.get(0).getActionType());
        assertEquals("SUSPEND_WORKER_VERIFICATION", activities.get(1).getActionType());
        assertEquals("APPROVE_WORKER_VERIFICATION", activities.get(2).getActionType());
        assertEquals(adminUser.getId(), activities.get(0).getActorUserId());
    }
}
