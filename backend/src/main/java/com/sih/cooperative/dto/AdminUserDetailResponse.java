package com.sih.cooperative.dto;

import com.sih.cooperative.entity.AccountStatus;
import com.sih.cooperative.entity.Role;
import com.sih.cooperative.entity.ServiceCategory;
import com.sih.cooperative.entity.VerificationStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public class AdminUserDetailResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private Role role;
    private boolean active;
    private AccountStatus status;
    private LocalDateTime createdAt;

    // Common activity statistics
    private Long serviceRequestsCreatedCount;
    private Long openRequestsCount;
    private Long completedRequestsCount;
    private Long cancelledRequestsCount;

    private Long jobsAssignedCount;
    private Long jobsCompletedCount;
    private Long activeJobsCount;

    private Long ratingsSubmittedCount;
    private Long ratingsReceivedCount;
    private Double averageRatingReceived;

    private BigDecimal totalGrossVolume;
    private BigDecimal totalPlatformFees;
    private BigDecimal totalWorkerEarnings;

    // Worker specific details (if role == WORKER)
    private Long workerProfileId;
    private String bio;
    private Integer experienceYears;
    private BigDecimal hourlyRate;
    private Set<String> skills;
    private Set<ServiceCategory> serviceCategories;
    private Boolean available;
    private String serviceLocation;
    private Integer serviceRadiusKm;
    private VerificationStatus verificationStatus;
    private LocalDateTime verificationSubmittedAt;
    private LocalDateTime verificationReviewedAt;

    // Recent activity list
    private List<AdminActivityResponse> recentActivity;

    public AdminUserDetailResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public void setStatus(AccountStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Long getServiceRequestsCreatedCount() {
        return serviceRequestsCreatedCount;
    }

    public void setServiceRequestsCreatedCount(Long serviceRequestsCreatedCount) {
        this.serviceRequestsCreatedCount = serviceRequestsCreatedCount;
    }

    public Long getOpenRequestsCount() {
        return openRequestsCount;
    }

    public void setOpenRequestsCount(Long openRequestsCount) {
        this.openRequestsCount = openRequestsCount;
    }

    public Long getCompletedRequestsCount() {
        return completedRequestsCount;
    }

    public void setCompletedRequestsCount(Long completedRequestsCount) {
        this.completedRequestsCount = completedRequestsCount;
    }

    public Long getCancelledRequestsCount() {
        return cancelledRequestsCount;
    }

    public void setCancelledRequestsCount(Long cancelledRequestsCount) {
        this.cancelledRequestsCount = cancelledRequestsCount;
    }

    public Long getJobsAssignedCount() {
        return jobsAssignedCount;
    }

    public void setJobsAssignedCount(Long jobsAssignedCount) {
        this.jobsAssignedCount = jobsAssignedCount;
    }

    public Long getJobsCompletedCount() {
        return jobsCompletedCount;
    }

    public void setJobsCompletedCount(Long jobsCompletedCount) {
        this.jobsCompletedCount = jobsCompletedCount;
    }

    public Long getActiveJobsCount() {
        return activeJobsCount;
    }

    public void setActiveJobsCount(Long activeJobsCount) {
        this.activeJobsCount = activeJobsCount;
    }

    public Long getRatingsSubmittedCount() {
        return ratingsSubmittedCount;
    }

    public void setRatingsSubmittedCount(Long ratingsSubmittedCount) {
        this.ratingsSubmittedCount = ratingsSubmittedCount;
    }

    public Long getRatingsReceivedCount() {
        return ratingsReceivedCount;
    }

    public void setRatingsReceivedCount(Long ratingsReceivedCount) {
        this.ratingsReceivedCount = ratingsReceivedCount;
    }

    public Double getAverageRatingReceived() {
        return averageRatingReceived;
    }

    public void setAverageRatingReceived(Double averageRatingReceived) {
        this.averageRatingReceived = averageRatingReceived;
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

    public Long getWorkerProfileId() {
        return workerProfileId;
    }

    public void setWorkerProfileId(Long workerProfileId) {
        this.workerProfileId = workerProfileId;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }

    public BigDecimal getHourlyRate() {
        return hourlyRate;
    }

    public void setHourlyRate(BigDecimal hourlyRate) {
        this.hourlyRate = hourlyRate;
    }

    public Set<String> getSkills() {
        return skills;
    }

    public void setSkills(Set<String> skills) {
        this.skills = skills;
    }

    public Set<ServiceCategory> getServiceCategories() {
        return serviceCategories;
    }

    public void setServiceCategories(Set<ServiceCategory> serviceCategories) {
        this.serviceCategories = serviceCategories;
    }

    public Boolean getAvailable() {
        return available;
    }

    public void setAvailable(Boolean available) {
        this.available = available;
    }

    public String getServiceLocation() {
        return serviceLocation;
    }

    public void setServiceLocation(String serviceLocation) {
        this.serviceLocation = serviceLocation;
    }

    public Integer getServiceRadiusKm() {
        return serviceRadiusKm;
    }

    public void setServiceRadiusKm(Integer serviceRadiusKm) {
        this.serviceRadiusKm = serviceRadiusKm;
    }

    public VerificationStatus getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(VerificationStatus verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public LocalDateTime getVerificationSubmittedAt() {
        return verificationSubmittedAt;
    }

    public void setVerificationSubmittedAt(LocalDateTime verificationSubmittedAt) {
        this.verificationSubmittedAt = verificationSubmittedAt;
    }

    public LocalDateTime getVerificationReviewedAt() {
        return verificationReviewedAt;
    }

    public void setVerificationReviewedAt(LocalDateTime verificationReviewedAt) {
        this.verificationReviewedAt = verificationReviewedAt;
    }

    public List<AdminActivityResponse> getRecentActivity() {
        return recentActivity;
    }

    public void setRecentActivity(List<AdminActivityResponse> recentActivity) {
        this.recentActivity = recentActivity;
    }
}
