package com.sih.cooperative.service;

import com.sih.cooperative.dto.PaymentResponse;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.JobRepository;
import com.sih.cooperative.repository.PaymentRepository;
import com.sih.cooperative.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

@Service
public class DemoPaymentService {

    private final PaymentRepository paymentRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    public DemoPaymentService(PaymentRepository paymentRepository,
                              JobRepository jobRepository,
                              UserRepository userRepository) {
        this.paymentRepository = paymentRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void validateCustomerAccess(Job job, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            return;
        }

        boolean isCustomer = job.getServiceRequest() != null &&
                job.getServiceRequest().getCustomer() != null &&
                job.getServiceRequest().getCustomer().getId().equals(currentUser.getId());

        if (!isCustomer) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the customer who requested the job can perform payment operations");
        }
    }

    @Transactional
    public PaymentResponse initiatePayment(Long jobId, String userEmail) {
        User currentUser = getAuthenticatedUser(userEmail);

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        validateCustomerAccess(job, currentUser);

        if (job.getStatus() != JobStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment can only be initiated for completed jobs");
        }

        Optional<Payment> existingOpt = paymentRepository.findByJobId(jobId);
        if (existingOpt.isPresent()) {
            Payment existing = existingOpt.get();
            if (existing.getStatus() == PaymentStatus.FAILED) {
                existing.setStatus(PaymentStatus.PENDING);
                existing.setFailureReason(null);
                return PaymentResponse.fromEntity(paymentRepository.save(existing));
            }
            return PaymentResponse.fromEntity(existing);
        }

        ServiceRequest request = job.getServiceRequest();
        if (request == null || request.getCustomer() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Job missing customer details");
        }

        BigDecimal amount = request.getBudget() != null ? request.getBudget() : BigDecimal.ZERO;

        Payment payment = new Payment(job, request.getCustomer(), amount, PaymentStatus.PENDING);

        try {
            Payment saved = paymentRepository.save(payment);
            return PaymentResponse.fromEntity(saved);
        } catch (DataIntegrityViolationException ex) {
            // Concurrent creation race condition -> fetch existing payment created concurrently
            return paymentRepository.findByJobId(jobId)
                    .map(PaymentResponse::fromEntity)
                    .orElseThrow(() -> ex);
        }
    }

    @Transactional
    public PaymentResponse simulatePayment(Long jobId, boolean shouldSucceed, String failureReason, String userEmail) {
        User currentUser = getAuthenticatedUser(userEmail);

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        validateCustomerAccess(job, currentUser);

        if (job.getStatus() != JobStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment can only be simulated for completed jobs");
        }

        Payment payment = paymentRepository.findByJobId(jobId)
                .orElseGet(() -> {
                    ServiceRequest request = job.getServiceRequest();
                    BigDecimal amount = (request != null && request.getBudget() != null) ? request.getBudget() : BigDecimal.ZERO;
                    User customer = request != null ? request.getCustomer() : currentUser;
                    Payment newPayment = new Payment(job, customer, amount, PaymentStatus.PENDING);
                    return paymentRepository.save(newPayment);
                });

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return PaymentResponse.fromEntity(payment);
        }

        if (shouldSucceed) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setTransactionReference("DEMO-TXN-" + System.currentTimeMillis());
            payment.setFailureReason(null);
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason(failureReason != null && !failureReason.isBlank() ? failureReason : "Simulated payment failure");
        }

        Payment updated = paymentRepository.save(payment);
        return PaymentResponse.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentForJob(Long jobId, String userEmail) {
        User currentUser = getAuthenticatedUser(userEmail);

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        validateCustomerAccess(job, currentUser);

        Payment payment = paymentRepository.findByJobId(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No payment found for job #" + jobId));

        return PaymentResponse.fromEntity(payment);
    }
}
