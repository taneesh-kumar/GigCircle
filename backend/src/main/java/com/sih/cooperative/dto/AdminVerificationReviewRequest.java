package com.sih.cooperative.dto;

public class AdminVerificationReviewRequest {

    private String reason;

    public AdminVerificationReviewRequest() {
    }

    public AdminVerificationReviewRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
