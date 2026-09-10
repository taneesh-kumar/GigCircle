package com.sih.cooperative.dto;

import com.sih.cooperative.entity.VerificationDocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SubmitVerificationDocumentRequest {

    @NotNull(message = "Document type is required")
    private VerificationDocumentType documentType;

    @NotBlank(message = "File reference is required")
    private String fileReference;

    public SubmitVerificationDocumentRequest() {
    }

    public SubmitVerificationDocumentRequest(VerificationDocumentType documentType, String fileReference) {
        this.documentType = documentType;
        this.fileReference = fileReference;
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
}
