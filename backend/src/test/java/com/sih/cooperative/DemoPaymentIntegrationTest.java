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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class DemoPaymentIntegrationTest {

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
    private PaymentRepository paymentRepository;

    @Autowired
    private EarningRepository earningRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

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

        // 1. Register Customer 1
        RegisterRequest c1 = new RegisterRequest("Alice Demo", "alice.demo@example.com", "9111111111", "Pass123!", Role.CUSTOMER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(c1))).andExpect(status().isCreated());
        MvcResult lr1 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("alice.demo@example.com", "Pass123!")))).andExpect(status().isOk()).andReturn();
        customerToken1 = objectMapper.readTree(lr1.getResponse().getContentAsString()).get("token").asText();

        // 2. Register Customer 2
        RegisterRequest c2 = new RegisterRequest("Bob Demo", "bob.demo@example.com", "9111111112", "Pass123!", Role.CUSTOMER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(c2))).andExpect(status().isCreated());
        MvcResult lr2 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("bob.demo@example.com", "Pass123!")))).andExpect(status().isOk()).andReturn();
        customerToken2 = objectMapper.readTree(lr2.getResponse().getContentAsString()).get("token").asText();

        // 3. Register Worker
        RegisterRequest w1 = new RegisterRequest("Charlie Worker", "charlie.demo@example.com", "9111111113", "Pass123!", Role.WORKER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(w1))).andExpect(status().isCreated());
        MvcResult lr3 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("charlie.demo@example.com", "Pass123!")))).andExpect(status().isOk()).andReturn();
        workerToken = objectMapper.readTree(lr3.getResponse().getContentAsString()).get("token").asText();

        CreateWorkerProfileRequest profile = new CreateWorkerProfileRequest("Plumbing Specialist", 5, new BigDecimal("500.00"), Set.of("Plumbing"), Set.of(ServiceCategory.PLUMBING), Boolean.TRUE, "Indiranagar", 10);
        mockMvc.perform(post("/api/worker/profile").header("Authorization", "Bearer " + workerToken).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(profile))).andExpect(status().isCreated());

        // 4. Create Service Request & Accept Job
        CreateServiceRequestRequest req = new CreateServiceRequestRequest(ServiceCategory.PLUMBING, "Fix pipe leak", "Indiranagar", new BigDecimal("750.00"), LocalDateTime.now().plusDays(1));
        MvcResult rRes = mockMvc.perform(post("/api/customer/requests").header("Authorization", "Bearer " + customerToken1).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated()).andReturn();
        Long requestId = objectMapper.readTree(rRes.getResponse().getContentAsString()).get("id").asLong();

        MvcResult aRes = mockMvc.perform(post("/api/worker/jobs/" + requestId + "/accept").header("Authorization", "Bearer " + workerToken)).andExpect(status().isCreated()).andReturn();
        jobId = objectMapper.readTree(aRes.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    void testCannotInitiatePaymentOnUncompletedJob() throws Exception {
        // Job is ASSIGNED, not COMPLETED
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate")
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testCompleteJobAndInitiatePaymentLifecycle() throws Exception {
        // 1. Complete job
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());

        // 2. Initiate payment
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate")
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobId").value(jobId))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.amount").value(750.00));

        assertEquals(1, paymentRepository.count());

        // 3. Initiate payment again -> Idempotent, returns existing payment record
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate")
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));

        assertEquals(1, paymentRepository.count());

        // 4. Simulate payment failure
        SimulatePaymentRequest failReq = new SimulatePaymentRequest(false, "Insufficient balance");
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(failReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FAILED"))
                .andExpect(jsonPath("$.failureReason").value("Insufficient balance"));

        assertEquals(1, paymentRepository.count());

        // 5. Initiate payment after failure -> resets status to PENDING in-place
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate")
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.failureReason").doesNotExist());

        assertEquals(1, paymentRepository.count());

        // 6. Simulate payment success
        SimulatePaymentRequest passReq = new SimulatePaymentRequest(true);
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/simulate")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(passReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.transactionReference").exists());

        assertEquals(1, paymentRepository.count());

        // 7. Get payment for job
        mockMvc.perform(get("/api/demo-payments/jobs/" + jobId)
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"));
    }

    @Test
    void testCustomerOwnershipSecurity() throws Exception {
        // Complete job
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken)).andExpect(status().isOk());

        // Customer 2 attempts to initiate payment for Customer 1's job -> 403 Forbidden
        mockMvc.perform(post("/api/demo-payments/jobs/" + jobId + "/initiate")
                        .header("Authorization", "Bearer " + customerToken2))
                .andExpect(status().isForbidden());
    }
}
