package com.sih.cooperative.dto;

import java.util.List;

public class NearbyWorkerSearchResult {

    private List<NearbyWorkerResponse> workers;
    private Integer effectiveRadiusKm;
    private String tierMessage;

    public NearbyWorkerSearchResult() {
    }

    public NearbyWorkerSearchResult(List<NearbyWorkerResponse> workers, Integer effectiveRadiusKm, String tierMessage) {
        this.workers = workers;
        this.effectiveRadiusKm = effectiveRadiusKm;
        this.tierMessage = tierMessage;
    }

    public List<NearbyWorkerResponse> getWorkers() {
        return workers;
    }

    public void setWorkers(List<NearbyWorkerResponse> workers) {
        this.workers = workers;
    }

    public Integer getEffectiveRadiusKm() {
        return effectiveRadiusKm;
    }

    public void setEffectiveRadiusKm(Integer effectiveRadiusKm) {
        this.effectiveRadiusKm = effectiveRadiusKm;
    }

    public String getTierMessage() {
        return tierMessage;
    }

    public void setTierMessage(String tierMessage) {
        this.tierMessage = tierMessage;
    }
}
