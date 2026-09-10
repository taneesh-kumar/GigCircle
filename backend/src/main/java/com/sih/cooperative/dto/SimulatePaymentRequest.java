package com.sih.cooperative.dto;

public class SimulatePaymentRequest {

    private boolean shouldSucceed = true;
    private String failureReason;

    public SimulatePaymentRequest() {
    }

    public SimulatePaymentRequest(boolean shouldSucceed) {
        this.shouldSucceed = shouldSucceed;
    }

    public SimulatePaymentRequest(boolean shouldSucceed, String failureReason) {
        this.shouldSucceed = shouldSucceed;
        this.failureReason = failureReason;
    }

    public boolean isShouldSucceed() {
        return shouldSucceed;
    }

    public void setShouldSucceed(boolean shouldSucceed) {
        this.shouldSucceed = shouldSucceed;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }
}
