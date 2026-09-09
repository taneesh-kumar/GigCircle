package com.sih.cooperative.dto;

import com.sih.cooperative.entity.DisputeReason;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateDisputeRequest {

    @NotNull(message = "Job ID is required")
    private Long jobId;

    @NotNull(message = "Dispute reason is required")
    private DisputeReason reason;

    @NotBlank(message = "Description cannot be blank")
    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    public CreateDisputeRequest() {
    }

    public CreateDisputeRequest(Long jobId, DisputeReason reason, String description) {
        this.jobId = jobId;
        this.reason = reason;
        this.description = description;
    }

    public Long getJobId() {
        return jobId;
    }

    public void setJobId(Long jobId) {
        this.jobId = jobId;
    }

    public DisputeReason getReason() {
        return reason;
    }

    public void setReason(DisputeReason reason) {
        this.reason = reason;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
