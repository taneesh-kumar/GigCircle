package com.sih.cooperative.controller;

import com.sih.cooperative.dto.*;
import com.sih.cooperative.service.WorkerVerificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/worker/verification")
@PreAuthorize("hasRole('WORKER')")
public class WorkerVerificationController {

    private final WorkerVerificationService workerVerificationService;

    public WorkerVerificationController(WorkerVerificationService workerVerificationService) {
        this.workerVerificationService = workerVerificationService;
    }

    @GetMapping
    public ResponseEntity<WorkerVerificationResponse> getWorkerVerification(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        WorkerVerificationResponse response = workerVerificationService.getWorkerVerification(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<WorkerVerificationResponse> createWorkerVerification(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        WorkerVerificationResponse response = workerVerificationService.createWorkerVerification(userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/documents")
    public ResponseEntity<VerificationDocumentResponse> submitDocument(
            @Valid @RequestBody SubmitVerificationDocumentRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        VerificationDocumentResponse response = workerVerificationService.submitDocument(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/documents/{id}")
    public ResponseEntity<VerificationDocumentResponse> updateDocument(
            @PathVariable Long id,
            @RequestBody UpdateVerificationDocumentRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        VerificationDocumentResponse response = workerVerificationService.updateDocument(id, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resubmit")
    public ResponseEntity<WorkerVerificationResponse> resubmitVerification(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        WorkerVerificationResponse response = workerVerificationService.resubmitVerification(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
