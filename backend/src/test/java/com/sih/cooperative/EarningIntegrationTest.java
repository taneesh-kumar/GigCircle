package com.sih.cooperative;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.cooperative.dto.*;
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
public class EarningIntegrationTest {

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
    private PasswordEncoder passwordEncoder;

    private String customerToken1;
    private String customerToken2;
    private String workerToken1;
    private String workerToken2;
    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        notificationRepository.deleteAll();
        invoiceRepository.deleteAll();
        ratingRepository.deleteAll();
        earningRepository.deleteAll();
        jobRepository.deleteAll();
        serviceRequestRepository.deleteAll();
        workerProfileRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Customer 1
        RegisterRequest c1 = new RegisterRequest("Alice Customer", "alice.earning@example.com", "9776543210", "Pass123!", Role.CUSTOMER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(c1))).andExpect(status().isCreated());
        MvcResult lr1 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("alice.earning@example.com", "Pass123!")))).andExpect(status().isOk()).andReturn();
        customerToken1 = objectMapper.readTree(lr1.getResponse().getContentAsString()).get("token").asText();

        // 2. Customer 2
        RegisterRequest c2 = new RegisterRequest("Bob Customer", "bob.earning@example.com", "9776543211", "Pass123!", Role.CUSTOMER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(c2))).andExpect(status().isCreated());
        MvcResult lr2 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("bob.earning@example.com", "Pass123!")))).andExpect(status().isOk()).andReturn();
        customerToken2 = objectMapper.readTree(lr2.getResponse().getContentAsString()).get("token").asText();

        // 3. Worker 1
        RegisterRequest w1 = new RegisterRequest("Charlie Worker", "charlie.earning@example.com", "9776543212", "Pass123!", Role.WORKER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(w1))).andExpect(status().isCreated());
        MvcResult lr3 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("charlie.earning@example.com", "Pass123!")))).andExpect(status().isOk()).andReturn();
        workerToken1 = objectMapper.readTree(lr3.getResponse().getContentAsString()).get("token").asText();

        CreateWorkerProfileRequest p1 = new CreateWorkerProfileRequest("Plumbing Expert", 5, new BigDecimal("500.00"), Set.of("Pipe Fitting"), Set.of(ServiceCategory.PLUMBING), Boolean.TRUE, "Indiranagar", 10);
        mockMvc.perform(post("/api/worker/profile").header("Authorization", "Bearer " + workerToken1).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(p1))).andExpect(status().isCreated());

        // 4. Worker 2
        RegisterRequest w2 = new RegisterRequest("Dave Worker", "dave.earning@example.com", "9776543213", "Pass123!", Role.WORKER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(w2))).andExpect(status().isCreated());
        MvcResult lr4 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("dave.earning@example.com", "Pass123!")))).andExpect(status().isOk()).andReturn();
        workerToken2 = objectMapper.readTree(lr4.getResponse().getContentAsString()).get("token").asText();

        CreateWorkerProfileRequest p2 = new CreateWorkerProfileRequest("Electrician Expert", 8, new BigDecimal("600.00"), Set.of("Wiring"), Set.of(ServiceCategory.ELECTRICAL), Boolean.TRUE, "Indiranagar", 10);
        mockMvc.perform(post("/api/worker/profile").header("Authorization", "Bearer " + workerToken2).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(p2))).andExpect(status().isCreated());

        // 5. Admin
        User adminUser = new User("Admin Steward", "admin.earning@example.com", "9776543214", passwordEncoder.encode("AdminPass123!"), Role.ADMIN);
        userRepository.save(adminUser);

        MvcResult lr5 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("admin.earning@example.com", "AdminPass123!")))).andExpect(status().isOk()).andReturn();
        adminToken = objectMapper.readTree(lr5.getResponse().getContentAsString()).get("token").asText();
    }

    private Long createJob(String customerToken, String workerToken, BigDecimal budget) throws Exception {
        CreateServiceRequestRequest req = new CreateServiceRequestRequest(ServiceCategory.PLUMBING, "Earning test description", "Indiranagar", budget, LocalDateTime.now().plusDays(1));
        MvcResult rRes = mockMvc.perform(post("/api/customer/requests").header("Authorization", "Bearer " + customerToken).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated()).andReturn();
        Long requestId = objectMapper.readTree(rRes.getResponse().getContentAsString()).get("id").asLong();

        MvcResult aRes = mockMvc.perform(post("/api/worker/jobs/" + requestId + "/accept").header("Authorization", "Bearer " + workerToken)).andExpect(status().isCreated()).andReturn();
        return objectMapper.readTree(aRes.getResponse().getContentAsString()).get("id").asLong();
    }

    private Long completeJob(Long jobId, String workerToken, String customerToken) throws Exception {
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());
        return jobId;
    }

    @Test
    void test1_7_CompletedJobGeneratesEarningAndCalculatesMonetaryValues() throws Exception {
        Long jobId = createJob(customerToken1, workerToken1, new BigDecimal("700.00"));
        completeJob(jobId, workerToken1, customerToken1);

        assertTrue(earningRepository.existsByJobId(jobId));
        Earning earning = earningRepository.findByJobId(jobId).orElseThrow();

        assertEquals(new BigDecimal("700.00"), earning.getGrossAmount());
        assertEquals(new BigDecimal("70.00"), earning.getPlatformFee());
        assertEquals(new BigDecimal("630.00"), earning.getWorkerEarning());
        assertEquals(new BigDecimal("10.00"), earning.getFeePercentage());
        assertEquals(EarningStatus.AVAILABLE, earning.getStatus());
        assertNotNull(earning.getCreatedAt());
        assertNotNull(earning.getAvailableAt());
    }

    @Test
    void test8_11_NonCompletedJobsDoNotGenerateEarnings() throws Exception {
        // ACCEPTED job
        Long acceptedJobId = createJob(customerToken1, workerToken1, new BigDecimal("500.00"));
        assertFalse(earningRepository.existsByJobId(acceptedJobId));

        // IN_PROGRESS job
        mockMvc.perform(post("/api/worker/jobs/" + acceptedJobId + "/start").header("Authorization", "Bearer " + workerToken1)).andExpect(status().isOk());
        assertFalse(earningRepository.existsByJobId(acceptedJobId));

        // Cancelled Service Request
        CreateServiceRequestRequest req = new CreateServiceRequestRequest(ServiceCategory.PLUMBING, "Cancelled request", "Indiranagar", new BigDecimal("500.00"), LocalDateTime.now().plusDays(1));
        MvcResult rRes = mockMvc.perform(post("/api/customer/requests").header("Authorization", "Bearer " + customerToken1).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated()).andReturn();
        Long requestId = objectMapper.readTree(rRes.getResponse().getContentAsString()).get("id").asLong();
        mockMvc.perform(patch("/api/customer/requests/" + requestId + "/cancel").header("Authorization", "Bearer " + customerToken1)).andExpect(status().isOk());

        assertFalse(earningRepository.existsByJobId(requestId));
    }

    @Test
    void test12_13_DuplicateEarningCreationPrevented() throws Exception {
        Long jobId = createJob(customerToken1, workerToken1, new BigDecimal("800.00"));
        completeJob(jobId, workerToken1, customerToken1);

        assertEquals(1, earningRepository.findAll().stream().filter(e -> e.getJob().getId().equals(jobId)).count());
    }

    @Test
    void test14_15_WorkerEarningsRetrievalAndIsolation() throws Exception {
        Long jobId = createJob(customerToken1, workerToken1, new BigDecimal("1000.00"));
        completeJob(jobId, workerToken1, customerToken1);

        // Worker 1 can retrieve own earnings
        mockMvc.perform(get("/api/worker/earnings")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].grossAmount").value(1000.00))
                .andExpect(jsonPath("$[0].platformFee").value(100.00))
                .andExpect(jsonPath("$[0].workerEarning").value(900.00));

        // Worker 2 sees empty list for own earnings
        mockMvc.perform(get("/api/worker/earnings")
                        .header("Authorization", "Bearer " + workerToken2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        Long earningId = earningRepository.findByJobId(jobId).orElseThrow().getId();

        // Worker 1 gets individual earning detail
        mockMvc.perform(get("/api/worker/earnings/" + earningId)
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(earningId));

        // Worker 2 accessing Worker 1's earning detail -> 403 Forbidden
        mockMvc.perform(get("/api/worker/earnings/" + earningId)
                        .header("Authorization", "Bearer " + workerToken2))
                .andExpect(status().isForbidden());
    }

    @Test
    void test16_17_CustomerJobEarningRetrievalAndIsolation() throws Exception {
        Long jobId = createJob(customerToken1, workerToken1, new BigDecimal("600.00"));
        completeJob(jobId, workerToken1, customerToken1);

        // Customer 1 can view financial summary for own job
        mockMvc.perform(get("/api/customer/earnings/job/" + jobId)
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobId").value(jobId))
                .andExpect(jsonPath("$.grossAmount").value(600.00))
                .andExpect(jsonPath("$.platformFee").value(60.00))
                .andExpect(jsonPath("$.workerEarning").value(540.00));

        // Customer 2 accessing Customer 1's job earning -> 403 Forbidden
        mockMvc.perform(get("/api/customer/earnings/job/" + jobId)
                        .header("Authorization", "Bearer " + customerToken2))
                .andExpect(status().isForbidden());
    }

    @Test
    void test20_22_AdminRevenueSummaryAndAccessControl() throws Exception {
        Long j1 = createJob(customerToken1, workerToken1, new BigDecimal("500.00"));
        completeJob(j1, workerToken1, customerToken1);

        Long j2 = createJob(customerToken2, workerToken1, new BigDecimal("1500.00"));
        completeJob(j2, workerToken1, customerToken2);

        // Admin retrieves revenue summary
        mockMvc.perform(get("/api/admin/revenue/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalGrossRevenue").value(2000.00))
                .andExpect(jsonPath("$.totalPlatformFees").value(200.00))
                .andExpect(jsonPath("$.totalWorkerEarnings").value(1800.00))
                .andExpect(jsonPath("$.totalCompletedJobsWithEarnings").value(2));

        // Customer & Worker blocked from admin revenue -> 403 Forbidden
        mockMvc.perform(get("/api/admin/revenue/summary")
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/revenue/summary")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isForbidden());
    }

    @Test
    void test23_24_UnauthenticatedAndUnauthorizedAccess() throws Exception {
        mockMvc.perform(get("/api/worker/earnings"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/revenue/summary"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void test25_28_WorkerSummaryAndMonetaryPrecision() throws Exception {
        Long j1 = createJob(customerToken1, workerToken1, new BigDecimal("350.50"));
        completeJob(j1, workerToken1, customerToken1);

        Long j2 = createJob(customerToken2, workerToken1, new BigDecimal("450.25"));
        completeJob(j2, workerToken1, customerToken2);

        // 350.50 * 0.10 = 35.05 fee -> 315.45 worker
        // 450.25 * 0.10 = 45.03 fee -> 405.22 worker
        // Total Gross: 800.75
        // Total Fee: 80.08
        // Total Worker: 720.67

        mockMvc.perform(get("/api/worker/earnings/summary")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalGross").value(800.75))
                .andExpect(jsonPath("$.totalPlatformFees").value(80.08))
                .andExpect(jsonPath("$.totalWorkerEarnings").value(720.67))
                .andExpect(jsonPath("$.totalJobs").value(2));
    }
}
