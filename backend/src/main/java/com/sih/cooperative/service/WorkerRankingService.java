package com.sih.cooperative.service;

import com.sih.cooperative.dto.NearbyWorkerResponse;
import com.sih.cooperative.dto.RecommendedWorkerResponse;
import com.sih.cooperative.entity.ServiceCategory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WorkerRankingService {

    /**
     * Calculates a deterministic suitability score for ranking eligible workers.
     * Distance is strongly prioritized so local workers rank higher.
     */
    public double calculateScore(NearbyWorkerResponse worker, ServiceCategory requestedCategory) {
        if (worker == null) return 0.0;

        // 1. Distance component (Max 100 points, minus 2 points per km)
        double distanceScore = Math.max(0.0, 100.0 - (worker.getDistanceKm() * 2.0));

        // 2. Rating component (Max 50 points for 5.0 rating)
        double ratingScore = (worker.getRating() != null ? worker.getRating() : 3.5) * 10.0;

        // 3. Experience component (Max 20 points, 2 points per year)
        int exp = worker.getExperienceYears() != null ? worker.getExperienceYears() : 0;
        double experienceScore = Math.min(20.0, exp * 2.0);

        // 4. Exact category match bonus
        double categoryBonus = 0.0;
        if (requestedCategory != null && worker.getServiceCategories() != null && worker.getServiceCategories().contains(requestedCategory)) {
            categoryBonus = 20.0;
        }

        double totalScore = distanceScore + ratingScore + experienceScore + categoryBonus;
        return Math.round(totalScore * 10.0) / 10.0;
    }

    /**
     * Generates human-readable explainable match reasons for customer display.
     */
    public List<String> generateMatchReasons(NearbyWorkerResponse worker, ServiceCategory requestedCategory) {
        List<String> reasons = new ArrayList<>();

        if (requestedCategory != null && worker.getServiceCategories() != null && worker.getServiceCategories().contains(requestedCategory)) {
            String catName = requestedCategory.name().toLowerCase().replace('_', ' ');
            reasons.add("✓ Required " + catName + " category");
        } else {
            reasons.add("✓ Qualified service provider");
        }

        if (worker.isAvailable()) {
            reasons.add("✓ Available now");
        }

        if (worker.getDistanceKm() != null) {
            reasons.add("✓ " + worker.getDistanceKm() + " km away");
        }

        if (worker.getRating() != null && worker.getRating() > 0) {
            long count = worker.getTotalRatings() != null ? worker.getTotalRatings() : 0;
            reasons.add("✓ " + String.format("%.1f", worker.getRating()) + "★ customer rating" + (count > 0 ? " (" + count + " review" + (count == 1 ? "" : "s") + ")" : ""));
        }

        return reasons;
    }

    /**
     * Ranks eligible candidate workers by suitability score descending and assigns suitability badges.
     */
    public List<RecommendedWorkerResponse> rankAndWrapWorkers(List<NearbyWorkerResponse> candidates, ServiceCategory requestedCategory) {
        if (candidates == null || candidates.isEmpty()) {
            return List.of();
        }

        List<RecommendedWorkerResponse> rankedList = candidates.stream()
                .map(worker -> {
                    double score = calculateScore(worker, requestedCategory);
                    List<String> reasons = generateMatchReasons(worker, requestedCategory);
                    return RecommendedWorkerResponse.fromNearbyWorker(worker, reasons, "", score);
                })
                .sorted(Comparator.comparingDouble(RecommendedWorkerResponse::getSuitabilityScore).reversed())
                .collect(Collectors.toList());

        // Assign Suitability Badges
        for (int i = 0; i < rankedList.size(); i++) {
            RecommendedWorkerResponse worker = rankedList.get(i);
            if (i == 0) {
                worker.setSuitabilityBadge("Top Recommended Match");
            } else if (i == 1 && worker.getSuitabilityScore() >= 100.0) {
                worker.setSuitabilityBadge("Highly Suitable");
            } else {
                worker.setSuitabilityBadge("Nearby Match");
            }
        }

        return rankedList;
    }
}
