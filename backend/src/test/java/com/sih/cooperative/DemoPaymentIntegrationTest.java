package com.sih.cooperative;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.cooperative.dto.CreateServiceRequestRequest;
import com.sih.cooperative.dto.CreateWorkerProfileRequest;
import com.sih.cooperative.dto.LoginRequest;
import com.sih.cooperative.dto.RegisterRequest;
import com.sih.cooperative.dto.CompletePaymentRequest;
import com.sih.cooperative.dto.PaymentRequest;
import com.sih.cooperative.entity.*;
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
    private RatingRepository ratingRepository;

    @Autowired
    private EarningRepository earningRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    private String customerToken;
    private String customerToken2;
    private String workerToken;

    @BeforeEach
    void setUp() throws Exception {
        notificationRepository.deleteAll();
        ratingRepository.deleteAll();
        paymentRepository.deleteAll();
        earningRepository.deleteAll();
        jobRepository.deleteAll();
        serviceRequestRepository.deleteAll();
        workerProfileRepository.deleteAll();
        userRepository.deleteAll();

        // Customer 1
        RegisterRequest c1 = new RegisterRequest("Demo Customer", "demo.customer@example.com", "9876543210", "CustomerPass123!", Role.CUSTOMER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(c1)));
        MvcResult lr1 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("demo.customer@example.com", "CustomerPass123!")))).andExpect(status().isOk()).andReturn();
        customerToken = objectMapper.readTree(lr1.getResponse().getContentAsString()).get("token").asText();

        // Customer 2
        RegisterRequest c2 = new RegisterRequest("Other Customer", "other.customer@example.com", "9876543211", "CustomerPass123!", Role.CUSTOMER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(c2)));
        MvcResult lr2 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("other.customer@example.com", "CustomerPass123!")))).andExpect(status().isOk()).andReturn();
        customerToken2 = objectMapper.readTree(lr2.getResponse().getContentAsString()).get("token").asText();

        // Worker
        RegisterRequest w1 = new RegisterRequest("Demo Worker", "demo.worker@example.com", "9876543212", "WorkerPass123!", Role.WORKER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(w1)));
        MvcResult lr3 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("demo.worker@example.com", "WorkerPass123!")))).andExpect(status().isOk()).andReturn();
        workerToken = objectMapper.readTree(lr3.getResponse().getContentAsString()).get("token").asText();

        CreateWorkerProfileRequest p1 = new CreateWorkerProfileRequest(
                "Demo Plumbing Expert", 5, new BigDecimal("500.00"),
                Set.of("Pipe Fitting"), Set.of(ServiceCategory.PLUMBING),
                Boolean.TRUE, "Indiranagar", 10
        );
        mockMvc.perform(post("/api/worker/profile").header("Authorization", "Bearer " + workerToken).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(p1)));
    }

    private Long createCompletedJob(String customerToken, String workerToken, BigDecimal budget) throws Exception {
        CreateServiceRequestRequest req = new CreateServiceRequestRequest(
                ServiceCategory.PLUMBING,
                "Demo payment test job",
                "Indiranagar",
                budget,
                LocalDateTime.now().plusDays(1)
        );
        MvcResult rRes = mockMvc.perform(post("/api/customer/requests")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))

                .andReturn();
        Long requestId = objectMapper.readTree(rRes.getResponse().getContentAsString()).get("id").asLong();

        MvcResult aRes = mockMvc.perform(post("/api/worker/jobs/" + requestId + "/accept")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON))

                .andReturn();
        Long jobId = objectMapper.readTree(aRes.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        return jobId;
    }

    private MvcResult initiatePayment(String token, Long jobId) throws Exception {
        PaymentRequest request = new PaymentRequest(jobId);
        return mockMvc.perform(post("/api/payments/initiate")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))

                .andReturn();
    }

    private MvcResult completePayment(String token, Long paymentId, String method, String upiId) throws Exception {
        CompletePaymentRequest request = upiId != null
                ? new CompletePaymentRequest(method, upiId)
                : new CompletePaymentRequest(method);
        return mockMvc.perform(post("/api/payments/" + paymentId + "/complete")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn();
    }

    @Test
    void test1_initiatePaymentCreatesPendingPayment() throws Exception {
        Long jobId = createCompletedJob(customerToken, workerToken, new BigDecimal("1000.00"));

        MvcResult result = initiatePayment(customerToken, jobId);

        String response = result.getResponse().getContentAsString();
        assertEquals(201, result.getResponse().getStatus());
        assertEquals("PENDING", objectMapper.readTree(response).get("paymentStatus").asText());
        assertEquals(jobId, objectMapper.readTree(response).get("jobId").asLong());
        assertEquals(1000.00, objectMapper.readTree(response).get("amount").asDouble());
        assertEquals(100.00, objectMapper.readTree(response).get("platformFee").asDouble());
        assertEquals(1100.00, objectMapper.readTree(response).get("totalAmount").asDouble());
        assertTrue(objectMapper.readTree(response).get("transactionId").asText().startsWith("SIM-TXN-"));
    }

    @Test
    void test2_successfulUpiPayment() throws Exception {
        Long jobId = createCompletedJob(customerToken, workerToken, new BigDecimal("1000.00"));
        MvcResult init = initiatePayment(customerToken, jobId);
        Long paymentId = objectMapper.readTree(init.getResponse().getContentAsString()).get("id").asLong();

        MvcResult result = completePayment(customerToken, paymentId, "UPI", "test-success@upi");

        String response = result.getResponse().getContentAsString();
        assertEquals(200, result.getResponse().getStatus());
        assertEquals("PAID", objectMapper.readTree(response).get("paymentStatus").asText());
        assertEquals("UPI", objectMapper.readTree(response).get("paymentMethod").asText());
        assertEquals("test-success@upi", objectMapper.readTree(response).get("paymentInstrument").asText());
        assertTrue(objectMapper.readTree(response).get("transactionId").asText().startsWith("SIM-TXN-"));
        assertNotNull(objectMapper.readTree(response).get("paidAt").asText());

        Job job = jobRepository.findById(jobId).orElseThrow();
        assertEquals(PaymentStatus.PAID, job.getPaymentStatus());
    }

    @Test
    void test3_successfulCardPayment() throws Exception {
        Long jobId = createCompletedJob(customerToken, workerToken, new BigDecimal("1500.00"));
        MvcResult init = initiatePayment(customerToken, jobId);
        Long paymentId = objectMapper.readTree(init.getResponse().getContentAsString()).get("id").asLong();

        MvcResult result = completePayment(customerToken, paymentId, "CARD", null);

        String response = result.getResponse().getContentAsString();
        assertEquals(200, result.getResponse().getStatus());
        assertEquals("PAID", objectMapper.readTree(response).get("paymentStatus").asText());
        assertEquals("CARD", objectMapper.readTree(response).get("paymentMethod").asText());
        assertEquals(150.00, objectMapper.readTree(response).get("platformFee").asDouble());
        assertEquals(1650.00, objectMapper.readTree(response).get("totalAmount").asDouble());
    }

    @Test
    void test4_successfulCashPayment() throws Exception {
        Long jobId = createCompletedJob(customerToken, workerToken, new BigDecimal("2000.00"));
        MvcResult init = initiatePayment(customerToken, jobId);
        Long paymentId = objectMapper.readTree(init.getResponse().getContentAsString()).get("id").asLong();

        MvcResult result = completePayment(customerToken, paymentId, "CASH", null);

        String response = result.getResponse().getContentAsString();
        assertEquals(200, result.getResponse().getStatus());
        assertEquals("PAID", objectMapper.readTree(response).get("paymentStatus").asText());
        assertEquals("CASH", objectMapper.readTree(response).get("paymentMethod").asText());
        assertEquals(200.00, objectMapper.readTree(response).get("platformFee").asDouble());
        assertEquals(2200.00, objectMapper.readTree(response).get("totalAmount").asDouble());
    }

    @Test
    void test5_alreadyPaidJobCannotInitiateAnotherPayment() throws Exception {
        Long jobId = createCompletedJob(customerToken, workerToken, new BigDecimal("1000.00"));
        MvcResult init = initiatePayment(customerToken, jobId);
        Long paymentId = objectMapper.readTree(init.getResponse().getContentAsString()).get("id").asLong();
        completePayment(customerToken, paymentId, "UPI", "test-success@upi");

        MvcResult result = initiatePayment(customerToken, jobId);

        String response = result.getResponse().getContentAsString();
        assertEquals(201, result.getResponse().getStatus());
        assertEquals("PAID", objectMapper.readTree(response).get("paymentStatus").asText());
        assertEquals(paymentId, objectMapper.readTree(response).get("id").asLong());
        assertEquals(1, paymentRepository.countByJobId(jobId));
    }

    @Test
    void test6_invalidJobStatusCannotInitiatePayment() throws Exception {
        Long jobId = createCompletedJob(customerToken, workerToken, new BigDecimal("1000.00"));
        Job job = jobRepository.findById(jobId).orElseThrow();
        job.setStatus(JobStatus.IN_PROGRESS);
        jobRepository.save(job);

        MvcResult result = initiatePayment(customerToken, jobId);

        assertEquals(409, result.getResponse().getStatus());
        assertTrue(result.getResponse().getContentAsString().contains("COMPLETED"));
    }

    @Test
    void test7_wrongCustomerCannotInitiatePayment() throws Exception {
        Long jobId = createCompletedJob(customerToken, workerToken, new BigDecimal("1000.00"));

        MvcResult result = initiatePayment(customerToken2, jobId);

        assertEquals(403, result.getResponse().getStatus());
        assertTrue(result.getResponse().getContentAsString().contains("Access denied"));
    }

    @Test
    void test8_paymentHistory() throws Exception {
        Long jobId = createCompletedJob(customerToken, workerToken, new BigDecimal("1000.00"));
        MvcResult init = initiatePayment(customerToken, jobId);
        Long paymentId = objectMapper.readTree(init.getResponse().getContentAsString()).get("id").asLong();
        completePayment(customerToken, paymentId, "UPI", "test-success@upi");

        MvcResult result = mockMvc.perform(get("/api/payments/customer")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].paymentStatus").value("PAID"))
                .andExpect(jsonPath("$[0].transactionId").exists())
                .andExpect(jsonPath("$[0].workerName").value("Demo Worker"))
                .andExpect(jsonPath("$[0].totalAmount").value(1100.00))
                .andReturn();

        String response = result.getResponse().getContentAsString();
        assertTrue(response.contains("SIM-TXN-"));
    }

    @Test
    void test9_paymentPersistenceAfterRefresh() throws Exception {
        Long jobId = createCompletedJob(customerToken, workerToken, new BigDecimal("1000.00"));
        MvcResult init = initiatePayment(customerToken, jobId);
        Long paymentId = objectMapper.readTree(init.getResponse().getContentAsString()).get("id").asLong();
        completePayment(customerToken, paymentId, "UPI", "test-success@upi");

        MvcResult result = mockMvc.perform(get("/api/payments/job/" + jobId)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.id").value(paymentId))
                .andExpect(jsonPath("$.transactionId").exists())
                .andReturn();

        String response = result.getResponse().getContentAsString();
        assertTrue(response.contains("SIM-TXN-"));
    }

    @Test
    void test10_platformFeeIsTenPercent() throws Exception {
        Long jobId = createCompletedJob(customerToken, workerToken, new BigDecimal("777.77"));
        MvcResult init = initiatePayment(customerToken, jobId);
        Long paymentId = objectMapper.readTree(init.getResponse().getContentAsString()).get("id").asLong();

        MvcResult result = completePayment(customerToken, paymentId, "CARD", null);

        String response = result.getResponse().getContentAsString();
        assertEquals(77.78, objectMapper.readTree(response).get("platformFee").asDouble());
        assertEquals(855.55, objectMapper.readTree(response).get("totalAmount").asDouble());
    }

    @Test
    void test11_workerEarningIsNinetyPercent() throws Exception {
        Long jobId = createCompletedJob(customerToken, workerToken, new BigDecimal("1000.00"));
        MvcResult init = initiatePayment(customerToken, jobId);
        Long paymentId = objectMapper.readTree(init.getResponse().getContentAsString()).get("id").asLong();

        MvcResult result = completePayment(customerToken, paymentId, "CASH", null);

        String response = result.getResponse().getContentAsString();
        assertEquals(900.00, objectMapper.readTree(response).get("workerEarning").asDouble());
        assertEquals(100.00, objectMapper.readTree(response).get("platformFee").asDouble());
        assertEquals(1000.00, objectMapper.readTree(response).get("amount").asDouble());
    }

    @Test
    void test12_duplicateCompletionAttemptIsRejected() throws Exception {
        Long jobId = createCompletedJob(customerToken, workerToken, new BigDecimal("1000.00"));
        MvcResult init = initiatePayment(customerToken, jobId);
        Long paymentId = objectMapper.readTree(init.getResponse().getContentAsString()).get("id").asLong();
        completePayment(customerToken, paymentId, "UPI", "test-success@upi");

        MvcResult result = completePayment(customerToken, paymentId, "CARD", null);

        assertEquals(409, result.getResponse().getStatus());
        assertTrue(result.getResponse().getContentAsString().contains("already completed"));
    }

    @Test
    void test13_invalidPaymentMethodIsRejected() throws Exception {
        Long jobId = createCompletedJob(customerToken, workerToken, new BigDecimal("1000.00"));
        MvcResult init = initiatePayment(customerToken, jobId);
        Long paymentId = objectMapper.readTree(init.getResponse().getContentAsString()).get("id").asLong();

        MvcResult result = completePayment(customerToken, paymentId, "INVALID_METHOD", null);

        assertEquals(400, result.getResponse().getStatus());
        assertTrue(result.getResponse().getContentAsString().contains("Invalid payment method"));
    }

    @Test
    void test14_wrongCustomerCannotCompletePayment() throws Exception {
        Long jobId = createCompletedJob(customerToken, workerToken, new BigDecimal("1000.00"));
        MvcResult init = initiatePayment(customerToken, jobId);
        Long paymentId = objectMapper.readTree(init.getResponse().getContentAsString()).get("id").asLong();

        MvcResult result = completePayment(customerToken2, paymentId, "UPI", "test-success@upi");

        assertEquals(403, result.getResponse().getStatus());
        assertTrue(result.getResponse().getContentAsString().contains("Access denied"));
    }

    @Test
    void test15_paymentPersistsWithSameTransactionId() throws Exception {
        Long jobId = createCompletedJob(customerToken, workerToken, new BigDecimal("1000.00"));
        MvcResult init = initiatePayment(customerToken, jobId);
        Long paymentId = objectMapper.readTree(init.getResponse().getContentAsString()).get("id").asLong();
        String transactionId = objectMapper.readTree(init.getResponse().getContentAsString()).get("transactionId").asText();
        completePayment(customerToken, paymentId, "UPI", "test-success@upi");

        MvcResult result = mockMvc.perform(get("/api/payments/" + paymentId)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.transactionId").value(transactionId))
                .andReturn();

        String response = result.getResponse().getContentAsString();
        assertTrue(response.contains("SIM-TXN-"));
    }
}
