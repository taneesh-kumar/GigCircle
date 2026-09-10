package com.sih.cooperative.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class DisputeResponseRequest {

    @NotBlank(message = "Response message cannot be blank")
    @Size(max = 2000, message = "Response message cannot exceed 2000 characters")
    private String message;

    public DisputeResponseRequest() {
    }

    public DisputeResponseRequest(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
