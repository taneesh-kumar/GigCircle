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
    public void testOneChatConversationPerJobConstraint() {
        User customer = userRepository.save(new User("Conv Cust", "conv_c@test.com", "9000000001", "pass", Role.CUSTOMER));
        User worker = userRepository.save(new User("Conv Work", "conv_w@test.com", "9000000002", "pass", Role.WORKER));

        ServiceRequest request = serviceRequestRepository.save(new ServiceRequest(
                customer, ServiceCategory.PLUMBING, "Fix leak", "Location 1", new BigDecimal("150.00"), LocalDateTime.now()
        ));

        Job job = jobRepository.save(new Job(request, worker, JobStatus.ACCEPTED));

        ChatConversation conv1 = chatConversationRepository.save(new ChatConversation(job));
        assertNotNull(conv1.getId());

        assertTrue(chatConversationRepository.existsByJobId(job.getId()));
        Optional<ChatConversation> foundConv = chatConversationRepository.findByJobId(job.getId());
        assertTrue(foundConv.isPresent());
        assertEquals(conv1.getId(), foundConv.get().getId());
    }

    @Test
    public void testMessageToConversationRelationship() {
        User customer = userRepository.save(new User("Msg Cust", "msg_c@test.com", "9000000003", "pass", Role.CUSTOMER));
        User worker = userRepository.save(new User("Msg Work", "msg_w@test.com", "9000000004", "pass", Role.WORKER));

        ServiceRequest request = serviceRequestRepository.save(new ServiceRequest(
                customer, ServiceCategory.CARPENTRY, "Repair table", "Location 2", new BigDecimal("200.00"), LocalDateTime.now()
        ));

        Job job = jobRepository.save(new Job(request, worker, JobStatus.IN_PROGRESS));
        ChatConversation conv = chatConversationRepository.save(new ChatConversation(job));

        ChatMessage msg1 = chatMessageRepository.save(new ChatMessage(conv, customer, "Are you on your way?"));
        ChatMessage msg2 = chatMessageRepository.save(new ChatMessage(conv, worker, "Yes, arriving in 10 mins."));

        assertNotNull(msg1.getId());
        assertNotNull(msg2.getId());
        assertEquals(conv.getId(), msg1.getConversation().getId());
        assertEquals(customer.getId(), msg1.getSender().getId());

        List<ChatMessage> ascMessages = chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(conv.getId());
        assertEquals(2, ascMessages.size());
        assertEquals("Are you on your way?", ascMessages.get(0).getMessageText());

        long unreadCountForWorker = chatMessageRepository.countByConversationIdAndSenderIdNotAndReadFalse(conv.getId(), worker.getId());
        assertEquals(1, unreadCountForWorker);
    }

    @Test
    public void testDuplicateActiveDisputesAndMultipleClosedDisputes() {
        User customer = userRepository.save(new User("Disp Cust", "disp_c2@test.com", "9000000005", "pass", Role.CUSTOMER));
        User worker = userRepository.save(new User("Disp Work", "disp_w2@test.com", "9000000006", "pass", Role.WORKER));
        User admin = userRepository.save(new User("Disp Admin", "disp_a2@test.com", "9000000007", "pass", Role.ADMIN));

        ServiceRequest request = serviceRequestRepository.save(new ServiceRequest(
                customer, ServiceCategory.ELECTRICAL, "Wiring issue", "Location 3", new BigDecimal("300.00"), LocalDateTime.now()
        ));

        Job job = jobRepository.save(new Job(request, worker, JobStatus.IN_PROGRESS));

        // 1. Create first dispute and resolve it
        Dispute dispute1 = new Dispute(job, customer, worker, DisputeReason.NON_DELIVERY, "Worker did not show up");
        dispute1.setStatus(DisputeStatus.RESOLVED);
        dispute1.setResolutionNotes("Resolved with warning");
        dispute1.setResolvedBy(admin);
        dispute1.setResolvedAt(LocalDateTime.now());
        disputeRepository.save(dispute1);

        // Active dispute should NOT exist because dispute1 is RESOLVED
        assertFalse(disputeRepository.existsByJobIdAndStatusIn(job.getId(), List.of(DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW, DisputeStatus.ACTION_REQUIRED)));
        assertTrue(disputeRepository.findActiveDisputeByJobId(job.getId()).isEmpty());

        // 2. Create second dispute for the same job (now OPEN)
        Dispute dispute2 = disputeRepository.save(new Dispute(job, customer, worker, DisputeReason.QUALITY_ISSUE, "New quality complaint"));
        assertNotNull(dispute2.getId());

        // Active dispute SHOULD now exist and return dispute2
        assertTrue(disputeRepository.existsByJobIdAndStatusIn(job.getId(), List.of(DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW, DisputeStatus.ACTION_REQUIRED)));
        Optional<Dispute> activeDispute = disputeRepository.findActiveDisputeByJobId(job.getId());
        assertTrue(activeDispute.isPresent());
        assertEquals(dispute2.getId(), activeDispute.get().getId());

        // Both disputes exist in job dispute history
        List<Dispute> allJobDisputes = disputeRepository.findByJobIdOrderByCreatedAtDesc(job.getId());
        assertEquals(2, allJobDisputes.size());
    }

    @Test
    public void testDisputeHistoryAndEvidenceRelationships() {
        User customer = userRepository.save(new User("Hist Cust", "hist_c@test.com", "9000000008", "pass", Role.CUSTOMER));
        User worker = userRepository.save(new User("Hist Work", "hist_w@test.com", "9000000009", "pass", Role.WORKER));
        User admin = userRepository.save(new User("Hist Admin", "hist_a@test.com", "9000000010", "pass", Role.ADMIN));

        ServiceRequest request = serviceRequestRepository.save(new ServiceRequest(
                customer, ServiceCategory.PAINTING, "Paint bedroom", "Location 4", new BigDecimal("500.00"), LocalDateTime.now()
        ));

        Job job = jobRepository.save(new Job(request, worker, JobStatus.COMPLETED));

        Dispute dispute = disputeRepository.save(new Dispute(job, worker, customer, DisputeReason.PAYMENT_ISSUE, "Payment not received"));

        DisputeEvidence evidence = disputeEvidenceRepository.save(new DisputeEvidence(dispute, worker, "receipt_99.png", "receipt.png", "image/png", 51200L));
        assertEquals(dispute.getId(), evidence.getDispute().getId());
        assertEquals(worker.getId(), evidence.getUploadedBy().getId());

        DisputeHistory h1 = disputeHistoryRepository.save(new DisputeHistory(dispute, worker, null, DisputeStatus.OPEN, "Dispute created"));
        DisputeHistory h2 = disputeHistoryRepository.save(new DisputeHistory(dispute, admin, DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW, "Admin under review"));

        assertEquals(dispute.getId(), h1.getDispute().getId());
        assertEquals(worker.getId(), h1.getActor().getId());
        assertEquals(admin.getId(), h2.getActor().getId());

        List<DisputeHistory> historyList = disputeHistoryRepository.findByDisputeIdOrderByCreatedAtAsc(dispute.getId());
        assertEquals(2, historyList.size());
        assertEquals(DisputeStatus.OPEN, historyList.get(0).getNewStatus());
        assertEquals(DisputeStatus.UNDER_REVIEW, historyList.get(1).getNewStatus());
    }

    @Test
    public void testRepositoryQueryCorrectness() {
        User customer = userRepository.save(new User("Query Cust", "query_c@test.com", "9000000011", "pass", Role.CUSTOMER));
        User worker = userRepository.save(new User("Query Work", "query_w@test.com", "9000000012", "pass", Role.WORKER));

        ServiceRequest request = serviceRequestRepository.save(new ServiceRequest(
                customer, ServiceCategory.GARDENING, "Mow lawn", "Location 5", new BigDecimal("80.00"), LocalDateTime.now()
        ));

        Job job = jobRepository.save(new Job(request, worker, JobStatus.IN_PROGRESS));

        Dispute dispute = disputeRepository.save(new Dispute(job, customer, worker, DisputeReason.COMMUNICATION_ISSUE, "Unresponsive worker"));

        List<Dispute> customerInvolved = disputeRepository.findByUserIdInvolvingOrderByCreatedAtDesc(customer.getId());
        assertFalse(customerInvolved.isEmpty());
        assertEquals(dispute.getId(), customerInvolved.get(0).getId());

        List<Dispute> workerInvolved = disputeRepository.findByUserIdInvolvingOrderByCreatedAtDesc(worker.getId());
        assertFalse(workerInvolved.isEmpty());
        assertEquals(dispute.getId(), workerInvolved.get(0).getId());

        List<Dispute> openDisputes = disputeRepository.findByStatusOrderByCreatedAtDesc(DisputeStatus.OPEN);
        assertFalse(openDisputes.isEmpty());

        List<Dispute> allDisputes = disputeRepository.findAllByOrderByCreatedAtDesc();
        assertFalse(allDisputes.isEmpty());
    }
}
