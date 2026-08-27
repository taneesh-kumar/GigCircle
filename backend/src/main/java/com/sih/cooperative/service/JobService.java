package com.sih.cooperative.service;

import com.sih.cooperative.dto.JobResponse;
import com.sih.cooperative.dto.ServiceRequestResponse;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.JobRepository;
import com.sih.cooperative.repository.ServiceRequestRepository;
import com.sih.cooperative.repository.UserRepository;
import com.sih.cooperative.repository.WorkerProfileRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final UserRepository userRepository;
    private final WorkerMatchingService workerMatchingService;

    public JobService(JobRepository jobRepository,
                      ServiceRequestRepository serviceRequestRepository,
                      WorkerProfileRepository workerProfileRepository,
                      UserRepository userRepository,
                      WorkerMatchingService workerMatchingService) {
        this.jobRepository = jobRepository;
        this.serviceRequestRepository = serviceRequestRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.userRepository = userRepository;
        this.workerMatchingService = workerMatchingService;
    }

    private User getAuthenticatedWorker(String email) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole() != Role.WORKER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only workers can access job management");
        }

        return user;
    }

    @Transactional(readOnly = true)
    public List<ServiceRequestResponse> getEligibleJobsForWorker(String workerEmail) {
        User worker = getAuthenticatedWorker(workerEmail);

        WorkerProfile profile = workerProfileRepository.findByWorkerId(worker.getId())
                .orElse(null);

        if (profile == null || !profile.isAvailable()) {
            return List.of();
        }

        List<ServiceRequest> openRequests = serviceRequestRepository.findAll().stream()
                .filter(req -> req.getStatus() == ServiceRequestStatus.OPEN)
                .filter(req -> !jobRepository.existsByServiceRequestId(req.getId()))
                .filter(req -> workerMatchingService.isWorkerEligible(req, profile))
                .collect(Collectors.toList());

        return openRequests.stream()
                .map(ServiceRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public JobResponse acceptJob(Long requestId, String workerEmail) {
        User worker = getAuthenticatedWorker(workerEmail);

        WorkerProfile profile = workerProfileRepository.findByWorkerId(worker.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Worker profile required to accept jobs"));

        if (!profile.isAvailable()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Worker is currently unavailable");
        }

        ServiceRequest request = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service request not found"));

        if (request.getStatus() == ServiceRequestStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Service request has been cancelled");
        }

        if (request.getStatus() != ServiceRequestStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Service request is not open");
        }

        if (jobRepository.existsByServiceRequestId(requestId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Service request has already been assigned.");
        }

        if (!workerMatchingService.isWorkerEligible(request, profile)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Worker is not eligible for this service request");
        }

        try {
            Job job = new Job(request, worker, JobStatus.ACCEPTED);
            Job savedJob = jobRepository.save(job);
            return JobResponse.fromEntity(savedJob);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Service request has already been assigned.");
        }
    }
}
