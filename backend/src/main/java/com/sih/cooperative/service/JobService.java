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

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final UserRepository userRepository;
    private final WorkerMatchingService workerMatchingService;
    private final NotificationService notificationService;
    private final EarningService earningService;

    public JobService(JobRepository jobRepository,
                      ServiceRequestRepository serviceRequestRepository,
                      WorkerProfileRepository workerProfileRepository,
                      UserRepository userRepository,
                      WorkerMatchingService workerMatchingService,
                      NotificationService notificationService,
                      EarningService earningService) {
        this.jobRepository = jobRepository;
        this.serviceRequestRepository = serviceRequestRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.userRepository = userRepository;
        this.workerMatchingService = workerMatchingService;
        this.notificationService = notificationService;
        this.earningService = earningService;
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

        if (!worker.isActive()) {
            return List.of();
        }

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

    @Transactional(readOnly = true)
    public List<JobResponse> getAssignedJobsForWorker(String workerEmail) {
        User worker = getAuthenticatedWorker(workerEmail);
        return jobRepository.findByWorkerIdOrderByCreatedAtDesc(worker.getId())
                .stream()
                .map(JobResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public JobResponse acceptJob(Long requestId, String workerEmail) {
        User worker = getAuthenticatedWorker(workerEmail);

        if (!worker.isActive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Worker account is deactivated");
        }

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

            // Segment 8 Notifications
            notificationService.createNotification(
                    request.getCustomer(),
                    NotificationType.WORKER_ASSIGNED,
                    "Worker assigned",
                    "A worker has been assigned to your service request.",
                    "SERVICE_REQUEST",
                    request.getId()
            );

            notificationService.createNotification(
                    worker,
                    NotificationType.WORKER_ASSIGNED,
                    "New job assigned",
                    "You have been assigned a new service job.",
                    "JOB",
                    savedJob.getId()
            );

            return JobResponse.fromEntity(savedJob);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Service request has already been assigned.");
        }
    }

    @Transactional
    public JobResponse startJob(Long jobId, String workerEmail) {
        try {
            User worker = getAuthenticatedWorker(workerEmail);

            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

            if (!job.getWorker().getId().equals(worker.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: job assigned to another worker");
            }

            if (job.getStatus() != JobStatus.ACCEPTED) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Job must be ACCEPTED before it can be started");
            }

            job.setStatus(JobStatus.IN_PROGRESS);
            if (job.getStartedAt() == null) {
                job.setStartedAt(LocalDateTime.now());
            }

            Job savedJob = jobRepository.save(job);

            // Segment 8 Notification
            notificationService.createNotification(
                    job.getServiceRequest().getCustomer(),
                    NotificationType.JOB_STARTED,
                    "Job started",
                    "Your assigned worker has started the job.",
                    "JOB",
                    savedJob.getId()
            );

            return JobResponse.fromEntity(savedJob);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            notificationService.createAdminNotification(
                    NotificationType.SYSTEM_ERROR,
                    "System operation failed",
                    "A service operation failed while processing Job #" + jobId + ". Please review the system activity.",
                    "JOB",
                    jobId
            );
            throw ex;
        }
    }

    @Transactional
    public JobResponse completeJob(Long jobId, String workerEmail) {
        Job savedJob = null;
        try {
            User worker = getAuthenticatedWorker(workerEmail);

            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

            if (!job.getWorker().getId().equals(worker.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: job assigned to another worker");
            }

            if (job.getStatus() != JobStatus.IN_PROGRESS) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Only IN_PROGRESS jobs can request completion");
            }

            job.setStatus(JobStatus.COMPLETED);
            job.setCompletedAt(LocalDateTime.now());

            savedJob = jobRepository.save(job);
            
            try {
                earningService.generateEarningForCompletedJob(savedJob);
            } catch (Exception ex) {
                // Earning generation logging if needed
            }
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            notificationService.createAdminNotification(
                    NotificationType.SYSTEM_ERROR,
                    "System operation failed",
                    "A service operation failed while processing Job #" + jobId + ". Please review the system activity.",
                    "JOB",
                    jobId
            );
            throw ex;
        }

        try {
            notificationService.createNotification(
                    savedJob.getServiceRequest().getCustomer(),
                    NotificationType.JOB_COMPLETED,
                    "Job Completed",
                    "Your worker has completed the service for Job #" + savedJob.getId() + ".",
                    "JOB",
                    savedJob.getId()
            );

            notificationService.createNotification(
                    savedJob.getWorker(),
                    NotificationType.JOB_COMPLETED,
                    "Job Completed",
                    "You have successfully completed Job #" + savedJob.getId() + ".",
                    "JOB",
                    savedJob.getId()
            );
        } catch (Exception ex) {
            // Non-critical
        }

        return JobResponse.fromEntity(savedJob);
    }

    @Transactional
    public JobResponse declineJob(Long jobId, String workerEmail) {
        User worker = getAuthenticatedWorker(workerEmail);

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (!job.getWorker().getId().equals(worker.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: job assigned to another worker");
        }

        if (job.getStatus() != JobStatus.ACCEPTED && job.getStatus() != JobStatus.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only ACCEPTED or IN_PROGRESS jobs can be declined");
        }

        ServiceRequest request = job.getServiceRequest();

        // Trigger Admin Notification before deleting the job record
        notificationService.createAdminNotification(
                NotificationType.WORKER_DECLINED_JOB,
                "Worker declined job",
                worker.getName() + " declined the '" + request.getDescription() + "' request from " + request.getCustomer().getName() + ".",
                "SERVICE_REQUEST",
                request.getId()
        );

        // Delete the Job record so that the service request becomes open for other workers
        jobRepository.delete(job);

        // Return a mock response representing the declined job state
        job.setStatus(JobStatus.DECLINED);
        return JobResponse.fromEntity(job);
    }
}
