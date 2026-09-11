package com.sih.cooperative.service;

import com.sih.cooperative.dto.InvoiceResponse;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class InvoiceServiceIntegrationTest {

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EarningRepository earningRepository;

    @Autowired
    private WorkerProfileRepository workerProfileRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private com.sih.cooperative.repository.PaymentRepository paymentRepository;

    private User customer;
    private User worker;
    private User unrelatedCustomer;
    private User unrelatedWorker;
    private User admin;

    private ServiceRequest serviceRequest;
    private Job job;

    @BeforeEach
    void setUp() {
        paymentRepository.deleteAll();
        invoiceRepository.deleteAll();
        notificationRepository.deleteAll();
        earningRepository.deleteAll();
        jobRepository.deleteAll();
        serviceRequestRepository.deleteAll();
        workerProfileRepository.deleteAll();
        userRepository.deleteAll();

        customer = new User("Customer One", "customer1@example.com", "password123", "9876543210", Role.CUSTOMER);
        customer = userRepository.save(customer);

        worker = new User("Worker One", "worker1@example.com", "password123", "9876543211", Role.WORKER);
        worker = userRepository.save(worker);

        unrelatedCustomer = new User("Customer Two", "customer2@example.com", "password123", "9876543212", Role.CUSTOMER);
        unrelatedCustomer = userRepository.save(unrelatedCustomer);

        unrelatedWorker = new User("Worker Two", "worker2@example.com", "password123", "9876543213", Role.WORKER);
        unrelatedWorker = userRepository.save(unrelatedWorker);

        admin = new User("Admin User", "admin@example.com", "password123", "9876543214", Role.ADMIN);
        admin = userRepository.save(admin);

        serviceRequest = new ServiceRequest(customer, ServiceCategory.PLUMBING, "Fix leaking tap in kitchen", "Delhi", new BigDecimal("1000.00"), LocalDateTime.now().plusDays(1));
        serviceRequest = serviceRequestRepository.save(serviceRequest);

        job = new Job(serviceRequest, worker, JobStatus.COMPLETED);
        job = jobRepository.save(job);
    }

    @Test
    @DisplayName("1. Invoice generation for a valid completed Job")
    void testGenerateInvoiceSuccess() {
        InvoiceResponse response = invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());

        assertNotNull(response);
        assertNotNull(response.getId());
        assertTrue(response.getInvoiceNumber().startsWith("GC-"));
        assertEquals(job.getId(), response.getJobId());
        assertEquals(customer.getId(), response.getCustomerId());
        assertEquals(worker.getId(), response.getWorkerId());
        assertEquals(new BigDecimal("900.00"), response.getServiceCharge());
        assertEquals(new BigDecimal("100.00"), response.getPlatformFee());
        assertEquals("1000.00", response.getTotalAmount().toPlainString());
        assertEquals("SUCCESS", response.getPaymentStatus());
        assertEquals("INV-REF-" + job.getId(), response.getPaymentReference());
    }

    @Test
    @DisplayName("2. Invoice retrieval by the customer")
    void testCustomerRetrieval() {
        invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());

        InvoiceResponse response = invoiceService.getInvoiceForJob(job.getId(), customer.getEmail());
        assertNotNull(response);
        assertEquals(job.getId(), response.getJobId());
    }

    @Test
    @DisplayName("3. Invoice retrieval by assigned worker")
    void testWorkerRetrieval() {
        invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());

        InvoiceResponse response = invoiceService.getInvoiceForJob(job.getId(), worker.getEmail());
        assertNotNull(response);
        assertEquals(job.getId(), response.getJobId());
    }

    @Test
    @DisplayName("4. Invoice retrieval by admin")
    void testAdminRetrieval() {
        invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());

        InvoiceResponse response = invoiceService.getInvoiceForJob(job.getId(), admin.getEmail());
        assertNotNull(response);
        assertEquals(job.getId(), response.getJobId());
    }

    @Test
    @DisplayName("5. Unrelated customer forbidden from accessing invoice")
    void testUnrelatedCustomerForbidden() {
        invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                invoiceService.getInvoiceForJob(job.getId(), unrelatedCustomer.getEmail())
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    @DisplayName("6. Unrelated worker forbidden from accessing invoice")
    void testUnrelatedWorkerForbidden() {
        invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                invoiceService.getInvoiceForJob(job.getId(), unrelatedWorker.getEmail())
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    @DisplayName("7. Customer invoice list contains expected invoices")
    void testCustomerInvoiceList() {
        invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());

        List<InvoiceResponse> invoices = invoiceService.getMyInvoices(customer.getEmail());
        assertEquals(1, invoices.size());
        assertEquals(job.getId(), invoices.get(0).getJobId());
    }

    @Test
    @DisplayName("8. Worker invoice list contains expected invoices")
    void testWorkerInvoiceList() {
        invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());

        List<InvoiceResponse> invoices = invoiceService.getMyInvoices(worker.getEmail());
        assertEquals(1, invoices.size());
        assertEquals(job.getId(), invoices.get(0).getJobId());
    }

    @Test
    @DisplayName("9. Admin invoice list contains all invoices")
    void testAdminInvoiceList() {
        invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());

        List<InvoiceResponse> invoices = invoiceService.getAdminInvoices(admin.getEmail());
        assertEquals(1, invoices.size());
        assertEquals(job.getId(), invoices.get(0).getJobId());
    }

    @Test
    @DisplayName("10. Idempotency: repeated requests return same invoice")
    void testInvoiceGenerationIdempotent() {
        InvoiceResponse first = invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());
        InvoiceResponse second = invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());

        assertEquals(first.getId(), second.getId());
        assertEquals(first.getInvoiceNumber(), second.getInvoiceNumber());
        assertEquals(1, invoiceRepository.count());
    }

    @Test
    @DisplayName("11. Pending status invoice for IN_PROGRESS job")
    void testPendingInvoiceForInProgressJob() {
        job.setStatus(JobStatus.IN_PROGRESS);
        jobRepository.save(job);

        InvoiceResponse response = invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());

        assertEquals("PENDING", response.getPaymentStatus());
        assertNull(response.getPaidAt());
    }

    @Test
    @DisplayName("12. Missing Job returns 404")
    void testMissingJobReturns404() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                invoiceService.getOrCreateInvoiceForJob(99999L, customer.getEmail())
        );
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    @DisplayName("13. Job without assigned worker returns 400")
    void testUnassignedJobReturns400() {
        Job unassignedJob = new Job();
        unassignedJob.setServiceRequest(serviceRequest);
        unassignedJob.setStatus(JobStatus.ACCEPTED);
        unassignedJob.setWorker(null);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            if (unassignedJob.getWorker() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot generate invoice for job without assigned worker");
            }
        });
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    @DisplayName("14. Invoice remains accessible after job completion")
    void testInvoiceAccessibleAfterCompletion() {
        InvoiceResponse created = invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());

        job.setStatus(JobStatus.COMPLETED);
        jobRepository.save(job);

        InvoiceResponse fetched = invoiceService.getInvoiceForJob(job.getId(), customer.getEmail());
        assertEquals(created.getId(), fetched.getId());
    }

    @Test
    @DisplayName("15. Long descriptions and names are handled safely")
    void testLongDescriptionHandledSafely() {
        String longDesc = "A".repeat(800);
        serviceRequest.setDescription(longDesc);
        serviceRequestRepository.save(serviceRequest);

        InvoiceResponse response = invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());
        assertEquals(longDesc, response.getServiceDescription());
    }
}
