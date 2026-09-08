package com.sih.cooperative.dto;

import com.sih.cooperative.entity.ServiceCategory;
import com.sih.cooperative.entity.WorkerProfile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

public class AdminWorkerResponse {

    private Long workerId;
    private Long profileId;
    private String name;
    private String email;
    private String phone;
    private String bio;
    private Integer experienceYears;
    private BigDecimal hourlyRate;
    private Set<String> skills;
    private Set<ServiceCategory> serviceCategories;
    private boolean available;
    private String serviceLocation;
    private Integer serviceRadiusKm;
    private boolean active;
    private Double averageRating;
    private Long totalRatings;
    private LocalDateTime createdAt;
    private Boolean isVerified = false;

    public AdminWorkerResponse() {
    }


    public AdminWorkerResponse(Long workerId, Long profileId, String name, String email, String phone,
                               String bio, Integer experienceYears, BigDecimal hourlyRate,
                               Set<String> skills, Set<ServiceCategory> serviceCategories,
                               boolean available, String serviceLocation, Integer serviceRadiusKm,
                               boolean active, Double averageRating, Long totalRatings, LocalDateTime createdAt) {
        this.workerId = workerId;
        this.profileId = profileId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.bio = bio;
        this.experienceYears = experienceYears;
        this.hourlyRate = hourlyRate;
        this.skills = skills;
        this.serviceCategories = serviceCategories;
        this.available = available;
        this.serviceLocation = serviceLocation;
        this.serviceRadiusKm = serviceRadiusKm;
        this.active = active;
        this.averageRating = averageRating;
        this.totalRatings = totalRatings;
        this.createdAt = createdAt;
    }

    public static AdminWorkerResponse fromEntity(WorkerProfile profile, Double averageRating, Long totalRatings) {
        if (profile == null) return null;
        return new AdminWorkerResponse(
                profile.getWorker().getId(),
                profile.getId(),
                profile.getWorker().getName(),
                profile.getWorker().getEmail(),
                profile.getWorker().getPhone(),
                profile.getBio(),
                profile.getExperienceYears(),
                profile.getHourlyRate(),
                profile.getSkills(),
                profile.getServiceCategories(),
                profile.isAvailable(),
                profile.getServiceLocation(),
                profile.getServiceRadiusKm(),
                profile.getWorker().isActive(),
                averageRating != null ? averageRating : 0.0,
                totalRatings != null ? totalRatings : 0L,
                profile.getCreatedAt()
        );
    }

    public Long getWorkerId() {
        return workerId;
    }

    public void setWorkerId(Long workerId) {
        this.workerId = workerId;
    }

    public Long getProfileId() {
        return profileId;
    }

    public void setProfileId(Long profileId) {
        this.profileId = profileId;
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

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
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

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Long getTotalRatings() {
        return totalRatings;
    }

    public void setTotalRatings(Long totalRatings) {
        this.totalRatings = totalRatings;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Boolean getIsVerified() {
        return isVerified;
    }

    public void setIsVerified(Boolean isVerified) {
        this.isVerified = isVerified != null ? isVerified : false;
    }
}

