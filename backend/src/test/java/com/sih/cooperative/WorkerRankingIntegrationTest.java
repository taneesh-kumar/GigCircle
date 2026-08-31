package com.sih.cooperative;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.cooperative.dto.CreateServiceRequestRequest;
import com.sih.cooperative.dto.CreateWorkerProfileRequest;
import com.sih.cooperative.dto.LoginRequest;
import com.sih.cooperative.dto.RegisterRequest;
import com.sih.cooperative.entity.Role;
import com.sih.cooperative.entity.ServiceCategory;
import com.sih.cooperative.repository.*;
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
import java.time.LocalDateTime;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class WorkerRankingIntegrationTest {

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

    private String customerToken;

    @BeforeEach
    void setUp() throws Exception {
        notificationRepository.deleteAll();
        ratingRepository.deleteAll();
        earningRepository.deleteAll();
        jobRepository.deleteAll();
        serviceRequestRepository.deleteAll();
        workerProfileRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Customer
        RegisterRequest custReg = new RegisterRequest("Customer Bob", "bob@example.com", "9876543220", "Pass123!", Role.CUSTOMER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(custReg)));

        LoginRequest custLogin = new LoginRequest("bob@example.com", "Pass123!");
        MvcResult custRes = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(custLogin))).andReturn();
        customerToken = objectMapper.readTree(custRes.getResponse().getContentAsString()).get("token").asText();

        // 2. Worker A (Local Plumber: 2.0 km away, 4.2 rating, 5 yrs exp)
        registerWorkerAndProfile("Local Plumber A", "localplumber@example.com", "9876543221", ServiceCategory.PLUMBING, 5, 16.5200, 80.6600, true);

        // 3. Worker B (Distant Plumber: 18.0 km away, 4.9 rating, 10 yrs exp)
        registerWorkerAndProfile("Distant Plumber B", "distantplumber@example.com", "9876543222", ServiceCategory.PLUMBING, 10, 16.6500, 80.7500, true);

        // 4. Worker C (Unavailable Plumber: 1.0 km away)
        registerWorkerAndProfile("Unavailable Plumber C", "unavail@example.com", "9876543223", ServiceCategory.PLUMBING, 2, 16.5100, 80.6500, false);
    }

    private void registerWorkerAndProfile(String name, String email, String phone, ServiceCategory category, int expYears, Double lat, Double lng, boolean available) throws Exception {
        RegisterRequest reg = new RegisterRequest(name, email, phone, "WorkerPass123!", Role.WORKER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(reg)));

        LoginRequest login = new LoginRequest(email, "WorkerPass123!");
        MvcResult res = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(login))).andReturn();
        String token = objectMapper.readTree(res.getResponse().getContentAsString()).get("token").asText();

        CreateWorkerProfileRequest profile = new CreateWorkerProfileRequest(
                "Bio", expYears, new BigDecimal("400.00"), Set.of("Plumbing"), Set.of(category), available, "Vijayawada", 25, lat, lng, "Addr", "Vijayawada"
        );

        mockMvc.perform(post("/api/worker/profile")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(profile)));
    }

    @Test
    void testLocalWorkerRankedAboveDistantWorker() throws Exception {
        // Customer at Vijayawada center (16.5062, 80.6480)
        mockMvc.perform(get("/api/customer/requests/recommendations")
                        .header("Authorization", "Bearer " + customerToken)
                        .param("latitude", "16.5062")
                        .param("longitude", "80.6480")
                        .param("category", "PLUMBING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.topRecommendation.name").value("Local Plumber A"))
                .andExpect(jsonPath("$.topRecommendation.suitabilityBadge").value("Top Recommended Match"))
                .andExpect(jsonPath("$.topRecommendation.matchReasons", hasItem(containsString("Required plumbing category"))))
                .andExpect(jsonPath("$.topRecommendation.matchReasons", hasItem(containsString("Available now"))));
    }

    @Test
    void testRecommendationsForSpecificServiceRequest() throws Exception {
        LocalDateTime futureTime = LocalDateTime.now().plusDays(2);
        CreateServiceRequestRequest req = new CreateServiceRequestRequest(
                ServiceCategory.PLUMBING, "Burst pipe in kitchen", "Vijayawada", new BigDecimal("750.00"), futureTime, 16.5062, 80.6480, "Bandar Road", "Vijayawada"
        );

        MvcResult res = mockMvc.perform(post("/api/customer/requests")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        Long reqId = objectMapper.readTree(res.getResponse().getContentAsString()).get("id").asLong();

        // Fetch recommendations for request
        mockMvc.perform(get("/api/customer/requests/" + reqId + "/recommendations")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.topRecommendation.name").value("Local Plumber A"))
                .andExpect(jsonPath("$.topRecommendation.distanceKm").value(lessThan(5.0)));
    }
}
