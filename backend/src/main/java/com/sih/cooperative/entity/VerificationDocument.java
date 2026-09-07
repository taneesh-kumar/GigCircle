package com.sih.cooperative.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "verification_documents",
        indexes = {
                @Index(name = "idx_vd_verification_id", columnList = "verification_id"),
                @Index(name = "idx_vd_document_type", columnList = "document_type"),
                @Index(name = "idx_vd_status", columnList = "status")
        }
)
public class VerificationDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "verification_id", nullable = false)
    private WorkerVerification verification;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false)
    private VerificationDocumentType documentType;

    @Column(name = "file_reference", nullable = false, length = 500)
    private String fileReference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationDocumentStatus status = VerificationDocumentStatus.PENDING;

    @Column(name = "review_note", length = 1000)
    private String reviewNote;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    public VerificationDocument() {
    }

    public VerificationDocument(WorkerVerification verification, VerificationDocumentType documentType, String fileReference) {
        this.verification = verification;
        this.documentType = documentType;
        this.fileReference = fileReference;
        this.status = VerificationDocumentStatus.PENDING;
    }

    public VerificationDocument(WorkerVerification verification, VerificationDocumentType documentType, String fileReference, VerificationDocumentStatus status) {
        this.verification = verification;
        this.documentType = documentType;
        this.fileReference = fileReference;
        this.status = status;
    }

    @PrePersist
    protected void onCreate() {
        if (this.uploadedAt == null) {
            this.uploadedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = VerificationDocumentStatus.PENDING;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public WorkerVerification getVerification() {
        return verification;
    }

    public void setVerification(WorkerVerification verification) {
        this.verification = verification;
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
