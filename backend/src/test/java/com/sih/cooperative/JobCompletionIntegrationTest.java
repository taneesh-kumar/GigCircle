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

    private User customer;
    private User worker;
    private Job job;

    @BeforeEach
    void setUp() {
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

    @Test
    void testWorkerCompletesJob_DirectToCompleted_GeneratesEarningAndNotification_NoPayment() {
        assertEquals(JobStatus.IN_PROGRESS, job.getStatus());
        assertNull(job.getCompletedAt());

        JobResponse response = jobService.completeJob(job.getId(), worker.getEmail());

        assertNotNull(response);
        assertEquals(JobStatus.COMPLETED, response.getJobStatus());

        Job updatedJob = jobRepository.findById(job.getId()).orElseThrow();
        assertEquals(JobStatus.COMPLETED, updatedJob.getStatus());
        assertNotNull(updatedJob.getCompletedAt());

        // Verify Earning was generated for the completed job
        assertTrue(earningRepository.existsByJobId(job.getId()));
        Earning earning = earningRepository.findByJobId(job.getId()).orElseThrow();
        assertEquals(new BigDecimal("1000.00"), earning.getGrossAmount());
        assertNotNull(earning.getWorkerEarning());
        assertNotNull(earning.getPlatformFee());

        // Verify Notification was generated
        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDescIdDesc(customer.getId());
        assertFalse(notifications.isEmpty());
        assertTrue(notifications.stream().anyMatch(n -> n.getType() == NotificationType.JOB_COMPLETED));
    }
}
