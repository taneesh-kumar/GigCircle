package com.sih.cooperative.dto;

import com.sih.cooperative.entity.ServiceCategory;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

public class RecommendedWorkerResponse extends NearbyWorkerResponse {

    private List<String> matchReasons;
    private String suitabilityBadge;
    private Double suitabilityScore;

    public RecommendedWorkerResponse() {
        super();
    }

    public RecommendedWorkerResponse(Long workerId, String name, Double distanceKm, Double rating, Long totalRatings, boolean available, Integer experienceYears, BigDecimal hourlyRate, Set<ServiceCategory> serviceCategories, Set<String> skills, Integer matchedSearchRadiusKm, List<String> matchReasons, String suitabilityBadge, Double suitabilityScore) {
        super(workerId, name, distanceKm, rating, totalRatings, available, experienceYears, hourlyRate, serviceCategories, skills, matchedSearchRadiusKm);
        this.matchReasons = matchReasons;
        this.suitabilityBadge = suitabilityBadge;
        this.suitabilityScore = suitabilityScore;
    }

    public static RecommendedWorkerResponse fromNearbyWorker(NearbyWorkerResponse worker, List<String> matchReasons, String suitabilityBadge, Double suitabilityScore) {
        return new RecommendedWorkerResponse(
                worker.getWorkerId(),
                worker.getName(),
                worker.getDistanceKm(),
                worker.getRating(),
                worker.getTotalRatings(),
                worker.isAvailable(),
                worker.getExperienceYears(),
                worker.getHourlyRate(),
                worker.getServiceCategories(),
                worker.getSkills(),
                worker.getMatchedSearchRadiusKm(),
                matchReasons,
                suitabilityBadge,
                suitabilityScore
        );
    }

    public List<String> getMatchReasons() {
        return matchReasons;
    }

    public void setMatchReasons(List<String> matchReasons) {
        this.matchReasons = matchReasons;
    }

    public String getSuitabilityBadge() {
        return suitabilityBadge;
    }

    public void setSuitabilityBadge(String suitabilityBadge) {
        this.suitabilityBadge = suitabilityBadge;
    }

    public Double getSuitabilityScore() {
        return suitabilityScore;
    }

    public void setSuitabilityScore(Double suitabilityScore) {
        this.suitabilityScore = suitabilityScore;
    }
}
