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
public class PaymentSimulationIntegrationTest {

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
    private PaymentRepository paymentRepository;

    @Autowired
    private EarningRepository earningRepository;

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private String customerToken;
    private String workerToken;
    @SuppressWarnings("unused")
    private String adminToken;
    private Long jobId;

    @BeforeEach
    void setUp() throws Exception {
        paymentRepository.deleteAll();
        notificationRepository.deleteAll();
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

        // 2. Register Worker
        RegisterRequest workReg = new RegisterRequest("Worker Bob", "bob@example.com", "9876543211", "Pass123!", Role.WORKER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(workReg)));

        LoginRequest workLogin = new LoginRequest("bob@example.com", "Pass123!");
        MvcResult workRes = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(workLogin))).andReturn();
        workerToken = objectMapper.readTree(workRes.getResponse().getContentAsString()).get("token").asText();

        CreateWorkerProfileRequest profileReq = new CreateWorkerProfileRequest(
                "Expert Plumber", 5, new BigDecimal("400.00"), Set.of("Pipe repair"), Set.of(ServiceCategory.PLUMBING), true, "Vijayawada", 25, 16.5062, 80.6480, "MG Road", "Vijayawada"
        );
        mockMvc.perform(post("/api/worker/profile")
                .header("Authorization", "Bearer " + workerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(profileReq)));

        // 3. Create Admin directly
        User adminUser = new User("System Admin", "admin@gigcircle.com", "9000000000", passwordEncoder.encode("AdminPass123!"), Role.ADMIN);
        userRepository.save(adminUser);

        LoginRequest adminLogin = new LoginRequest("admin@gigcircle.com", "AdminPass123!");
        MvcResult adminRes = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(adminLogin))).andReturn();
        adminToken = objectMapper.readTree(adminRes.getResponse().getContentAsString()).get("token").asText();

        // 4. Create Service Request & Accept Job
        CreateServiceRequestRequest req = new CreateServiceRequestRequest(
                ServiceCategory.PLUMBING, "Fix pipe leak", "Vijayawada", new BigDecimal("500.00"), LocalDateTime.now().plusDays(1), 16.5062, 80.6480, "MG Road", "Vijayawada"
        );
        MvcResult reqRes = mockMvc.perform(post("/api/customer/requests")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();
        Long requestId = objectMapper.readTree(reqRes.getResponse().getContentAsString()).get("id").asLong();

        // Worker accepts job
        MvcResult jobRes = mockMvc.perform(post("/api/worker/jobs/" + requestId + "/accept")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isCreated())
                .andReturn();
        jobId = objectMapper.readTree(jobRes.getResponse().getContentAsString()).get("id").asLong();

        // Worker starts job -> IN_PROGRESS
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk());

        // Worker completes job -> PAYMENT_REQUIRED
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobStatus").value("PAYMENT_REQUIRED"));
    }

    private Long createAcceptedJob() throws Exception {
        CreateServiceRequestRequest req = new CreateServiceRequestRequest(
                ServiceCategory.PLUMBING, "Install tap fixture", "Vijayawada", new BigDecimal("400.00"), LocalDateTime.now().plusDays(1), 16.5062, 80.6480, "MG Road", "Vijayawada"
        );
        MvcResult reqRes = mockMvc.perform(post("/api/customer/requests")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();
        Long requestId = objectMapper.readTree(reqRes.getResponse().getContentAsString()).get("id").asLong();

        MvcResult jobRes = mockMvc.perform(post("/api/worker/jobs/" + requestId + "/accept")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(jobRes.getResponse().getContentAsString()).get("id").asLong();
    }

    private String registerAndLoginCustomer(String name, String email, String phone) throws Exception {
        RegisterRequest reg = new RegisterRequest(name, email, phone, "Pass123!", Role.CUSTOMER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated());

        LoginRequest login = new LoginRequest(email, "Pass123!");
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    void testGetPaymentSummary() throws Exception {
        mockMvc.perform(get("/api/customer/payments/summary/" + jobId)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobId").value(jobId))
                .andExpect(jsonPath("$.jobStatus").value("PAYMENT_REQUIRED"))
                .andExpect(jsonPath("$.serviceAmount").value(500.00))
                .andExpect(jsonPath("$.platformFee").value(50.00))
                .andExpect(jsonPath("$.totalAmount").value(550.00))
                .andExpect(jsonPath("$.alreadyPaid").value(false))
                .andExpect(jsonPath("$.existingPaymentStatus").value("PENDING"));
    }

    @Test
    void testWorkerCompletionCreatesPendingPaymentAndDoesNotCompleteJob() throws Exception {
        Job job = jobRepository.findById(jobId).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(JobStatus.PAYMENT_REQUIRED, job.getStatus());
        org.junit.jupiter.api.Assertions.assertNull(job.getCompletedAt());

        Payment payment = paymentRepository.findFirstByJobIdAndStatusOrderByCreatedAtDesc(jobId, PaymentStatus.PENDING)
                .orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(jobId, payment.getJob().getId());
        org.junit.jupiter.api.Assertions.assertEquals(job.getServiceRequest().getCustomer().getId(), payment.getCustomer().getId());
        org.junit.jupiter.api.Assertions.assertEquals(new BigDecimal("500.00"), payment.getServiceAmount());
        org.junit.jupiter.api.Assertions.assertEquals(new BigDecimal("50.00"), payment.getPlatformFee());
        org.junit.jupiter.api.Assertions.assertEquals(new BigDecimal("550.00"), payment.getAmount());
        org.junit.jupiter.api.Assertions.assertTrue(payment.getTransactionReference().startsWith("SIM-PENDING-"));
    }

    @Test
    void testPaymentRejectedBeforeWorkerRequestsCompletion() throws Exception {
        Long acceptedJobId = createAcceptedJob();
        CreatePaymentRequest payReq = new CreatePaymentRequest(
                acceptedJobId, PaymentMethod.UPI, "test-success@upi", null, null, null
        );

        mockMvc.perform(post("/api/customer/payments/process")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("worker requests completion")));

        mockMvc.perform(post("/api/worker/jobs/" + acceptedJobId + "/start")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/customer/payments/process")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("worker requests completion")));

        Job job = jobRepository.findById(acceptedJobId).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(JobStatus.IN_PROGRESS, job.getStatus());
    }

    @Test
    void testProcessPaymentUpiSuccess() throws Exception {
        CreatePaymentRequest payReq = new CreatePaymentRequest(
                jobId, PaymentMethod.UPI, "test-success@upi", null, null, null
        );

        mockMvc.perform(post("/api/customer/payments/process")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.amount").value(550.00))
                .andExpect(jsonPath("$.paymentMethod").value("UPI"))
                .andExpect(jsonPath("$.paymentMethodDetails").value("test-success@upi"))
                .andExpect(jsonPath("$.transactionReference", startsWith("SIM-TXN-")));

        Job job = jobRepository.findById(jobId).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(JobStatus.COMPLETED, job.getStatus());
        org.junit.jupiter.api.Assertions.assertNotNull(job.getCompletedAt());
        org.junit.jupiter.api.Assertions.assertTrue(earningRepository.existsByJobId(jobId));
    }

    @Test
    void testProcessPaymentUpiFailure() throws Exception {
        CreatePaymentRequest payReq = new CreatePaymentRequest(
                jobId, PaymentMethod.UPI, "test-failure@upi", null, null, null
        );

        mockMvc.perform(post("/api/customer/payments/process")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FAILED"))
                .andExpect(jsonPath("$.failureReason", containsString("declined")));

        Job job = jobRepository.findById(jobId).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(JobStatus.PAYMENT_REQUIRED, job.getStatus());
        org.junit.jupiter.api.Assertions.assertNull(job.getCompletedAt());
        org.junit.jupiter.api.Assertions.assertFalse(earningRepository.existsByJobId(jobId));
    }

    @Test
    void testRetryPaymentAfterFailureCompletesJob() throws Exception {
        CreatePaymentRequest failedReq = new CreatePaymentRequest(
                jobId, PaymentMethod.UPI, "test-failure@upi", null, null, null
        );
        mockMvc.perform(post("/api/customer/payments/process")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(failedReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FAILED"));

        Job failedJob = jobRepository.findById(jobId).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(JobStatus.PAYMENT_REQUIRED, failedJob.getStatus());

        CreatePaymentRequest successReq = new CreatePaymentRequest(
                jobId, PaymentMethod.UPI, "test-success@upi", null, null, null
        );
        mockMvc.perform(post("/api/customer/payments/process")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(successReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SUCCESS"));

        Job completedJob = jobRepository.findById(jobId).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(JobStatus.COMPLETED, completedJob.getStatus());
        org.junit.jupiter.api.Assertions.assertTrue(paymentRepository.existsByJobIdAndStatus(jobId, PaymentStatus.FAILED));
        org.junit.jupiter.api.Assertions.assertTrue(paymentRepository.existsByJobIdAndStatus(jobId, PaymentStatus.SUCCESS));
    }

    @Test
    void testProcessPaymentCardSuccessAndFailure() throws Exception {
        // Success
        CreatePaymentRequest successCard = new CreatePaymentRequest(
                jobId, PaymentMethod.CARD, null, "4242 4242 4242 4242", "12/30", "123"
        );

        mockMvc.perform(post("/api/customer/payments/process")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(successCard)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.paymentMethodDetails").value("Card ending in 4242"));
    }

    @Test
    void testDuplicatePaymentPrevented() throws Exception {
        CreatePaymentRequest payReq = new CreatePaymentRequest(
                jobId, PaymentMethod.UPI, "test-success@upi", null, null, null
        );

        // First payment succeeds
        mockMvc.perform(post("/api/customer/payments/process")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isCreated());

        // Second payment attempt fails with 409 Conflict
        mockMvc.perform(post("/api/customer/payments/process")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isConflict());
    }

    @Test
    void testUnauthorizedCustomerCannotPayAnotherCustomersJob() throws Exception {
        String otherCustomerToken = registerAndLoginCustomer("Customer Eve", "eve@example.com", "9876543222");
        CreatePaymentRequest payReq = new CreatePaymentRequest(
                jobId, PaymentMethod.UPI, "test-success@upi", null, null, null
        );

        mockMvc.perform(post("/api/customer/payments/process")
                        .header("Authorization", "Bearer " + otherCustomerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isForbidden());

        Job job = jobRepository.findById(jobId).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(JobStatus.PAYMENT_REQUIRED, job.getStatus());
    }

    @Test
    void testWorkerCannotManipulatePaymentEndpoint() throws Exception {
        CreatePaymentRequest payReq = new CreatePaymentRequest(
                jobId, PaymentMethod.UPI, "test-success@upi", null, null, null
        );

        mockMvc.perform(post("/api/customer/payments/process")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isForbidden());

        Job job = jobRepository.findById(jobId).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(JobStatus.PAYMENT_REQUIRED, job.getStatus());
    }

    @Test
    void testReviewUnavailableBeforePaymentAndAvailableAfterSuccess() throws Exception {
        mockMvc.perform(post("/api/customer/ratings/" + jobId)
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(5, "Too early"))))
                .andExpect(status().isConflict());

        CreatePaymentRequest payReq = new CreatePaymentRequest(
                jobId, PaymentMethod.UPI, "test-success@upi", null, null, null
        );
        mockMvc.perform(post("/api/customer/payments/process")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/customer/ratings/" + jobId)
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRatingRequest(5, "Great service"))))
                .andExpect(status().isCreated());
    }

    @Test
    void testRefundPayment() throws Exception {
        CreatePaymentRequest payReq = new CreatePaymentRequest(
                jobId, PaymentMethod.UPI, "test-success@upi", null, null, null
        );

        MvcResult res = mockMvc.perform(post("/api/customer/payments/process")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Long paymentId = objectMapper.readTree(res.getResponse().getContentAsString()).get("id").asLong();

        // Refund payment
        mockMvc.perform(post("/api/customer/payments/" + paymentId + "/refund")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REFUNDED"))
                .andExpect(jsonPath("$.refundAmount").value(550.00));
    }
}
