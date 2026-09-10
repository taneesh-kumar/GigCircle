package com.sih.cooperative.controller;

import com.sih.cooperative.dto.*;
import com.sih.cooperative.service.EarningService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/admin/revenue")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRevenueController {

    private final EarningService earningService;

    public AdminRevenueController(EarningService earningService) {
        this.earningService = earningService;
    }

    @GetMapping("/summary")
    public ResponseEntity<PlatformRevenueSummary> getPlatformRevenueSummary(Principal principal) {
        PlatformRevenueSummary summary = earningService.getPlatformRevenueSummary(principal.getName());
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/earnings")
    public ResponseEntity<List<EarningResponse>> getPlatformEarningsLedger(Principal principal) {
        List<EarningResponse> ledger = earningService.getPlatformEarningsLedger(principal.getName());
        return ResponseEntity.ok(ledger);
    }
}
