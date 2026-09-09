package com.sih.cooperative.dto;

import com.sih.cooperative.entity.DisputeHistory;
import com.sih.cooperative.entity.DisputeStatus;
import java.time.LocalDateTime;

public class DisputeHistoryResponse {

    private Long id;
    private Long disputeId;
    private UserResponse actor;
    private DisputeStatus oldStatus;
    private DisputeStatus newStatus;
    private String comment;
    private LocalDateTime createdAt;

    public DisputeHistoryResponse() {
    }

    public DisputeHistoryResponse(Long id, Long disputeId, UserResponse actor, DisputeStatus oldStatus, DisputeStatus newStatus, String comment, LocalDateTime createdAt) {
        this.id = id;
        this.disputeId = disputeId;
        this.actor = actor;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.comment = comment;
        this.createdAt = createdAt;
    }

    public static DisputeHistoryResponse fromEntity(DisputeHistory history) {
        return new DisputeHistoryResponse(
                history.getId(),
                history.getDispute().getId(),
                UserResponse.fromEntity(history.getActor()),
                history.getOldStatus(),
                history.getNewStatus(),
                history.getComment(),
                history.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDisputeId() {
        return disputeId;
    }

    public void setDisputeId(Long disputeId) {
        this.disputeId = disputeId;
    }

    public UserResponse getActor() {
        return actor;
    }

    public void setActor(UserResponse actor) {
        this.actor = actor;
    }

    public DisputeStatus getOldStatus() {
        return oldStatus;
    }

    public void setOldStatus(DisputeStatus oldStatus) {
        this.oldStatus = oldStatus;
    }

    public DisputeStatus getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(DisputeStatus newStatus) {
        this.newStatus = newStatus;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
