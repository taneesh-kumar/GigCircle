package com.sih.cooperative.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AdminDismissRequest {

    @NotBlank(message = "Dismissal note cannot be blank")
    @Size(max = 2000, message = "Dismissal note cannot exceed 2000 characters")
    private String dismissalNote;

    public AdminDismissRequest() {
    }

    public AdminDismissRequest(String dismissalNote) {
        this.dismissalNote = dismissalNote;
    }

    public String getDismissalNote() {
        return dismissalNote;
    }

    public void setDismissalNote(String dismissalNote) {
        this.dismissalNote = dismissalNote;
    }
}
