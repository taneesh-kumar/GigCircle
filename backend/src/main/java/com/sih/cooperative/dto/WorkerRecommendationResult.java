package com.sih.cooperative.dto;

import java.util.List;

public class WorkerRecommendationResult {

    private RecommendedWorkerResponse topRecommendation;
    private List<RecommendedWorkerResponse> otherWorkers;
    private Integer effectiveSearchRadiusKm;
    private String tierMessage;

    public WorkerRecommendationResult() {
    }

    public WorkerRecommendationResult(RecommendedWorkerResponse topRecommendation, List<RecommendedWorkerResponse> otherWorkers, Integer effectiveSearchRadiusKm, String tierMessage) {
        this.topRecommendation = topRecommendation;
        this.otherWorkers = otherWorkers;
        this.effectiveSearchRadiusKm = effectiveSearchRadiusKm;
        this.tierMessage = tierMessage;
    }

    public RecommendedWorkerResponse getTopRecommendation() {
        return topRecommendation;
    }

    public void setTopRecommendation(RecommendedWorkerResponse topRecommendation) {
        this.topRecommendation = topRecommendation;
    }

    public List<RecommendedWorkerResponse> getOtherWorkers() {
        return otherWorkers;
    }

    public void setOtherWorkers(List<RecommendedWorkerResponse> otherWorkers) {
        this.otherWorkers = otherWorkers;
    }

    public Integer getEffectiveSearchRadiusKm() {
        return effectiveSearchRadiusKm;
    }

    public void setEffectiveSearchRadiusKm(Integer effectiveSearchRadiusKm) {
        this.effectiveSearchRadiusKm = effectiveSearchRadiusKm;
    }

    public String getTierMessage() {
        return tierMessage;
    }

    public void setTierMessage(String tierMessage) {
        this.tierMessage = tierMessage;
    }
}
