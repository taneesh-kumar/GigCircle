package com.sih.cooperative.controller;

import com.sih.cooperative.dto.*;
import com.sih.cooperative.service.DisputeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/disputes")
public class DisputeController {

    private final DisputeService disputeService;

    public DisputeController(DisputeService disputeService) {
        this.disputeService = disputeService;
    }

    @PostMapping
    public ResponseEntity<DisputeDetailResponse> createDispute(
            @Valid @RequestBody CreateDisputeRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        DisputeDetailResponse response = disputeService.createDispute(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-disputes")
    public ResponseEntity<List<DisputeDetailResponse>> getMyDisputes(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<DisputeDetailResponse> disputes = disputeService.getMyDisputes(userDetails.getUsername());
        return ResponseEntity.ok(disputes);
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<DisputeDetailResponse> getDisputeForJob(
            @PathVariable Long jobId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        DisputeDetailResponse response = disputeService.getDisputeForJob(jobId, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{disputeId}")
    public ResponseEntity<DisputeDetailResponse> getDisputeById(
            @PathVariable Long disputeId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        DisputeDetailResponse response = disputeService.getDisputeById(disputeId, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{disputeId}/respond")
    public ResponseEntity<DisputeDetailResponse> respondToDispute(
            @PathVariable Long disputeId,
            @Valid @RequestBody DisputeResponseRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        DisputeDetailResponse response = disputeService.respondToDispute(disputeId, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
