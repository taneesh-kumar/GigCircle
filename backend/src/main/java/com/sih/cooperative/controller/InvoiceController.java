package com.sih.cooperative.controller;

import com.sih.cooperative.dto.InvoiceResponse;
import com.sih.cooperative.service.InvoiceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
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
            Principal principal) {
        InvoiceResponse response = invoiceService.getOrCreateInvoiceForJob(jobId, principal.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<InvoiceResponse> getInvoiceForJob(
            @PathVariable Long jobId,
            Principal principal) {
        InvoiceResponse response = invoiceService.getInvoiceForJob(jobId, principal.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{invoiceId}")
    public ResponseEntity<InvoiceResponse> getInvoiceById(
            @PathVariable Long invoiceId,
            Principal principal) {
        InvoiceResponse response = invoiceService.getInvoiceById(invoiceId, principal.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-invoices")
    public ResponseEntity<List<InvoiceResponse>> getMyInvoices(
            Principal principal) {
        List<InvoiceResponse> responses = invoiceService.getMyInvoices(principal.getName());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/admin")
    public ResponseEntity<List<InvoiceResponse>> getAdminInvoices(
            Principal principal) {
        List<InvoiceResponse> responses = invoiceService.getAdminInvoices(principal.getName());
        return ResponseEntity.ok(responses);
    }
}
