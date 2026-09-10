package com.sih.cooperative;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.cooperative.dto.*;
import com.sih.cooperative.dto.SimulatePaymentRequest;
import com.sih.cooperative.entity.*;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class RatingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    private WorkerProfileRepository workerProfileRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private EarningRepository earningRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private com.sih.cooperative.repository.PaymentRepository paymentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String customerToken1;
    private String customerToken2;
    private String workerToken1;
    private String workerToken2;
    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        paymentRepository.deleteAll();
        notificationRepository.deleteAll();
        invoiceRepository.deleteAll();
        ratingRepository.deleteAll();
        earningRepository.deleteAll();
        jobRepository.deleteAll();
        serviceRequestRepository.deleteAll();
        workerProfileRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Customer 1
        RegisterRequest c1 = new RegisterRequest("Alice Customer", "alice.customer@example.com", "9876543210", "Pass123!", Role.CUSTOMER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(c1))).andExpect(status().isCreated());
        MvcResult lr1 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("alice.customer@example.com", "Pass123!")))).andExpect(status().isOk()).andReturn();
        customerToken1 = objectMapper.readTree(lr1.getResponse().getContentAsString()).get("token").asText();

        // 2. Customer 2
        RegisterRequest c2 = new RegisterRequest("Bob Customer", "bob.customer@example.com", "9876543211", "Pass123!", Role.CUSTOMER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(c2))).andExpect(status().isCreated());
        MvcResult lr2 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("bob.customer@example.com", "Pass123!")))).andExpect(status().isOk()).andReturn();
        customerToken2 = objectMapper.readTree(lr2.getResponse().getContentAsString()).get("token").asText();

        // 3. Worker 1
        RegisterRequest w1 = new RegisterRequest("Charlie Worker", "charlie.worker@example.com", "9876543212", "Pass123!", Role.WORKER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(w1))).andExpect(status().isCreated());
        MvcResult lr3 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("charlie.worker@example.com", "Pass123!")))).andExpect(status().isOk()).andReturn();
        workerToken1 = objectMapper.readTree(lr3.getResponse().getContentAsString()).get("token").asText();

        CreateWorkerProfileRequest p1 = new CreateWorkerProfileRequest("Plumbing Expert", 5, new BigDecimal("500.00"), Set.of("Pipe Fitting"), Set.of(ServiceCategory.PLUMBING), Boolean.TRUE, "Indiranagar", 10);
        mockMvc.perform(post("/api/worker/profile").header("Authorization", "Bearer " + workerToken1).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(p1))).andExpect(status().isCreated());

        // 4. Worker 2
        RegisterRequest w2 = new RegisterRequest("Dave Worker", "dave.worker@example.com", "9876543213", "Pass123!", Role.WORKER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(w2))).andExpect(status().isCreated());
        MvcResult lr4 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("dave.worker@example.com", "Pass123!")))).andExpect(status().isOk()).andReturn();
        workerToken2 = objectMapper.readTree(lr4.getResponse().getContentAsString()).get("token").asText();

        CreateWorkerProfileRequest p2 = new CreateWorkerProfileRequest("Electrician Expert", 8, new BigDecimal("600.00"), Set.of("Wiring"), Set.of(ServiceCategory.ELECTRICAL), Boolean.TRUE, "Indiranagar", 10);
        mockMvc.perform(post("/api/worker/profile").header("Authorization", "Bearer " + workerToken2).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(p2))).andExpect(status().isCreated());

        // 5. Admin (Created via repository save as public ADMIN registration is blocked)
        User adminUser = new User("Admin Steward", "admin.test@example.com", "9876543214", passwordEncoder.encode("AdminPass123!"), Role.ADMIN);
        userRepository.save(adminUser);

        MvcResult lr5 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("admin.test@example.com", "AdminPass123!")))).andExpect(status().isOk()).andReturn();
        adminToken = objectMapper.readTree(lr5.getResponse().getContentAsString()).get("token").asText();
    }

    private Long createJobAndProgressToStatus(String customerToken, String workerToken, ServiceCategory category, JobStatus targetStatus) throws Exception {
        CreateServiceRequestRequest req = new CreateServiceRequestRequest(category, "Service request test description", "Indiranagar", new BigDecimal("500.00"), LocalDateTime.now().plusDays(1));
        MvcResult rRes = mockMvc.perform(post("/api/customer/requests").header("Authorization", "Bearer " + customerToken).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated()).andReturn();
        Long requestId = objectMapper.readTree(rRes.getResponse().getContentAsString()).get("id").asLong();

        MvcResult aRes = mockMvc.perform(post("/api/worker/jobs/" + requestId + "/accept").header("Authorization", "Bearer " + workerToken)).andExpect(status().isCreated()).andReturn();
        Long jobId = objectMapper.readTree(aRes.getResponse().getContentAsString()).get("id").asLong();

        if (targetStatus == JobStatus.ACCEPTED) {
            return jobId;
        }

        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());
        if (targetStatus == JobStatus.IN_PROGRESS) {
            return jobId;
        }

        // Phase 4: /complete transitions to PAYMENT_REQUIRED
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());
        if (targetStatus == JobStatus.PAYMENT_REQUIRED) {
            return jobId;
        }

        // COMPLETED requires successful payment simulation
        SimulatePaymentRequest successReq = new SimulatePaymentRequest(true);
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(successReq))).andExpect(status().isOk());
        return jobId;
    }

    @Test
    void test1_2_CustomerCanRateCompletedJobAndPersists() throws Exception {
        Long jobId = createJobAndProgressToStatus(customerToken1, workerToken1, ServiceCategory.PLUMBING, JobStatus.COMPLETED);

        CreateRatingRequest ratingReq = new CreateRatingRequest(5, "Outstanding plumbing work!");
        mockMvc.perform(post("/api/customer/ratings/" + jobId)
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ratingReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.jobId").value(jobId))
                .andExpect(jsonPath("$.score").value(5))
                .andExpect(jsonPath("$.review").value("Outstanding plumbing work!"));

        Rating rating = ratingRepository.findByJobId(jobId).orElseThrow();
        assertEquals(5, rating.getScore());
        assertEquals("Outstanding plumbing work!", rating.getReview());
        assertNotNull(rating.getCreatedAt());
    }

    @Test
    void test3_4_ScoreBoundaryValues1And5Accepted() throws Exception {
        Long jobId1 = createJobAndProgressToStatus(customerToken1, workerToken1, ServiceCategory.PLUMBING, JobStatus.COMPLETED);
        mockMvc.perform(post("/api/customer/ratings/" + jobId1)
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(1, "Poor service"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.score").value(1));

        Long jobId2 = createJobAndProgressToStatus(customerToken1, workerToken1, ServiceCategory.PLUMBING, JobStatus.COMPLETED);
        mockMvc.perform(post("/api/customer/ratings/" + jobId2)
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(5, "Perfect service"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.score").value(5));
    }

    @Test
    void test5_6_InvalidScoreValues0And6RejectedWith400() throws Exception {
        Long jobId = createJobAndProgressToStatus(customerToken1, workerToken1, ServiceCategory.PLUMBING, JobStatus.COMPLETED);

        mockMvc.perform(post("/api/customer/ratings/" + jobId)
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(0, "Invalid 0"))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/customer/ratings/" + jobId)
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(6, "Invalid 6"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void test7_ReviewOver500CharsRejectedWith400() throws Exception {
        Long jobId = createJobAndProgressToStatus(customerToken1, workerToken1, ServiceCategory.PLUMBING, JobStatus.COMPLETED);
        String longReview = "A".repeat(501);

        mockMvc.perform(post("/api/customer/ratings/" + jobId)
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(5, longReview))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void test8_OptionalReviewWorks() throws Exception {
        Long jobId = createJobAndProgressToStatus(customerToken1, workerToken1, ServiceCategory.PLUMBING, JobStatus.COMPLETED);

        mockMvc.perform(post("/api/customer/ratings/" + jobId)
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(4, null))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.score").value(4))
                .andExpect(jsonPath("$.review").doesNotExist());
    }

    @Test
    void test9_CustomerCannotRateAnotherCustomersJob() throws Exception {
        Long jobId = createJobAndProgressToStatus(customerToken1, workerToken1, ServiceCategory.PLUMBING, JobStatus.COMPLETED);

        mockMvc.perform(post("/api/customer/ratings/" + jobId)
                        .header("Authorization", "Bearer " + customerToken2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(5, "Hacked rating"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void test10_11_CustomerCannotRateAcceptedOrInProgressJob() throws Exception {
        Long acceptedJobId = createJobAndProgressToStatus(customerToken1, workerToken1, ServiceCategory.PLUMBING, JobStatus.ACCEPTED);
        mockMvc.perform(post("/api/customer/ratings/" + acceptedJobId)
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(5, "Too early"))))
                .andExpect(status().isConflict());

        Long inProgressJobId = createJobAndProgressToStatus(customerToken1, workerToken1, ServiceCategory.PLUMBING, JobStatus.IN_PROGRESS);
        mockMvc.perform(post("/api/customer/ratings/" + inProgressJobId)
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(5, "Still working"))))
                .andExpect(status().isConflict());
    }

    @Test
    void test12_CustomerCannotRateCancelledJob() throws Exception {
        CreateServiceRequestRequest req = new CreateServiceRequestRequest(ServiceCategory.PLUMBING, "Cancelled request", "Indiranagar", new BigDecimal("500.00"), LocalDateTime.now().plusDays(1));
        MvcResult rRes = mockMvc.perform(post("/api/customer/requests").header("Authorization", "Bearer " + customerToken1).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated()).andReturn();
        Long requestId = objectMapper.readTree(rRes.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(patch("/api/customer/requests/" + requestId + "/cancel").header("Authorization", "Bearer " + customerToken1)).andExpect(status().isOk());

        mockMvc.perform(post("/api/customer/ratings/" + requestId)
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(5, "Rating cancelled"))))
                .andExpect(status().isNotFound());
    }

    @Test
    void test13_DuplicateRatingReturns409() throws Exception {
        Long jobId = createJobAndProgressToStatus(customerToken1, workerToken1, ServiceCategory.PLUMBING, JobStatus.COMPLETED);

        mockMvc.perform(post("/api/customer/ratings/" + jobId)
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(5, "First rating"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/customer/ratings/" + jobId)
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(4, "Second rating"))))
                .andExpect(status().isConflict());
    }

    @Test
    void test14_15_WorkerAndAdminCannotCreateRating() throws Exception {
        Long jobId = createJobAndProgressToStatus(customerToken1, workerToken1, ServiceCategory.PLUMBING, JobStatus.COMPLETED);

        mockMvc.perform(post("/api/customer/ratings/" + jobId)
                        .header("Authorization", "Bearer " + workerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(5, "Worker self rating"))))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/customer/ratings/" + jobId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(5, "Admin rating"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void test16_UnauthenticatedCreateRatingReturns401() throws Exception {
        Long jobId = createJobAndProgressToStatus(customerToken1, workerToken1, ServiceCategory.PLUMBING, JobStatus.COMPLETED);

        mockMvc.perform(post("/api/customer/ratings/" + jobId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(5, "No token"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void test17_18_CustomerRatingRetrievalPermissions() throws Exception {
        Long jobId = createJobAndProgressToStatus(customerToken1, workerToken1, ServiceCategory.PLUMBING, JobStatus.COMPLETED);
        mockMvc.perform(post("/api/customer/ratings/" + jobId)
                .header("Authorization", "Bearer " + customerToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateRatingRequest(5, "Great"))));

        // Customer 1 can retrieve own job rating
        mockMvc.perform(get("/api/customer/ratings/job/" + jobId)
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(5));

        // Customer 2 cannot retrieve Customer 1's job rating -> 403 Forbidden
        mockMvc.perform(get("/api/customer/ratings/job/" + jobId)
                        .header("Authorization", "Bearer " + customerToken2))
                .andExpect(status().isForbidden());
    }

    @Test
    void test19_20_WorkerRatingsRetrievalPermissions() throws Exception {
        Long jobId = createJobAndProgressToStatus(customerToken1, workerToken1, ServiceCategory.PLUMBING, JobStatus.COMPLETED);
        mockMvc.perform(post("/api/customer/ratings/" + jobId)
                .header("Authorization", "Bearer " + customerToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateRatingRequest(5, "Great work"))));

        // Worker 1 can retrieve own received ratings
        mockMvc.perform(get("/api/worker/ratings")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].score").value(5));

        // Worker 2 retrieves empty list for their own ratings
        mockMvc.perform(get("/api/worker/ratings")
                        .header("Authorization", "Bearer " + workerToken2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void test21_22_WorkerRatingSummaryAndMultipleAggregations() throws Exception {
        // Job 1 rated 5
        Long jobId1 = createJobAndProgressToStatus(customerToken1, workerToken1, ServiceCategory.PLUMBING, JobStatus.COMPLETED);
        mockMvc.perform(post("/api/customer/ratings/" + jobId1)
                .header("Authorization", "Bearer " + customerToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateRatingRequest(5, "Awesome"))));

        // Job 2 rated 4
        Long jobId2 = createJobAndProgressToStatus(customerToken2, workerToken1, ServiceCategory.PLUMBING, JobStatus.COMPLETED);
        mockMvc.perform(post("/api/customer/ratings/" + jobId2)
                .header("Authorization", "Bearer " + customerToken2)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateRatingRequest(4, "Good"))));

        // Worker 1 Summary: (5 + 4)/2 = 4.5 average, 2 ratings
        mockMvc.perform(get("/api/worker/ratings/summary")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averageRating").value(4.5))
                .andExpect(jsonPath("$.totalRatings").value(2));
    }

    @Test
    void test23_CompletedJobBecomesRateable() throws Exception {
        Long jobId = createJobAndProgressToStatus(customerToken1, workerToken1, ServiceCategory.PLUMBING, JobStatus.ACCEPTED);

        // Before completion -> 409
        mockMvc.perform(post("/api/customer/ratings/" + jobId)
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(5, "Early"))))
                .andExpect(status().isConflict());

        // Worker completes service -> PAYMENT_REQUIRED
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + workerToken1)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobStatus").value("PAYMENT_REQUIRED"));

        // Customer pays -> COMPLETED
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SimulatePaymentRequest(true))))
                .andExpect(status().isOk());

        // After completion -> 201 Created
        mockMvc.perform(post("/api/customer/ratings/" + jobId)
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(5, "Now completed"))))
                .andExpect(status().isCreated());
    }

    @Test
    void test24_InvalidStateTransitionDoesNotCreateRating() throws Exception {
        Long jobId = createJobAndProgressToStatus(customerToken1, workerToken1, ServiceCategory.PLUMBING, JobStatus.ACCEPTED);

        // Attempt completion without starting -> fails 409
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken1)).andExpect(status().isConflict());

        // Attempt rate -> fails 409
        mockMvc.perform(post("/api/customer/ratings/" + jobId)
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(5, "Invalid state rating"))))
                .andExpect(status().isConflict());

        assertFalse(ratingRepository.existsByJobId(jobId));
    }

    @Test
    void test25_ConcurrentDuplicateRatingPreventedByDBConstraint() throws Exception {
        Long jobId = createJobAndProgressToStatus(customerToken1, workerToken1, ServiceCategory.PLUMBING, JobStatus.COMPLETED);

        mockMvc.perform(post("/api/customer/ratings/" + jobId)
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(5, "First"))))
                .andExpect(status().isCreated());

        // Concurrent/duplicate attempt
        mockMvc.perform(post("/api/customer/ratings/" + jobId)
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(5, "Duplicate"))))
                .andExpect(status().isConflict());

        assertEquals(1, ratingRepository.findAll().stream().filter(r -> r.getJob().getId().equals(jobId)).count());
    }
}
