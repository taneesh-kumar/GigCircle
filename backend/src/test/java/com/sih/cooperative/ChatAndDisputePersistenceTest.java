package com.sih.cooperative;

import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ChatAndDisputePersistenceTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ChatConversationRepository chatConversationRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private DisputeRepository disputeRepository;

    @Autowired
    private DisputeEvidenceRepository disputeEvidenceRepository;

    @Autowired
    private DisputeHistoryRepository disputeHistoryRepository;

    @Test
    public void testChatConversationAndMessagePersistence() {
        User customer = userRepository.save(new User("Test Customer", "chat_cust@test.com", "9876543210", "pass", Role.CUSTOMER));
        User worker = userRepository.save(new User("Test Worker", "chat_work@test.com", "9876543211", "pass", Role.WORKER));

        ServiceRequest request = serviceRequestRepository.save(new ServiceRequest(
                customer, ServiceCategory.PLUMBING, "Fix pipe", "Location", new BigDecimal("100.00"), LocalDateTime.now()
        ));

        Job job = jobRepository.save(new Job(request, worker, JobStatus.ACCEPTED));

        ChatConversation conversation = chatConversationRepository.save(new ChatConversation(job));
        assertNotNull(conversation.getId());
        assertNotNull(conversation.getCreatedAt());
        assertNotNull(conversation.getUpdatedAt());

        Optional<ChatConversation> fetchedConv = chatConversationRepository.findByJobId(job.getId());
        assertTrue(fetchedConv.isPresent());
        assertEquals(conversation.getId(), fetchedConv.get().getId());
        assertTrue(chatConversationRepository.existsByJobId(job.getId()));

        ChatMessage msg1 = chatMessageRepository.save(new ChatMessage(conversation, customer, "Hello worker"));
        chatMessageRepository.save(new ChatMessage(conversation, worker, "Hello customer"));

        assertNotNull(msg1.getId());
        assertNotNull(msg1.getCreatedAt());
        assertFalse(msg1.isRead());

        List<ChatMessage> messages = chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
        assertEquals(2, messages.size());
        assertEquals("Hello worker", messages.get(0).getMessageText());
        assertEquals("Hello customer", messages.get(1).getMessageText());

        long unreadCount = chatMessageRepository.countByConversationIdAndSenderIdNotAndReadFalse(conversation.getId(), worker.getId());
        assertEquals(1, unreadCount);
    }

    @Test
    public void testDisputeWorkflowPersistence() {
        User customer = userRepository.save(new User("Dispute Cust", "disp_cust@test.com", "9876543212", "pass", Role.CUSTOMER));
        User worker = userRepository.save(new User("Dispute Worker", "disp_work@test.com", "9876543213", "pass", Role.WORKER));
        User admin = userRepository.save(new User("Admin User", "disp_admin@test.com", "9876543214", "pass", Role.ADMIN));

        ServiceRequest request = serviceRequestRepository.save(new ServiceRequest(
                customer, ServiceCategory.CLEANING, "Deep clean", "City", new BigDecimal("250.00"), LocalDateTime.now()
        ));

        Job job = jobRepository.save(new Job(request, worker, JobStatus.IN_PROGRESS));

        Dispute dispute = disputeRepository.save(new Dispute(job, customer, worker, DisputeReason.QUALITY_ISSUE, "Incomplete cleaning work"));
        assertNotNull(dispute.getId());
        assertEquals(DisputeStatus.OPEN, dispute.getStatus());
        assertNotNull(dispute.getCreatedAt());

        assertTrue(disputeRepository.existsByJobIdAndStatusIn(job.getId(), List.of(DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW, DisputeStatus.ACTION_REQUIRED)));
        Optional<Dispute> activeDispute = disputeRepository.findActiveDisputeByJobId(job.getId());
        assertTrue(activeDispute.isPresent());
        assertEquals(dispute.getId(), activeDispute.get().getId());

        DisputeEvidence evidence = disputeEvidenceRepository.save(new DisputeEvidence(dispute, customer, "evidence_123.png", "photo.png", "image/png", 102400L));
        assertNotNull(evidence.getId());
        assertEquals("evidence_123.png", evidence.getFileReference());

        List<DisputeEvidence> evidenceList = disputeEvidenceRepository.findByDisputeIdOrderByCreatedAtAsc(dispute.getId());
        assertEquals(1, evidenceList.size());
        assertEquals("evidence_123.png", evidenceList.get(0).getFileReference());

        DisputeHistory history1 = disputeHistoryRepository.save(new DisputeHistory(dispute, customer, null, DisputeStatus.OPEN, "Dispute created by customer"));
        assertNotNull(history1.getId());

        dispute.setStatus(DisputeStatus.RESOLVED);
        dispute.setResolutionNotes("Partial refund agreed");
        dispute.setResolvedBy(admin);
        dispute.setResolvedAt(LocalDateTime.now());
        Dispute updatedDispute = disputeRepository.save(dispute);

        disputeHistoryRepository.save(new DisputeHistory(updatedDispute, admin, DisputeStatus.OPEN, DisputeStatus.RESOLVED, "Resolved by admin"));

        List<DisputeHistory> histories = disputeHistoryRepository.findByDisputeIdOrderByCreatedAtAsc(dispute.getId());
        assertEquals(2, histories.size());
        assertEquals(DisputeStatus.OPEN, histories.get(0).getNewStatus());
        assertEquals(DisputeStatus.RESOLVED, histories.get(1).getNewStatus());

        List<Dispute> userDisputes = disputeRepository.findByUserIdInvolvingOrderByCreatedAtDesc(customer.getId());
        assertFalse(userDisputes.isEmpty());
        assertEquals(dispute.getId(), userDisputes.get(0).getId());
    }
}
