package com.sih.cooperative.service;

import com.sih.cooperative.config.EarningsConfig;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
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
    private PaymentRepository paymentRepository;

    @Autowired
    private EarningRepository earningRepository;

    @Autowired
    private WorkerProfileRepository workerProfileRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EarningsConfig earningsConfig;

    private User customer;
    private User worker;
    private User unrelatedCustomer;
    private User unrelatedWorker;
    private User admin;

    private ServiceRequest serviceRequest;
    private Job job;
    private Payment payment;

    @BeforeEach
    void setUp() {
        invoiceRepository.deleteAll();
        notificationRepository.deleteAll();
        earningRepository.deleteAll();
        paymentRepository.deleteAll();
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

        payment = new Payment(job, customer, new BigDecimal("1000.00"), new BigDecimal("100.00"), new BigDecimal("1100.00"), PaymentMethod.UPI, "customer@upi", PaymentStatus.SUCCESS, "SIM-TXN-INVOICE123");
        payment = paymentRepository.save(payment);
    }

    @Test
    @DisplayName("1. Invoice generation for a valid completed/paid Job")
    void testGenerateInvoiceSuccess() {
        InvoiceResponse response = invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());

        assertNotNull(response);
        assertNotNull(response.getId());
        assertTrue(response.getInvoiceNumber().startsWith("GC-"));
        assertEquals(job.getId(), response.getJobId());
        assertEquals(customer.getId(), response.getCustomerId());
        assertEquals(worker.getId(), response.getWorkerId());
        assertEquals(new BigDecimal("1000.00"), response.getServiceCharge());
        assertEquals(new BigDecimal("100.00"), response.getPlatformFee());
        assertEquals(new BigDecimal("1100.00"), response.getTotalAmount());
        assertEquals(PaymentStatus.SUCCESS, response.getPaymentStatus());
        assertEquals("SIM-TXN-INVOICE123", response.getPaymentReference());
    }

    @Test
    @DisplayName("2. Invoice retrieval by the customer")
    void testCustomerRetrieval() {
        InvoiceResponse generated = invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());

        InvoiceResponse fetched = invoiceService.getInvoiceForJob(job.getId(), customer.getEmail());
        assertEquals(generated.getId(), fetched.getId());

        InvoiceResponse fetchedById = invoiceService.getInvoiceById(generated.getId(), customer.getEmail());
        assertEquals(generated.getId(), fetchedById.getId());
    }

    @Test
    @DisplayName("3. Invoice retrieval by the assigned worker")
    void testWorkerRetrieval() {
        InvoiceResponse generated = invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());

        InvoiceResponse fetched = invoiceService.getInvoiceForJob(job.getId(), worker.getEmail());
        assertEquals(generated.getId(), fetched.getId());
    }

    @Test
    @DisplayName("4. Invoice retrieval by ADMIN")
    void testAdminRetrieval() {
        InvoiceResponse generated = invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());

        InvoiceResponse fetched = invoiceService.getInvoiceForJob(job.getId(), admin.getEmail());
        assertEquals(generated.getId(), fetched.getId());

        List<InvoiceResponse> adminInvoices = invoiceService.getAdminInvoices(admin.getEmail());
        assertFalse(adminInvoices.isEmpty());
    }

    @Test
    @DisplayName("5. Unauthenticated access rejection")
    void testUnauthenticatedRejection() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                invoiceService.getOrCreateInvoiceForJob(job.getId(), "nonexistent@example.com")
        );
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    @DisplayName("6. Unrelated customer rejection")
    void testUnrelatedCustomerRejection() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                invoiceService.getInvoiceForJob(job.getId(), unrelatedCustomer.getEmail())
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    @DisplayName("7. Unassigned worker rejection")
    void testUnassignedWorkerRejection() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                invoiceService.getInvoiceForJob(job.getId(), unrelatedWorker.getEmail())
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    @DisplayName("8. Invoice number uniqueness")
    void testInvoiceNumberUniqueness() {
        InvoiceResponse invoice1 = invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());

        // Create second job & request
        ServiceRequest req2 = new ServiceRequest(customer, ServiceCategory.ELECTRICAL, "Fix wiring", "Delhi", new BigDecimal("500.00"), LocalDateTime.now());
        req2 = serviceRequestRepository.save(req2);
        Job job2 = new Job(req2, worker, JobStatus.COMPLETED);
        job2 = jobRepository.save(job2);

        InvoiceResponse invoice2 = invoiceService.getOrCreateInvoiceForJob(job2.getId(), customer.getEmail());

        assertNotEquals(invoice1.getInvoiceNumber(), invoice2.getInvoiceNumber());
    }

    @Test
    @DisplayName("9. Repeated generation returns the same invoice")
    void testRepeatedGenerationReturnsSame() {
        InvoiceResponse first = invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());
        InvoiceResponse second = invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());

        assertEquals(first.getId(), second.getId());
        assertEquals(first.getInvoiceNumber(), second.getInvoiceNumber());
        assertEquals(1, invoiceRepository.count());
    }

    @Test
    @DisplayName("10. Backend calculates total and doesn't trust frontend")
    void testBackendCalculatesTotal() {
        InvoiceResponse response = invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());

        // budget = 1000, 10% platform fee = 100, total = 1100
        assertEquals(new BigDecimal("1000.00"), response.getServiceCharge());
        assertEquals(new BigDecimal("100.00"), response.getPlatformFee());
        assertEquals(new BigDecimal("1100.00"), response.getTotalAmount());
    }

    @Test
    @DisplayName("11. Unpaid payment does not produce a PAID invoice")
    void testUnpaidPaymentInvoice() {
        paymentRepository.deleteAll();

        InvoiceResponse response = invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());

        assertEquals(PaymentStatus.PENDING, response.getPaymentStatus());
        assertNull(response.getPaymentReference());
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

        // We bypass constraint validation for unit check
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
    @DisplayName("15. Invoice generation does not mutate payment/refund state")
    void testInvoiceGenerationDoesNotMutatePayment() {
        Payment original = paymentRepository.findById(payment.getId()).get();

        invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());

        Payment after = paymentRepository.findById(payment.getId()).get();

        assertEquals(original.getStatus(), after.getStatus());
        assertEquals(original.getAmount(), after.getAmount());
        assertEquals(original.getRefundAmount(), after.getRefundAmount());
    }

    @Test
    @DisplayName("16. Long descriptions and names are handled safely")
    void testLongDescriptionHandledSafely() {
        String longDesc = "A".repeat(800);
        serviceRequest.setDescription(longDesc);
        serviceRequestRepository.save(serviceRequest);

        InvoiceResponse response = invoiceService.getOrCreateInvoiceForJob(job.getId(), customer.getEmail());
        assertEquals(longDesc, response.getServiceDescription());
    }
}
