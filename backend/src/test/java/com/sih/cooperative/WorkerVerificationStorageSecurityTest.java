package com.sih.cooperative;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.cooperative.dto.CreateWorkerProfileRequest;
import com.sih.cooperative.dto.RegisterRequest;
import com.sih.cooperative.dto.SubmitVerificationDocumentRequest;
import com.sih.cooperative.dto.UpdateVerificationDocumentRequest;
import com.sih.cooperative.entity.Role;
import com.sih.cooperative.entity.ServiceCategory;
import com.sih.cooperative.entity.User;
import com.sih.cooperative.entity.VerificationDocumentType;
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
import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class WorkerVerificationStorageSecurityTest {

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
    private PasswordEncoder passwordEncoder;

    private String adminToken;
    private String worker1Token;
    private String worker2Token;
    private String customerToken;

    @SuppressWarnings("unused")
    private User worker1User;
    @SuppressWarnings("unused")
    private User worker2User;
    @SuppressWarnings("unused")
    private User customerUser;
    private User adminUser;

    @BeforeEach
    void setUp() throws Exception {
        notificationRepository.deleteAll();
        verificationDocumentRepository.deleteAll();
        workerVerificationRepository.deleteAll();
        workerProfileRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Admin
        adminUser = new User("Storage Admin", "admin_storage@gigcircle.com", "9000000000", passwordEncoder.encode("AdminPass123!"), Role.ADMIN);
        userRepository.save(adminUser);

        MvcResult adminLoginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin_storage@gigcircle.com\",\"password\":\"AdminPass123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        adminToken = objectMapper.readTree(adminLoginResult.getResponse().getContentAsString()).get("token").asText();

        // 2. Worker 1
        RegisterRequest w1Reg = new RegisterRequest("Worker One", "worker1_storage@test.com", "9111111111", "Password123!", Role.WORKER);
        MvcResult w1Result = mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(w1Reg)))
                .andExpect(status().isCreated()).andReturn();
        worker1Token = objectMapper.readTree(w1Result.getResponse().getContentAsString()).get("token").asText();
        worker1User = userRepository.findByEmail("worker1_storage@test.com").orElseThrow();

        CreateWorkerProfileRequest p1 = new CreateWorkerProfileRequest("Bio 1", 5, new BigDecimal("400.00"), Set.of("Skills"), Set.of(ServiceCategory.PLUMBING), true, "City", 10, 16.5, 80.6, "Addr", "City");
        mockMvc.perform(post("/api/worker/profile").header("Authorization", "Bearer " + worker1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(p1))).andExpect(status().isCreated());

        // 3. Worker 2
        RegisterRequest w2Reg = new RegisterRequest("Worker Two", "worker2_storage@test.com", "9222222222", "Password123!", Role.WORKER);
        MvcResult w2Result = mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(w2Reg)))
                .andExpect(status().isCreated()).andReturn();
        worker2Token = objectMapper.readTree(w2Result.getResponse().getContentAsString()).get("token").asText();
        worker2User = userRepository.findByEmail("worker2_storage@test.com").orElseThrow();

        CreateWorkerProfileRequest p2 = new CreateWorkerProfileRequest("Bio 2", 3, new BigDecimal("300.00"), Set.of("Skills"), Set.of(ServiceCategory.ELECTRICAL), true, "City", 10, 16.5, 80.6, "Addr", "City");
        mockMvc.perform(post("/api/worker/profile").header("Authorization", "Bearer " + worker2Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(p2))).andExpect(status().isCreated());

        // 4. Customer
        RegisterRequest cReg = new RegisterRequest("Customer User", "customer_storage@test.com", "9333333333", "Password123!", Role.CUSTOMER);
        MvcResult cResult = mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(cReg)))
                .andExpect(status().isCreated()).andReturn();
        customerToken = objectMapper.readTree(cResult.getResponse().getContentAsString()).get("token").asText();
        customerUser = userRepository.findByEmail("customer_storage@test.com").orElseThrow();
    }

    @Test
    public void testValidUploadAndPathTraversalRejection() throws Exception {
        mockMvc.perform(post("/api/worker/verification")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isCreated());

        // 1. Valid PDF upload
        SubmitVerificationDocumentRequest validDoc = new SubmitVerificationDocumentRequest(VerificationDocumentType.GOVERNMENT_ID, "docs/my_id.pdf");
        mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", "Bearer " + worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validDoc)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.documentType").value("GOVERNMENT_ID"))
                .andExpect(jsonPath("$.status").value("PENDING"));

        // 2. Path traversal rejection (..)
        SubmitVerificationDocumentRequest invalidDoc1 = new SubmitVerificationDocumentRequest(VerificationDocumentType.SKILL_CERTIFICATE, "../../../etc/passwd.pdf");
        mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", "Bearer " + worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidDoc1)))
                .andExpect(status().isBadRequest());

        // 3. Unsupported extension rejection (.exe)
        SubmitVerificationDocumentRequest invalidDoc2 = new SubmitVerificationDocumentRequest(VerificationDocumentType.SKILL_CERTIFICATE, "malicious_script.exe");
        mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", "Bearer " + worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidDoc2)))
                .andExpect(status().isBadRequest());

        // 4. Blank reference rejection
        SubmitVerificationDocumentRequest invalidDoc3 = new SubmitVerificationDocumentRequest(VerificationDocumentType.SKILL_CERTIFICATE, "   ");
        mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", "Bearer " + worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidDoc3)))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testWorkerOwnershipAndCustomerDenial() throws Exception {
        // Worker 1 submits document
        mockMvc.perform(post("/api/worker/verification").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isCreated());
        SubmitVerificationDocumentRequest docReq = new SubmitVerificationDocumentRequest(VerificationDocumentType.GOVERNMENT_ID, "docs/w1_id.pdf");
        MvcResult docRes = mockMvc.perform(post("/api/worker/verification/documents").header("Authorization", "Bearer " + worker1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(docReq)))
                .andExpect(status().isCreated()).andReturn();
        Long w1DocId = objectMapper.readTree(docRes.getResponse().getContentAsString()).get("id").asLong();

        // Worker 1 can preview own document
        mockMvc.perform(get("/api/worker/verification/documents/" + w1DocId + "/preview")
                        .header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isOk());

        // Worker 2 cannot preview Worker 1's document -> 403 Forbidden
        mockMvc.perform(get("/api/worker/verification/documents/" + w1DocId + "/preview")
                        .header("Authorization", "Bearer " + worker2Token))
                .andExpect(status().isForbidden());

        // Customer cannot preview Worker 1's document -> 403 Forbidden
        mockMvc.perform(get("/api/worker/verification/documents/" + w1DocId + "/preview")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        // Unauthenticated access -> 401 Unauthorized
        mockMvc.perform(get("/api/worker/verification/documents/" + w1DocId + "/preview"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testAdminAccessAndCrossVerificationIdProtection() throws Exception {
        // Worker 1 submits document
        mockMvc.perform(post("/api/worker/verification").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isCreated());
        SubmitVerificationDocumentRequest docReq = new SubmitVerificationDocumentRequest(VerificationDocumentType.GOVERNMENT_ID, "docs/w1_id.png");
        MvcResult docRes = mockMvc.perform(post("/api/worker/verification/documents").header("Authorization", "Bearer " + worker1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(docReq)))
                .andExpect(status().isCreated()).andReturn();
        Long w1DocId = objectMapper.readTree(docRes.getResponse().getContentAsString()).get("id").asLong();
        Long w1VerId = objectMapper.readTree(docRes.getResponse().getContentAsString()).get("verificationId").asLong();

        // Admin can preview matching (vId, docId)
        mockMvc.perform(get("/api/admin/verifications/" + w1VerId + "/documents/" + w1DocId + "/preview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Admin with non-matching verification ID -> 404 Not Found
        mockMvc.perform(get("/api/admin/verifications/999999/documents/" + w1DocId + "/preview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testDocumentReplacementAndCleanup() throws Exception {
        mockMvc.perform(post("/api/worker/verification").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isCreated());

        SubmitVerificationDocumentRequest doc1 = new SubmitVerificationDocumentRequest(VerificationDocumentType.GOVERNMENT_ID, "docs/v1.pdf");
        MvcResult res1 = mockMvc.perform(post("/api/worker/verification/documents").header("Authorization", "Bearer " + worker1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(doc1)))
                .andExpect(status().isCreated()).andReturn();
        Long docId = objectMapper.readTree(res1.getResponse().getContentAsString()).get("id").asLong();

        // Update document with v2
        UpdateVerificationDocumentRequest doc2 = new UpdateVerificationDocumentRequest(VerificationDocumentType.GOVERNMENT_ID, "docs/v2.pdf");
        mockMvc.perform(put("/api/worker/verification/documents/" + docId)
                        .header("Authorization", "Bearer " + worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(doc2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileReference").value("docs/v2.pdf"));
    }
}
