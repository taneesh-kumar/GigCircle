package com.sih.cooperative.dto;

import com.sih.cooperative.entity.ServiceCategory;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.Set;

public class UpdateWorkerProfileRequest {

    @Size(max = 500, message = "Bio must not exceed 500 characters")
    private String bio;

    @NotNull(message = "Experience years is required")
    @Min(value = 0, message = "Experience years cannot be negative")
    private Integer experienceYears;

    @NotNull(message = "Hourly rate is required")
    @DecimalMin(value = "0.01", message = "Hourly rate must be greater than 0")
    private BigDecimal hourlyRate;

    @NotEmpty(message = "At least one skill is required")
    private Set<String> skills;

    @NotEmpty(message = "At least one service category is required")
    private Set<ServiceCategory> serviceCategories;

    private Boolean isAvailable;

    @Size(max = 255, message = "Service location must not exceed 255 characters")
    private String serviceLocation;

    @Min(value = 1, message = "Service radius must be at least 1 km")
    private Integer serviceRadiusKm;

    public UpdateWorkerProfileRequest() {
    }

    public UpdateWorkerProfileRequest(String bio, Integer experienceYears, BigDecimal hourlyRate, Set<String> skills, Set<ServiceCategory> serviceCategories, Boolean isAvailable, String serviceLocation, Integer serviceRadiusKm) {
        this.bio = bio;
        this.experienceYears = experienceYears;
        this.hourlyRate = hourlyRate;
        this.skills = skills;
        this.serviceCategories = serviceCategories;
        this.isAvailable = isAvailable;
        this.serviceLocation = serviceLocation;
        this.serviceRadiusKm = serviceRadiusKm;
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

    public Boolean getIsAvailable() {
        return isAvailable;
    }

    public void setIsAvailable(Boolean available) {
        isAvailable = available;
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
}
