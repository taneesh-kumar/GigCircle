package com.sih.cooperative.controller;

import com.sih.cooperative.dto.*;
import com.sih.cooperative.entity.DisputeStatus;
import com.sih.cooperative.service.DisputeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/disputes")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDisputeController {

    private final DisputeService disputeService;

    public AdminDisputeController(DisputeService disputeService) {
        this.disputeService = disputeService;
    }

    @GetMapping
    public ResponseEntity<?> getAllDisputes(
            @RequestParam(required = false) DisputeStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (page != null || size != null || search != null) {
            int p = (page != null) ? page : 0;
            int s = (size != null) ? size : 15;
            PageResponse<DisputeDetailResponse> pageRes = disputeService.getDisputesPaginatedForAdmin(status, search, p, s, userDetails.getUsername());
            return ResponseEntity.ok(pageRes);
        }
        List<DisputeDetailResponse> disputes = disputeService.getAllDisputesForAdmin(status, userDetails.getUsername());
        return ResponseEntity.ok(disputes);
    }

    @GetMapping("/{disputeId}")
    public ResponseEntity<DisputeDetailResponse> getDisputeDetails(
            @PathVariable Long disputeId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        DisputeDetailResponse response = disputeService.getDisputeById(disputeId, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{disputeId}/request-response")
    public ResponseEntity<DisputeDetailResponse> requestResponse(
            @PathVariable Long disputeId,
            @Valid @RequestBody AdminRequestResponseRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        DisputeDetailResponse response = disputeService.adminRequestResponse(disputeId, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{disputeId}/review")
    public ResponseEntity<DisputeDetailResponse> moveUnderReview(
            @PathVariable Long disputeId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        DisputeDetailResponse response = disputeService.adminReviewDispute(disputeId, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{disputeId}/resolve")
    public ResponseEntity<DisputeDetailResponse> resolveDispute(
            @PathVariable Long disputeId,
            @Valid @RequestBody AdminResolutionRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        DisputeDetailResponse response = disputeService.adminResolveDispute(disputeId, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{disputeId}/dismiss")
    public ResponseEntity<DisputeDetailResponse> dismissDispute(
            @PathVariable Long disputeId,
            @Valid @RequestBody AdminDismissRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        DisputeDetailResponse response = disputeService.adminDismissDispute(disputeId, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
