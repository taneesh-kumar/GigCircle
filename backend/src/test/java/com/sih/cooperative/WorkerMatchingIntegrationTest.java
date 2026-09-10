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
import java.util.Map;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class WorkerMatchingIntegrationTest {

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

    private String customerToken;
    private String workerToken1;
    private String workerToken2;

    @BeforeEach
    void setUp() throws Exception {
        notificationRepository.deleteAll();
        ratingRepository.deleteAll();
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

        // Create Profile for Worker 1 (Plumber in Indiranagar, Available)
        CreateWorkerProfileRequest profileReq1 = new CreateWorkerProfileRequest(
                "Expert plumbing technician",
                5,
                new BigDecimal("500.00"),
                Set.of("Pipe Fitting", "Leakage Repair"),
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

        // Create Profile for Worker 2 (Plumber in Indiranagar, Available)
        CreateWorkerProfileRequest profileReq2 = new CreateWorkerProfileRequest(
                "Licensed master plumber",
                8,
                new BigDecimal("600.00"),
                Set.of("Drain Cleaning", "Pipe Fitting"),
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

    private Long createCustomerRequest(String category, String location, String budget) throws Exception {
        CreateServiceRequestRequest req = new CreateServiceRequestRequest(
                ServiceCategory.valueOf(category),
                "Fix leaking bathroom pipe",
                location,
                new BigDecimal(budget),
                LocalDateTime.now().plusDays(1)
        );
        MvcResult res = mockMvc.perform(post("/api/customer/requests")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    void testEligibleWorkerAppearsInJobFeed() throws Exception {
        Long reqId = createCustomerRequest("PLUMBING", "Indiranagar", "700.00");

        mockMvc.perform(get("/api/worker/jobs")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(reqId))
                .andExpect(jsonPath("$[0].category").value("PLUMBING"))
                .andExpect(jsonPath("$[0].location").value("Indiranagar"));
    }

    @Test
    void testWorkerWithWrongCategoryDoesNotReceiveRequest() throws Exception {
        // Create request for ELECTRICAL
        createCustomerRequest("ELECTRICAL", "Indiranagar", "800.00");

        // Worker 1 is PLUMBING only -> empty job feed
        mockMvc.perform(get("/api/worker/jobs")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void testUnavailableWorkerDoesNotReceiveRequest() throws Exception {
        createCustomerRequest("PLUMBING", "Indiranagar", "700.00");

        // Toggle Worker 1 availability to FALSE via JSON body
        mockMvc.perform(patch("/api/worker/profile/availability")
                        .header("Authorization", "Bearer " + workerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("isAvailable", false))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/worker/jobs")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void testWorkerWithLocationMismatchDoesNotReceiveRequest() throws Exception {
        // Create request in Whitefield
        createCustomerRequest("PLUMBING", "Whitefield", "900.00");

        // Worker 1 location is Indiranagar -> mismatch -> empty feed
        mockMvc.perform(get("/api/worker/jobs")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void testWorkerAcceptsEligibleRequest() throws Exception {
        Long reqId = createCustomerRequest("PLUMBING", "Indiranagar", "700.00");

        mockMvc.perform(post("/api/worker/jobs/" + reqId + "/accept")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.serviceRequestId").value(reqId))
                .andExpect(jsonPath("$.jobStatus").value("ACCEPTED"))
                .andExpect(jsonPath("$.workerName").value("Worker Rahul"));

        assertTrue(jobRepository.existsByServiceRequestId(reqId));
    }

    @Test
    void testSecondWorkerAcceptingSameRequestFailsWithConflict() throws Exception {
        Long reqId = createCustomerRequest("PLUMBING", "Indiranagar", "700.00");

        // Worker 1 accepts
        mockMvc.perform(post("/api/worker/jobs/" + reqId + "/accept")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isCreated());

        // Worker 2 attempts same request -> HTTP 409 Conflict
        mockMvc.perform(post("/api/worker/jobs/" + reqId + "/accept")
                        .header("Authorization", "Bearer " + workerToken2))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("already been assigned")));
    }

    @Test
    void testCustomerCannotCallWorkerJobFeed() throws Exception {
        mockMvc.perform(get("/api/worker/jobs")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUnauthenticatedCallToWorkerJobFeed() throws Exception {
        mockMvc.perform(get("/api/worker/jobs"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testCustomerSeesAssignmentInformationAfterWorkerAccepts() throws Exception {
        Long reqId = createCustomerRequest("PLUMBING", "Indiranagar", "700.00");

        // Worker 1 accepts
        mockMvc.perform(post("/api/worker/jobs/" + reqId + "/accept")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isCreated());

        // Customer gets request details
        mockMvc.perform(get("/api/customer/requests/" + reqId)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignmentStatus").value("ASSIGNED"))
                .andExpect(jsonPath("$.workerName").value("Worker Rahul"));
    }

    @Test
    void testCustomerCannotCancelAssignedRequest() throws Exception {
        Long reqId = createCustomerRequest("PLUMBING", "Indiranagar", "700.00");

        // Worker 1 accepts
        mockMvc.perform(post("/api/worker/jobs/" + reqId + "/accept")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isCreated());

        // Customer attempts to cancel assigned request -> HTTP 409 Conflict
        mockMvc.perform(patch("/api/customer/requests/" + reqId + "/cancel")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("Assigned service requests cannot be cancelled")));
    }

    @Test
    void testCustomerCanCancelUnassignedOpenRequest() throws Exception {
        Long reqId = createCustomerRequest("PLUMBING", "Indiranagar", "700.00");

        // Customer cancels unassigned request -> HTTP 200 OK
        mockMvc.perform(patch("/api/customer/requests/" + reqId + "/cancel")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void testWorkerCannotAcceptCancelledRequest() throws Exception {
        Long reqId = createCustomerRequest("PLUMBING", "Indiranagar", "700.00");

        // Customer cancels
        mockMvc.perform(patch("/api/customer/requests/" + reqId + "/cancel")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk());

        // Worker attempts to accept cancelled request -> HTTP 409 Conflict
        mockMvc.perform(post("/api/worker/jobs/" + reqId + "/accept")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isConflict());
    }

    @Test
    void testWorkerCannotAcceptRequestOutsideMatchingCriteria() throws Exception {
        // Create request for CLEANING
        Long reqId = createCustomerRequest("CLEANING", "Indiranagar", "600.00");

        // Worker 1 (PLUMBING only) attempts to accept CLEANING request directly -> HTTP 409 Conflict
        mockMvc.perform(post("/api/worker/jobs/" + reqId + "/accept")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("not eligible")));
    }

    @Test
    void testConcurrentAcceptanceSafety() throws Exception {
        Long reqId = createCustomerRequest("PLUMBING", "Indiranagar", "700.00");

        // First worker succeeds
        mockMvc.perform(post("/api/worker/jobs/" + reqId + "/accept")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isCreated());

        // Concurrent/second attempt fails cleanly with 409
        mockMvc.perform(post("/api/worker/jobs/" + reqId + "/accept")
                        .header("Authorization", "Bearer " + workerToken2))
                .andExpect(status().isConflict());

        // Ensure exactly ONE job exists in repository for reqId
        assertEquals(1, jobRepository.findAll().stream().filter(j -> j.getServiceRequest().getId().equals(reqId)).count());
    }

    @Test
    void testMultiSegmentLocationTokenMatchingAcceptance() throws Exception {
        // Service Request with detailed address containing Vijayawada
        Long reqId = createCustomerRequest("PLUMBING", "APSRTC Enquiry Counter, APSRTC PNBS Bus Station Inner Road, Kaleswara Rao Market, Vijayawada", "800.00");

        // Worker 3 with detailed address also in Vijayawada
        RegisterRequest wrk3Reg = new RegisterRequest("John Worker", "john.worker.test@example.com", "9876543299", "WorkerPass123!", Role.WORKER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrk3Reg)))
                .andExpect(status().isCreated());

        LoginRequest wrk3Login = new LoginRequest("john.worker.test@example.com", "WorkerPass123!");
        MvcResult wrk3LoginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrk3Login)))
                .andExpect(status().isOk())
                .andReturn();
        String wrk3Token = objectMapper.readTree(wrk3LoginRes.getResponse().getContentAsString()).get("token").asText();

        CreateWorkerProfileRequest profileReq3 = new CreateWorkerProfileRequest(
                "Plumber in Vijayawada",
                2,
                new BigDecimal("99.00"),
                Set.of("Plumbing"),
                Set.of(ServiceCategory.PLUMBING),
                Boolean.TRUE,
                "Madhura Nagar, Devi Nagar, Vijayawada, Vijayawada",
                10
        );
        mockMvc.perform(post("/api/worker/profile")
                        .header("Authorization", "Bearer " + wrk3Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileReq3)))
                .andExpect(status().isCreated());

        // Worker 3 accepts job matching location by shared token "Vijayawada"
        mockMvc.perform(post("/api/worker/jobs/" + reqId + "/accept")
                        .header("Authorization", "Bearer " + wrk3Token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.workerName").value("John Worker"));
    }
}
