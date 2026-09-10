package com.sih.cooperative.controller;

import com.sih.cooperative.dto.PaymentResponse;
import com.sih.cooperative.dto.SimulatePaymentRequest;
import com.sih.cooperative.service.DemoPaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/demo-payments")
public class DemoPaymentController {

    private final DemoPaymentService demoPaymentService;

    public DemoPaymentController(DemoPaymentService demoPaymentService) {
        this.demoPaymentService = demoPaymentService;
    }

    @PostMapping("/jobs/{jobId}/initiate")
    public ResponseEntity<PaymentResponse> initiatePayment(
            @PathVariable Long jobId,
            @AuthenticationPrincipal String userEmail) {
        PaymentResponse response = demoPaymentService.initiatePayment(jobId, userEmail);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/jobs/{jobId}/simulate")
    public ResponseEntity<PaymentResponse> simulatePayment(
            @PathVariable Long jobId,
            @RequestBody(required = false) SimulatePaymentRequest request,
            @AuthenticationPrincipal String userEmail) {
        boolean shouldSucceed = request == null || request.isShouldSucceed();
        String failureReason = request != null ? request.getFailureReason() : null;
        PaymentResponse response = demoPaymentService.simulatePayment(jobId, shouldSucceed, failureReason, userEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<PaymentResponse> getPaymentForJob(
            @PathVariable Long jobId,
            @AuthenticationPrincipal String userEmail) {
        PaymentResponse response = demoPaymentService.getPaymentForJob(jobId, userEmail);
        return ResponseEntity.ok(response);
    }
}
