package com.sih.cooperative.controller;

import com.sih.cooperative.dto.CreateRatingRequest;
import com.sih.cooperative.dto.RatingResponse;
import com.sih.cooperative.service.RatingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/customer/ratings")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerRatingController {

    private final RatingService ratingService;

    public CustomerRatingController(RatingService ratingService) {
        this.ratingService = ratingService;
    }

    @PostMapping("/{jobId}")
    public ResponseEntity<RatingResponse> createRating(
            @PathVariable Long jobId,
            @Valid @RequestBody CreateRatingRequest request,
            Principal principal
    ) {
        RatingResponse response = ratingService.createRating(jobId, request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<RatingResponse> getRatingForJob(
            @PathVariable Long jobId,
            Principal principal
    ) {
        RatingResponse response = ratingService.getRatingForJob(jobId, principal.getName());
        return ResponseEntity.ok(response);
    }
}
