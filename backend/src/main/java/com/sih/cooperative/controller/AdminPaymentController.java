package com.sih.cooperative.controller;

import com.sih.cooperative.dto.PaymentResponse;
import com.sih.cooperative.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/admin/payments")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPaymentController {

    private final PaymentService paymentService;

    public AdminPaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getAllPayments(Principal principal) {
        List<PaymentResponse> payments = paymentService.getAllPayments(principal.getName());
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/summary")
    public ResponseEntity<com.sih.cooperative.dto.AdminPaymentSummaryResponse> getPaymentSummary(Principal principal) {
        com.sih.cooperative.dto.AdminPaymentSummaryResponse summary = paymentService.getPaymentSummary(principal.getName());
        return ResponseEntity.ok(summary);
    }
}
