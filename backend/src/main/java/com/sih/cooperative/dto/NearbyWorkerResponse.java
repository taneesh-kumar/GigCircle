package com.sih.cooperative.dto;

import com.sih.cooperative.entity.ServiceCategory;

import java.math.BigDecimal;
import java.util.Set;

public class NearbyWorkerResponse {

    private Long workerId;
    private String name;
    private Double distanceKm;
    private Double rating;
    private Long totalRatings;
    private boolean available;
    private Integer experienceYears;
    private BigDecimal hourlyRate;
    private Set<ServiceCategory> serviceCategories;
    private Set<String> skills;
    private Integer matchedSearchRadiusKm;
    private Boolean isVerified = false;

    public NearbyWorkerResponse() {
    }

    public NearbyWorkerResponse(Long workerId, String name, Double distanceKm, Double rating, Long totalRatings, boolean available, Integer experienceYears, BigDecimal hourlyRate, Set<ServiceCategory> serviceCategories, Set<String> skills, Integer matchedSearchRadiusKm) {
        this(workerId, name, distanceKm, rating, totalRatings, available, experienceYears, hourlyRate, serviceCategories, skills, matchedSearchRadiusKm, false);
    }

    public NearbyWorkerResponse(Long workerId, String name, Double distanceKm, Double rating, Long totalRatings, boolean available, Integer experienceYears, BigDecimal hourlyRate, Set<ServiceCategory> serviceCategories, Set<String> skills, Integer matchedSearchRadiusKm, Boolean isVerified) {
        this.workerId = workerId;
        this.name = name;
        this.distanceKm = distanceKm;
        this.rating = rating != null ? rating : 0.0;
        this.totalRatings = totalRatings != null ? totalRatings : 0L;
        this.available = available;
        this.experienceYears = experienceYears;
        this.hourlyRate = hourlyRate;
        this.serviceCategories = serviceCategories;
        this.skills = skills;
        this.matchedSearchRadiusKm = matchedSearchRadiusKm;
        this.isVerified = isVerified != null ? isVerified : false;
    }


    public Long getWorkerId() {
        return workerId;
    }

    public void setWorkerId(Long workerId) {
        this.workerId = workerId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public Long getTotalRatings() {
        return totalRatings;
    }

    public void setTotalRatings(Long totalRatings) {
        this.totalRatings = totalRatings;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
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

    public Set<ServiceCategory> getServiceCategories() {
        return serviceCategories;
    }

    public void setServiceCategories(Set<ServiceCategory> serviceCategories) {
        this.serviceCategories = serviceCategories;
    }

    public Set<String> getSkills() {
        return skills;
    }

    public void setSkills(Set<String> skills) {
        this.skills = skills;
    }

    public Integer getMatchedSearchRadiusKm() {
        return matchedSearchRadiusKm;
    }

    public void setMatchedSearchRadiusKm(Integer matchedSearchRadiusKm) {
        this.matchedSearchRadiusKm = matchedSearchRadiusKm;
    }

    public Boolean getIsVerified() {
        return isVerified;
    }

    public void setIsVerified(Boolean isVerified) {
        this.isVerified = isVerified != null ? isVerified : false;
    }
}

