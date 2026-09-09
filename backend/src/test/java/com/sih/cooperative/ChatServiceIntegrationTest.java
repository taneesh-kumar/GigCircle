package com.sih.cooperative;

import com.sih.cooperative.dto.ChatConversationResponse;
import com.sih.cooperative.dto.ChatMessageRequest;
import com.sih.cooperative.dto.ChatMessageResponse;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.*;
import com.sih.cooperative.service.ChatService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ChatServiceIntegrationTest {

    @Autowired
    private ChatService chatService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ChatConversationRepository chatConversationRepository;

    private User customer;
    private User worker;
    private User unrelatedUser;
    private User admin;
    private Job job;
    private Job completedJob;

    @BeforeEach
    public void setup() {
        customer = userRepository.save(new User("Chat Cust", "chat_cust@test.com", "9111111111", "password123", Role.CUSTOMER));
        worker = userRepository.save(new User("Chat Work", "chat_work@test.com", "9222222222", "password123", Role.WORKER));
        unrelatedUser = userRepository.save(new User("Unrelated User", "unrelated@test.com", "9333333333", "password123", Role.CUSTOMER));
        admin = userRepository.save(new User("Chat Admin", "chat_admin@test.com", "9444444444", "password123", Role.ADMIN));

        ServiceRequest request1 = serviceRequestRepository.save(new ServiceRequest(
                customer, ServiceCategory.PLUMBING, "Fix pipe leak", "123 Main St", new BigDecimal("100.00"), LocalDateTime.now()
        ));
        job = jobRepository.save(new Job(request1, worker, JobStatus.IN_PROGRESS));

        ServiceRequest request2 = serviceRequestRepository.save(new ServiceRequest(
                customer, ServiceCategory.CARPENTRY, "Fix door frame", "456 Oak St", new BigDecimal("200.00"), LocalDateTime.now()
        ));
        completedJob = jobRepository.save(new Job(request2, worker, JobStatus.COMPLETED));
    }

    @Test
    public void testCustomerCanRetrieveJobChat() {
        ChatConversationResponse response = chatService.getConversationResponse(job.getId(), customer.getEmail());
        assertNotNull(response);
        assertEquals(job.getId(), response.getJobId());
        assertEquals(customer.getId(), response.getCustomer().getId());
        assertEquals(worker.getId(), response.getWorker().getId());
    }

    @Test
    public void testAssignedWorkerCanRetrieveJobChat() {
        ChatConversationResponse response = chatService.getConversationResponse(job.getId(), worker.getEmail());
        assertNotNull(response);
        assertEquals(job.getId(), response.getJobId());
    }

    @Test
    public void testCustomerCanSendMessage() {
        ChatMessageRequest request = new ChatMessageRequest("Hello worker!");
        ChatMessageResponse response = chatService.sendMessage(job.getId(), request, customer.getEmail());

        assertNotNull(response);
        assertNotNull(response.getId());
        assertEquals("Hello worker!", response.getMessageText());
        assertEquals(customer.getId(), response.getSender().getId());
    }

    @Test
    public void testAssignedWorkerCanSendMessage() {
        ChatMessageRequest request = new ChatMessageRequest("Hello customer!");
        ChatMessageResponse response = chatService.sendMessage(job.getId(), request, worker.getEmail());

        assertNotNull(response);
        assertEquals("Hello customer!", response.getMessageText());
        assertEquals(worker.getId(), response.getSender().getId());
    }

    @Test
    public void testSenderIsTakenFromAuthenticationNotRequest() {
        ChatMessageRequest request = new ChatMessageRequest("Verified sender content");
        ChatMessageResponse response = chatService.sendMessage(job.getId(), request, customer.getEmail());

        assertEquals(customer.getId(), response.getSender().getId());
        assertNotEquals(worker.getId(), response.getSender().getId());
    }

    @Test
    public void testUnrelatedUserCannotRetrieveChat() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                chatService.getConversationResponse(job.getId(), unrelatedUser.getEmail())
        );
        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    public void testUnrelatedUserCannotSendMessage() {
        ChatMessageRequest request = new ChatMessageRequest("Unauthorized message");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                chatService.sendMessage(job.getId(), request, unrelatedUser.getEmail())
        );
        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    public void testUnassignedWorkerCannotAccessChat() {
        User unassignedWorker = userRepository.save(new User("Unassigned Worker", "unassigned_w@test.com", "9555555555", "pass", Role.WORKER));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                chatService.getConversationResponse(job.getId(), unassignedWorker.getEmail())
        );
        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    public void testBlankMessageIsRejected() {
        ChatMessageRequest emptyRequest = new ChatMessageRequest("   ");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                chatService.sendMessage(job.getId(), emptyRequest, customer.getEmail())
        );
        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    public void testDuplicateConversationCreationIsPrevented() {
        ChatConversationResponse c1 = chatService.getConversationResponse(job.getId(), customer.getEmail());
        ChatConversationResponse c2 = chatService.getConversationResponse(job.getId(), worker.getEmail());

        assertEquals(c1.getId(), c2.getId());
        assertEquals(1, chatConversationRepository.findAll().stream().filter(c -> c.getJob().getId().equals(job.getId())).count());
    }

    @Test
    public void testChatRemainsAccessibleAfterJobCompletion() {
        ChatMessageRequest req = new ChatMessageRequest("Post completion question");
        ChatMessageResponse msgResp = chatService.sendMessage(completedJob.getId(), req, customer.getEmail());
        assertNotNull(msgResp);

        List<ChatMessageResponse> messages = chatService.getMessagesForJob(completedJob.getId(), worker.getEmail());
        assertEquals(1, messages.size());
        assertEquals("Post completion question", messages.get(0).getMessageText());
    }

    @Test
    public void testMissingJobReturnsNotFound() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                chatService.getConversationResponse(999999L, customer.getEmail())
        );
        assertEquals(404, ex.getStatusCode().value());
    }

    @Test
    public void testAdminCannotSendAsParticipant() {
        ChatMessageRequest req = new ChatMessageRequest("Admin trying to speak");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                chatService.sendMessage(job.getId(), req, admin.getEmail())
        );
        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    public void testMarkMessagesAsRead() {
        chatService.sendMessage(job.getId(), new ChatMessageRequest("Hi worker"), customer.getEmail());

        List<ChatMessageResponse> workerView1 = chatService.getMessagesForJob(job.getId(), worker.getEmail());
        assertFalse(workerView1.get(0).isRead());

        chatService.markMessagesAsRead(job.getId(), worker.getEmail());

        List<ChatMessageResponse> workerView2 = chatService.getMessagesForJob(job.getId(), worker.getEmail());
        assertTrue(workerView2.get(0).isRead());
        assertNotNull(workerView2.get(0).getReadAt());
    }
}
