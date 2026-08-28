package com.sih.cooperative.controller;

import com.sih.cooperative.dto.*;
import com.sih.cooperative.entity.Role;
import com.sih.cooperative.service.AdminOperationsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOperationsController {

    private final AdminOperationsService adminOperationsService;

    public AdminOperationsController(AdminOperationsService adminOperationsService) {
        this.adminOperationsService = adminOperationsService;
    }

    @GetMapping("/overview")
    public ResponseEntity<PlatformOverviewSummary> getPlatformOverview(Principal principal) {
        PlatformOverviewSummary summary = adminOperationsService.getPlatformOverview(principal.getName());
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> getUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search,
            Principal principal) {
        List<AdminUserResponse> users = adminOperationsService.getUsers(role, active, search, principal.getName());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/workers")
    public ResponseEntity<List<AdminWorkerResponse>> getWorkers(Principal principal) {
        List<AdminWorkerResponse> workers = adminOperationsService.getWorkers(principal.getName());
        return ResponseEntity.ok(workers);
    }

    @PostMapping("/workers/{workerId}/activate")
    public ResponseEntity<AdminWorkerResponse> activateWorker(
            @PathVariable Long workerId,
            Principal principal) {
        AdminWorkerResponse worker = adminOperationsService.activateWorker(workerId, principal.getName());
        return ResponseEntity.ok(worker);
    }

    @PostMapping("/workers/{workerId}/deactivate")
    public ResponseEntity<AdminWorkerResponse> deactivateWorker(
            @PathVariable Long workerId,
            Principal principal) {
        AdminWorkerResponse worker = adminOperationsService.deactivateWorker(workerId, principal.getName());
        return ResponseEntity.ok(worker);
    }

    @GetMapping("/service-requests")
    public ResponseEntity<List<AdminServiceRequestResponse>> getServiceRequests(Principal principal) {
        List<AdminServiceRequestResponse> requests = adminOperationsService.getServiceRequests(principal.getName());
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/jobs")
    public ResponseEntity<List<AdminJobResponse>> getJobs(Principal principal) {
        List<AdminJobResponse> jobs = adminOperationsService.getJobs(principal.getName());
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/ratings")
    public ResponseEntity<List<AdminRatingResponse>> getRatings(Principal principal) {
        List<AdminRatingResponse> ratings = adminOperationsService.getRatings(principal.getName());
        return ResponseEntity.ok(ratings);
    }

    @GetMapping("/activity")
    public ResponseEntity<List<AdminActivityResponse>> getActivity(Principal principal) {
        List<AdminActivityResponse> activities = adminOperationsService.getActivity(principal.getName());
        return ResponseEntity.ok(activities);
    }
}
