package com.sih.cooperative.dto;

import java.math.BigDecimal;

public class PlatformOverviewSummary {

    private Long totalUsers;
    private Long totalCustomers;
    private Long totalWorkers;
    private Long activeUsers;
    private Long suspendedUsers;
    private Long deactivatedUsers;
    private Long totalServiceRequests;
    private Long openRequests;
    private Long assignedRequests;
    private Long activeJobs;
    private Long completedJobs;
    private Long cancelledRequests;
    private BigDecimal completionRate;
    private BigDecimal cancellationRate;
    private Long totalRatings;
    private BigDecimal averageRating;
    private BigDecimal totalGrossVolume;
    private BigDecimal totalPlatformFees;
    private BigDecimal totalWorkerEarnings;

    private Long pendingVerifications;
    private Long unresolvedDisputes;
    private Long recentlyResolvedDisputes;

    public PlatformOverviewSummary() {
    }

    public PlatformOverviewSummary(Long totalUsers, Long totalCustomers, Long totalWorkers,
                                   Long activeUsers, Long suspendedUsers, Long deactivatedUsers,
                                   Long totalServiceRequests, Long openRequests, Long assignedRequests,
                                   Long activeJobs, Long completedJobs, Long cancelledRequests,
                                   BigDecimal completionRate, BigDecimal cancellationRate,
                                   Long totalRatings, BigDecimal averageRating, BigDecimal totalGrossVolume,
                                   BigDecimal totalPlatformFees, BigDecimal totalWorkerEarnings) {
        this.totalUsers = totalUsers;
        this.totalCustomers = totalCustomers;
        this.totalWorkers = totalWorkers;
        this.activeUsers = activeUsers;
        this.suspendedUsers = suspendedUsers;
        this.deactivatedUsers = deactivatedUsers;
        this.totalServiceRequests = totalServiceRequests;
        this.openRequests = openRequests;
        this.assignedRequests = assignedRequests;
        this.activeJobs = activeJobs;
        this.completedJobs = completedJobs;
        this.cancelledRequests = cancelledRequests;
        this.completionRate = completionRate;
        this.cancellationRate = cancellationRate;
        this.totalRatings = totalRatings;
        this.averageRating = averageRating;
        this.totalGrossVolume = totalGrossVolume;
        this.totalPlatformFees = totalPlatformFees;
        this.totalWorkerEarnings = totalWorkerEarnings;
    }

    public Long getPendingVerifications() {
        return pendingVerifications;
    }

    public void setPendingVerifications(Long pendingVerifications) {
        this.pendingVerifications = pendingVerifications;
    }

    public Long getUnresolvedDisputes() {
        return unresolvedDisputes;
    }

    public void setUnresolvedDisputes(Long unresolvedDisputes) {
        this.unresolvedDisputes = unresolvedDisputes;
    }

    public Long getRecentlyResolvedDisputes() {
        return recentlyResolvedDisputes;
    }

    public void setRecentlyResolvedDisputes(Long recentlyResolvedDisputes) {
        this.recentlyResolvedDisputes = recentlyResolvedDisputes;
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

    public Long getActiveUsers() {
        return activeUsers;
    }

    public void setActiveUsers(Long activeUsers) {
        this.activeUsers = activeUsers;
    }

    public Long getSuspendedUsers() {
        return suspendedUsers;
    }

    public void setSuspendedUsers(Long suspendedUsers) {
        this.suspendedUsers = suspendedUsers;
    }

    public Long getDeactivatedUsers() {
        return deactivatedUsers;
    }

    public void setDeactivatedUsers(Long deactivatedUsers) {
        this.deactivatedUsers = deactivatedUsers;
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

    public Long getActiveJobs() {
        return activeJobs;
    }

    public void setActiveJobs(Long activeJobs) {
        this.activeJobs = activeJobs;
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

    public BigDecimal getCompletionRate() {
        return completionRate;
    }

    public void setCompletionRate(BigDecimal completionRate) {
        this.completionRate = completionRate;
    }

    public BigDecimal getCancellationRate() {
        return cancellationRate;
    }

    public void setCancellationRate(BigDecimal cancellationRate) {
        this.cancellationRate = cancellationRate;
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

