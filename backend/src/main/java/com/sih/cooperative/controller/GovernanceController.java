package com.sih.cooperative.controller;

import com.sih.cooperative.dto.*;
import com.sih.cooperative.entity.ProposalCategory;
import com.sih.cooperative.entity.ProposalStatus;
import com.sih.cooperative.service.GovernanceService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/governance")
public class GovernanceController {

    private final GovernanceService governanceService;

    public GovernanceController(GovernanceService governanceService) {
        this.governanceService = governanceService;
    }

    /**
     * Create a new proposal (WORKER or ADMIN).
     */
    @PostMapping("/proposals")
    public ResponseEntity<ProposalResponse> createProposal(
            @Valid @RequestBody CreateProposalRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ProposalResponse response = governanceService.createProposal(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * List / browse proposals with optional filtering.
     */
    @GetMapping("/proposals")
    public ResponseEntity<Page<ProposalResponse>> getProposals(
            @RequestParam(required = false) ProposalStatus status,
            @RequestParam(required = false) ProposalCategory category,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String username = userDetails != null ? userDetails.getUsername() : null;
        Page<ProposalResponse> proposals = governanceService.getProposals(status, category, pageable, username);
        return ResponseEntity.ok(proposals);
    }

    /**
     * Get single proposal by ID with caller's vote status and live tally.
     */
    @GetMapping("/proposals/{id}")
    public ResponseEntity<ProposalResponse> getProposalById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String username = userDetails != null ? userDetails.getUsername() : null;
        ProposalResponse response = governanceService.getProposalById(id, username);
        return ResponseEntity.ok(response);
    }

    /**
     * Open voting on a proposal (Admin or Proposal Creator).
     */
    @PostMapping("/proposals/{id}/open")
    public ResponseEntity<ProposalResponse> openVoting(
            @PathVariable Long id,
            @RequestBody(required = false) OpenProposalRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ProposalResponse response = governanceService.openVoting(id, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * Cast vote on a proposal.
     * Only authenticated WORKER can vote.
     */
    @PostMapping("/proposals/{id}/vote")
    @PreAuthorize("hasRole('WORKER')")
    public ResponseEntity<ProposalResponse> castVote(
            @PathVariable Long id,
            @Valid @RequestBody CastVoteRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ProposalResponse response = governanceService.castVote(id, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * Close voting and tally final results (Admin or Proposal Creator).
     */
    @PostMapping("/proposals/{id}/close")
    public ResponseEntity<ProposalResultResponse> closeVoting(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ProposalResultResponse response = governanceService.closeVoting(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * Get computed proposal results.
     */
    @GetMapping("/proposals/{id}/results")
    public ResponseEntity<ProposalResultResponse> getProposalResults(
            @PathVariable Long id
    ) {
        ProposalResultResponse response = governanceService.getProposalResults(id);
        return ResponseEntity.ok(response);
    }
}
