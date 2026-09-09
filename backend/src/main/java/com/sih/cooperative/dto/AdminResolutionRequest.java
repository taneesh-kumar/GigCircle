package com.sih.cooperative.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AdminResolutionRequest {

    @NotBlank(message = "Resolution note cannot be blank")
    @Size(max = 2000, message = "Resolution note cannot exceed 2000 characters")
    private String resolutionNote;

    public AdminResolutionRequest() {
    }

    public AdminResolutionRequest(String resolutionNote) {
        this.resolutionNote = resolutionNote;
    }

    public String getResolutionNote() {
        return resolutionNote;
    }

    public void setResolutionNote(String resolutionNote) {
        this.resolutionNote = resolutionNote;
    }
}
