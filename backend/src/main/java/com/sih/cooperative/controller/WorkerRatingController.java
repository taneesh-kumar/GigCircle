package com.sih.cooperative.controller;

import com.sih.cooperative.dto.RatingResponse;
import com.sih.cooperative.dto.WorkerRatingSummary;
import com.sih.cooperative.service.RatingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/worker/ratings")
@PreAuthorize("hasRole('WORKER')")
public class WorkerRatingController {

    private final RatingService ratingService;

    public WorkerRatingController(RatingService ratingService) {
        this.ratingService = ratingService;
    }

    @GetMapping
    public ResponseEntity<List<RatingResponse>> getWorkerRatings(Principal principal) {
        List<RatingResponse> ratings = ratingService.getWorkerRatings(principal.getName());
        return ResponseEntity.ok(ratings);
    }

    @GetMapping("/summary")
    public ResponseEntity<WorkerRatingSummary> getWorkerRatingSummary(Principal principal) {
        WorkerRatingSummary summary = ratingService.getWorkerRatingSummary(principal.getName());
        return ResponseEntity.ok(summary);
    }
}
