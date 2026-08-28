package com.sih.cooperative.dto;

import java.math.BigDecimal;

public class WorkerEarningsSummary {

    private Long workerId;
    private BigDecimal totalGross;
    private BigDecimal totalPlatformFees;
    private BigDecimal totalWorkerEarnings;
    private BigDecimal availableEarnings;
    private long totalJobs;

    public WorkerEarningsSummary() {
    }

    public WorkerEarningsSummary(Long workerId, BigDecimal totalGross, BigDecimal totalPlatformFees, BigDecimal totalWorkerEarnings, BigDecimal availableEarnings, long totalJobs) {
        this.workerId = workerId;
        this.totalGross = totalGross;
        this.totalPlatformFees = totalPlatformFees;
        this.totalWorkerEarnings = totalWorkerEarnings;
        this.availableEarnings = availableEarnings;
        this.totalJobs = totalJobs;
    }

    public Long getWorkerId() {
        return workerId;
    }

    public BigDecimal getTotalGross() {
        return totalGross;
    }

    public BigDecimal getTotalPlatformFees() {
        return totalPlatformFees;
    }

    public BigDecimal getTotalWorkerEarnings() {
        return totalWorkerEarnings;
    }

    public BigDecimal getAvailableEarnings() {
        return availableEarnings;
    }

    public long getTotalJobs() {
        return totalJobs;
    }
}
