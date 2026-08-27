package com.sih.cooperative.controller;

import com.sih.cooperative.dto.CreateWorkerProfileRequest;
import com.sih.cooperative.dto.UpdateWorkerProfileRequest;
import com.sih.cooperative.dto.WorkerProfileResponse;
import com.sih.cooperative.service.WorkerProfileService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/worker/profile")
@PreAuthorize("hasRole('WORKER')")
public class WorkerProfileController {

    private final WorkerProfileService workerProfileService;

    public WorkerProfileController(WorkerProfileService workerProfileService) {
        this.workerProfileService = workerProfileService;
    }

    @GetMapping
    public ResponseEntity<WorkerProfileResponse> getWorkerProfile(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        WorkerProfileResponse response = workerProfileService.getWorkerProfile(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<WorkerProfileResponse> createWorkerProfile(
            @Valid @RequestBody CreateWorkerProfileRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        WorkerProfileResponse response = workerProfileService.createWorkerProfile(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping
    public ResponseEntity<WorkerProfileResponse> updateWorkerProfile(
            @Valid @RequestBody UpdateWorkerProfileRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        WorkerProfileResponse response = workerProfileService.updateWorkerProfile(request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/availability")
    public ResponseEntity<WorkerProfileResponse> toggleAvailability(
            @RequestBody Map<String, Boolean> payload,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Boolean isAvailable = payload != null ? payload.get("isAvailable") : null;
        WorkerProfileResponse response = workerProfileService.toggleAvailability(isAvailable, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
