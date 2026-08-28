package com.sih.cooperative.service;

import com.sih.cooperative.dto.CreateRatingRequest;
import com.sih.cooperative.dto.RatingResponse;
import com.sih.cooperative.dto.WorkerRatingSummary;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.JobRepository;
import com.sih.cooperative.repository.RatingRepository;
import com.sih.cooperative.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RatingService {

    private final RatingRepository ratingRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public RatingService(RatingRepository ratingRepository,
                          JobRepository jobRepository,
                          UserRepository userRepository,
                          NotificationService notificationService) {
        this.ratingRepository = ratingRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    private User getAuthenticatedCustomer(String email) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole() != Role.CUSTOMER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only customers can submit service ratings");
        }

        return user;
    }

    private User getAuthenticatedWorker(String email) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole() != Role.WORKER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only workers can access worker ratings");
        }

        return user;
    }

    @Transactional
    public RatingResponse createRating(Long jobId, CreateRatingRequest request, String customerEmail) {
        User customer = getAuthenticatedCustomer(customerEmail);

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (job.getServiceRequest() == null || !job.getServiceRequest().getCustomer().getId().equals(customer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: job belongs to another customer");
        }

        if (job.getStatus() != JobStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only COMPLETED jobs can be rated");
        }

        if (ratingRepository.existsByJobId(jobId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This job has already been rated.");
        }

        User worker = job.getWorker();
        if (worker == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Job has no assigned worker");
        }

        String reviewText = request.getReview() != null ? request.getReview().trim() : null;
        if (reviewText != null && reviewText.length() > 500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review text cannot exceed 500 characters");
        }

        try {
            Rating rating = new Rating(job, customer, worker, request.getScore(), reviewText);
            Rating savedRating = ratingRepository.save(rating);

            // Segment 8 Notification
            notificationService.createNotification(
                    worker,
                    NotificationType.RATING_RECEIVED,
                    "New rating received",
                    "You received a new rating for a completed job.",
                    "RATING",
                    savedRating.getId()
            );

            return RatingResponse.fromEntity(savedRating);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This job has already been rated.");
        }
    }

    @Transactional(readOnly = true)
    public RatingResponse getRatingForJob(Long jobId, String customerEmail) {
        User customer = getAuthenticatedCustomer(customerEmail);

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (job.getServiceRequest() == null || !job.getServiceRequest().getCustomer().getId().equals(customer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to job rating");
        }

        Rating rating = ratingRepository.findByJobId(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rating not found for this job"));

        return RatingResponse.fromEntity(rating);
    }

    @Transactional(readOnly = true)
    public List<RatingResponse> getWorkerRatings(String workerEmail) {
        User worker = getAuthenticatedWorker(workerEmail);
        return ratingRepository.findByWorkerIdOrderByCreatedAtDesc(worker.getId())
                .stream()
                .map(RatingResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkerRatingSummary getWorkerRatingSummary(String workerEmail) {
        User worker = getAuthenticatedWorker(workerEmail);
        return getWorkerRatingSummaryByWorkerId(worker.getId());
    }

    @Transactional(readOnly = true)
    public WorkerRatingSummary getWorkerRatingSummaryByWorkerId(Long workerId) {
        Double avg = ratingRepository.findAverageScoreByWorkerId(workerId);
        Long count = ratingRepository.countByWorkerId(workerId);
        return new WorkerRatingSummary(workerId, avg, count);
    }
}
