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
    public ResponseEntity<PageResponse<AdminUserResponse>> getUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) com.sih.cooperative.entity.AccountStatus status,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            Principal principal) {
        PageResponse<AdminUserResponse> users = adminOperationsService.getUsersPaginated(role, status, active, search, page, size, sort, principal.getName());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<AdminUserDetailResponse> getUserDetail(
            @PathVariable Long userId,
            Principal principal) {
        AdminUserDetailResponse response = adminOperationsService.getUserDetail(userId, principal.getName());
        return ResponseEntity.ok(response);
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

    @PostMapping("/users/{userId}/activate")
    public ResponseEntity<AdminUserResponse> activateUser(
            @PathVariable Long userId,
            Principal principal) {
        AdminUserResponse response = adminOperationsService.activateUser(userId, principal.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/users/{userId}/deactivate")
    public ResponseEntity<AdminUserResponse> deactivateUser(
            @PathVariable Long userId,
            @RequestBody(required = false) UpdateUserStatusRequest request,
            Principal principal) {
        String reason = request != null ? request.getReason() : null;
        AdminUserResponse response = adminOperationsService.deactivateUser(userId, reason, principal.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/users/{userId}/suspend")
    public ResponseEntity<AdminUserResponse> suspendUser(
            @PathVariable Long userId,
            @RequestBody(required = false) UpdateUserStatusRequest request,
            Principal principal) {
        String reason = request != null ? request.getReason() : null;
        AdminUserResponse response = adminOperationsService.suspendUser(userId, reason, principal.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/users/{userId}/reactivate")
    public ResponseEntity<AdminUserResponse> reactivateUser(
            @PathVariable Long userId,
            Principal principal) {
        AdminUserResponse response = adminOperationsService.reactivateUser(userId, principal.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/service-requests")
    public ResponseEntity<List<AdminServiceRequestResponse>> getServiceRequests(Principal principal) {
        List<AdminServiceRequestResponse> requests = adminOperationsService.getServiceRequests(principal.getName());
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/jobs")
    public ResponseEntity<List<AdminJobResponse>> getJobs(
            @RequestParam(required = false) String status,
            Principal principal) {
        List<AdminJobResponse> jobs = adminOperationsService.getJobsFiltered(status, principal.getName());
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/analytics/service-demand")
    public ResponseEntity<List<ServiceDemandResponse>> getServiceDemand(Principal principal) {
        List<ServiceDemandResponse> demand = adminOperationsService.getServiceDemand(principal.getName());
        return ResponseEntity.ok(demand);
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<OperationalAlertResponse>> getOperationalAlerts(Principal principal) {
        List<OperationalAlertResponse> alerts = adminOperationsService.getOperationalAlerts(principal.getName());
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/ratings")
    public ResponseEntity<List<AdminRatingResponse>> getRatings(Principal principal) {
        List<AdminRatingResponse> ratings = adminOperationsService.getRatings(principal.getName());
        return ResponseEntity.ok(ratings);
    }

    @GetMapping("/activity")
    public ResponseEntity<PageResponse<AdminActivityResponse>> getActivity(
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) Long adminId,
            @RequestParam(required = false) Long targetUserId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate from,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            Principal principal) {
        PageResponse<AdminActivityResponse> activities = adminOperationsService.getActivityPaginated(actionType, adminId, targetUserId, search, from, to, page, size, sort, principal.getName());
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/financial/summary")
    public ResponseEntity<AdminFinancialSummaryResponse> getFinancialSummary(
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate from,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate to,
            Principal principal) {
        AdminFinancialSummaryResponse response = adminOperationsService.getFinancialSummary(from, to, principal.getName());
        return ResponseEntity.ok(response);
    }
}

