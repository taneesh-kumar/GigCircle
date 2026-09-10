package com.sih.cooperative;

import com.sih.cooperative.dto.JobResponse;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.*;
import com.sih.cooperative.service.JobService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests the service-level job completion behavior under the Phase 4 lifecycle.
 * Worker calling completeJob() now moves job to PAYMENT_REQUIRED.
 * Earning and final COMPLETED status are set only after customer pays.
 */
@SpringBootTest
@ActiveProfiles("test")
public class JobCompletionIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private EarningRepository earningRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private WorkerProfileRepository workerProfileRepository;

    @Autowired
    private JobService jobService;

    @Autowired
    private com.sih.cooperative.repository.PaymentRepository paymentRepository;

    private User customer;
    private User worker;
    private Job job;

    @BeforeEach
    void setUp() {
        paymentRepository.deleteAll();
        notificationRepository.deleteAll();
        invoiceRepository.deleteAll();
        earningRepository.deleteAll();
        jobRepository.deleteAll();
        serviceRequestRepository.deleteAll();
        workerProfileRepository.deleteAll();
        userRepository.deleteAll();

        customer = new User("Customer Alice", "alice.jobtest@example.com", "1234567890", "password", Role.CUSTOMER);
        customer = userRepository.save(customer);

        worker = new User("Worker Bob", "bob.jobtest@example.com", "0987654321", "password", Role.WORKER);
        worker = userRepository.save(worker);

        ServiceRequest request = new ServiceRequest(customer, ServiceCategory.PLUMBING, "Fix pipe leakage", "Goa", new BigDecimal("1000.00"), LocalDateTime.now());
        request = serviceRequestRepository.save(request);

        job = new Job(request, worker, JobStatus.IN_PROGRESS);
        job = jobRepository.save(job);
    }

    /**
     * Phase 4 lifecycle:
     * Worker completing a job now sets status to PAYMENT_REQUIRED (not COMPLETED directly).
     * Earning and completedAt are set ONLY after successful customer payment.
     */
    @Test
    void testWorkerCompletesJob_MovesToPaymentRequired_NoEarningYet() {
        assertEquals(JobStatus.IN_PROGRESS, job.getStatus());
        assertNull(job.getCompletedAt());

        JobResponse response = jobService.completeJob(job.getId(), worker.getEmail());

        assertNotNull(response);
        assertEquals(JobStatus.PAYMENT_REQUIRED, response.getJobStatus(),
                "Worker completing the job must transition it to PAYMENT_REQUIRED, not COMPLETED");

        Job updatedJob = jobRepository.findById(job.getId()).orElseThrow();
        assertEquals(JobStatus.PAYMENT_REQUIRED, updatedJob.getStatus());
        // completedAt is NOT set yet — it gets set after customer pays
        assertNull(updatedJob.getCompletedAt(),
                "completedAt must remain null until customer completes payment");

        // No earning should be created yet — earning is generated when customer pays
        assertFalse(earningRepository.existsByJobId(job.getId()),
                "Earning must NOT be generated until customer pays");

        // Customer should receive a PAYMENT_REQUIRED notification
        List<Notification> customerNotifications = notificationRepository.findByRecipientIdOrderByCreatedAtDescIdDesc(customer.getId());
        assertFalse(customerNotifications.isEmpty(), "Customer should receive a payment-required notification");
        assertTrue(customerNotifications.stream().anyMatch(n -> n.getType() == NotificationType.PAYMENT_REQUIRED),
                "Customer must receive PAYMENT_REQUIRED notification type");
    }

    /**
     * Calling completeJob() twice on a PAYMENT_REQUIRED job is idempotent.
     * The second call returns the current PAYMENT_REQUIRED state without error.
     */
    @Test
    void testCompleteJobIsIdempotentOnPaymentRequired() {
        jobService.completeJob(job.getId(), worker.getEmail());

        // Second call — idempotent
        JobResponse secondResponse = jobService.completeJob(job.getId(), worker.getEmail());
        assertEquals(JobStatus.PAYMENT_REQUIRED, secondResponse.getJobStatus());

        // Still no earning
        assertFalse(earningRepository.existsByJobId(job.getId()));
    }
}
