package com.sih.cooperative.dto;

import com.sih.cooperative.entity.Rating;

import java.time.LocalDateTime;

public class AdminRatingResponse {

    private Long id;
    private Long jobId;
    private Long customerId;
    private String customerName;
    private Long workerId;
    private String workerName;
    private Integer score;
    private String review;
    private LocalDateTime createdAt;

    public AdminRatingResponse() {
    }

    public AdminRatingResponse(Long id, Long jobId, Long customerId, String customerName,
                               Long workerId, String workerName, Integer score, String review,
                               LocalDateTime createdAt) {
        this.id = id;
        this.jobId = jobId;
        this.customerId = customerId;
        this.customerName = customerName;
        this.workerId = workerId;
        this.workerName = workerName;
        this.score = score;
        this.review = review;
        this.createdAt = createdAt;
    }

    public static AdminRatingResponse fromEntity(Rating rating) {
        if (rating == null) return null;
        return new AdminRatingResponse(
                rating.getId(),
                rating.getJob().getId(),
                rating.getCustomer().getId(),
                rating.getCustomer().getName(),
                rating.getWorker().getId(),
                rating.getWorker().getName(),
                rating.getScore(),
                rating.getReview(),
                rating.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getJobId() {
        return jobId;
    }

    public void setJobId(Long jobId) {
        this.jobId = jobId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public Long getWorkerId() {
        return workerId;
    }

    public void setWorkerId(Long workerId) {
        this.workerId = workerId;
    }

    public String getWorkerName() {
        return workerName;
    }

    public void setWorkerName(String workerName) {
        this.workerName = workerName;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public String getReview() {
        return review;
    }

    public void setReview(String review) {
        this.review = review;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
