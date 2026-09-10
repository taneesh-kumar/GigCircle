package com.sih.cooperative.controller;

import com.sih.cooperative.dto.*;
import com.sih.cooperative.service.EarningService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/worker/earnings")
@PreAuthorize("hasRole('WORKER')")
public class WorkerEarningsController {

    private final EarningService earningService;

    public WorkerEarningsController(EarningService earningService) {
        this.earningService = earningService;
    }

    @GetMapping
    public ResponseEntity<List<EarningResponse>> getWorkerEarnings(Principal principal) {
        List<EarningResponse> earnings = earningService.getWorkerEarnings(principal.getName());
        return ResponseEntity.ok(earnings);
    }

    @GetMapping("/summary")
    public ResponseEntity<WorkerEarningsSummary> getWorkerEarningsSummary(Principal principal) {
        WorkerEarningsSummary summary = earningService.getWorkerEarningsSummary(principal.getName());
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/{earningId}")
    public ResponseEntity<EarningResponse> getWorkerEarningById(@PathVariable Long earningId, Principal principal) {
        EarningResponse earning = earningService.getWorkerEarningById(earningId, principal.getName());
        return ResponseEntity.ok(earning);
    }
}
