package com.sih.cooperative.dto;

import jakarta.validation.constraints.NotNull;

public class PaymentRequest {

    @NotNull(message = "Job ID is required")
    private Long jobId;

    public PaymentRequest() {
    }

    public PaymentRequest(Long jobId) {
        this.jobId = jobId;
    }

    public Long getJobId() { return jobId; }
    public void setJobId(Long jobId) { this.jobId = jobId; }
}
