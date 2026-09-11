package com.sih.cooperative;

import com.fasterxml.jackson.databind.JsonNode;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Phase 4 – Realistic Demo Payment & Correct GigCircle Lifecycle
 *
 * Correct lifecycle:
 *   ACCEPTED → IN_PROGRESS → PAYMENT_REQUIRED → [customer pays] → COMPLETED
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class DemoPaymentIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private ServiceRequestRepository serviceRequestRepository;
    @Autowired private WorkerProfileRepository workerProfileRepository;
    @Autowired private JobRepository jobRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private EarningRepository earningRepository;
    @Autowired private InvoiceRepository invoiceRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private String customerToken1;
    private String customerToken2;
    private String workerToken;
    private Long jobId;

    @BeforeEach
    void setUp() throws Exception {
        paymentRepository.deleteAll();
        invoiceRepository.deleteAll();
        earningRepository.deleteAll();
        notificationRepository.deleteAll();
        jobRepository.deleteAll();
        serviceRequestRepository.deleteAll();
        workerProfileRepository.deleteAll();
        userRepository.deleteAll();

        // Customer 1
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new RegisterRequest("Alice Pay", "alice.pay@example.com", "9221111111", "Pass123!", Role.CUSTOMER))))
                .andExpect(status().isCreated());
        MvcResult lr1 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest("alice.pay@example.com", "Pass123!"))))
                .andExpect(status().isOk()).andReturn();
        customerToken1 = objectMapper.readTree(lr1.getResponse().getContentAsString()).get("token").asText();

        // Customer 2
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new RegisterRequest("Bob Pay", "bob.pay@example.com", "9221111112", "Pass123!", Role.CUSTOMER))))
                .andExpect(status().isCreated());
        MvcResult lr2 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest("bob.pay@example.com", "Pass123!"))))
                .andExpect(status().isOk()).andReturn();
        customerToken2 = objectMapper.readTree(lr2.getResponse().getContentAsString()).get("token").asText();

        // Worker
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new RegisterRequest("Charlie Pay", "charlie.pay@example.com", "9221111113", "Pass123!", Role.WORKER))))
                .andExpect(status().isCreated());
        MvcResult lr3 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest("charlie.pay@example.com", "Pass123!"))))
                .andExpect(status().isOk()).andReturn();
        workerToken = objectMapper.readTree(lr3.getResponse().getContentAsString()).get("token").asText();

        mockMvc.perform(post("/api/worker/profile").header("Authorization", "Bearer " + workerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateWorkerProfileRequest("Plumber", 5, new BigDecimal("500.00"), Set.of("Plumbing"), Set.of(ServiceCategory.PLUMBING), Boolean.TRUE, "Indiranagar", 10))))
                .andExpect(status().isCreated());

        // Create request + accept job
        MvcResult rRes = mockMvc.perform(post("/api/customer/requests").header("Authorization", "Bearer " + customerToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateServiceRequestRequest(ServiceCategory.PLUMBING, "Fix pipes", "Indiranagar", new BigDecimal("800.00"), LocalDateTime.now().plusDays(1)))))
                .andExpect(status().isCreated()).andReturn();
        Long requestId = objectMapper.readTree(rRes.getResponse().getContentAsString()).get("id").asLong();

        MvcResult aRes = mockMvc.perform(post("/api/worker/jobs/" + requestId + "/accept").header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isCreated()).andReturn();
        jobId = objectMapper.readTree(aRes.getResponse().getContentAsString()).get("id").asLong();
    }

    // ────────────────────────────────────────────────────────────────────────
    // Test 1: Worker can start an accepted job
    // ────────────────────────────────────────────────────────────────────────
    @Test
    void test01_WorkerCanStartAcceptedJob() throws Exception {
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobStatus").value("IN_PROGRESS"));
    }

    // ────────────────────────────────────────────────────────────────────────
    // Test 2: Worker can move IN_PROGRESS → PAYMENT_REQUIRED
    // ────────────────────────────────────────────────────────────────────────
    @Test
    void test02_WorkerCompleteMovesToPaymentRequired() throws Exception {
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobStatus").value("PAYMENT_REQUIRED"));
    }

    // ────────────────────────────────────────────────────────────────────────
    // Test 3: Worker cannot directly move PAYMENT_REQUIRED → COMPLETED
    // ────────────────────────────────────────────────────────────────────────
    @Test
    void test03_WorkerCannotBypassPaymentByCallingCompleteAgain() throws Exception {
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());
        // Second call → idempotent (returns PAYMENT_REQUIRED, not COMPLETED)
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobStatus").value("PAYMENT_REQUIRED"));
        // Still no earning or payment
        assertEquals(0, earningRepository.count());
    }

    // ────────────────────────────────────────────────────────────────────────
    // Test 4 & 5: Payment is initiated exactly once, starts PENDING
    // ────────────────────────────────────────────────────────────────────────
    @Test
    void test04_05_CustomerInitiatesPaymentForPaymentRequiredJob() throws Exception {
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());

        MvcResult initiateRes = mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate")
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobId").value(jobId))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.amount").value(800.00))
                .andReturn();

        Long firstPaymentId = objectMapper.readTree(initiateRes.getResponse().getContentAsString()).get("id").asLong();
        assertEquals(1, paymentRepository.count(), "Exactly 1 Payment row must exist");

        // Re-initiate → idempotent, same Payment ID
        MvcResult reInitiateRes = mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate")
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn();

        Long secondPaymentId = objectMapper.readTree(reInitiateRes.getResponse().getContentAsString()).get("id").asLong();
        assertEquals(firstPaymentId, secondPaymentId, "Payment ID must be stable on re-initiation");
        assertEquals(1, paymentRepository.count(), "Still exactly 1 Payment row after re-initiation");
    }

    // ────────────────────────────────────────────────────────────────────────
    // Test 7: Simulated failure → FAILED
    // ────────────────────────────────────────────────────────────────────────
    @Test
    void test07_SimulatedFailureSetsFailed() throws Exception {
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());

        SimulatePaymentRequest failReq = new SimulatePaymentRequest(false, "Demo UPI transaction declined");
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(failReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FAILED"))
                .andExpect(jsonPath("$.failureReason").value("Demo UPI transaction declined"));

        assertEquals(1, paymentRepository.count());
        // Job must still be PAYMENT_REQUIRED after failure
        Job job = jobRepository.findById(jobId).orElseThrow();
        assertEquals(JobStatus.PAYMENT_REQUIRED, job.getStatus());
    }

    // ────────────────────────────────────────────────────────────────────────
    // Test 8 & 9: Retry after failure → PENDING, same Payment ID
    // ────────────────────────────────────────────────────────────────────────
    @Test
    void test08_09_RetryAfterFailureReusesSamePaymentId() throws Exception {
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());

        // Initiate → get Payment ID
        MvcResult initRes = mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate")
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk()).andReturn();
        Long originalPaymentId = objectMapper.readTree(initRes.getResponse().getContentAsString()).get("id").asLong();

        // Fail payment
        SimulatePaymentRequest failReq = new SimulatePaymentRequest(false, "Insufficient funds");
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(failReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FAILED"));

        assertEquals(1, paymentRepository.count());

        // Retry via initiate → same Payment ID, status reset to PENDING
        MvcResult retryRes = mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate")
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn();

        JsonNode retryNode = objectMapper.readTree(retryRes.getResponse().getContentAsString());
        Long retriedPaymentId = retryNode.get("id").asLong();
        assertNull(retryNode.get("failureReason").isNull() ? null : retryNode.get("failureReason").asText(null), "failureReason must be cleared on retry");
        assertEquals(originalPaymentId, retriedPaymentId, "Payment ID must be the same after retry (no new row inserted)");
        assertEquals(1, paymentRepository.count(), "Still exactly 1 Payment row after retry");
    }

    // ────────────────────────────────────────────────────────────────────────
    // Test 10 & 11: Simulated success → SUCCESS; job → COMPLETED
    // ────────────────────────────────────────────────────────────────────────
    @Test
    void test10_11_SimulatedSuccessCompletesJob() throws Exception {
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());

        SimulatePaymentRequest successReq = new SimulatePaymentRequest(true);
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(successReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.transactionReference").exists());

        assertEquals(1, paymentRepository.count());
        Job job = jobRepository.findById(jobId).orElseThrow();
        assertEquals(JobStatus.COMPLETED, job.getStatus(), "Job must be COMPLETED after successful payment");
        assertNotNull(job.getCompletedAt(), "completedAt must be set after payment success");
    }

    // ────────────────────────────────────────────────────────────────────────
    // Test 12: Failed payment leaves job PAYMENT_REQUIRED
    // ────────────────────────────────────────────────────────────────────────
    @Test
    void test12_FailedPaymentLeavesJobPaymentRequired() throws Exception {
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());

        SimulatePaymentRequest failReq = new SimulatePaymentRequest(false, "Card declined");
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(failReq)))
                .andExpect(status().isOk()).andReturn();

        Job job = jobRepository.findById(jobId).orElseThrow();
        assertEquals(JobStatus.PAYMENT_REQUIRED, job.getStatus());
    }

    // ────────────────────────────────────────────────────────────────────────
    // Test 13: Pending payment leaves job PAYMENT_REQUIRED
    // ────────────────────────────────────────────────────────────────────────
    @Test
    void test13_PendingPaymentLeavesJobPaymentRequired() throws Exception {
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());

        // Just initiate — leave PENDING without simulating anything
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate")
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));

        Job job = jobRepository.findById(jobId).orElseThrow();
        assertEquals(JobStatus.PAYMENT_REQUIRED, job.getStatus());
    }

    // ────────────────────────────────────────────────────────────────────────
    // Test 15: Unauthorized customer cannot pay
    // ────────────────────────────────────────────────────────────────────────
    @Test
    void test15_UnauthorizedCustomerCannotPay() throws Exception {
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());

        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate")
                        .header("Authorization", "Bearer " + customerToken2))
                .andExpect(status().isForbidden());
    }

    // ────────────────────────────────────────────────────────────────────────
    // Test 14: Worker cannot call complete endpoint on ACCEPTED job to bypass payment
    // ────────────────────────────────────────────────────────────────────────
    @Test
    void test14_WorkerCannotCompleteAcceptedJobWithoutStarting() throws Exception {
        // Job is ACCEPTED — worker should not be able to skip IN_PROGRESS
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isConflict());
    }

    // ────────────────────────────────────────────────────────────────────────
    // Test 18 & 19: Exactly one Earning and one Invoice generated after payment success
    // ────────────────────────────────────────────────────────────────────────
    @Test
    void test18_19_ExactlyOneEarningAndOneInvoiceAfterPaymentSuccess() throws Exception {
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());

        SimulatePaymentRequest successReq = new SimulatePaymentRequest(true);
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(successReq)))
                .andExpect(status().isOk());

        assertEquals(1, earningRepository.count(), "Exactly 1 Earning must be generated");
        assertEquals(1, invoiceRepository.count(), "Exactly 1 Invoice must be generated");

        // Simulate success again (idempotent) — no new earning or invoice
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(successReq)))
                .andExpect(status().isOk());

        assertEquals(1, earningRepository.count(), "Still exactly 1 Earning after repeated simulate success");
        assertEquals(1, invoiceRepository.count(), "Still exactly 1 Invoice after repeated simulate success");
    }

    // ────────────────────────────────────────────────────────────────────────
    // Test 16 & 17: Repeated initiation and retry never create more than 1 Payment row
    // ────────────────────────────────────────────────────────────────────────
    @Test
    void test16_17_RepeatedInitiationAndRetryNeverDuplicatePayment() throws Exception {
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());

        // 3 initiations
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate").header("Authorization", "Bearer " + customerToken1))
                    .andExpect(status().isOk());
        }
        assertEquals(1, paymentRepository.count());

        // Fail, retry, fail, retry — still 1 row
        SimulatePaymentRequest failReq = new SimulatePaymentRequest(false, "Bank error");
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate").header("Authorization", "Bearer " + customerToken1)
                .contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(failReq))).andExpect(status().isOk());
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate").header("Authorization", "Bearer " + customerToken1)).andExpect(status().isOk());
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate").header("Authorization", "Bearer " + customerToken1)
                .contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(failReq))).andExpect(status().isOk());
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate").header("Authorization", "Bearer " + customerToken1)).andExpect(status().isOk());

        assertEquals(1, paymentRepository.count(), "Exactly 1 Payment row at all times");
    }

    // ────────────────────────────────────────────────────────────────────────
    // Test 21: Full end-to-end lifecycle
    // ────────────────────────────────────────────────────────────────────────
    @Test
    void test21_FullE2ELifecycle() throws Exception {
        // 1. Worker starts job
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.jobStatus").value("IN_PROGRESS"));

        // 2. Worker completes work → PAYMENT_REQUIRED
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.jobStatus").value("PAYMENT_REQUIRED"));

        // 3. No earning yet
        assertEquals(0, earningRepository.count());
        assertEquals(0, paymentRepository.count());

        // 4. Customer initiates payment → PENDING
        MvcResult initRes = mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate")
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn();
        Long paymentId = objectMapper.readTree(initRes.getResponse().getContentAsString()).get("id").asLong();
        assertEquals(1, paymentRepository.count());

        // 5. Payment fails
        SimulatePaymentRequest failReq = new SimulatePaymentRequest(false, "Demo UPI declined");
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(failReq)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("FAILED"));

        Job jobAfterFail = jobRepository.findById(jobId).orElseThrow();
        assertEquals(JobStatus.PAYMENT_REQUIRED, jobAfterFail.getStatus(), "Job stays PAYMENT_REQUIRED after failure");
        assertEquals(0, earningRepository.count(), "No earning created after failure");

        // 6. Customer retries → PENDING, same Payment ID
        MvcResult retryRes = mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate")
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PENDING")).andReturn();
        Long retryPaymentId = objectMapper.readTree(retryRes.getResponse().getContentAsString()).get("id").asLong();
        assertEquals(paymentId, retryPaymentId, "Payment ID must be stable across retries");
        assertEquals(1, paymentRepository.count());

        // 7. Customer pays successfully
        SimulatePaymentRequest successReq = new SimulatePaymentRequest(true);
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(successReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.transactionReference").exists());

        // 8. Job is now COMPLETED
        Job completedJob = jobRepository.findById(jobId).orElseThrow();
        assertEquals(JobStatus.COMPLETED, completedJob.getStatus());
        assertNotNull(completedJob.getCompletedAt());

        // 9. Exactly 1 Payment, 1 Earning, 1 Invoice
        assertEquals(1, paymentRepository.count());
        assertEquals(1, earningRepository.count());
        assertEquals(1, invoiceRepository.count());

        // 10. GET payment by job
        mockMvc.perform(get("/api/demo-payments/jobs/" + jobId).header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.id").value(paymentId));
    }

    // ────────────────────────────────────────────────────────────────────────
    // Test 22: Payment Methods & Receipt Verification (Phase 6)
    // ────────────────────────────────────────────────────────────────────────
    @Test
    void test22_PaymentMethodsAndReceiptVerification() throws Exception {
        // Start & complete work
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());

        // Simulate CARD payment success
        SimulatePaymentRequest cardReq = new SimulatePaymentRequest(true, "CARD", null);
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(cardReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.paymentMethod").value("CARD"))
                .andExpect(jsonPath("$.transactionReference").value(org.hamcrest.Matchers.startsWith("DEMO-TXN-")));

        // Verify Job COMPLETED
        Job completedJob = jobRepository.findById(jobId).orElseThrow();
        assertEquals(JobStatus.COMPLETED, completedJob.getStatus());
    }
}
