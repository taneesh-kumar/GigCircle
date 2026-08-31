package com.sih.cooperative.dto;

import com.sih.cooperative.entity.ServiceCategory;
import com.sih.cooperative.entity.WorkerProfile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

public class WorkerProfileResponse {

    private Long id;
    private Long workerId;
    private String workerName;
    private String workerEmail;
    private String workerPhone;
    private String bio;
    private Integer experienceYears;
    private BigDecimal hourlyRate;
    private Set<String> skills;
    private Set<ServiceCategory> serviceCategories;
    private boolean isAvailable;
    private String serviceLocation;
    private Integer serviceRadiusKm;
    private Double latitude;
    private Double longitude;
    private String address;
    private String city;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public WorkerProfileResponse() {
    }

    public WorkerProfileResponse(Long id, Long workerId, String workerName, String workerEmail, String workerPhone, String bio, Integer experienceYears, BigDecimal hourlyRate, Set<String> skills, Set<ServiceCategory> serviceCategories, boolean isAvailable, String serviceLocation, Integer serviceRadiusKm, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this(id, workerId, workerName, workerEmail, workerPhone, bio, experienceYears, hourlyRate, skills, serviceCategories, isAvailable, serviceLocation, serviceRadiusKm, null, null, null, null, createdAt, updatedAt);
    }

    public WorkerProfileResponse(Long id, Long workerId, String workerName, String workerEmail, String workerPhone, String bio, Integer experienceYears, BigDecimal hourlyRate, Set<String> skills, Set<ServiceCategory> serviceCategories, boolean isAvailable, String serviceLocation, Integer serviceRadiusKm, Double latitude, Double longitude, String address, String city, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.workerId = workerId;
        this.workerName = workerName;
        this.workerEmail = workerEmail;
        this.workerPhone = workerPhone;
        this.bio = bio;
        this.experienceYears = experienceYears;
        this.hourlyRate = hourlyRate;
        this.skills = skills;
        this.serviceCategories = serviceCategories;
        this.isAvailable = isAvailable;
        this.serviceLocation = serviceLocation;
        this.serviceRadiusKm = serviceRadiusKm;
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
        this.city = city;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static WorkerProfileResponse fromEntity(WorkerProfile profile) {
        return new WorkerProfileResponse(
                profile.getId(),
                profile.getWorker() != null ? profile.getWorker().getId() : null,
                profile.getWorker() != null ? profile.getWorker().getName() : null,
                profile.getWorker() != null ? profile.getWorker().getEmail() : null,
                profile.getWorker() != null ? profile.getWorker().getPhone() : null,
                profile.getBio(),
                profile.getExperienceYears(),
                profile.getHourlyRate(),
                profile.getSkills(),
                profile.getServiceCategories(),
                profile.isAvailable(),
                profile.getServiceLocation(),
                profile.getServiceRadiusKm(),
                profile.getLatitude(),
                profile.getLongitude(),
                profile.getAddress(),
                profile.getCity(),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getWorkerId() {
        return workerId;
    }

    public void setWorkerId(Long workerId) {
        this.workerId = workerId;
    }

    public String getWorkerName() {
        return workerName;
    }

    public void setWorkerName(String workerName) {
        this.workerName = workerName;
    }

    public String getWorkerEmail() {
        return workerEmail;
    }

    public void setWorkerEmail(String workerEmail) {
        this.workerEmail = workerEmail;
    }

    public String getWorkerPhone() {
        return workerPhone;
    }

    public void setWorkerPhone(String workerPhone) {
        this.workerPhone = workerPhone;
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
        return isAvailable;
    }

    public void setAvailable(boolean available) {
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

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
