package com.sih.cooperative;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.cooperative.dto.CreateWorkerProfileRequest;
import com.sih.cooperative.dto.RegisterRequest;
import com.sih.cooperative.dto.UpdateWorkerProfileRequest;
import com.sih.cooperative.entity.Role;
import com.sih.cooperative.entity.ServiceCategory;
import com.sih.cooperative.repository.JobRepository;
import com.sih.cooperative.repository.RatingRepository;
import com.sih.cooperative.repository.ServiceRequestRepository;
import com.sih.cooperative.repository.UserRepository;
import com.sih.cooperative.repository.WorkerProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class WorkerProfileIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkerProfileRepository workerProfileRepository;

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private RatingRepository ratingRepository;

    private String workerAToken;
    private String workerBToken;
    private String customerToken;

    @BeforeEach
    void setUp() throws Exception {
        ratingRepository.deleteAll();
        jobRepository.deleteAll();
        serviceRequestRepository.deleteAll();
        workerProfileRepository.deleteAll();
        userRepository.deleteAll();

        // Register Worker A
        RegisterRequest reqWA = new RegisterRequest("Worker A", "workerA@test.com", "9111111111", "Password123!", Role.WORKER);
        MvcResult resWA = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqWA)))
                .andExpect(status().isCreated())
                .andReturn();
        workerAToken = objectMapper.readTree(resWA.getResponse().getContentAsString()).get("token").asText();

        // Register Worker B
        RegisterRequest reqWB = new RegisterRequest("Worker B", "workerB@test.com", "9111111112", "Password123!", Role.WORKER);
        MvcResult resWB = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqWB)))
                .andExpect(status().isCreated())
                .andReturn();
        workerBToken = objectMapper.readTree(resWB.getResponse().getContentAsString()).get("token").asText();

        // Register Customer
        RegisterRequest reqC = new RegisterRequest("Customer One", "customer@test.com", "9111111113", "Password123!", Role.CUSTOMER);
        MvcResult resC = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqC)))
                .andExpect(status().isCreated())
                .andReturn();
        customerToken = objectMapper.readTree(resC.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    void testGetProfileNotCreatedReturns404() throws Exception {
        mockMvc.perform(get("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerAToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCreateWorkerProfileSuccessAndPersistence() throws Exception {
        CreateWorkerProfileRequest request = new CreateWorkerProfileRequest(
                "Experienced plumber with 5 years of local household experience.",
                5,
                new BigDecimal("450.00"),
                Set.of("Pipe Fitting", "Leak Repair", "Drain Cleaning"),
                Set.of(ServiceCategory.PLUMBING, ServiceCategory.APPLIANCE_REPAIR),
                true,
                "Indiranagar, Bengaluru",
                10
        );

        MvcResult result = mockMvc.perform(post("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.workerName").value("Worker A"))
                .andExpect(jsonPath("$.experienceYears").value(5))
                .andExpect(jsonPath("$.hourlyRate").value(450.00))
                .andExpect(jsonPath("$.skills", hasItems("Pipe Fitting", "Leak Repair", "Drain Cleaning")))
                .andExpect(jsonPath("$.serviceCategories", hasItems("PLUMBING", "APPLIANCE_REPAIR")))
                .andExpect(jsonPath("$.available").value(true))
                .andExpect(jsonPath("$.serviceLocation").value("Indiranagar, Bengaluru"))
                .andExpect(jsonPath("$.serviceRadiusKm").value(10))
                .andReturn();

        Long profileId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
        assertTrue(workerProfileRepository.findById(profileId).isPresent());
    }

    @Test
    void testCreateDuplicateWorkerProfileFailsWithConflict() throws Exception {
        CreateWorkerProfileRequest request = new CreateWorkerProfileRequest(
                "Bio text", 3, new BigDecimal("300.00"),
                Set.of("Wiring"), Set.of(ServiceCategory.ELECTRICAL), true, "Loc", 5
        );

        mockMvc.perform(post("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Attempt second creation -> 409 Conflict
        mockMvc.perform(post("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void testUpdateWorkerProfileSuccess() throws Exception {
        CreateWorkerProfileRequest createReq = new CreateWorkerProfileRequest(
                "Initial Bio", 2, new BigDecimal("250.00"),
                Set.of("Cleaning"), Set.of(ServiceCategory.CLEANING), true, "Loc", 5
        );

        mockMvc.perform(post("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated());

        UpdateWorkerProfileRequest updateReq = new UpdateWorkerProfileRequest(
                "Updated Bio", 4, new BigDecimal("350.00"),
                Set.of("Deep Cleaning", "Sanitization"), Set.of(ServiceCategory.CLEANING), false, "New Loc", 12
        );

        mockMvc.perform(put("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bio").value("Updated Bio"))
                .andExpect(jsonPath("$.experienceYears").value(4))
                .andExpect(jsonPath("$.hourlyRate").value(350.00))
                .andExpect(jsonPath("$.available").value(false))
                .andExpect(jsonPath("$.serviceLocation").value("New Loc"))
                .andExpect(jsonPath("$.serviceRadiusKm").value(12));
    }

    @Test
    void testToggleAvailabilitySuccess() throws Exception {
        CreateWorkerProfileRequest createReq = new CreateWorkerProfileRequest(
                "Bio", 2, new BigDecimal("200.00"),
                Set.of("Carpentry"), Set.of(ServiceCategory.CARPENTRY), true, "Loc", 5
        );

        mockMvc.perform(post("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated());

        // Toggle to false
        mockMvc.perform(patch("/api/worker/profile/availability")
                        .header("Authorization", "Bearer " + workerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("isAvailable", false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(false));

        // Toggle to true
        mockMvc.perform(patch("/api/worker/profile/availability")
                        .header("Authorization", "Bearer " + workerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("isAvailable", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(true));
    }

    @Test
    void testWorkerProfileValidationFailures() throws Exception {
        // Negative experience
        CreateWorkerProfileRequest negExp = new CreateWorkerProfileRequest("Bio", -1, new BigDecimal("200.00"), Set.of("Skill"), Set.of(ServiceCategory.OTHER), true, "Loc", 5);
        mockMvc.perform(post("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(negExp)))
                .andExpect(status().isBadRequest());

        // Zero rate
        CreateWorkerProfileRequest zeroRate = new CreateWorkerProfileRequest("Bio", 2, BigDecimal.ZERO, Set.of("Skill"), Set.of(ServiceCategory.OTHER), true, "Loc", 5);
        mockMvc.perform(post("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(zeroRate)))
                .andExpect(status().isBadRequest());

        // Empty skills
        CreateWorkerProfileRequest emptySkills = new CreateWorkerProfileRequest("Bio", 2, new BigDecimal("200.00"), Set.of(), Set.of(ServiceCategory.OTHER), true, "Loc", 5);
        mockMvc.perform(post("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emptySkills)))
                .andExpect(status().isBadRequest());

        // Empty categories
        CreateWorkerProfileRequest emptyCats = new CreateWorkerProfileRequest("Bio", 2, new BigDecimal("200.00"), Set.of("Skill"), Set.of(), true, "Loc", 5);
        mockMvc.perform(post("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emptyCats)))
                .andExpect(status().isBadRequest());

        // Long bio (> 500 chars)
        String longBio = "A".repeat(501);
        CreateWorkerProfileRequest longBioReq = new CreateWorkerProfileRequest(longBio, 2, new BigDecimal("200.00"), Set.of("Skill"), Set.of(ServiceCategory.OTHER), true, "Loc", 5);
        mockMvc.perform(post("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(longBioReq)))
                .andExpect(status().isBadRequest());

        // Invalid radius (<= 0)
        CreateWorkerProfileRequest negRadius = new CreateWorkerProfileRequest("Bio", 2, new BigDecimal("200.00"), Set.of("Skill"), Set.of(ServiceCategory.OTHER), true, "Loc", 0);
        mockMvc.perform(post("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(negRadius)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testAuthorizationAndRBAC() throws Exception {
        // Unauthenticated -> 401
        mockMvc.perform(get("/api/worker/profile"))
                .andExpect(status().isUnauthorized());

        // Customer accessing worker profile endpoint -> 403
        mockMvc.perform(get("/api/worker/profile")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        CreateWorkerProfileRequest req = new CreateWorkerProfileRequest("Bio", 2, new BigDecimal("200.00"), Set.of("Skill"), Set.of(ServiceCategory.OTHER), true, "Loc", 5);

        mockMvc.perform(post("/api/worker/profile")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }
}
