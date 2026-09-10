package com.sih.cooperative.controller;

import com.sih.cooperative.dto.AdminVerificationReviewRequest;
import com.sih.cooperative.dto.VerificationDocumentResponse;
import com.sih.cooperative.dto.WorkerVerificationResponse;
import com.sih.cooperative.entity.VerificationStatus;
import com.sih.cooperative.service.WorkerVerificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/verifications")
@PreAuthorize("hasRole('ADMIN')")
public class AdminVerificationController {

    private final WorkerVerificationService workerVerificationService;

    public AdminVerificationController(WorkerVerificationService workerVerificationService) {
        this.workerVerificationService = workerVerificationService;
    }

    @GetMapping
    public ResponseEntity<?> getVerifications(
            @RequestParam(required = false) VerificationStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (page != null || size != null || search != null) {
            int p = (page != null) ? page : 0;
            int s = (size != null) ? size : 15;
            com.sih.cooperative.dto.PageResponse<WorkerVerificationResponse> pageRes =
                    workerVerificationService.getAdminVerificationsPaginated(status, search, p, s, userDetails.getUsername());
            return ResponseEntity.ok(pageRes);
        }
        List<WorkerVerificationResponse> list = workerVerificationService.getAdminVerifications(status, userDetails.getUsername());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkerVerificationResponse> getVerificationById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        WorkerVerificationResponse response = workerVerificationService.getAdminVerificationById(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{verificationId}/documents/{documentId}/preview")
    public ResponseEntity<VerificationDocumentResponse> previewDocument(
            @PathVariable Long verificationId,
            @PathVariable Long documentId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        VerificationDocumentResponse response = workerVerificationService.previewAdminDocument(verificationId, documentId, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }


    @PostMapping("/{id}/approve")
    public ResponseEntity<WorkerVerificationResponse> approveVerification(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        WorkerVerificationResponse response = workerVerificationService.approveVerification(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/request-changes")
    public ResponseEntity<WorkerVerificationResponse> requestChanges(
            @PathVariable Long id,
            @RequestBody(required = false) AdminVerificationReviewRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        WorkerVerificationResponse response = workerVerificationService.requestChanges(id, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<WorkerVerificationResponse> rejectVerification(
            @PathVariable Long id,
            @RequestBody(required = false) AdminVerificationReviewRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        WorkerVerificationResponse response = workerVerificationService.rejectVerification(id, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/suspend")
    public ResponseEntity<WorkerVerificationResponse> suspendVerification(
            @PathVariable Long id,
            @RequestBody(required = false) AdminVerificationReviewRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        WorkerVerificationResponse response = workerVerificationService.suspendVerification(id, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/reinstate")
    public ResponseEntity<WorkerVerificationResponse> reinstateVerification(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        WorkerVerificationResponse response = workerVerificationService.reinstateVerification(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
