package com.sih.cooperative.dto;

import java.math.BigDecimal;

public class PlatformRevenueSummary {

    private BigDecimal totalGrossRevenue;
    private BigDecimal totalPlatformFees;
    private BigDecimal totalWorkerEarnings;
    private long totalCompletedJobsWithEarnings;
    private BigDecimal totalAvailableWorkerEarnings;

    public PlatformRevenueSummary() {
    }

    public PlatformRevenueSummary(BigDecimal totalGrossRevenue, BigDecimal totalPlatformFees, BigDecimal totalWorkerEarnings, long totalCompletedJobsWithEarnings, BigDecimal totalAvailableWorkerEarnings) {
        this.totalGrossRevenue = totalGrossRevenue;
        this.totalPlatformFees = totalPlatformFees;
        this.totalWorkerEarnings = totalWorkerEarnings;
        this.totalCompletedJobsWithEarnings = totalCompletedJobsWithEarnings;
        this.totalAvailableWorkerEarnings = totalAvailableWorkerEarnings;
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
}
