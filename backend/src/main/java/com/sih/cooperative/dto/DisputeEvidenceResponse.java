package com.sih.cooperative.dto;

import com.sih.cooperative.entity.DisputeEvidence;
import java.time.LocalDateTime;

public class DisputeEvidenceResponse {

    private Long id;
    private Long disputeId;
    private UserResponse uploadedBy;
    private String fileReference;
    private String originalFileName;
    private String contentType;
    private Long fileSize;
    private LocalDateTime createdAt;

    public DisputeEvidenceResponse() {
    }

    public DisputeEvidenceResponse(Long id, Long disputeId, UserResponse uploadedBy, String fileReference, String originalFileName, String contentType, Long fileSize, LocalDateTime createdAt) {
        this.id = id;
        this.disputeId = disputeId;
        this.uploadedBy = uploadedBy;
        this.fileReference = fileReference;
        this.originalFileName = originalFileName;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.createdAt = createdAt;
    }

    public static DisputeEvidenceResponse fromEntity(DisputeEvidence evidence) {
        return new DisputeEvidenceResponse(
                evidence.getId(),
                evidence.getDispute().getId(),
                UserResponse.fromEntity(evidence.getUploadedBy()),
                evidence.getFileReference(),
                evidence.getOriginalFileName(),
                evidence.getContentType(),
                evidence.getFileSize(),
                evidence.getCreatedAt()
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

    public UserResponse getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(UserResponse uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public String getFileReference() {
        return fileReference;
    }

    public void setFileReference(String fileReference) {
        this.fileReference = fileReference;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
