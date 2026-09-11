package com.sih.cooperative;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.cooperative.dto.*;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class E2EHardeningAcceptanceTest {

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
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private DisputeRepository disputeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String customer1Token;
    private String customer2Token;
    private String worker1Token;
    private String worker2Token;
    private String adminToken;

    private User customer1;
    private User customer2;
    private User worker1;
    private User worker2;
    private User admin;

    @BeforeEach
    void setUp() throws Exception {
        disputeRepository.deleteAll();
        paymentRepository.deleteAll();
        invoiceRepository.deleteAll();
        notificationRepository.deleteAll();
        ratingRepository.deleteAll();
        earningRepository.deleteAll();
        jobRepository.deleteAll();
        serviceRequestRepository.deleteAll();
        workerProfileRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Customer 1
        RegisterRequest c1Req = new RegisterRequest("Alice Customer", "alice.e2e@example.com", "9111111101", "Password123!", Role.CUSTOMER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(c1Req))).andExpect(status().isCreated());
        MvcResult c1Login = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("alice.e2e@example.com", "Password123!")))).andExpect(status().isOk()).andReturn();
        customer1Token = objectMapper.readTree(c1Login.getResponse().getContentAsString()).get("token").asText();
        customer1 = userRepository.findByEmail("alice.e2e@example.com").orElseThrow();

        // 2. Customer 2
        RegisterRequest c2Req = new RegisterRequest("Bob Customer", "bob.e2e@example.com", "9111111102", "Password123!", Role.CUSTOMER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(c2Req))).andExpect(status().isCreated());
        MvcResult c2Login = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("bob.e2e@example.com", "Password123!")))).andExpect(status().isOk()).andReturn();
        customer2Token = objectMapper.readTree(c2Login.getResponse().getContentAsString()).get("token").asText();
        customer2 = userRepository.findByEmail("bob.e2e@example.com").orElseThrow();

        // 3. Worker 1
        RegisterRequest w1Req = new RegisterRequest("Charlie Worker", "charlie.e2e@example.com", "9222222201", "Password123!", Role.WORKER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(w1Req))).andExpect(status().isCreated());
        MvcResult w1Login = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("charlie.e2e@example.com", "Password123!")))).andExpect(status().isOk()).andReturn();
        worker1Token = objectMapper.readTree(w1Login.getResponse().getContentAsString()).get("token").asText();
        worker1 = userRepository.findByEmail("charlie.e2e@example.com").orElseThrow();

        CreateWorkerProfileRequest p1 = new CreateWorkerProfileRequest("Plumber Pro", 5, new BigDecimal("500.00"), Set.of("Pipe Repair"), Set.of(ServiceCategory.PLUMBING), true, "Downtown", 10);
        mockMvc.perform(post("/api/worker/profile").header("Authorization", "Bearer " + worker1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(p1))).andExpect(status().isCreated());

        // 4. Worker 2
        RegisterRequest w2Req = new RegisterRequest("Dave Worker", "dave.e2e@example.com", "9222222202", "Password123!", Role.WORKER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(w2Req))).andExpect(status().isCreated());
        MvcResult w2Login = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("dave.e2e@example.com", "Password123!")))).andExpect(status().isOk()).andReturn();
        worker2Token = objectMapper.readTree(w2Login.getResponse().getContentAsString()).get("token").asText();
        worker2 = userRepository.findByEmail("dave.e2e@example.com").orElseThrow();

        CreateWorkerProfileRequest p2 = new CreateWorkerProfileRequest("Electric Pro", 4, new BigDecimal("600.00"), Set.of("Wiring"), Set.of(ServiceCategory.ELECTRICAL), true, "Downtown", 10);
        mockMvc.perform(post("/api/worker/profile").header("Authorization", "Bearer " + worker2Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(p2))).andExpect(status().isCreated());

        // 5. Admin
        admin = new User("System Admin", "admin.e2e@example.com", "9000000000", passwordEncoder.encode("AdminPass123!"), Role.ADMIN);
        userRepository.save(admin);
        MvcResult adminLogin = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("admin.e2e@example.com", "AdminPass123!")))).andExpect(status().isOk()).andReturn();
        adminToken = objectMapper.readTree(adminLogin.getResponse().getContentAsString()).get("token").asText();
    }

    private Long createAndAcceptJob(String customerToken, String workerToken, BigDecimal budget) throws Exception {
        CreateServiceRequestRequest req = new CreateServiceRequestRequest(ServiceCategory.PLUMBING, "Fix pipe leak", "Downtown", budget, LocalDateTime.now().plusDays(1));
        MvcResult rRes = mockMvc.perform(post("/api/customer/requests").header("Authorization", "Bearer " + customerToken).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated()).andReturn();
        Long requestId = objectMapper.readTree(rRes.getResponse().getContentAsString()).get("id").asLong();

        MvcResult aRes = mockMvc.perform(post("/api/worker/jobs/" + requestId + "/accept").header("Authorization", "Bearer " + workerToken)).andExpect(status().isCreated()).andReturn();
        return objectMapper.readTree(aRes.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    @DisplayName("Scenario 1: Full happy-path lifecycle")
    void testScenario1_FullHappyPathLifecycle() throws Exception {
        Long jobId = createAndAcceptJob(customer1Token, worker1Token, new BigDecimal("1000.00"));

        // Worker starts job
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobStatus").value("IN_PROGRESS"));

        // Worker completes work -> PAYMENT_REQUIRED
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobStatus").value("PAYMENT_REQUIRED"));

        // Customer initiates payment
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate").header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));

        // Customer simulates SUCCESS payment
        SimulatePaymentRequest simReq = new SimulatePaymentRequest(true, "UPI", null);
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate").header("Authorization", "Bearer " + customer1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(simReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.transactionReference").value(org.hamcrest.Matchers.startsWith("DEMO-TXN-")));

        // Job is now COMPLETED
        Job completedJob = jobRepository.findById(jobId).orElseThrow();
        assertEquals(JobStatus.COMPLETED, completedJob.getStatus());

        // Earning exists
        assertTrue(earningRepository.existsByJobId(jobId));
        Earning earning = earningRepository.findByJobId(jobId).orElseThrow();
        assertEquals(new BigDecimal("1000.00"), earning.getGrossAmount());
        assertEquals(new BigDecimal("100.00"), earning.getPlatformFee());
        assertEquals(new BigDecimal("900.00"), earning.getWorkerEarning());

        // Invoice exists
        assertTrue(invoiceRepository.existsByJobId(jobId));
        Invoice invoice = invoiceRepository.findByJobId(jobId).orElseThrow();
        assertEquals(new BigDecimal("1000.00"), invoice.getTotalAmount());
        assertTrue(invoice.getPaymentStatus().equals("SUCCESS") || invoice.getPaymentStatus().equals("COMPLETED"));
    }

    @Test
    @DisplayName("Scenario 2: Payment attempt before PAYMENT_REQUIRED rejected")
    void testScenario2_PaymentBeforePaymentRequiredRejected() throws Exception {
        Long jobId = createAndAcceptJob(customer1Token, worker1Token, new BigDecimal("1000.00"));

        // Status is ACCEPTED -> initiate payment should fail with 400
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate").header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isBadRequest());

        // Worker starts job -> IN_PROGRESS -> initiate payment should still fail with 400
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());

        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate").header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Scenario 3: Worker forbidden from paying")
    void testScenario3_WorkerForbiddenFromPaying() throws Exception {
        Long jobId = createAndAcceptJob(customer1Token, worker1Token, new BigDecimal("1000.00"));
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());

        // Worker attempts to initiate payment -> 403 FORBIDDEN
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate").header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Scenario 4: Wrong customer forbidden from paying another customer's job")
    void testScenario4_WrongCustomerForbiddenFromPaying() throws Exception {
        Long jobId = createAndAcceptJob(customer1Token, worker1Token, new BigDecimal("1000.00"));
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());

        // Customer 2 attempts to pay for Customer 1's job -> 403 FORBIDDEN
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate").header("Authorization", "Bearer " + customer2Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Scenario 5: Failed payment -> retry -> success reusing same Payment record ID")
    void testScenario5_FailedPaymentRetrySuccess() throws Exception {
        Long jobId = createAndAcceptJob(customer1Token, worker1Token, new BigDecimal("1000.00"));
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());

        // Simulate FAILED payment
        SimulatePaymentRequest failReq = new SimulatePaymentRequest(false, "CARD", "Insufficient funds");
        MvcResult failRes = mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate").header("Authorization", "Bearer " + customer1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(failReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FAILED"))
                .andExpect(jsonPath("$.failureReason").value("Insufficient funds"))
                .andReturn();

        Long paymentId = objectMapper.readTree(failRes.getResponse().getContentAsString()).get("id").asLong();

        // Job remains PAYMENT_REQUIRED
        assertEquals(JobStatus.PAYMENT_REQUIRED, jobRepository.findById(jobId).orElseThrow().getStatus());

        // Retry initiation -> status resets to PENDING on SAME payment ID
        MvcResult retryRes = mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate").header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(paymentId))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn();

        // Simulate SUCCESS
        SimulatePaymentRequest successReq = new SimulatePaymentRequest(true, "CARD", null);
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate").header("Authorization", "Bearer " + customer1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(successReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(paymentId))
                .andExpect(jsonPath("$.status").value("SUCCESS"));

        // Job is COMPLETED
        assertEquals(JobStatus.COMPLETED, jobRepository.findById(jobId).orElseThrow().getStatus());
        assertEquals(1, paymentRepository.count());
    }

    @Test
    @DisplayName("Scenario 6: Repeated initiation remains idempotent")
    void testScenario6_RepeatedInitiationIdempotent() throws Exception {
        Long jobId = createAndAcceptJob(customer1Token, worker1Token, new BigDecimal("1000.00"));
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());

        MvcResult r1 = mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate").header("Authorization", "Bearer " + customer1Token)).andExpect(status().isOk()).andReturn();
        Long pid1 = objectMapper.readTree(r1.getResponse().getContentAsString()).get("id").asLong();

        MvcResult r2 = mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate").header("Authorization", "Bearer " + customer1Token)).andExpect(status().isOk()).andReturn();
        Long pid2 = objectMapper.readTree(r2.getResponse().getContentAsString()).get("id").asLong();

        assertEquals(pid1, pid2);
        assertEquals(1, paymentRepository.count());
    }

    @Test
    @DisplayName("Scenario 7: Repeated simulation returns existing SUCCESS Payment without duplicate records")
    void testScenario7_RepeatedSimulationIdempotent() throws Exception {
        Long jobId = createAndAcceptJob(customer1Token, worker1Token, new BigDecimal("1000.00"));
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());

        SimulatePaymentRequest sReq = new SimulatePaymentRequest(true, "UPI", null);
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate").header("Authorization", "Bearer " + customer1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(sReq))).andExpect(status().isOk());

        // Repeated simulation
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate").header("Authorization", "Bearer " + customer1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(sReq))).andExpect(status().isOk());

        assertEquals(1, paymentRepository.count());
        assertEquals(1, earningRepository.count());
        assertEquals(1, invoiceRepository.count());
    }

    @Test
    @DisplayName("Scenario 8: Job cannot transition to COMPLETED before successful payment")
    void testScenario8_JobCannotCompleteBeforePayment() throws Exception {
        Long jobId = createAndAcceptJob(customer1Token, worker1Token, new BigDecimal("1000.00"));
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());

        // Job status is PAYMENT_REQUIRED
        assertEquals(JobStatus.PAYMENT_REQUIRED, jobRepository.findById(jobId).orElseThrow().getStatus());

        // Worker attempting to complete again returns HTTP 200 (idempotent) with jobStatus PAYMENT_REQUIRED (cannot skip payment)
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + worker1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobStatus").value("PAYMENT_REQUIRED"));

        // Job remains PAYMENT_REQUIRED
        assertEquals(JobStatus.PAYMENT_REQUIRED, jobRepository.findById(jobId).orElseThrow().getStatus());
    }

    @Test
    @DisplayName("Scenario 9 & 10: Successful payment generates exactly 1 Earning and 1 Invoice")
    void testScenario9_10_SuccessfulPaymentGeneratesSingleEarningAndInvoice() throws Exception {
        Long jobId = createAndAcceptJob(customer1Token, worker1Token, new BigDecimal("1200.00"));
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());

        SimulatePaymentRequest sReq = new SimulatePaymentRequest(true, "UPI", null);
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate").header("Authorization", "Bearer " + customer1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(sReq))).andExpect(status().isOk());

        assertEquals(1, earningRepository.count());
        assertEquals(1, invoiceRepository.count());
    }

    @Test
    @DisplayName("Scenario 11: Failed/Pending payment generates neither Earning nor Invoice")
    void testScenario11_FailedPendingPaymentGeneratesNeitherEarningNorInvoice() throws Exception {
        Long jobId = createAndAcceptJob(customer1Token, worker1Token, new BigDecimal("1000.00"));
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());

        // Initiate PENDING
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate").header("Authorization", "Bearer " + customer1Token)).andExpect(status().isOk());

        assertEquals(0, earningRepository.count());
        assertEquals(0, invoiceRepository.count());

        // Simulate FAILED
        SimulatePaymentRequest fReq = new SimulatePaymentRequest(false, "UPI", "Declined");
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate").header("Authorization", "Bearer " + customer1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(fReq))).andExpect(status().isOk());

        assertEquals(0, earningRepository.count());
        assertEquals(0, invoiceRepository.count());
    }

    @Test
    @DisplayName("Scenario 12: Admin financial summary accurately aggregates successful payments")
    void testScenario12_AdminFinancialSummaryAccurate() throws Exception {
        Long jobId = createAndAcceptJob(customer1Token, worker1Token, new BigDecimal("1500.00"));
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());

        SimulatePaymentRequest sReq = new SimulatePaymentRequest(true, "UPI", null);
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate").header("Authorization", "Bearer " + customer1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(sReq))).andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/financial/summary").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalGrossVolume").value(1500.00))
                .andExpect(jsonPath("$.totalPlatformFees").value(150.00))
                .andExpect(jsonPath("$.totalWorkerEarnings").value(1350.00))
                .andExpect(jsonPath("$.completedPaymentAmount").value(1500.00))
                .andExpect(jsonPath("$.completedTransactions").value(1));
    }

    @Test
    @DisplayName("Scenario 13: Admin-only endpoint security")
    void testScenario13_AdminOnlyEndpointSecurity() throws Exception {
        mockMvc.perform(get("/api/admin/financial/summary").header("Authorization", "Bearer " + customer1Token)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/financial/summary").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/revenue/summary").header("Authorization", "Bearer " + customer1Token)).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Scenario 14: IDOR protection across invoices and earnings")
    void testScenario14_IDORProtectionAcrossInvoicesAndEarnings() throws Exception {
        Long jobId = createAndAcceptJob(customer1Token, worker1Token, new BigDecimal("1000.00"));
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());
        SimulatePaymentRequest sReq = new SimulatePaymentRequest(true, "UPI", null);
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate").header("Authorization", "Bearer " + customer1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(sReq))).andExpect(status().isOk());

        Long earningId = earningRepository.findByJobId(jobId).orElseThrow().getId();
        Long invoiceId = invoiceRepository.findByJobId(jobId).orElseThrow().getId();

        // Customer 2 forbidden from accessing Worker 1's earning detail
        mockMvc.perform(get("/api/worker/earnings/" + earningId).header("Authorization", "Bearer " + customer2Token)).andExpect(status().isForbidden());

        // Worker 2 forbidden from accessing Customer 1's invoice
        mockMvc.perform(get("/api/invoices/" + invoiceId).header("Authorization", "Bearer " + worker2Token)).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Scenario 15: State persistence across reloads")
    void testScenario15_StatePersistenceAcrossReloads() throws Exception {
        Long jobId = createAndAcceptJob(customer1Token, worker1Token, new BigDecimal("1000.00"));
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());
        SimulatePaymentRequest sReq = new SimulatePaymentRequest(true, "CARD", null);
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate").header("Authorization", "Bearer " + customer1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(sReq))).andExpect(status().isOk());

        // Re-query database to simulate reload
        Job reloadedJob = jobRepository.findById(jobId).orElseThrow();
        assertEquals(JobStatus.COMPLETED, reloadedJob.getStatus());

        Payment reloadedPayment = paymentRepository.findByJobId(jobId).orElseThrow();
        assertEquals(PaymentStatus.SUCCESS, reloadedPayment.getStatus());
        assertEquals("CARD", reloadedPayment.getPaymentMethod());
    }

    @Test
    @DisplayName("Scenario 16: Rating flow usable after payment completion")
    void testScenario16_RatingFlowUsableAfterCompletion() throws Exception {
        Long jobId = createAndAcceptJob(customer1Token, worker1Token, new BigDecimal("1000.00"));
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + worker1Token)).andExpect(status().isOk());
        SimulatePaymentRequest sReq = new SimulatePaymentRequest(true, "UPI", null);
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate").header("Authorization", "Bearer " + customer1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(sReq))).andExpect(status().isOk());

        // Customer submits rating for COMPLETED job
        CreateRatingRequest rReq = new CreateRatingRequest(5, "Outstanding plumbing work!");
        mockMvc.perform(post("/api/customer/ratings/" + jobId).header("Authorization", "Bearer " + customer1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(rReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.score").value(5));
    }

    @Test
    @DisplayName("Scenario 17: Worker verification and governance flows remain unaffected")
    void testScenario17_WorkerVerificationAndGovernanceUnaffected() throws Exception {
        // Admin overview works
        mockMvc.perform(get("/api/admin/overview").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").value(5));
    }
}
