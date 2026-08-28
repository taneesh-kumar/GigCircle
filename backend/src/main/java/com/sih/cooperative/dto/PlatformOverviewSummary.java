package com.sih.cooperative.dto;

import java.math.BigDecimal;

public class PlatformOverviewSummary {

    private Long totalUsers;
    private Long totalCustomers;
    private Long totalWorkers;
    private Long totalServiceRequests;
    private Long openRequests;
    private Long assignedRequests;
    private Long completedJobs;
    private Long cancelledRequests;
    private Long totalRatings;
    private BigDecimal averageRating;
    private BigDecimal totalGrossVolume;
    private BigDecimal totalPlatformFees;
    private BigDecimal totalWorkerEarnings;

    public PlatformOverviewSummary() {
    }

    public PlatformOverviewSummary(Long totalUsers, Long totalCustomers, Long totalWorkers,
                                   Long totalServiceRequests, Long openRequests, Long assignedRequests,
                                   Long completedJobs, Long cancelledRequests, Long totalRatings,
                                   BigDecimal averageRating, BigDecimal totalGrossVolume,
                                   BigDecimal totalPlatformFees, BigDecimal totalWorkerEarnings) {
        this.totalUsers = totalUsers;
        this.totalCustomers = totalCustomers;
        this.totalWorkers = totalWorkers;
        this.totalServiceRequests = totalServiceRequests;
        this.openRequests = openRequests;
        this.assignedRequests = assignedRequests;
        this.completedJobs = completedJobs;
        this.cancelledRequests = cancelledRequests;
        this.totalRatings = totalRatings;
        this.averageRating = averageRating;
        this.totalGrossVolume = totalGrossVolume;
        this.totalPlatformFees = totalPlatformFees;
        this.totalWorkerEarnings = totalWorkerEarnings;
    }

    public Long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(Long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public Long getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(Long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public Long getTotalWorkers() {
        return totalWorkers;
    }

    public void setTotalWorkers(Long totalWorkers) {
        this.totalWorkers = totalWorkers;
    }

    public Long getTotalServiceRequests() {
        return totalServiceRequests;
    }

    public void setTotalServiceRequests(Long totalServiceRequests) {
        this.totalServiceRequests = totalServiceRequests;
    }

    public Long getOpenRequests() {
        return openRequests;
    }

    public void setOpenRequests(Long openRequests) {
        this.openRequests = openRequests;
    }

    public Long getAssignedRequests() {
        return assignedRequests;
    }

    public void setAssignedRequests(Long assignedRequests) {
        this.assignedRequests = assignedRequests;
    }

    public Long getCompletedJobs() {
        return completedJobs;
    }

    public void setCompletedJobs(Long completedJobs) {
        this.completedJobs = completedJobs;
    }

    public Long getCancelledRequests() {
        return cancelledRequests;
    }

    public void setCancelledRequests(Long cancelledRequests) {
        this.cancelledRequests = cancelledRequests;
    }

    public Long getTotalRatings() {
        return totalRatings;
    }

    public void setTotalRatings(Long totalRatings) {
        this.totalRatings = totalRatings;
    }

    public BigDecimal getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(BigDecimal averageRating) {
        this.averageRating = averageRating;
    }

    public BigDecimal getTotalGrossVolume() {
        return totalGrossVolume;
    }

    public void setTotalGrossVolume(BigDecimal totalGrossVolume) {
        this.totalGrossVolume = totalGrossVolume;
    }

    public BigDecimal getTotalPlatformFees() {
        return totalPlatformFees;
    }

    public void setTotalPlatformFees(BigDecimal totalPlatformFees) {
        this.totalPlatformFees = totalPlatformFees;
    }

    public BigDecimal getTotalWorkerEarnings() {
        return totalWorkerEarnings;
    }

    public void setTotalWorkerEarnings(BigDecimal totalWorkerEarnings) {
        this.totalWorkerEarnings = totalWorkerEarnings;
    }
}
