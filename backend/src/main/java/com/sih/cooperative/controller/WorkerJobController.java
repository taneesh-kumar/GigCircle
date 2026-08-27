package com.sih.cooperative.controller;

import com.sih.cooperative.dto.JobResponse;
import com.sih.cooperative.dto.ServiceRequestResponse;
import com.sih.cooperative.service.JobService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/worker/jobs")
@PreAuthorize("hasRole('WORKER')")
public class WorkerJobController {

    private final JobService jobService;

    public WorkerJobController(JobService jobService) {
        this.jobService = jobService;
    }

    @GetMapping
    public ResponseEntity<List<ServiceRequestResponse>> getEligibleJobs(Principal principal) {
        List<ServiceRequestResponse> jobs = jobService.getEligibleJobsForWorker(principal.getName());
        return ResponseEntity.ok(jobs);
    }

    @PostMapping("/{requestId}/accept")
    public ResponseEntity<JobResponse> acceptJob(@PathVariable Long requestId, Principal principal) {
        JobResponse response = jobService.acceptJob(requestId, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
