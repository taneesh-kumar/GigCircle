package com.sih.cooperative.controller;

import com.sih.cooperative.dto.EarningResponse;
import com.sih.cooperative.service.EarningService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/customer/earnings")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerEarningsController {

    private final EarningService earningService;

    public CustomerEarningsController(EarningService earningService) {
        this.earningService = earningService;
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<EarningResponse> getCustomerJobEarning(@PathVariable Long jobId, Principal principal) {
        EarningResponse earning = earningService.getCustomerJobEarning(jobId, principal.getName());
        return ResponseEntity.ok(earning);
    }
}
