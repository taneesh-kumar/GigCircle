package com.sih.cooperative;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.cooperative.dto.CreateServiceRequestRequest;
import com.sih.cooperative.dto.RegisterRequest;
import com.sih.cooperative.entity.Role;
import com.sih.cooperative.entity.ServiceCategory;
import com.sih.cooperative.entity.ServiceRequestStatus;
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

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ServiceRequestIntegrationTest {

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

    private String customerAToken;
    private String customerBToken;
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

        // Register Customer A
        RegisterRequest reqA = new RegisterRequest("Customer A", "customerA@test.com", "9000000001", "Password123!", Role.CUSTOMER);
        MvcResult resA = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqA)))
                .andExpect(status().isCreated())
                .andReturn();
        customerAToken = objectMapper.readTree(resA.getResponse().getContentAsString()).get("token").asText();

        // Register Customer B
        RegisterRequest reqB = new RegisterRequest("Customer B", "customerB@test.com", "9000000002", "Password123!", Role.CUSTOMER);
        MvcResult resB = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqB)))
                .andExpect(status().isCreated())
                .andReturn();
        customerBToken = objectMapper.readTree(resB.getResponse().getContentAsString()).get("token").asText();

        // Register Worker
        RegisterRequest reqW = new RegisterRequest("Worker One", "worker@test.com", "9000000003", "Password123!", Role.WORKER);
        MvcResult resW = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqW)))
                .andExpect(status().isCreated())
                .andReturn();
        workerToken = objectMapper.readTree(resW.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    void testCreateValidServiceRequestSuccess() throws Exception {
        LocalDateTime futureTime = LocalDateTime.now().plusDays(2).withNano(0);
        CreateServiceRequestRequest request = new CreateServiceRequestRequest(
                ServiceCategory.PLUMBING,
                "Kitchen sink is leaking and needs repair.",
                "Indiranagar, Bengaluru",
                new BigDecimal("700.00"),
                futureTime
        );

        MvcResult result = mockMvc.perform(post("/api/customer/requests")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.category").value("PLUMBING"))
                .andExpect(jsonPath("$.description").value("Kitchen sink is leaking and needs repair."))
                .andExpect(jsonPath("$.location").value("Indiranagar, Bengaluru"))
                .andExpect(jsonPath("$.budget").value(700.00))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.customerName").value("Customer A"))
                .andReturn();

        Long createdId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
        assertTrue(serviceRequestRepository.findById(createdId).isPresent());
    }

    @Test
    void testCreateServiceRequestValidationErrors() throws Exception {
        LocalDateTime futureTime = LocalDateTime.now().plusDays(2);

        // Missing Category
        CreateServiceRequestRequest noCat = new CreateServiceRequestRequest(null, "Description", "Loc", new BigDecimal("100"), futureTime);
        mockMvc.perform(post("/api/customer/requests")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(noCat)))
                .andExpect(status().isBadRequest());

        // Blank Description
        CreateServiceRequestRequest blankDesc = new CreateServiceRequestRequest(ServiceCategory.ELECTRICAL, "   ", "Loc", new BigDecimal("100"), futureTime);
        mockMvc.perform(post("/api/customer/requests")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blankDesc)))
                .andExpect(status().isBadRequest());

        // Blank Location
        CreateServiceRequestRequest blankLoc = new CreateServiceRequestRequest(ServiceCategory.CLEANING, "Desc", "  ", new BigDecimal("100"), futureTime);
        mockMvc.perform(post("/api/customer/requests")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blankLoc)))
                .andExpect(status().isBadRequest());

        // Zero Budget
        CreateServiceRequestRequest zeroBudget = new CreateServiceRequestRequest(ServiceCategory.CARPENTRY, "Desc", "Loc", BigDecimal.ZERO, futureTime);
        mockMvc.perform(post("/api/customer/requests")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(zeroBudget)))
                .andExpect(status().isBadRequest());

        // Negative Budget
        CreateServiceRequestRequest negBudget = new CreateServiceRequestRequest(ServiceCategory.CARPENTRY, "Desc", "Loc", new BigDecimal("-50.00"), futureTime);
        mockMvc.perform(post("/api/customer/requests")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(negBudget)))
                .andExpect(status().isBadRequest());

        // Past Preferred Time
        CreateServiceRequestRequest pastTime = new CreateServiceRequestRequest(ServiceCategory.PAINTING, "Desc", "Loc", new BigDecimal("500"), LocalDateTime.now().minusDays(1));
        mockMvc.perform(post("/api/customer/requests")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pastTime)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testCustomerListIsolation() throws Exception {
        LocalDateTime futureTime = LocalDateTime.now().plusDays(3);

        // Customer A creates request
        CreateServiceRequestRequest reqA = new CreateServiceRequestRequest(ServiceCategory.PLUMBING, "Sink repair", "Loc A", new BigDecimal("500"), futureTime);
        mockMvc.perform(post("/api/customer/requests")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqA)))
                .andExpect(status().isCreated());

        // Customer B creates request
        CreateServiceRequestRequest reqB = new CreateServiceRequestRequest(ServiceCategory.ELECTRICAL, "Wiring check", "Loc B", new BigDecimal("800"), futureTime);
        mockMvc.perform(post("/api/customer/requests")
                        .header("Authorization", "Bearer " + customerBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqB)))
                .andExpect(status().isCreated());

        // Customer A fetches list -> sees only 1 request (Sink repair)
        mockMvc.perform(get("/api/customer/requests")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].category").value("PLUMBING"))
                .andExpect(jsonPath("$[0].description").value("Sink repair"));

        // Customer B fetches list -> sees only 1 request (Wiring check)
        mockMvc.perform(get("/api/customer/requests")
                        .header("Authorization", "Bearer " + customerBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].category").value("ELECTRICAL"))
                .andExpect(jsonPath("$[0].description").value("Wiring check"));
    }

    @Test
    void testCustomerDetailOwnership() throws Exception {
        LocalDateTime futureTime = LocalDateTime.now().plusDays(2);
        CreateServiceRequestRequest createReq = new CreateServiceRequestRequest(ServiceCategory.CLEANING, "Deep cleaning", "Bengaluru", new BigDecimal("1200"), futureTime);

        MvcResult result = mockMvc.perform(post("/api/customer/requests")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Long reqId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();

        // Customer A fetches own request -> 200 OK
        mockMvc.perform(get("/api/customer/requests/" + reqId)
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(reqId))
                .andExpect(jsonPath("$.description").value("Deep cleaning"));

        // Customer B attempts to access Customer A's request -> 403 Forbidden
        mockMvc.perform(get("/api/customer/requests/" + reqId)
                        .header("Authorization", "Bearer " + customerBToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testCancelServiceRequestWorkflow() throws Exception {
        LocalDateTime futureTime = LocalDateTime.now().plusDays(2);
        CreateServiceRequestRequest createReq = new CreateServiceRequestRequest(ServiceCategory.GARDENING, "Lawn mowing", "Garden City", new BigDecimal("400"), futureTime);

        MvcResult result = mockMvc.perform(post("/api/customer/requests")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Long reqId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();

        // Customer B attempts to cancel Customer A's request -> 403 Forbidden
        mockMvc.perform(patch("/api/customer/requests/" + reqId + "/cancel")
                        .header("Authorization", "Bearer " + customerBToken))
                .andExpect(status().isForbidden());

        // Customer A cancels own request -> 200 OK & status CANCELLED
        mockMvc.perform(patch("/api/customer/requests/" + reqId + "/cancel")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        // Verify status in DB
        assertEquals(ServiceRequestStatus.CANCELLED, serviceRequestRepository.findById(reqId).get().getStatus());

        // Attempting to cancel an already cancelled request -> 400 Bad Request
        mockMvc.perform(patch("/api/customer/requests/" + reqId + "/cancel")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testAuthorizationAndRoleIsolation() throws Exception {
        // Unauthenticated access -> 401 Unauthorized
        mockMvc.perform(get("/api/customer/requests"))
                .andExpect(status().isUnauthorized());

        // Worker accessing Customer API -> 403 Forbidden
        mockMvc.perform(get("/api/customer/requests")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());

        LocalDateTime futureTime = LocalDateTime.now().plusDays(2);
        CreateServiceRequestRequest createReq = new CreateServiceRequestRequest(ServiceCategory.OTHER, "Other task", "Loc", new BigDecimal("100"), futureTime);

        // Worker attempting to create request on customer API -> 403 Forbidden
        mockMvc.perform(post("/api/customer/requests")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isForbidden());
    }
}
