package com.sih.cooperative;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.cooperative.dto.AdminVerificationReviewRequest;
import com.sih.cooperative.dto.CreateWorkerProfileRequest;
import com.sih.cooperative.dto.RegisterRequest;
import com.sih.cooperative.dto.SubmitVerificationDocumentRequest;
import com.sih.cooperative.dto.UpdateWorkerProfileRequest;
import com.sih.cooperative.entity.Role;
import com.sih.cooperative.entity.ServiceCategory;
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

import java.math.BigDecimal;
import java.util.Set;

import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class WorkerVerificationBadgeIntegrationTest {

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
    private String workerToken;
    private String customerToken;

    private User workerUser;

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

        // 2. Worker setup
        RegisterRequest wkrReq = new RegisterRequest("Verified Worker", "verifiedworker@test.com", "9111111111", "Password123!", Role.WORKER);
        MvcResult wkrResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wkrReq)))
                .andExpect(status().isCreated())
                .andReturn();
        workerToken = objectMapper.readTree(wkrResult.getResponse().getContentAsString()).get("token").asText();
        workerUser = userRepository.findByEmail("verifiedworker@test.com").orElseThrow();

        // 3. Customer setup
        RegisterRequest custReq = new RegisterRequest("Customer One", "customer1@test.com", "9333333333", "Password123!", Role.CUSTOMER);
        MvcResult custResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(custReq)))
                .andExpect(status().isCreated())
                .andReturn();
        customerToken = objectMapper.readTree(custResult.getResponse().getContentAsString()).get("token").asText();

        // Create initial worker profile
        CreateWorkerProfileRequest profileReq = new CreateWorkerProfileRequest(
                "Certified electrician & plumber",
                5,
                new BigDecimal("500.00"),
                Set.of("Wiring", "Pipes"),
                Set.of(ServiceCategory.ELECTRICAL, ServiceCategory.PLUMBING),
                true,
                "Vijayawada",
                25,
                16.5060,
                80.6480,
                "MG Road",
                "Vijayawada"
        );

        mockMvc.perform(post("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileReq)))
                .andExpect(status().isCreated());
    }

    @Test
    public void testWorkerVerificationBadgeLifecycleAndSecurity() throws Exception {
        // 1. Initial State (No Verification Record) -> isVerified = false
        mockMvc.perform(get("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isVerified").value(false))
                .andExpect(jsonPath("$.fileReference").doesNotExist())
                .andExpect(jsonPath("$.rejectionReason").doesNotExist());

        // 2. Create Verification Record & Submit -> status = PENDING_REVIEW -> isVerified = false
        mockMvc.perform(post("/api/worker/verification")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isCreated());

        SubmitVerificationDocumentRequest docReq = new SubmitVerificationDocumentRequest(
                VerificationDocumentType.GOVERNMENT_ID, "docs/gov_id.pdf");
        mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docReq)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/worker/verification/resubmit")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isVerified").value(false));

        Long verificationId = workerVerificationRepository.findByWorkerId(workerUser.getId()).orElseThrow().getId();

        // 3. Admin Requests Changes -> status = CHANGES_REQUIRED -> isVerified = false
        AdminVerificationReviewRequest changesReq = new AdminVerificationReviewRequest("Document blurry");
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/request-changes")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(changesReq)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isVerified").value(false));

        // Resubmit
        mockMvc.perform(post("/api/worker/verification/resubmit")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk());

        // 4. Admin Rejects -> status = REJECTED -> isVerified = false
        AdminVerificationReviewRequest rejectReq = new AdminVerificationReviewRequest("Fake document");
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/reject")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isVerified").value(false));

        // Resubmit
        mockMvc.perform(post("/api/worker/verification/resubmit")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk());

        // 5. Admin Approves -> status = VERIFIED -> isVerified = true
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isVerified").value(true));

        // 6. Admin Suspends -> status = SUSPENDED -> isVerified = false
        AdminVerificationReviewRequest suspendReq = new AdminVerificationReviewRequest("Violation of terms");
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/suspend")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(suspendReq)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isVerified").value(false));
    }

    @Test
    public void testWorkerCannotAlterPublicVerificationStatusViaProfileUpdate() throws Exception {
        // Approve worker
        mockMvc.perform(post("/api/worker/verification")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isCreated());
        SubmitVerificationDocumentRequest docReq = new SubmitVerificationDocumentRequest(
                VerificationDocumentType.GOVERNMENT_ID, "docs/gov_id.pdf");
        mockMvc.perform(post("/api/worker/verification/documents")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docReq)))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/worker/verification/resubmit")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk());
        Long verificationId = workerVerificationRepository.findByWorkerId(workerUser.getId()).orElseThrow().getId();
        mockMvc.perform(post("/api/admin/verifications/" + verificationId + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Worker attempts profile update
        UpdateWorkerProfileRequest updateReq = new UpdateWorkerProfileRequest();
        updateReq.setBio("Updated bio info");
        updateReq.setExperienceYears(6);
        updateReq.setHourlyRate(new BigDecimal("600.00"));
        updateReq.setSkills(Set.of("Wiring", "Pipes", "Solar"));
        updateReq.setServiceCategories(Set.of(ServiceCategory.ELECTRICAL));

        mockMvc.perform(put("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isVerified").value(true));
    }
}
