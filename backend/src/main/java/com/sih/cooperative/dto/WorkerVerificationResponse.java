package com.sih.cooperative.dto;

import com.sih.cooperative.entity.VerificationStatus;
import com.sih.cooperative.entity.WorkerVerification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class WorkerVerificationResponse {

    private Long id;
    private Long workerId;
    private String workerName;
    private String workerEmail;
    private VerificationStatus status;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private Long reviewedById;
    private String reviewedByName;
    private LocalDateTime verifiedAt;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<VerificationDocumentResponse> documents = new ArrayList<>();

    public WorkerVerificationResponse() {
    }

    public WorkerVerificationResponse(WorkerVerification verification) {
        if (verification != null) {
            this.id = verification.getId();
            if (verification.getWorker() != null) {
                this.workerId = verification.getWorker().getId();
                this.workerName = verification.getWorker().getName();
                this.workerEmail = verification.getWorker().getEmail();
            }
            this.status = verification.getStatus();
            this.submittedAt = verification.getSubmittedAt();
            this.reviewedAt = verification.getReviewedAt();
            if (verification.getReviewedBy() != null) {
                this.reviewedById = verification.getReviewedBy().getId();
                this.reviewedByName = verification.getReviewedBy().getName();
            }
            this.verifiedAt = verification.getVerifiedAt();
            this.rejectionReason = verification.getRejectionReason();
            this.createdAt = verification.getCreatedAt();
            this.updatedAt = verification.getUpdatedAt();

            if (verification.getDocuments() != null) {
                this.documents = verification.getDocuments().stream()
                        .map(VerificationDocumentResponse::new)
                        .toList();
            }
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getWorkerEmail() {
        return workerEmail;
    }

    public void setWorkerEmail(String workerEmail) {
        this.workerEmail = workerEmail;
    }

    public VerificationStatus getStatus() {
        return status;
    }

    public void setStatus(VerificationStatus status) {
        this.status = status;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public Long getReviewedById() {
        return reviewedById;
    }

    public void setReviewedById(Long reviewedById) {
        this.reviewedById = reviewedById;
    }

    public String getReviewedByName() {
        return reviewedByName;
    }

    public void setReviewedByName(String reviewedByName) {
        this.reviewedByName = reviewedByName;
    }

    public LocalDateTime getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(LocalDateTime verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<VerificationDocumentResponse> getDocuments() {
        return documents;
    }

    public void setDocuments(List<VerificationDocumentResponse> documents) {
        this.documents = documents;
    }
}
