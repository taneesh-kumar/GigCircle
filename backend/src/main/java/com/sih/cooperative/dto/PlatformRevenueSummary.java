package com.sih.cooperative.dto;

import java.math.BigDecimal;

public class PlatformRevenueSummary {

    private BigDecimal totalGrossRevenue;
    private BigDecimal totalPlatformFees;
    private BigDecimal totalWorkerEarnings;
    private long totalCompletedJobsWithEarnings;
    private BigDecimal totalAvailableWorkerEarnings;

    private long totalSuccessfulPayments;
    private long totalPendingPayments;
    private long totalFailedPayments;

    private long upiPaymentCount;
    private long cardPaymentCount;
    private long walletPaymentCount;

    public PlatformRevenueSummary() {
    }

    public PlatformRevenueSummary(BigDecimal totalGrossRevenue, BigDecimal totalPlatformFees, BigDecimal totalWorkerEarnings, long totalCompletedJobsWithEarnings, BigDecimal totalAvailableWorkerEarnings) {
        this.totalGrossRevenue = totalGrossRevenue;
        this.totalPlatformFees = totalPlatformFees;
        this.totalWorkerEarnings = totalWorkerEarnings;
        this.totalCompletedJobsWithEarnings = totalCompletedJobsWithEarnings;
        this.totalAvailableWorkerEarnings = totalAvailableWorkerEarnings;
    }

    public PlatformRevenueSummary(BigDecimal totalGrossRevenue, BigDecimal totalPlatformFees, BigDecimal totalWorkerEarnings,
                                  long totalCompletedJobsWithEarnings, BigDecimal totalAvailableWorkerEarnings,
                                  long totalSuccessfulPayments, long totalPendingPayments, long totalFailedPayments,
                                  long upiPaymentCount, long cardPaymentCount, long walletPaymentCount) {
        this.totalGrossRevenue = totalGrossRevenue;
        this.totalPlatformFees = totalPlatformFees;
        this.totalWorkerEarnings = totalWorkerEarnings;
        this.totalCompletedJobsWithEarnings = totalCompletedJobsWithEarnings;
        this.totalAvailableWorkerEarnings = totalAvailableWorkerEarnings;
        this.totalSuccessfulPayments = totalSuccessfulPayments;
        this.totalPendingPayments = totalPendingPayments;
        this.totalFailedPayments = totalFailedPayments;
        this.upiPaymentCount = upiPaymentCount;
        this.cardPaymentCount = cardPaymentCount;
        this.walletPaymentCount = walletPaymentCount;
    }

    public BigDecimal getTotalGrossRevenue() {
        return totalGrossRevenue;
    }

    public BigDecimal getTotalPlatformFees() {
        return totalPlatformFees;
    }

    public BigDecimal getTotalWorkerEarnings() {
        return totalWorkerEarnings;
    }

    public long getTotalCompletedJobsWithEarnings() {
        return totalCompletedJobsWithEarnings;
    }

    public BigDecimal getTotalAvailableWorkerEarnings() {
        return totalAvailableWorkerEarnings;
    }

    public long getTotalSuccessfulPayments() {
        return totalSuccessfulPayments;
    }

    public void setTotalSuccessfulPayments(long totalSuccessfulPayments) {
        this.totalSuccessfulPayments = totalSuccessfulPayments;
    }

    public long getTotalPendingPayments() {
        return totalPendingPayments;
    }

    public void setTotalPendingPayments(long totalPendingPayments) {
        this.totalPendingPayments = totalPendingPayments;
    }

    public long getTotalFailedPayments() {
        return totalFailedPayments;
    }

    public void setTotalFailedPayments(long totalFailedPayments) {
        this.totalFailedPayments = totalFailedPayments;
    }

    public long getUpiPaymentCount() {
        return upiPaymentCount;
    }

    public void setUpiPaymentCount(long upiPaymentCount) {
        this.upiPaymentCount = upiPaymentCount;
    }

    public long getCardPaymentCount() {
        return cardPaymentCount;
    }

    public void setCardPaymentCount(long cardPaymentCount) {
        this.cardPaymentCount = cardPaymentCount;
    }

    public long getWalletPaymentCount() {
        return walletPaymentCount;
    }

    public void setWalletPaymentCount(long walletPaymentCount) {
        this.walletPaymentCount = walletPaymentCount;
    }
}
