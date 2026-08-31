package com.sih.cooperative.controller;

import com.sih.cooperative.dto.AdminPaymentSummaryResponse;
import com.sih.cooperative.dto.PaymentResponse;
import com.sih.cooperative.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    public ResponseEntity<List<PaymentResponse>> getAllPayments(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<PaymentResponse> payments = paymentService.getAdminPayments(userDetails.getUsername());
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/summary")
    public ResponseEntity<AdminPaymentSummaryResponse> getPaymentSummary(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AdminPaymentSummaryResponse summary = paymentService.getAdminPaymentSummary(userDetails.getUsername());
        return ResponseEntity.ok(summary);
    }
}
