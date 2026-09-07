package com.sih.cooperative.dto;

import com.sih.cooperative.entity.VerificationDocumentType;

public class UpdateVerificationDocumentRequest {

    private VerificationDocumentType documentType;
    private String fileReference;

    public UpdateVerificationDocumentRequest() {
    }

    public UpdateVerificationDocumentRequest(VerificationDocumentType documentType, String fileReference) {
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
