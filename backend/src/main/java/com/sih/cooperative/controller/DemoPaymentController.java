package com.sih.cooperative.controller;

import com.sih.cooperative.dto.CompletePaymentRequest;
import com.sih.cooperative.dto.PaymentRequest;
import com.sih.cooperative.dto.PaymentResponse;
import com.sih.cooperative.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Demo payment controller for the SIH presentation.
 * Provides a local simulated payment gateway — does NOT call PhonePe or any external gateway.
 */
@RestController
@RequestMapping("/api/payments")
@PreAuthorize("hasRole('CUSTOMER')")
public class DemoPaymentController {

    private final PaymentService paymentService;

    public DemoPaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /**
     * Initiate a demo payment for a COMPLETED job.
     * Creates a PENDING payment record with a demo transaction ID.
     */
    @PostMapping("/initiate")
    public ResponseEntity<PaymentResponse> initiatePayment(
            @Valid @RequestBody PaymentRequest request,
            Principal principal) {
        PaymentResponse payment = paymentService.initiatePayment(principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(payment);
    }

    /**
     * Complete a demo payment using the selected payment method (UPI / CARD / CASH).
     */
    @PostMapping("/{paymentId}/complete")
    public ResponseEntity<PaymentResponse> completePayment(
            @PathVariable Long paymentId,
            @Valid @RequestBody CompletePaymentRequest request,
            Principal principal) {
        PaymentResponse payment = paymentService.completePayment(principal.getName(), paymentId, request);
        return ResponseEntity.ok(payment);
    }

    /**
     * Return the authenticated customer's persisted payment history.
     */
    @GetMapping("/customer")
    public ResponseEntity<List<PaymentResponse>> getPaymentHistory(Principal principal) {
        List<PaymentResponse> payments = paymentService.getCustomerPaymentHistory(principal.getName());
        return ResponseEntity.ok(payments);
    }

    /**
     * Return the existing payment for a specific job.
     * This supports refreshing the customer page to retrieve an existing PAID payment.
     */
    @GetMapping("/job/{jobId}")
    public ResponseEntity<PaymentResponse> getPaymentByJob(
            @PathVariable Long jobId,
            Principal principal) {
        PaymentResponse payment = paymentService.getPaymentByJob(principal.getName(), jobId);
        return ResponseEntity.ok(payment);
    }

    /**
     * Return a specific payment by ID.
     */
    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentResponse> getPaymentById(
            @PathVariable Long paymentId,
            Principal principal) {
        PaymentResponse payment = paymentService.getPaymentById(principal.getName(), paymentId);
        return ResponseEntity.ok(payment);
    }
}