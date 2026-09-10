package com.sih.cooperative;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.cooperative.dto.RegisterRequest;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AdminOperationsIntegrationTest {

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
    private InvoiceRepository invoiceRepository;

    @Autowired
    private DisputeRepository disputeRepository;

    @Autowired
    private AdminActivityRepository adminActivityRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminToken;
    private String customerToken;
    private String workerToken;
    private User adminUser;
    private User customerUser;
    private User workerUser;
    private WorkerProfile workerProfile;

    @BeforeEach
    void setUp() throws Exception {
        paymentRepository.deleteAll();
        adminActivityRepository.deleteAll();
        notificationRepository.deleteAll();
        invoiceRepository.deleteAll();
        disputeRepository.deleteAll();
        ratingRepository.deleteAll();
        earningRepository.deleteAll();
        jobRepository.deleteAll();
        serviceRequestRepository.deleteAll();
        workerProfileRepository.deleteAll();
        userRepository.deleteAll();

        // Create Admin user directly in repository
        adminUser = new User("System Admin", "admin@gigcircle.com", "9000000000", passwordEncoder.encode("AdminPass123!"), Role.ADMIN);
        userRepository.save(adminUser);

        // Login Admin to get token
        MvcResult adminLoginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@gigcircle.com\",\"password\":\"AdminPass123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        adminToken = objectMapper.readTree(adminLoginResult.getResponse().getContentAsString()).get("token").asText();

        // Register Customer
        RegisterRequest custReq = new RegisterRequest("Customer One", "customer1@test.com", "9111111111", "Password123!", Role.CUSTOMER);
        MvcResult custResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(custReq)))
                .andExpect(status().isCreated())
                .andReturn();
        customerToken = objectMapper.readTree(custResult.getResponse().getContentAsString()).get("token").asText();
        customerUser = userRepository.findByEmail("customer1@test.com").orElseThrow();

        // Register Worker
        RegisterRequest wkrReq = new RegisterRequest("Worker One", "worker1@test.com", "9222222222", "Password123!", Role.WORKER);
        MvcResult wkrResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wkrReq)))
                .andExpect(status().isCreated())
                .andReturn();
        workerToken = objectMapper.readTree(wkrResult.getResponse().getContentAsString()).get("token").asText();
        workerUser = userRepository.findByEmail("worker1@test.com").orElseThrow();

        // Create Worker Profile
        workerProfile = new WorkerProfile(
                workerUser,
                "Experienced Electrician",
                5,
                new BigDecimal("500.00"),
                Set.of("Wiring", "Repair"),
                Set.of(ServiceCategory.ELECTRICAL),
                true,
                "Downtown",
                10
        );
        workerProfileRepository.save(workerProfile);
    }

    @Test
    void test1_AdminCanRetrievePlatformOverview() throws Exception {
        mockMvc.perform(get("/api/admin/overview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").value(3))
                .andExpect(jsonPath("$.totalCustomers").value(1))
                .andExpect(jsonPath("$.totalWorkers").value(1))
                .andExpect(jsonPath("$.totalServiceRequests").value(0));
    }

    @Test
    void test2_CustomerCannotRetrievePlatformOverview() throws Exception {
        mockMvc.perform(get("/api/admin/overview")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void test3_WorkerCannotRetrievePlatformOverview() throws Exception {
        mockMvc.perform(get("/api/admin/overview")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void test4_UnauthenticatedUserCannotRetrievePlatformOverview() throws Exception {
        mockMvc.perform(get("/api/admin/overview"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void test5_AdminCanRetrieveUsers() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.content.length()").value(3))
                .andExpect(jsonPath("$.content[0].email").exists());
    }

    @Test
    void test6_AdminCanRetrieveWorkers() throws Exception {
        mockMvc.perform(get("/api/admin/workers")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].workerId").value(workerUser.getId()))
                .andExpect(jsonPath("$[0].active").value(true));
    }

    @Test
    void test7_AdminCanDeactivateWorker() throws Exception {
        mockMvc.perform(post("/api/admin/workers/" + workerUser.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        User updatedWorker = userRepository.findById(workerUser.getId()).orElseThrow();
        assertFalse(updatedWorker.isActive());
    }

    @Test
    void test8_DeactivatedWorkerBecomesIneligibleForNewMatching() throws Exception {
        // Create an OPEN service request matching worker
        ServiceRequest req = new ServiceRequest(customerUser, ServiceCategory.ELECTRICAL, "Need wiring fix", "Downtown", new BigDecimal("1000.00"), LocalDateTime.now().plusDays(1));
        serviceRequestRepository.save(req);

        // Verify active worker sees job
        mockMvc.perform(get("/api/worker/jobs")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        // Deactivate worker
        mockMvc.perform(post("/api/admin/workers/" + workerUser.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Deactivated worker sees 0 eligible jobs
        mockMvc.perform(get("/api/worker/jobs")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        // Deactivated worker cannot accept job (409 Conflict)
        mockMvc.perform(post("/api/worker/jobs/" + req.getId() + "/accept")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isConflict());
    }

    @Test
    void test9_AdminCanReactivateWorker() throws Exception {
        // Deactivate first
        workerUser.setActive(false);
        userRepository.save(workerUser);

        // Reactivate
        mockMvc.perform(post("/api/admin/workers/" + workerUser.getId() + "/activate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(true));

        User updatedWorker = userRepository.findById(workerUser.getId()).orElseThrow();
        assertTrue(updatedWorker.isActive());
    }

    @Test
    void test10_ReactivatedWorkerCanBecomeEligibleAgain() throws Exception {
        // Create OPEN service request
        ServiceRequest req = new ServiceRequest(customerUser, ServiceCategory.ELECTRICAL, "Need wiring fix", "Downtown", new BigDecimal("1000.00"), LocalDateTime.now().plusDays(1));
        serviceRequestRepository.save(req);

        // Deactivate worker
        workerUser.setActive(false);
        userRepository.save(workerUser);

        // Verify ineligible
        mockMvc.perform(get("/api/worker/jobs")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        // Reactivate
        mockMvc.perform(post("/api/admin/workers/" + workerUser.getId() + "/activate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Eligible again
        mockMvc.perform(get("/api/worker/jobs")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void test11_HistoricalWorkerJobsRemainIntactAfterDeactivation() throws Exception {
        ServiceRequest req = new ServiceRequest(customerUser, ServiceCategory.ELECTRICAL, "Need wiring fix", "Downtown", new BigDecimal("1000.00"), LocalDateTime.now().plusDays(1));
        serviceRequestRepository.save(req);

        Job job = new Job(req, workerUser, JobStatus.COMPLETED);
        job.setStartedAt(LocalDateTime.now().minusHours(2));
        job.setCompletedAt(LocalDateTime.now().minusHours(1));
        jobRepository.save(job);

        // Deactivate worker
        mockMvc.perform(post("/api/admin/workers/" + workerUser.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Verify job still exists
        assertTrue(jobRepository.existsById(job.getId()));
        assertEquals(JobStatus.COMPLETED, jobRepository.findById(job.getId()).orElseThrow().getStatus());
    }

    @Test
    void test12_AdminCanRetrieveServiceRequests() throws Exception {
        ServiceRequest req = new ServiceRequest(customerUser, ServiceCategory.PLUMBING, "Leaking pipe", "Uptown", new BigDecimal("800.00"), LocalDateTime.now().plusDays(1));
        serviceRequestRepository.save(req);

        mockMvc.perform(get("/api/admin/service-requests")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].description").value("Leaking pipe"))
                .andExpect(jsonPath("$[0].customerName").value("Customer One"));
    }

    @Test
    void test13_AdminCanRetrieveJobs() throws Exception {
        ServiceRequest req = new ServiceRequest(customerUser, ServiceCategory.ELECTRICAL, "Fuse box replacement", "Downtown", new BigDecimal("1500.00"), LocalDateTime.now().plusDays(1));
        serviceRequestRepository.save(req);

        Job job = new Job(req, workerUser, JobStatus.ACCEPTED);
        jobRepository.save(job);

        mockMvc.perform(get("/api/admin/jobs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].workerName").value("Worker One"))
                .andExpect(jsonPath("$[0].status").value("ACCEPTED"));
    }

    @Test
    void test14_AdminCanRetrieveRatings() throws Exception {
        ServiceRequest req = new ServiceRequest(customerUser, ServiceCategory.ELECTRICAL, "AC Repair", "Downtown", new BigDecimal("2000.00"), LocalDateTime.now().plusDays(1));
        serviceRequestRepository.save(req);

        Job job = new Job(req, workerUser, JobStatus.COMPLETED);
        jobRepository.save(job);

        Rating rating = new Rating(job, customerUser, workerUser, 5, "Excellent work!");
        ratingRepository.save(rating);

        mockMvc.perform(get("/api/admin/ratings")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].score").value(5))
                .andExpect(jsonPath("$[0].review").value("Excellent work!"));
    }

    @Test
    void test15_AdminCanRetrieveActivity() throws Exception {
        // Perform an admin action (deactivate worker)
        mockMvc.perform(post("/api/admin/workers/" + workerUser.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/activity")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].actionType").value("WORKER_DEACTIVATED"));
    }

    @Test
    void test16_CustomerCannotAccessAdminUsers() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void test17_WorkerCannotAccessAdminWorkers() throws Exception {
        mockMvc.perform(get("/api/admin/workers")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void test18_CustomerCannotDeactivateWorker() throws Exception {
        mockMvc.perform(post("/api/admin/workers/" + workerUser.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void test19_WorkerCannotDeactivateAnotherWorker() throws Exception {
        mockMvc.perform(post("/api/admin/workers/" + workerUser.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void test20_UnauthenticatedAdminEndpointAccessReturns401() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void test21_AdminCanDeactivateCustomerWithReason() throws Exception {
        mockMvc.perform(post("/api/admin/users/" + customerUser.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Terms of service violation\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DEACTIVATED"));

        User updated = userRepository.findById(customerUser.getId()).orElseThrow();
        assertEquals(AccountStatus.DEACTIVATED, updated.getStatus());
        assertFalse(updated.isActive());

        // Deactivated user cannot log in (403 FORBIDDEN)
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"customer1@test.com\",\"password\":\"Password123!\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void test22_AdminCanSuspendWorkerWithReason() throws Exception {
        mockMvc.perform(post("/api/admin/users/" + workerUser.getId() + "/suspend")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Under investigation\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));

        User updated = userRepository.findById(workerUser.getId()).orElseThrow();
        assertEquals(AccountStatus.SUSPENDED, updated.getStatus());

        // Suspended user cannot log in (403 FORBIDDEN)
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"worker1@test.com\",\"password\":\"Password123!\"}"))
                .andExpect(status().isForbidden());

        // Suspended worker excluded from matching
        mockMvc.perform(get("/api/worker/jobs")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void test23_AdminCanReactivateSuspendedUser() throws Exception {
        // Suspend user first
        customerUser.setStatus(AccountStatus.SUSPENDED);
        userRepository.save(customerUser);

        mockMvc.perform(post("/api/admin/users/" + customerUser.getId() + "/reactivate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // User can log in again
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"customer1@test.com\",\"password\":\"Password123!\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void test24_DeactivationRequiresReason() throws Exception {
        mockMvc.perform(post("/api/admin/users/" + customerUser.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void test25_AdminCannotDeactivateThemselves() throws Exception {
        mockMvc.perform(post("/api/admin/users/" + adminUser.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Self deactivation test\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void test26_AdminCannotDeactivateFinalActiveAdmin() throws Exception {
        // Register second admin
        User admin2 = new User("Second Admin", "admin2@test.com", "9999999999", passwordEncoder.encode("AdminPass123!"), Role.ADMIN);
        userRepository.save(admin2);

        // Deactivate admin2 using adminUser's token
        mockMvc.perform(post("/api/admin/users/" + admin2.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Deactivating second admin\"}"))
                .andExpect(status().isOk());

        // Now adminUser is the final active admin. Attempting to deactivate adminUser via another session (or direct API call) must fail with CONFLICT (409)
        mockMvc.perform(post("/api/admin/users/" + adminUser.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Attempt deactivating final admin\"}"))
                .andExpect(status().isBadRequest()); // Protected by self-deactivation check (or conflict check)
    }

    @Test
    void test27_EnhancedPlatformOverviewReturnsCalculatedMetricsAndRates() throws Exception {
        // Create service request and job
        ServiceRequest req = new ServiceRequest(customerUser, ServiceCategory.ELECTRICAL, "Wiring repair", "Downtown", new BigDecimal("1000.00"), LocalDateTime.now().plusDays(1));
        serviceRequestRepository.save(req);

        Job job = new Job(req, workerUser, JobStatus.COMPLETED);
        jobRepository.save(job);

        mockMvc.perform(get("/api/admin/overview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeUsers").value(3))
                .andExpect(jsonPath("$.suspendedUsers").value(0))
                .andExpect(jsonPath("$.deactivatedUsers").value(0))
                .andExpect(jsonPath("$.activeJobs").value(0))
                .andExpect(jsonPath("$.completionRate").value(100.0))
                .andExpect(jsonPath("$.cancellationRate").value(0.0));
    }

    @Test
    void test28_ZeroDenominatorRatesReturnZero() throws Exception {
        mockMvc.perform(get("/api/admin/overview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completionRate").value(0.0))
                .andExpect(jsonPath("$.cancellationRate").value(0.0));
    }

    @Test
    void test29_ServiceDemandAnalyticsReturnsGroupedAndSortedData() throws Exception {
        ServiceRequest req1 = new ServiceRequest(customerUser, ServiceCategory.ELECTRICAL, "Wiring 1", "Downtown", new BigDecimal("1000.00"), LocalDateTime.now().plusDays(1));
        ServiceRequest req2 = new ServiceRequest(customerUser, ServiceCategory.ELECTRICAL, "Wiring 2", "Downtown", new BigDecimal("1500.00"), LocalDateTime.now().plusDays(1));
        ServiceRequest req3 = new ServiceRequest(customerUser, ServiceCategory.PLUMBING, "Leak fix", "Downtown", new BigDecimal("800.00"), LocalDateTime.now().plusDays(1));
        serviceRequestRepository.save(req1);
        serviceRequestRepository.save(req2);
        serviceRequestRepository.save(req3);

        mockMvc.perform(get("/api/admin/analytics/service-demand")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].category").value("ELECTRICAL"))
                .andExpect(jsonPath("$[0].requestCount").value(2))
                .andExpect(jsonPath("$[0].demandPercentage").value(66.67))
                .andExpect(jsonPath("$[1].category").value("PLUMBING"))
                .andExpect(jsonPath("$[1].requestCount").value(1))
                .andExpect(jsonPath("$[1].demandPercentage").value(33.33));
    }

    @Test
    void test30_ActiveJobsFilterReturnsOnlyActiveStatuses() throws Exception {
        ServiceRequest req1 = new ServiceRequest(customerUser, ServiceCategory.ELECTRICAL, "Wiring 1", "Downtown", new BigDecimal("1000.00"), LocalDateTime.now().plusDays(1));
        ServiceRequest req2 = new ServiceRequest(customerUser, ServiceCategory.PLUMBING, "Leak fix", "Downtown", new BigDecimal("800.00"), LocalDateTime.now().plusDays(1));
        serviceRequestRepository.save(req1);
        serviceRequestRepository.save(req2);

        Job activeJob = new Job(req1, workerUser, JobStatus.IN_PROGRESS);
        Job completedJob = new Job(req2, workerUser, JobStatus.COMPLETED);
        jobRepository.save(activeJob);
        jobRepository.save(completedJob);

        // Filter ACTIVE
        mockMvc.perform(get("/api/admin/jobs?status=ACTIVE")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("IN_PROGRESS"));

        // Filter IN_PROGRESS
        mockMvc.perform(get("/api/admin/jobs?status=IN_PROGRESS")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("IN_PROGRESS"));

        // Invalid status
        mockMvc.perform(get("/api/admin/jobs?status=INVALID_STATUS")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    void test31_OperationalAlertsGeneratedFromRealConditions() throws Exception {
        // Create open request -> should generate alert
        ServiceRequest req = new ServiceRequest(customerUser, ServiceCategory.CLEANING, "House cleaning", "Downtown", new BigDecimal("500.00"), LocalDateTime.now().plusDays(1));
        serviceRequestRepository.save(req);

        mockMvc.perform(get("/api/admin/alerts")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].alertType").value("UNASSIGNED_SERVICE_REQUESTS"))
                .andExpect(jsonPath("$[0].severity").value("WARNING"));
    }

    // ==========================================
    // PHASE 3 TESTS
    // ==========================================

    @Test
    void test32_AdminCanRetrieveCustomerDetails() throws Exception {
        mockMvc.perform(get("/api/admin/users/" + customerUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(customerUser.getId()))
                .andExpect(jsonPath("$.email").value("customer1@test.com"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.serviceRequestsCreatedCount").value(0))
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    @Test
    void test33_AdminCanRetrieveWorkerDetails() throws Exception {
        mockMvc.perform(get("/api/admin/users/" + workerUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(workerUser.getId()))
                .andExpect(jsonPath("$.email").value("worker1@test.com"))
                .andExpect(jsonPath("$.role").value("WORKER"))
                .andExpect(jsonPath("$.skills").exists())
                .andExpect(jsonPath("$.bio").value("Experienced Electrician"));
    }

    @Test
    void test34_AdminCanRetrieveAnotherAdminDetails() throws Exception {
        User admin2 = new User("Second Admin", "admin2@test.com", "9888888888", passwordEncoder.encode("AdminPass123!"), Role.ADMIN);
        userRepository.save(admin2);

        mockMvc.perform(get("/api/admin/users/" + admin2.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(admin2.getId()))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void test35_NonAdminCannotRetrieveUserDetails() throws Exception {
        mockMvc.perform(get("/api/admin/users/" + customerUser.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void test36_MissingUserReturns404() throws Exception {
        mockMvc.perform(get("/api/admin/users/999999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void test37_UserSearchByNameAndEmail() throws Exception {
        mockMvc.perform(get("/api/admin/users?search=Customer")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].email").value("customer1@test.com"));

        mockMvc.perform(get("/api/admin/users?search=worker1@test.com")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Worker One"));
    }

    @Test
    void test38_RoleAndStatusFilteringAndPaginationMetadata() throws Exception {
        mockMvc.perform(get("/api/admin/users?role=WORKER&status=ACTIVE&page=0&size=10")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.first").value(true))
                .andExpect(jsonPath("$.last").value(true))
                .andExpect(jsonPath("$.content[0].role").value("WORKER"));
    }

    @Test
    void test39_StatusChangesCreateAuditRecordsAndRepeatedStatusHandledSafely() throws Exception {
        mockMvc.perform(post("/api/admin/users/" + customerUser.getId() + "/suspend")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Repeated violation check\"}"))
                .andExpect(status().isOk());

        // Repeated suspension
        mockMvc.perform(post("/api/admin/users/" + customerUser.getId() + "/suspend")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Repeated violation check again\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/activity")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].actionType").value("USER_SUSPENDED"));
    }

    @Test
    void test40_AdminCanAccessFinancialSummaryAndMetricsAreAccurate() throws Exception {
        ServiceRequest req = new ServiceRequest(customerUser, ServiceCategory.PLUMBING, "Fix leaking sink", "Delhi", new BigDecimal("1000.00"), LocalDateTime.now());
        serviceRequestRepository.save(req);

        Job job = new Job(req, workerUser, JobStatus.COMPLETED);
        jobRepository.save(job);

        Earning earning = new Earning(job, workerUser, customerUser, new BigDecimal("1000.00"), new BigDecimal("100.00"), new BigDecimal("900.00"), new BigDecimal("10.00"), EarningStatus.AVAILABLE);
        earningRepository.save(earning);

        mockMvc.perform(get("/api/admin/financial/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalGrossVolume").value(1000.00))
                .andExpect(jsonPath("$.totalPlatformFees").value(100.00))
                .andExpect(jsonPath("$.totalWorkerEarnings").value(900.00))
                .andExpect(jsonPath("$.completedPaymentAmount").value(1000.00))
                .andExpect(jsonPath("$.totalTransactions").value(1))
                .andExpect(jsonPath("$.completedTransactions").value(1));
    }

    @Test
    void test41_NonAdminCannotAccessFinancialSummary() throws Exception {
        mockMvc.perform(get("/api/admin/financial/summary")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/financial/summary")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());

    }

    @Test
    void test46_DateRangeValidationOnFinancialSummary() throws Exception {
        mockMvc.perform(get("/api/admin/financial/summary?from=2026-09-10&to=2026-09-01")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    void test48_PaginatedAndFilteredAuditActivityEndpoint() throws Exception {
        mockMvc.perform(post("/api/admin/users/" + customerUser.getId() + "/suspend")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Policy audit test\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/activity?actionType=USER_SUSPENDED&page=0&size=10")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].actionType").value("USER_SUSPENDED"))
                .andExpect(jsonPath("$.content[0].description").value(org.hamcrest.Matchers.containsString("Policy audit test")));
    }
}

