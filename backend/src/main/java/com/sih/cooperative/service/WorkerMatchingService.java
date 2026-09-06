package com.sih.cooperative.service;

import com.sih.cooperative.dto.NearbyWorkerResponse;
import com.sih.cooperative.dto.NearbyWorkerSearchResult;
import com.sih.cooperative.dto.RecommendedWorkerResponse;
import com.sih.cooperative.dto.WorkerRecommendationResult;
import com.sih.cooperative.entity.ServiceCategory;
import com.sih.cooperative.entity.ServiceRequest;
import com.sih.cooperative.entity.WorkerProfile;
import com.sih.cooperative.repository.RatingRepository;
import com.sih.cooperative.repository.WorkerProfileRepository;
import com.sih.cooperative.util.HaversineUtil;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WorkerMatchingService {

    private final WorkerProfileRepository workerProfileRepository;
    private final RatingRepository ratingRepository;

    public WorkerMatchingService(WorkerProfileRepository workerProfileRepository, RatingRepository ratingRepository) {
        this.workerProfileRepository = workerProfileRepository;
        this.ratingRepository = ratingRepository;
    }

    public boolean isLocationCompatible(String requestLocation, String workerLocation) {
        if (workerLocation == null || workerLocation.isBlank() || requestLocation == null || requestLocation.isBlank()) {
            return true;
        }

        String normReq = requestLocation.toLowerCase().trim();
        String normWorker = workerLocation.toLowerCase().trim();

        if (normReq.contains(normWorker) || normWorker.contains(normReq)) {
            return true;
        }

        // Token-based matching for multi-segment addresses (e.g. matching shared locality/city like "Vijayawada")
        String[] reqTokens = normReq.split("[,\\s]+");
        String[] workerTokens = normWorker.split("[,\\s]+");

        for (String wToken : workerTokens) {
            String cleanToken = wToken.trim();
            if (cleanToken.length() >= 3) {
                for (String rToken : reqTokens) {
                    if (rToken.trim().equals(cleanToken)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    public boolean isWorkerEligible(ServiceRequest request, WorkerProfile profile) {
        if (request == null || profile == null) {
            return false;
        }

        // 0. Worker account active status check
        if (profile.getWorker() == null || !profile.getWorker().isActive()) {
            return false;
        }

        // 1. Worker availability check
        if (!profile.isAvailable()) {
            return false;
        }

        // 2. Category match check
        if (profile.getServiceCategories() == null || !profile.getServiceCategories().contains(request.getCategory())) {
            return false;
        }

        // 3. Geographic distance check if both coordinates exist (Platform enforces max 30 km)
        if (request.getLatitude() != null && request.getLongitude() != null
                && profile.getLatitude() != null && profile.getLongitude() != null) {
            double distanceKm = HaversineUtil.calculateDistanceKm(
                    request.getLatitude(), request.getLongitude(),
                    profile.getLatitude(), profile.getLongitude()
            );
            return distanceKm <= 30.0;
        }

        // 4. Fallback text locality match check if coordinates missing
        return isLocationCompatible(request.getLocation(), profile.getServiceLocation());
    }

    public Comparator<WorkerProfile> getPriorityComparator(String requestLocation) {
        return (p1, p2) -> {
            boolean p1ExactLoc = isExactLocationMatch(requestLocation, p1.getServiceLocation());
            boolean p2ExactLoc = isExactLocationMatch(requestLocation, p2.getServiceLocation());

            if (p1ExactLoc != p2ExactLoc) {
                return p1ExactLoc ? -1 : 1;
            }

            // Lower hourly rate first
            int rateCompare = p1.getHourlyRate().compareTo(p2.getHourlyRate());
            if (rateCompare != 0) {
                return rateCompare;
            }

            // Greater experience first
            int expCompare = Integer.compare(p2.getExperienceYears(), p1.getExperienceYears());
            if (expCompare != 0) {
                return expCompare;
            }

            // Profile ID
            return p1.getId().compareTo(p2.getId());
        };
    }

    /**
     * Executes Progressive Tiered Radius Search (10 km -> 20 km -> 30 km max) for qualified, available workers.
     * Stops at the smallest radius with eligible workers and sorts returned workers strictly by distance (nearest first).
     */
    public NearbyWorkerSearchResult findNearbyWorkers(Double customerLat, Double customerLng, ServiceCategory category, Integer requestedRadius) {
        if (customerLat == null || customerLng == null) {
            return new NearbyWorkerSearchResult(
                    List.of(),
                    10,
                    "Please select a service location on the map to find nearby workers."
            );
        }

        List<WorkerProfile> allProfiles = workerProfileRepository.findAll();

        // Base Filter: Active, Available, Matching Category, Valid Worker Coordinates
        List<WorkerProfile> eligibleProfiles = allProfiles.stream()
                .filter(p -> p.getWorker() != null && p.getWorker().isActive())
                .filter(WorkerProfile::isAvailable)
                .filter(p -> category == null || (p.getServiceCategories() != null && p.getServiceCategories().contains(category)))
                .filter(p -> p.getLatitude() != null && p.getLongitude() != null)
                .collect(Collectors.toList());

        // Platform Search Radii Tiers: 10 km -> 20 km -> 30 km (capped at max 30 km)
        int effectiveCap = (requestedRadius != null) ? Math.min(requestedRadius, 30) : 30;
        int[] tiers = (requestedRadius != null) ? new int[]{effectiveCap} : new int[]{10, 20, 30};

        for (int tierRadius : tiers) {
            List<NearbyWorkerResponse> matchedWorkers = eligibleProfiles.stream()
                    .map(profile -> {
                        double distanceKm = HaversineUtil.calculateDistanceKm(customerLat, customerLng, profile.getLatitude(), profile.getLongitude());
                        if (distanceKm <= tierRadius) {
                            Long workerId = profile.getWorker().getId();
                            Double avgRating = ratingRepository.findAverageScoreByWorkerId(workerId);
                            Long countRatings = ratingRepository.countByWorkerId(workerId);

                            return new NearbyWorkerResponse(
                                    workerId,
                                    profile.getWorker().getName(),
                                    distanceKm,
                                    avgRating,
                                    countRatings,
                                    profile.isAvailable(),
                                    profile.getExperienceYears(),
                                    profile.getHourlyRate(),
                                    profile.getServiceCategories(),
                                    profile.getSkills(),
                                    tierRadius
                            );
                        }
                        return null;
                    })
                    .filter(res -> res != null)
                    .sorted(Comparator.comparingDouble(NearbyWorkerResponse::getDistanceKm))
                    .collect(Collectors.toList());

            if (!matchedWorkers.isEmpty()) {
                String tierMessage;
                if (tierRadius == 10) {
                    tierMessage = matchedWorkers.size() + " worker" + (matchedWorkers.size() == 1 ? "" : "s") + " found within 10 km";
                } else if (tierRadius == 20) {
                    tierMessage = "No available workers found within 10 km. Expanded search to 20 km (" + matchedWorkers.size() + " worker" + (matchedWorkers.size() == 1 ? "" : "s") + " found).";
                } else {
                    tierMessage = "No available workers found within 20 km. Expanded search to 30 km (" + matchedWorkers.size() + " worker" + (matchedWorkers.size() == 1 ? "" : "s") + " found).";
                }

                return new NearbyWorkerSearchResult(matchedWorkers, tierRadius, tierMessage);
            }
        }

        // Zero workers found within 30 km
        return new NearbyWorkerSearchResult(
                List.of(),
                30,
                "No available workers found within 30 km for this service."
        );
    }

    /**
     * Returns nearby workers wrapped in simple distance-sorted response objects with no recommendation ranking.
     */
    public WorkerRecommendationResult getWorkerRecommendations(Double customerLat, Double customerLng, ServiceCategory category, Integer requestedRadius) {
        NearbyWorkerSearchResult rawSearch = findNearbyWorkers(customerLat, customerLng, category, requestedRadius);

        if (rawSearch.getWorkers() == null || rawSearch.getWorkers().isEmpty()) {
            return new WorkerRecommendationResult(null, List.of(), rawSearch.getEffectiveRadiusKm(), rawSearch.getTierMessage());
        }

        List<RecommendedWorkerResponse> distanceSortedWorkers = rawSearch.getWorkers().stream()
                .map(w -> RecommendedWorkerResponse.fromNearbyWorker(w, List.of(), "Available Nearby", w.getDistanceKm()))
                .collect(Collectors.toList());

        RecommendedWorkerResponse topMatch = distanceSortedWorkers.get(0);
        List<RecommendedWorkerResponse> otherMatches = distanceSortedWorkers.stream().skip(1).collect(Collectors.toList());

        return new WorkerRecommendationResult(
                topMatch,
                otherMatches,
                rawSearch.getEffectiveRadiusKm(),
                rawSearch.getTierMessage()
        );
    }

    private boolean isExactLocationMatch(String reqLoc, String workerLoc) {
        if (reqLoc == null || workerLoc == null) return false;
        return reqLoc.trim().equalsIgnoreCase(workerLoc.trim());
    }
}
