package com.sih.cooperative.controller;

import com.sih.cooperative.dto.CreatePaymentRequest;
import com.sih.cooperative.dto.PaymentResponse;
import com.sih.cooperative.dto.PaymentSummaryResponse;
import com.sih.cooperative.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer/payments")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerPaymentController {

    private final PaymentService paymentService;

    public CustomerPaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/summary/{jobId}")
    public ResponseEntity<PaymentSummaryResponse> getPaymentSummary(
            @PathVariable Long jobId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        PaymentSummaryResponse summary = paymentService.getPaymentSummary(jobId, userDetails.getUsername());
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/process")
    public ResponseEntity<PaymentResponse> processPayment(
            @Valid @RequestBody CreatePaymentRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        PaymentResponse response = paymentService.processPayment(request, userDetails.getUsername());
        HttpStatus status = response.getStatus() == com.sih.cooperative.entity.PaymentStatus.SUCCESS ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(status).body(response);
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getCustomerPayments(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<PaymentResponse> payments = paymentService.getCustomerPayments(userDetails.getUsername());
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getPaymentDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        PaymentResponse payment = paymentService.getPaymentDetail(id, userDetails.getUsername());
        return ResponseEntity.ok(payment);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<PaymentResponse> cancelPayment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        PaymentResponse payment = paymentService.cancelPayment(id, userDetails.getUsername());
        return ResponseEntity.ok(payment);
    }

    @PostMapping("/{id}/refund")
    public ResponseEntity<PaymentResponse> refundPayment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        PaymentResponse payment = paymentService.refundPayment(id, userDetails.getUsername());
        return ResponseEntity.ok(payment);
    }
}
