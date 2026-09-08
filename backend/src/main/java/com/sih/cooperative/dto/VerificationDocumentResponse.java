package com.sih.cooperative.dto;

import com.sih.cooperative.entity.VerificationDocument;
import com.sih.cooperative.entity.VerificationDocumentStatus;
import com.sih.cooperative.entity.VerificationDocumentType;

import java.time.LocalDateTime;

public class VerificationDocumentResponse {

    private Long id;
    private Long verificationId;
    private VerificationDocumentType documentType;
    private String fileReference;
    private VerificationDocumentStatus status;
    private String reviewNote;
    private LocalDateTime uploadedAt;

    public VerificationDocumentResponse() {
    }

    public VerificationDocumentResponse(VerificationDocument document) {
        if (document != null) {
            this.id = document.getId();
            if (document.getVerification() != null) {
                this.verificationId = document.getVerification().getId();
            }
            this.documentType = document.getDocumentType();
            this.fileReference = document.getFileReference();
            this.status = document.getStatus();
            this.reviewNote = document.getReviewNote();
            this.uploadedAt = document.getUploadedAt();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getVerificationId() {
        return verificationId;
    }

    public void setVerificationId(Long verificationId) {
        this.verificationId = verificationId;
    }

    public VerificationDocumentType getDocumentType() {
        return documentType;
    }

    public void setDocumentType(VerificationDocumentType documentType) {
        this.documentType = documentType;
    }

    public String getFileReference() {
        return fileReference;
    }

    public void setFileReference(String fileReference) {
        this.fileReference = fileReference;
    }

    public VerificationDocumentStatus getStatus() {
        return status;
    }

    public void setStatus(VerificationDocumentStatus status) {
        this.status = status;
    }

    public String getReviewNote() {
        return reviewNote;
    }

    public void setReviewNote(String reviewNote) {
        this.reviewNote = reviewNote;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}
