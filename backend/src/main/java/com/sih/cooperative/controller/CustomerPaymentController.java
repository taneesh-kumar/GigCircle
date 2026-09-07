package com.sih.cooperative.controller;

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

@RestController
@RequestMapping("/api/customer/payments")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerPaymentController {

    private final PaymentService paymentService;

    public CustomerPaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<PaymentResponse> initiatePayment(
            @Valid @RequestBody PaymentRequest request,
            Principal principal) {
        PaymentResponse payment = paymentService.initiatePayment(principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(payment);
    }

    /**
     * Frontend polls this endpoint after redirect-back from PhonePe to check
     * whether the webhook has already updated the payment to a terminal state.
     * If still PENDING, it triggers a fresh status verification against PhonePe.
     */
    @GetMapping("/{paymentId}/status")
    public ResponseEntity<PaymentResponse> getPaymentStatus(
            @PathVariable Long paymentId,
            Principal principal) {
        PaymentResponse payment = paymentService.verifyPaymentStatus(principal.getName(), paymentId);
        return ResponseEntity.ok(payment);
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getPaymentHistory(Principal principal) {
        List<PaymentResponse> payments = paymentService.getCustomerPaymentHistory(principal.getName());
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<PaymentResponse> getPaymentByJob(
            @PathVariable Long jobId,
            Principal principal) {
        PaymentResponse payment = paymentService.getPaymentByJob(principal.getName(), jobId);
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentResponse> getPaymentById(
            @PathVariable Long paymentId,
            Principal principal) {
        PaymentResponse payment = paymentService.getPaymentById(principal.getName(), paymentId);
        return ResponseEntity.ok(payment);
    }
}
