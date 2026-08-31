package com.sih.cooperative;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.cooperative.dto.CreateWorkerProfileRequest;
import com.sih.cooperative.dto.LoginRequest;
import com.sih.cooperative.dto.RegisterRequest;
import com.sih.cooperative.entity.Role;
import com.sih.cooperative.entity.ServiceCategory;
import com.sih.cooperative.repository.*;
import com.sih.cooperative.util.HaversineUtil;
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
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class GeographicWorkerMatchingIntegrationTest {

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

    @Autowired
    private EarningRepository earningRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private com.sih.cooperative.repository.PaymentRepository paymentRepository;

    private String customerToken;

    @BeforeEach
    void setUp() throws Exception {
        notificationRepository.deleteAll();
        paymentRepository.deleteAll();
        ratingRepository.deleteAll();
        earningRepository.deleteAll();
        jobRepository.deleteAll();
        serviceRequestRepository.deleteAll();
        workerProfileRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Register Customer
        RegisterRequest custReg = new RegisterRequest("Customer Alice", "alice@example.com", "9876543210", "Pass123!", Role.CUSTOMER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(custReg)));

        LoginRequest custLogin = new LoginRequest("alice@example.com", "Pass123!");
        MvcResult custRes = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(custLogin))).andReturn();
        customerToken = objectMapper.readTree(custRes.getResponse().getContentAsString()).get("token").asText();

        // 2. Register Worker 1 (Plumber @ 2.5 km: Vijayawada Center - 16.5062, 80.6480 -> 16.5200, 80.6600)
        registerWorkerAndProfile("Worker A (2.5 km)", "workera@example.com", "9876543211", ServiceCategory.PLUMBING, 16.5200, 80.6600, true);

        // 3. Register Worker 2 (Plumber @ 8.0 km: 16.5500, 80.7000)
        registerWorkerAndProfile("Worker B (8.0 km)", "workerb@example.com", "9876543212", ServiceCategory.PLUMBING, 16.5500, 80.7000, true);

        // 4. Register Worker 3 (Plumber @ 18.0 km: 16.6500, 80.7500)
        registerWorkerAndProfile("Worker C (18.0 km)", "workerc@example.com", "9876543213", ServiceCategory.PLUMBING, 16.6500, 80.7500, true);

        // 5. Register Worker 4 (Electrician @ 1.5 km: 16.5100, 80.6500)
        registerWorkerAndProfile("Worker D (Electrician 1.5 km)", "workerd@example.com", "9876543214", ServiceCategory.ELECTRICAL, 16.5100, 80.6500, true);

        // 6. Register Worker 5 (Plumber @ 3.0 km but Unavailable: 16.5250, 80.6550)
        registerWorkerAndProfile("Worker E (Unavailable)", "workere@example.com", "9876543215", ServiceCategory.PLUMBING, 16.5250, 80.6550, false);
    }

    private void registerWorkerAndProfile(String name, String email, String phone, ServiceCategory category, Double lat, Double lng, boolean available) throws Exception {
        RegisterRequest reg = new RegisterRequest(name, email, phone, "WorkerPass123!", Role.WORKER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(reg)));

        LoginRequest login = new LoginRequest(email, "WorkerPass123!");
        MvcResult res = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(login))).andReturn();
        String token = objectMapper.readTree(res.getResponse().getContentAsString()).get("token").asText();

        CreateWorkerProfileRequest profile = new CreateWorkerProfileRequest(
                "Bio", 3, new BigDecimal("350.00"), Set.of("Skill"), Set.of(category), available, "Vijayawada", 15, lat, lng, "Addr", "Vijayawada"
        );

        mockMvc.perform(post("/api/worker/profile")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(profile)));
    }

    @Test
    void testHaversineDistanceAccuracy() {
        // Test same location
        assertEquals(0.0, HaversineUtil.calculateDistanceKm(16.5062, 80.6480, 16.5062, 80.6480));

        // Test known distance: Vijayawada (16.5062, 80.6480) to Guntur (16.3067, 80.4365) ~ 31 km
        double dist = HaversineUtil.calculateDistanceKm(16.5062, 80.6480, 16.3067, 80.4365);
        assertEquals(31.2, dist, 1.0);
    }

    @Test
    void test10KmTierSearchReturnsOnlyWorkersWithin10Km() throws Exception {
        // Customer at Vijayawada (16.5062, 80.6480), PLUMBING category
        mockMvc.perform(get("/api/customer/requests/nearby-workers")
                        .header("Authorization", "Bearer " + customerToken)
                        .param("latitude", "16.5062")
                        .param("longitude", "80.6480")
                        .param("category", "PLUMBING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.effectiveRadiusKm").value(10))
                .andExpect(jsonPath("$.workers", hasSize(2)))
                .andExpect(jsonPath("$.workers[0].name").value("Worker A (2.5 km)"))
                .andExpect(jsonPath("$.workers[1].name").value("Worker B (8.0 km)"))
                .andExpect(jsonPath("$.tierMessage").value(containsString("10 km")));
    }

    @Test
    void testTierExpansionTo25KmWhenNoWorkersWithin10Km() throws Exception {
        // Search at a location (16.5500, 80.8500) where plumbers are ~15-20 km away (> 10 km, <= 25 km)
        mockMvc.perform(get("/api/customer/requests/nearby-workers")
                        .header("Authorization", "Bearer " + customerToken)
                        .param("latitude", "16.5500")
                        .param("longitude", "80.8500")
                        .param("category", "PLUMBING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.effectiveRadiusKm").value(25))
                .andExpect(jsonPath("$.workers", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.tierMessage").value(containsString("25 km")));
    }

    @Test
    void testCategoryFilterExcludesWrongSkillWorkers() throws Exception {
        // Search for ELECTRICAL category -> Worker D is 1.5 km away
        mockMvc.perform(get("/api/customer/requests/nearby-workers")
                        .header("Authorization", "Bearer " + customerToken)
                        .param("latitude", "16.5062")
                        .param("longitude", "80.6480")
                        .param("category", "ELECTRICAL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workers", hasSize(1)))
                .andExpect(jsonPath("$.workers[0].name").value("Worker D (Electrician 1.5 km)"));
    }

    @Test
    void testPrivacyExcludesWorkerCoordinatesFromResponse() throws Exception {
        mockMvc.perform(get("/api/customer/requests/nearby-workers")
                        .header("Authorization", "Bearer " + customerToken)
                        .param("latitude", "16.5062")
                        .param("longitude", "80.6480")
                        .param("category", "PLUMBING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workers[0].latitude").doesNotExist())
                .andExpect(jsonPath("$.workers[0].longitude").doesNotExist());
    }

    @Test
    void testNoWorkerResultWhenBeyond50Km() throws Exception {
        // Customer at remote location (10.0000, 70.0000)
        mockMvc.perform(get("/api/customer/requests/nearby-workers")
                        .header("Authorization", "Bearer " + customerToken)
                        .param("latitude", "10.0000")
                        .param("longitude", "70.0000")
                        .param("category", "PLUMBING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.effectiveRadiusKm").value(50))
                .andExpect(jsonPath("$.workers", hasSize(0)))
                .andExpect(jsonPath("$.tierMessage").value(containsString("No suitable workers found within 50 km")));
    }
}
