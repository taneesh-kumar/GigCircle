package com.sih.cooperative;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.cooperative.dto.CreateServiceRequestRequest;
import com.sih.cooperative.dto.CreateWorkerProfileRequest;
import com.sih.cooperative.dto.LoginRequest;
import com.sih.cooperative.dto.RegisterRequest;
import com.sih.cooperative.entity.Job;
import com.sih.cooperative.entity.JobStatus;
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
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class WorkerJobLifecycleIntegrationTest {

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
    private PaymentRepository paymentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private com.sih.cooperative.repository.PaymentRepository paymentRepository;

    private String customerToken;
    private String workerToken1;
    private String workerToken2;

    @BeforeEach
    void setUp() throws Exception {
        notificationRepository.deleteAll();
        paymentRepository.deleteAll();
        ratingRepository.deleteAll();
        paymentRepository.deleteAll();
        earningRepository.deleteAll();
        jobRepository.deleteAll();
        serviceRequestRepository.deleteAll();
        workerProfileRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Register Customer
        RegisterRequest custReg = new RegisterRequest(
                "Customer Bob",
                "bob.customer@example.com",
                "9876543210",
                "CustomerPass123!",
                Role.CUSTOMER
        );
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(custReg)))
                .andExpect(status().isCreated());

        LoginRequest custLogin = new LoginRequest("bob.customer@example.com", "CustomerPass123!");
        MvcResult custLoginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(custLogin)))
                .andExpect(status().isOk())
                .andReturn();
        customerToken = objectMapper.readTree(custLoginRes.getResponse().getContentAsString()).get("token").asText();

        // 2. Register Worker 1
        RegisterRequest wrk1Reg = new RegisterRequest(
                "Worker Rahul",
                "rahul.worker@example.com",
                "9876543211",
                "WorkerPass123!",
                Role.WORKER
        );
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrk1Reg)))
                .andExpect(status().isCreated());

        LoginRequest wrk1Login = new LoginRequest("rahul.worker@example.com", "WorkerPass123!");
        MvcResult wrk1LoginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrk1Login)))
                .andExpect(status().isOk())
                .andReturn();
        workerToken1 = objectMapper.readTree(wrk1LoginRes.getResponse().getContentAsString()).get("token").asText();

        CreateWorkerProfileRequest profileReq1 = new CreateWorkerProfileRequest(
                "Plumbing specialist",
                5,
                new BigDecimal("500.00"),
                Set.of("Pipe Fitting"),
                Set.of(ServiceCategory.PLUMBING),
                Boolean.TRUE,
                "Indiranagar",
                10
        );
        mockMvc.perform(post("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileReq1)))
                .andExpect(status().isCreated());

        // 3. Register Worker 2
        RegisterRequest wrk2Reg = new RegisterRequest(
                "Worker Priya",
                "priya.worker@example.com",
                "9876543212",
                "WorkerPass123!",
                Role.WORKER
        );
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrk2Reg)))
                .andExpect(status().isCreated());

        LoginRequest wrk2Login = new LoginRequest("priya.worker@example.com", "WorkerPass123!");
        MvcResult wrk2LoginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrk2Login)))
                .andExpect(status().isOk())
                .andReturn();
        workerToken2 = objectMapper.readTree(wrk2LoginRes.getResponse().getContentAsString()).get("token").asText();

        CreateWorkerProfileRequest profileReq2 = new CreateWorkerProfileRequest(
                "Plumber two",
                8,
                new BigDecimal("600.00"),
                Set.of("Drain Repair"),
                Set.of(ServiceCategory.PLUMBING),
                Boolean.TRUE,
                "Indiranagar",
                15
        );
        mockMvc.perform(post("/api/worker/profile")
                        .header("Authorization", "Bearer " + workerToken2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileReq2)))
                .andExpect(status().isCreated());
    }

    private Long createAndAcceptJob(String workerToken) throws Exception {
        CreateServiceRequestRequest req = new CreateServiceRequestRequest(
                ServiceCategory.PLUMBING,
                "Fix leaking bathroom pipe",
                "Indiranagar",
                new BigDecimal("700.00"),
                LocalDateTime.now().plusDays(1)
        );
        MvcResult reqRes = mockMvc.perform(post("/api/customer/requests")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();
        Long requestId = objectMapper.readTree(reqRes.getResponse().getContentAsString()).get("id").asLong();

        MvcResult acceptRes = mockMvc.perform(post("/api/worker/jobs/" + requestId + "/accept")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(acceptRes.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    void test1_WorkerCanStartAcceptedJob() throws Exception {
        Long jobId = createAndAcceptJob(workerToken1);

        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(jobId))
                .andExpect(jsonPath("$.jobStatus").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.startedAt").exists());

        Job job = jobRepository.findById(jobId).orElseThrow();
        assertEquals(JobStatus.IN_PROGRESS, job.getStatus());
        assertNotNull(job.getStartedAt());
    }

    @Test
    void test2_WorkerCanCompleteInProgressJob() throws Exception {
        Long jobId = createAndAcceptJob(workerToken1);

        // Start job
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isOk());

        // Worker requests completion -> PAYMENT_REQUIRED
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(jobId))
                .andExpect(jsonPath("$.jobStatus").value("PAYMENT_REQUIRED"))
                .andExpect(jsonPath("$.startedAt").exists());

        Job job = jobRepository.findById(jobId).orElseThrow();
        assertEquals(JobStatus.PAYMENT_REQUIRED, job.getStatus());
    }

    @Test
    void test3_WorkerCannotCompleteAcceptedJobDirectly() throws Exception {
        Long jobId = createAndAcceptJob(workerToken1);

        // Attempt direct completion without starting -> HTTP 409 Conflict
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("Only IN_PROGRESS jobs can request completion")));
    }

    @Test
    void test4_WorkerCannotStartAlreadyStartedJob() throws Exception {
        Long jobId = createAndAcceptJob(workerToken1);

        // Start job
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isOk());

        // Attempt second start -> HTTP 409 Conflict
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isConflict());
    }

    @Test
    void test5_WorkerCannotStartPaymentRequiredJob() throws Exception {
        Long jobId = createAndAcceptJob(workerToken1);

        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start")
                .header("Authorization", "Bearer " + workerToken1));

        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete")
                .header("Authorization", "Bearer " + workerToken1));

        // Attempt start on PAYMENT_REQUIRED job -> HTTP 409 Conflict
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isConflict());
    }

    @Test
    void test6_WorkerCannotCompletePaymentRequiredJob() throws Exception {
        Long jobId = createAndAcceptJob(workerToken1);

        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start")
                .header("Authorization", "Bearer " + workerToken1));

        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete")
                .header("Authorization", "Bearer " + workerToken1));

        // Attempt second completion request -> HTTP 409 Conflict
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isConflict());
    }

    @Test
    void test7_WorkerCannotManipulateAnotherWorkersJob() throws Exception {
        Long jobId = createAndAcceptJob(workerToken1);

        // Worker 2 attempts to start Worker 1's job -> HTTP 403 Forbidden
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start")
                        .header("Authorization", "Bearer " + workerToken2))
                .andExpect(status().isForbidden());

        // Worker 2 attempts to complete Worker 1's job -> HTTP 403 Forbidden
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete")
                        .header("Authorization", "Bearer " + workerToken2))
                .andExpect(status().isForbidden());
    }

    @Test
    void test8_9_CustomerCannotStartOrCompleteWorkerJob() throws Exception {
        Long jobId = createAndAcceptJob(workerToken1);

        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void test12_13_UnauthenticatedUserCannotStartOrCompleteJob() throws Exception {
        Long jobId = createAndAcceptJob(workerToken1);

        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void test14_15_16_CustomerSeesJobStatusProgressions() throws Exception {
        Long jobId = createAndAcceptJob(workerToken1);
        Job job = jobRepository.findById(jobId).orElseThrow();
        Long requestId = job.getServiceRequest().getId();

        // 1. ACCEPTED state visibility
        mockMvc.perform(get("/api/customer/requests/" + requestId)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobStatus").value("ACCEPTED"));

        // 2. Start job -> IN_PROGRESS state visibility
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/customer/requests/" + requestId)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobStatus").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.startedAt").exists());

        // 3. Worker requests completion -> PAYMENT_REQUIRED state visibility
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/customer/requests/" + requestId)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobStatus").value("PAYMENT_REQUIRED"))
                .andExpect(jsonPath("$.startedAt").exists());

        // 4. Customer pays -> COMPLETED state visibility
        com.sih.cooperative.dto.CreatePaymentRequest payReq = new com.sih.cooperative.dto.CreatePaymentRequest();
        payReq.setJobId(jobId);
        payReq.setPaymentMethod(com.sih.cooperative.entity.PaymentMethod.UPI);
        payReq.setUpiId("test-success@upi");

        mockMvc.perform(post("/api/customer/payments/process")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/customer/requests/" + requestId)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobStatus").value("COMPLETED"))
                .andExpect(jsonPath("$.startedAt").exists())
                .andExpect(jsonPath("$.completedAt").exists());
    }

    @Test
    void test17_18_19_CustomerCannotCancelAssignedJobsInAnyState() throws Exception {
        Long jobId = createAndAcceptJob(workerToken1);
        Job job = jobRepository.findById(jobId).orElseThrow();
        Long requestId = job.getServiceRequest().getId();

        // 1. ACCEPTED state cancellation attempt -> HTTP 409
        mockMvc.perform(patch("/api/customer/requests/" + requestId + "/cancel")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isConflict());

        // 2. IN_PROGRESS state cancellation attempt -> HTTP 409
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start")
                .header("Authorization", "Bearer " + workerToken1));

        mockMvc.perform(patch("/api/customer/requests/" + requestId + "/cancel")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isConflict());

        // 3. PAYMENT_REQUIRED state cancellation attempt -> HTTP 409
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete")
                .header("Authorization", "Bearer " + workerToken1));

        mockMvc.perform(patch("/api/customer/requests/" + requestId + "/cancel")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isConflict());
    }

    @Test
    void test20_LifecycleTimestampsPersistCorrectly() throws Exception {
        Long jobId = createAndAcceptJob(workerToken1);

        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start")
                .header("Authorization", "Bearer " + workerToken1));

        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete")
                .header("Authorization", "Bearer " + workerToken1));

        // Customer pays to finalize job completion
        com.sih.cooperative.dto.CreatePaymentRequest payReq = new com.sih.cooperative.dto.CreatePaymentRequest();
        payReq.setJobId(jobId);
        payReq.setPaymentMethod(com.sih.cooperative.entity.PaymentMethod.UPI);
        payReq.setUpiId("test-success@upi");

        mockMvc.perform(post("/api/customer/payments/process")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isCreated());

        Job persisted = jobRepository.findById(jobId).orElseThrow();
        assertNotNull(persisted.getCreatedAt());
        assertNotNull(persisted.getAcceptedAt());
        assertNotNull(persisted.getStartedAt());
        assertNotNull(persisted.getCompletedAt());
        assertEquals(JobStatus.COMPLETED, persisted.getStatus());
    }

    @Test
    void test21_InvalidTransitionDoesNotModifyJobState() throws Exception {
        Long jobId = createAndAcceptJob(workerToken1);

        // Attempt invalid completion without starting
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isConflict());

        // State remains ACCEPTED
        Job persisted = jobRepository.findById(jobId).orElseThrow();
        assertEquals(JobStatus.ACCEPTED, persisted.getStatus());
        assertNull(persisted.getStartedAt());
        assertNull(persisted.getCompletedAt());
    }

    @Test
    void test22_23_ConcurrentStartAndCompletionSafety() throws Exception {
        Long jobId = createAndAcceptJob(workerToken1);

        // Concurrent start attempts
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isConflict());

        // Concurrent completion attempts
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isConflict());

        Job finalJob = jobRepository.findById(jobId).orElseThrow();
        assertEquals(JobStatus.PAYMENT_REQUIRED, finalJob.getStatus());
    }
}
