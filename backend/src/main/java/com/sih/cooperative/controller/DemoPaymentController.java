package com.sih.cooperative.controller;

import com.sih.cooperative.dto.PaymentResponse;
import com.sih.cooperative.dto.SimulatePaymentRequest;
import com.sih.cooperative.service.DemoPaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/demo-payments")
public class DemoPaymentController {

    private final DemoPaymentService demoPaymentService;

    public DemoPaymentController(DemoPaymentService demoPaymentService) {
        this.demoPaymentService = demoPaymentService;
    }

    private String extractEmail(Object principal) {
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }
        if (principal instanceof String str) {
            return str;
        }
        if (principal != null) {
            return principal.toString();
        }
        return null;
    }

    @PostMapping("/jobs/{jobId}/initiate")
    public ResponseEntity<PaymentResponse> initiatePayment(
            @PathVariable Long jobId,
            @AuthenticationPrincipal Object principal) {
        String userEmail = extractEmail(principal);
        PaymentResponse response = demoPaymentService.initiatePayment(jobId, userEmail);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/jobs/{jobId}/simulate")
    public ResponseEntity<PaymentResponse> simulatePayment(
            @PathVariable Long jobId,
            @RequestBody(required = false) SimulatePaymentRequest request,
            @AuthenticationPrincipal Object principal) {
        String userEmail = extractEmail(principal);
        boolean shouldSucceed = request == null || request.isShouldSucceed();
        String failureReason = request != null ? request.getFailureReason() : null;
        PaymentResponse response = demoPaymentService.simulatePayment(jobId, shouldSucceed, failureReason, userEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<PaymentResponse> getPaymentForJob(
            @PathVariable Long jobId,
            @AuthenticationPrincipal Object principal) {
        String userEmail = extractEmail(principal);
        PaymentResponse response = demoPaymentService.getPaymentForJob(jobId, userEmail);
        return ResponseEntity.ok(response);
    }
}
