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
import java.util.List;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class NotificationIntegrationTest {

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
    private PasswordEncoder passwordEncoder;

    private String customerToken1;
    private String customerToken2;
    private String workerToken1;
    private String workerToken2;
    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        notificationRepository.deleteAll();
        ratingRepository.deleteAll();
        earningRepository.deleteAll();
        jobRepository.deleteAll();
        serviceRequestRepository.deleteAll();
        workerProfileRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Customer 1
        RegisterRequest c1 = new RegisterRequest("Alice Customer", "alice.noti@example.com", "9666543210", "Pass123!", Role.CUSTOMER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(c1))).andExpect(status().isCreated());
        MvcResult lr1 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("alice.noti@example.com", "Pass123!")))).andExpect(status().isOk()).andReturn();
        customerToken1 = objectMapper.readTree(lr1.getResponse().getContentAsString()).get("token").asText();

        // 2. Customer 2
        RegisterRequest c2 = new RegisterRequest("Bob Customer", "bob.noti@example.com", "9666543211", "Pass123!", Role.CUSTOMER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(c2))).andExpect(status().isCreated());
        MvcResult lr2 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("bob.noti@example.com", "Pass123!")))).andExpect(status().isOk()).andReturn();
        customerToken2 = objectMapper.readTree(lr2.getResponse().getContentAsString()).get("token").asText();

        // 3. Worker 1
        RegisterRequest w1 = new RegisterRequest("Charlie Worker", "charlie.noti@example.com", "9666543212", "Pass123!", Role.WORKER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(w1))).andExpect(status().isCreated());
        MvcResult lr3 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("charlie.noti@example.com", "Pass123!")))).andExpect(status().isOk()).andReturn();
        workerToken1 = objectMapper.readTree(lr3.getResponse().getContentAsString()).get("token").asText();

        CreateWorkerProfileRequest p1 = new CreateWorkerProfileRequest("Plumbing Expert", 5, new BigDecimal("500.00"), Set.of("Pipe Fitting"), Set.of(ServiceCategory.PLUMBING), Boolean.TRUE, "Indiranagar", 10);
        mockMvc.perform(post("/api/worker/profile").header("Authorization", "Bearer " + workerToken1).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(p1))).andExpect(status().isCreated());

        // 4. Worker 2
        RegisterRequest w2 = new RegisterRequest("Dave Worker", "dave.noti@example.com", "9666543213", "Pass123!", Role.WORKER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(w2))).andExpect(status().isCreated());
        MvcResult lr4 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("dave.noti@example.com", "Pass123!")))).andExpect(status().isOk()).andReturn();
        workerToken2 = objectMapper.readTree(lr4.getResponse().getContentAsString()).get("token").asText();

        CreateWorkerProfileRequest p2 = new CreateWorkerProfileRequest("Electrician Expert", 8, new BigDecimal("600.00"), Set.of("Wiring"), Set.of(ServiceCategory.ELECTRICAL), Boolean.TRUE, "Indiranagar", 10);
        mockMvc.perform(post("/api/worker/profile").header("Authorization", "Bearer " + workerToken2).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(p2))).andExpect(status().isCreated());

        // 5. Admin
        User adminUser = new User("Admin Steward", "admin.noti@example.com", "9666543214", passwordEncoder.encode("AdminPass123!"), Role.ADMIN);
        userRepository.save(adminUser);

        MvcResult lr5 = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LoginRequest("admin.noti@example.com", "AdminPass123!")))).andExpect(status().isOk()).andReturn();
        adminToken = objectMapper.readTree(lr5.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    void test1_ServiceRequestCreatedGeneratesNotificationForCustomer() throws Exception {
        CreateServiceRequestRequest req = new CreateServiceRequestRequest(ServiceCategory.PLUMBING, "Notification test description", "Indiranagar", new BigDecimal("700.00"), LocalDateTime.now().plusDays(1));
        MvcResult rRes = mockMvc.perform(post("/api/customer/requests").header("Authorization", "Bearer " + customerToken1).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated()).andReturn();
        Long requestId = objectMapper.readTree(rRes.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/customer/notifications")
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].type").value("SERVICE_REQUEST_CREATED"))
                .andExpect(jsonPath("$[0].title").value("Service request created"))
                .andExpect(jsonPath("$[0].relatedEntityType").value("SERVICE_REQUEST"))
                .andExpect(jsonPath("$[0].relatedEntityId").value(requestId))
                .andExpect(jsonPath("$[0].read").value(false));

        mockMvc.perform(get("/api/customer/notifications/unread-count")
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadNotifications").value(1));
    }

    @Test
    void test2_WorkerAssignedGeneratesCustomerAndWorkerNotifications() throws Exception {
        CreateServiceRequestRequest req = new CreateServiceRequestRequest(ServiceCategory.PLUMBING, "Assignment test", "Indiranagar", new BigDecimal("700.00"), LocalDateTime.now().plusDays(1));
        MvcResult rRes = mockMvc.perform(post("/api/customer/requests").header("Authorization", "Bearer " + customerToken1).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated()).andReturn();
        Long requestId = objectMapper.readTree(rRes.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/worker/jobs/" + requestId + "/accept").header("Authorization", "Bearer " + workerToken1)).andExpect(status().isCreated());

        // Customer sees request created + worker assigned (2 notifications)
        mockMvc.perform(get("/api/customer/notifications")
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].type").value("WORKER_ASSIGNED"));

        // Worker sees job assigned (1 notification)
        mockMvc.perform(get("/api/worker/notifications")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].type").value("WORKER_ASSIGNED"))
                .andExpect(jsonPath("$[0].title").value("New job assigned"));
    }

    @Test
    void test3_JobStartedAndCompletedGeneratesNotifications() throws Exception {
        CreateServiceRequestRequest req = new CreateServiceRequestRequest(ServiceCategory.PLUMBING, "Job lifecycle test", "Indiranagar", new BigDecimal("700.00"), LocalDateTime.now().plusDays(1));
        MvcResult rRes = mockMvc.perform(post("/api/customer/requests").header("Authorization", "Bearer " + customerToken1).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated()).andReturn();
        Long requestId = objectMapper.readTree(rRes.getResponse().getContentAsString()).get("id").asLong();

        MvcResult aRes = mockMvc.perform(post("/api/worker/jobs/" + requestId + "/accept").header("Authorization", "Bearer " + workerToken1)).andExpect(status().isCreated()).andReturn();
        Long jobId = objectMapper.readTree(aRes.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + workerToken1)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken1)).andExpect(status().isOk());

        // Worker notifications: WORKER_ASSIGNED, JOB_COMPLETED, EARNING_GENERATED (3 total)
        mockMvc.perform(get("/api/worker/notifications")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)));
    }

    @Test
    void test4_RatingReceivedGeneratesWorkerNotification() throws Exception {
        CreateServiceRequestRequest req = new CreateServiceRequestRequest(ServiceCategory.PLUMBING, "Rating test", "Indiranagar", new BigDecimal("700.00"), LocalDateTime.now().plusDays(1));
        MvcResult rRes = mockMvc.perform(post("/api/customer/requests").header("Authorization", "Bearer " + customerToken1).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated()).andReturn();
        Long requestId = objectMapper.readTree(rRes.getResponse().getContentAsString()).get("id").asLong();

        MvcResult aRes = mockMvc.perform(post("/api/worker/jobs/" + requestId + "/accept").header("Authorization", "Bearer " + workerToken1)).andExpect(status().isCreated()).andReturn();
        Long jobId = objectMapper.readTree(aRes.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/start").header("Authorization", "Bearer " + workerToken1)).andExpect(status().isOk());
        mockMvc.perform(post("/api/worker/jobs/" + jobId + "/complete").header("Authorization", "Bearer " + workerToken1)).andExpect(status().isOk());

        mockMvc.perform(post("/api/customer/ratings/" + jobId)
                .header("Authorization", "Bearer " + customerToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateRatingRequest(5, "Awesome!")))).andExpect(status().isCreated());

        // Worker should receive RATING_RECEIVED notification
        mockMvc.perform(get("/api/worker/notifications")
                        .header("Authorization", "Bearer " + workerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("RATING_RECEIVED"))
                .andExpect(jsonPath("$[0].title").value("New rating received"));
    }

    @Test
    void test5_ServiceRequestCancellationGeneratesNotification() throws Exception {
        CreateServiceRequestRequest req = new CreateServiceRequestRequest(ServiceCategory.PLUMBING, "Cancel test", "Indiranagar", new BigDecimal("700.00"), LocalDateTime.now().plusDays(1));
        MvcResult rRes = mockMvc.perform(post("/api/customer/requests").header("Authorization", "Bearer " + customerToken1).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated()).andReturn();
        Long requestId = objectMapper.readTree(rRes.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(patch("/api/customer/requests/" + requestId + "/cancel").header("Authorization", "Bearer " + customerToken1)).andExpect(status().isOk());

        mockMvc.perform(get("/api/customer/notifications")
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("SERVICE_REQUEST_CANCELLED"));
    }

    @Test
    void test6_MarkNotificationAsReadAndMarkAllAsRead() throws Exception {
        CreateServiceRequestRequest req = new CreateServiceRequestRequest(ServiceCategory.PLUMBING, "Read status test", "Indiranagar", new BigDecimal("700.00"), LocalDateTime.now().plusDays(1));
        mockMvc.perform(post("/api/customer/requests").header("Authorization", "Bearer " + customerToken1).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated());

        MvcResult notiRes = mockMvc.perform(get("/api/customer/notifications").header("Authorization", "Bearer " + customerToken1)).andExpect(status().isOk()).andReturn();
        Long notiId = objectMapper.readTree(notiRes.getResponse().getContentAsString()).get(0).get("id").asLong();

        // Mark single as read
        mockMvc.perform(post("/api/customer/notifications/" + notiId + "/read")
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read").value(true))
                .andExpect(jsonPath("$.readAt").exists());

        // Mark all as read
        mockMvc.perform(post("/api/customer/notifications/read-all")
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadNotifications").value(0));
    }

    @Test
    void test7_SecurityAndRoleIsolation() throws Exception {
        // Customer 2 attempting to read Customer 1's notification -> 403 Forbidden
        CreateServiceRequestRequest req = new CreateServiceRequestRequest(ServiceCategory.PLUMBING, "Security test", "Indiranagar", new BigDecimal("700.00"), LocalDateTime.now().plusDays(1));
        mockMvc.perform(post("/api/customer/requests").header("Authorization", "Bearer " + customerToken1).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated());

        MvcResult notiRes = mockMvc.perform(get("/api/customer/notifications").header("Authorization", "Bearer " + customerToken1)).andExpect(status().isOk()).andReturn();
        Long notiId = objectMapper.readTree(notiRes.getResponse().getContentAsString()).get(0).get("id").asLong();

        mockMvc.perform(post("/api/customer/notifications/" + notiId + "/read")
                        .header("Authorization", "Bearer " + customerToken2))
                .andExpect(status().isForbidden());

        // Cross-role access checks
        mockMvc.perform(get("/api/worker/notifications").header("Authorization", "Bearer " + customerToken1)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/customer/notifications").header("Authorization", "Bearer " + workerToken1)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/notifications").header("Authorization", "Bearer " + customerToken1)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/customer/notifications")).andExpect(status().isUnauthorized());
    }
}
