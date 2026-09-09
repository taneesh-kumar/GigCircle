package com.sih.cooperative.dto;

import jakarta.validation.constraints.Size;

public class UpdateUserStatusRequest {

    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    private String reason;

    public UpdateUserStatusRequest() {
    }

    public UpdateUserStatusRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
