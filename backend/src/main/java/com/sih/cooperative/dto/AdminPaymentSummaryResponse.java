package com.sih.cooperative.dto;

import java.math.BigDecimal;

public class AdminPaymentSummaryResponse {

    private long totalTransactions;
    private long successfulTransactions;
    private long failedTransactions;
    private long refundedTransactions;
    private BigDecimal totalSimulatedVolume;
    private BigDecimal totalSimulatedPlatformFees;

    public AdminPaymentSummaryResponse() {
    }

    public AdminPaymentSummaryResponse(long totalTransactions, long successfulTransactions, long failedTransactions, long refundedTransactions, BigDecimal totalSimulatedVolume, BigDecimal totalSimulatedPlatformFees) {
        this.totalTransactions = totalTransactions;
        this.successfulTransactions = successfulTransactions;
        this.failedTransactions = failedTransactions;
        this.refundedTransactions = refundedTransactions;
        this.totalSimulatedVolume = totalSimulatedVolume;
        this.totalSimulatedPlatformFees = totalSimulatedPlatformFees;
    }

    public long getTotalTransactions() {
        return totalTransactions;
    }

    public void setTotalTransactions(long totalTransactions) {
        this.totalTransactions = totalTransactions;
    }

    public long getSuccessfulTransactions() {
        return successfulTransactions;
    }

    public void setSuccessfulTransactions(long successfulTransactions) {
        this.successfulTransactions = successfulTransactions;
    }

    public long getFailedTransactions() {
        return failedTransactions;
    }

    public void setFailedTransactions(long failedTransactions) {
        this.failedTransactions = failedTransactions;
    }

    public long getRefundedTransactions() {
        return refundedTransactions;
    }

    public void setRefundedTransactions(long refundedTransactions) {
        this.refundedTransactions = refundedTransactions;
    }

    public BigDecimal getTotalSimulatedVolume() {
        return totalSimulatedVolume;
    }

    public void setTotalSimulatedVolume(BigDecimal totalSimulatedVolume) {
        this.totalSimulatedVolume = totalSimulatedVolume;
    }

    public BigDecimal getTotalSimulatedPlatformFees() {
        return totalSimulatedPlatformFees;
    }

    public void setTotalSimulatedPlatformFees(BigDecimal totalSimulatedPlatformFees) {
        this.totalSimulatedPlatformFees = totalSimulatedPlatformFees;
    }
}
