package com.sih.cooperative;

import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.UserRepository;
import com.sih.cooperative.repository.VerificationDocumentRepository;
import com.sih.cooperative.repository.WorkerVerificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class WorkerVerificationIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkerVerificationRepository workerVerificationRepository;

    @Autowired
    private VerificationDocumentRepository verificationDocumentRepository;

    private User worker1;
    private User worker2;
    private User adminUser;

    @BeforeEach
    public void setUp() {
        verificationDocumentRepository.deleteAll();
        workerVerificationRepository.deleteAll();
        userRepository.deleteAll();

        worker1 = new User("John Worker", "john.worker@example.com", "1234567890", "password123", Role.WORKER);
        worker1 = userRepository.save(worker1);

        worker2 = new User("Jane Worker", "jane.worker@example.com", "0987654321", "password123", Role.WORKER);
        worker2 = userRepository.save(worker2);

        adminUser = new User("Admin User", "admin@example.com", "1122334455", "admin123", Role.ADMIN);
        adminUser = userRepository.save(adminUser);
    }

    @Test
    public void testWorkerVerificationCreation() {
        WorkerVerification verification = new WorkerVerification(worker1);
        WorkerVerification saved = workerVerificationRepository.save(verification);

        assertNotNull(saved.getId());
        assertEquals(worker1.getId(), saved.getWorker().getId());
        assertEquals(VerificationStatus.NOT_SUBMITTED, saved.getStatus());
        assertNotNull(saved.getCreatedAt());
        assertNotNull(saved.getUpdatedAt());
        assertNull(saved.getSubmittedAt());
        assertNull(saved.getReviewedAt());
        assertNull(saved.getReviewedBy());
        assertNull(saved.getVerifiedAt());
        assertNull(saved.getRejectionReason());

        Optional<WorkerVerification> found = workerVerificationRepository.findByWorkerId(worker1.getId());
        assertTrue(found.isPresent());
        assertEquals(saved.getId(), found.get().getId());
    }

    @Test
    public void testWorkerVerificationToVerificationDocumentRelationship() {
        WorkerVerification verification = new WorkerVerification(worker1, VerificationStatus.PENDING_REVIEW);
        verification.setSubmittedAt(LocalDateTime.now());

        VerificationDocument doc1 = new VerificationDocument(verification, VerificationDocumentType.GOVERNMENT_ID, "docs/gov_id_123.pdf");
        VerificationDocument doc2 = new VerificationDocument(verification, VerificationDocumentType.PROFILE_PHOTO, "docs/photo_123.png");

        verification.addDocument(doc1);
        verification.addDocument(doc2);

        WorkerVerification saved = workerVerificationRepository.save(verification);
        assertNotNull(saved.getId());

        List<VerificationDocument> savedDocs = verificationDocumentRepository.findByVerificationId(saved.getId());
        assertEquals(2, savedDocs.size());

        VerificationDocument retrievedDoc1 = savedDocs.stream()
                .filter(d -> d.getDocumentType() == VerificationDocumentType.GOVERNMENT_ID)
                .findFirst()
                .orElse(null);
        assertNotNull(retrievedDoc1);
        assertEquals("docs/gov_id_123.pdf", retrievedDoc1.getFileReference());
        assertEquals(VerificationDocumentStatus.PENDING, retrievedDoc1.getStatus());
        assertNotNull(retrievedDoc1.getUploadedAt());

        // Test updating document status
        retrievedDoc1.setStatus(VerificationDocumentStatus.APPROVED);
        retrievedDoc1.setReviewNote("Legible ID");
        verificationDocumentRepository.save(retrievedDoc1);

        List<VerificationDocument> approvedDocs = verificationDocumentRepository.findByVerificationIdAndStatus(
                saved.getId(), VerificationDocumentStatus.APPROVED);
        assertEquals(1, approvedDocs.size());
        assertEquals(VerificationDocumentType.GOVERNMENT_ID, approvedDocs.get(0).getDocumentType());

        // Test cascade orphan removal
        saved.removeDocument(doc2);
        workerVerificationRepository.save(saved);

        List<VerificationDocument> docsAfterRemoval = verificationDocumentRepository.findByVerificationId(saved.getId());
        assertEquals(1, docsAfterRemoval.size());
    }

    @Test
    public void testVerificationStatusPersistence() {
        WorkerVerification verification = new WorkerVerification(worker1, VerificationStatus.NOT_SUBMITTED);
        WorkerVerification saved = workerVerificationRepository.save(verification);

        // Transition to PENDING_REVIEW
        saved.setStatus(VerificationStatus.PENDING_REVIEW);
        LocalDateTime submitTime = LocalDateTime.now();
        saved.setSubmittedAt(submitTime);
        saved = workerVerificationRepository.save(saved);

        WorkerVerification reloaded = workerVerificationRepository.findById(saved.getId()).orElseThrow();
        assertEquals(VerificationStatus.PENDING_REVIEW, reloaded.getStatus());
        assertNotNull(reloaded.getSubmittedAt());

        // Transition to CHANGES_REQUIRED
        reloaded.setStatus(VerificationStatus.CHANGES_REQUIRED);
        reloaded.setRejectionReason("ID image is blurry");
        reloaded.setReviewedBy(adminUser);
        reloaded.setReviewedAt(LocalDateTime.now());
        saved = workerVerificationRepository.save(reloaded);

        reloaded = workerVerificationRepository.findById(saved.getId()).orElseThrow();
        assertEquals(VerificationStatus.CHANGES_REQUIRED, reloaded.getStatus());
        assertEquals("ID image is blurry", reloaded.getRejectionReason());
        assertEquals(adminUser.getId(), reloaded.getReviewedBy().getId());

        // Transition to VERIFIED
        reloaded.setStatus(VerificationStatus.VERIFIED);
        reloaded.setVerifiedAt(LocalDateTime.now());
        reloaded.setRejectionReason(null);
        saved = workerVerificationRepository.save(reloaded);

        reloaded = workerVerificationRepository.findById(saved.getId()).orElseThrow();
        assertEquals(VerificationStatus.VERIFIED, reloaded.getStatus());
        assertNotNull(reloaded.getVerifiedAt());

        // Transition to REJECTED & SUSPENDED persistence check
        reloaded.setStatus(VerificationStatus.REJECTED);
        workerVerificationRepository.save(reloaded);
        assertEquals(VerificationStatus.REJECTED, workerVerificationRepository.findById(saved.getId()).orElseThrow().getStatus());

        reloaded.setStatus(VerificationStatus.SUSPENDED);
        workerVerificationRepository.save(reloaded);
        assertEquals(VerificationStatus.SUSPENDED, workerVerificationRepository.findById(saved.getId()).orElseThrow().getStatus());

        // Verify lookup by status
        List<WorkerVerification> suspendedList = workerVerificationRepository.findByStatus(VerificationStatus.SUSPENDED);
        assertEquals(1, suspendedList.size());
        assertEquals(worker1.getId(), suspendedList.get(0).getWorker().getId());
    }

    @Test
    public void testUniqueWorkerVerificationConstraint() {
        WorkerVerification verification1 = new WorkerVerification(worker1, VerificationStatus.PENDING_REVIEW);
        workerVerificationRepository.saveAndFlush(verification1);

        WorkerVerification verification2 = new WorkerVerification(worker1, VerificationStatus.NOT_SUBMITTED);
        assertThrows(DataIntegrityViolationException.class, () -> {
            workerVerificationRepository.saveAndFlush(verification2);
        });
    }
}
