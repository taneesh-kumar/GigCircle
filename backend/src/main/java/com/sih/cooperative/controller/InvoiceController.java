package com.sih.cooperative.controller;

import com.sih.cooperative.dto.InvoiceResponse;
import com.sih.cooperative.service.InvoiceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @PostMapping("/job/{jobId}/generate")
    public ResponseEntity<InvoiceResponse> generateInvoice(
            @PathVariable Long jobId,
            @AuthenticationPrincipal String userEmail) {
        InvoiceResponse response = invoiceService.getOrCreateInvoiceForJob(jobId, userEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<InvoiceResponse> getInvoiceForJob(
            @PathVariable Long jobId,
            @AuthenticationPrincipal String userEmail) {
        InvoiceResponse response = invoiceService.getInvoiceForJob(jobId, userEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{invoiceId}")
    public ResponseEntity<InvoiceResponse> getInvoiceById(
            @PathVariable Long invoiceId,
            @AuthenticationPrincipal String userEmail) {
        InvoiceResponse response = invoiceService.getInvoiceById(invoiceId, userEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-invoices")
    public ResponseEntity<List<InvoiceResponse>> getMyInvoices(
            @AuthenticationPrincipal String userEmail) {
        List<InvoiceResponse> responses = invoiceService.getMyInvoices(userEmail);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/admin")
    public ResponseEntity<List<InvoiceResponse>> getAdminInvoices(
            @AuthenticationPrincipal String adminEmail) {
        List<InvoiceResponse> responses = invoiceService.getAdminInvoices(adminEmail);
        return ResponseEntity.ok(responses);
    }
}
