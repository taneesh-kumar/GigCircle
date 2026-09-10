package com.sih.cooperative.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "worker_profiles")
public class WorkerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "worker_id", nullable = false, unique = true)
    private User worker;

    @Column(length = 500)
    private String bio;

    @Column(name = "experience_years", nullable = false)
    private Integer experienceYears;

    @Column(name = "hourly_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "worker_profile_skills", joinColumns = @JoinColumn(name = "worker_profile_id"))
    @Column(name = "skill")
    private Set<String> skills = new HashSet<>();

    @ElementCollection(targetClass = ServiceCategory.class, fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "worker_profile_categories", joinColumns = @JoinColumn(name = "worker_profile_id"))
    @Column(name = "category")
    private Set<ServiceCategory> serviceCategories = new HashSet<>();

    @Column(name = "is_available", nullable = false)
    private boolean isAvailable = true;

    @Column(name = "service_location", length = 255)
    private String serviceLocation;

    @Column(name = "service_radius_km")
    private Integer serviceRadiusKm;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public WorkerProfile() {
    }

    public WorkerProfile(User worker, String bio, Integer experienceYears, BigDecimal hourlyRate, Set<String> skills, Set<ServiceCategory> serviceCategories, boolean isAvailable, String serviceLocation, Integer serviceRadiusKm) {
        this(worker, bio, experienceYears, hourlyRate, skills, serviceCategories, isAvailable, serviceLocation, serviceRadiusKm, null, null, null, null);
    }

    public WorkerProfile(User worker, String bio, Integer experienceYears, BigDecimal hourlyRate, Set<String> skills, Set<ServiceCategory> serviceCategories, boolean isAvailable, String serviceLocation, Integer serviceRadiusKm, Double latitude, Double longitude, String address, String city) {
        this.worker = worker;
        this.bio = bio;
        this.experienceYears = experienceYears;
        this.hourlyRate = hourlyRate;
        if (skills != null) this.skills = skills;
        if (serviceCategories != null) this.serviceCategories = serviceCategories;
        this.isAvailable = isAvailable;
        this.serviceLocation = serviceLocation;
        this.serviceRadiusKm = serviceRadiusKm;
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
        this.city = city;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getWorker() {
        return worker;
    }

    public void setWorker(User worker) {
        this.worker = worker;
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
