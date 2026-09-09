package com.sih.cooperative.dto;

import com.sih.cooperative.entity.Dispute;
import com.sih.cooperative.entity.DisputeReason;
import com.sih.cooperative.entity.DisputeStatus;

import java.time.LocalDateTime;
import java.util.List;

public class DisputeDetailResponse {

    private Long id;
    private Long jobId;
    private UserResponse raisedBy;
    private UserResponse againstUser;
    private DisputeReason reason;
    private String description;
    private DisputeStatus status;
    private String resolutionNotes;
    private UserResponse resolvedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private List<DisputeHistoryResponse> history;
    private List<DisputeEvidenceResponse> evidence;

    public DisputeDetailResponse() {
    }

    public DisputeDetailResponse(Long id, Long jobId, UserResponse raisedBy, UserResponse againstUser, DisputeReason reason, String description, DisputeStatus status, String resolutionNotes, UserResponse resolvedBy, LocalDateTime createdAt, LocalDateTime updatedAt, LocalDateTime resolvedAt, List<DisputeHistoryResponse> history, List<DisputeEvidenceResponse> evidence) {
        this.id = id;
        this.jobId = jobId;
        this.raisedBy = raisedBy;
        this.againstUser = againstUser;
        this.reason = reason;
        this.description = description;
        this.status = status;
        this.resolutionNotes = resolutionNotes;
        this.resolvedBy = resolvedBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.resolvedAt = resolvedAt;
        this.history = history;
        this.evidence = evidence;
    }

    public static DisputeDetailResponse fromEntity(Dispute dispute, List<DisputeHistoryResponse> history, List<DisputeEvidenceResponse> evidence) {
        UserResponse resolvedByResp = dispute.getResolvedBy() != null ? UserResponse.fromEntity(dispute.getResolvedBy()) : null;
        return new DisputeDetailResponse(
                dispute.getId(),
                dispute.getJob().getId(),
                UserResponse.fromEntity(dispute.getRaisedBy()),
                UserResponse.fromEntity(dispute.getAgainstUser()),
                dispute.getReason(),
                dispute.getDescription(),
                dispute.getStatus(),
                dispute.getResolutionNotes(),
                resolvedByResp,
                dispute.getCreatedAt(),
                dispute.getUpdatedAt(),
                dispute.getResolvedAt(),
                history,
                evidence
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

    public UserResponse getRaisedBy() {
        return raisedBy;
    }

    public void setRaisedBy(UserResponse raisedBy) {
        this.raisedBy = raisedBy;
    }

    public UserResponse getAgainstUser() {
        return againstUser;
    }

    public void setAgainstUser(UserResponse againstUser) {
        this.againstUser = againstUser;
    }

    public DisputeReason getReason() {
        return reason;
    }

    public void setReason(DisputeReason reason) {
        this.reason = reason;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public DisputeStatus getStatus() {
        return status;
    }

    public void setStatus(DisputeStatus status) {
        this.status = status;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }

    public UserResponse getResolvedBy() {
        return resolvedBy;
    }

    public void setResolvedBy(UserResponse resolvedBy) {
        this.resolvedBy = resolvedBy;
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

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public List<DisputeHistoryResponse> getHistory() {
        return history;
    }

    public void setHistory(List<DisputeHistoryResponse> history) {
        this.history = history;
    }

    public List<DisputeEvidenceResponse> getEvidence() {
        return evidence;
    }

    public void setEvidence(List<DisputeEvidenceResponse> evidence) {
        this.evidence = evidence;
    }
}
