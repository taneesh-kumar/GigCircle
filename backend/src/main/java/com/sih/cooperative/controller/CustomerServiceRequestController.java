package com.sih.cooperative.controller;

import com.sih.cooperative.dto.CreateServiceRequestRequest;
import com.sih.cooperative.dto.ServiceRequestResponse;
import com.sih.cooperative.service.ServiceRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.sih.cooperative.dto.NearbyWorkerSearchResult;
import com.sih.cooperative.entity.ServiceCategory;

import java.util.List;

@RestController
@RequestMapping("/api/customer/requests")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerServiceRequestController {

    private final ServiceRequestService serviceRequestService;

    public CustomerServiceRequestController(ServiceRequestService serviceRequestService) {
        this.serviceRequestService = serviceRequestService;
    }

    @PostMapping
    public ResponseEntity<ServiceRequestResponse> createServiceRequest(
            @Valid @RequestBody CreateServiceRequestRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ServiceRequestResponse response = serviceRequestService.createServiceRequest(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ServiceRequestResponse>> getServiceRequests(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<ServiceRequestResponse> requests = serviceRequestService.getServiceRequestsForCustomer(userDetails.getUsername());
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/nearby-workers")
    public ResponseEntity<NearbyWorkerSearchResult> getNearbyWorkers(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) ServiceCategory category,
            @RequestParam(required = false) Integer radiusKm,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        NearbyWorkerSearchResult result = serviceRequestService.findNearbyWorkers(latitude, longitude, category, radiusKm, userDetails.getUsername());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/nearby-workers")
    public ResponseEntity<NearbyWorkerSearchResult> getNearbyWorkersForRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        NearbyWorkerSearchResult result = serviceRequestService.findNearbyWorkersForRequest(id, userDetails.getUsername());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/recommendations")
    public ResponseEntity<com.sih.cooperative.dto.WorkerRecommendationResult> getWorkerRecommendations(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) ServiceCategory category,
            @RequestParam(required = false) Integer radiusKm,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        com.sih.cooperative.dto.WorkerRecommendationResult result = serviceRequestService.getWorkerRecommendations(latitude, longitude, category, radiusKm, userDetails.getUsername());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/recommendations")
    public ResponseEntity<com.sih.cooperative.dto.WorkerRecommendationResult> getWorkerRecommendationsForRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        com.sih.cooperative.dto.WorkerRecommendationResult result = serviceRequestService.getWorkerRecommendationsForRequest(id, userDetails.getUsername());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceRequestResponse> getServiceRequestDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ServiceRequestResponse response = serviceRequestService.getServiceRequestDetail(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ServiceRequestResponse> cancelServiceRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ServiceRequestResponse response = serviceRequestService.cancelServiceRequest(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
