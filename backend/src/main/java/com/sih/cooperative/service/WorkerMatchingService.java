package com.sih.cooperative.service;

import com.sih.cooperative.dto.NearbyWorkerResponse;
import com.sih.cooperative.dto.NearbyWorkerSearchResult;
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

        return normReq.contains(normWorker) || normWorker.contains(normReq);
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

        // 3. Geographic distance check if both coordinates exist
        if (request.getLatitude() != null && request.getLongitude() != null
                && profile.getLatitude() != null && profile.getLongitude() != null) {
            double distanceKm = HaversineUtil.calculateDistanceKm(
                    request.getLatitude(), request.getLongitude(),
                    profile.getLatitude(), profile.getLongitude()
            );
            int maxRadius = profile.getServiceRadiusKm() != null ? profile.getServiceRadiusKm() : 50;
            return distanceKm <= maxRadius;
        }

        // 4. Fallback text locality match check
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
     * Executes Tiered Radius Search (10 km -> 25 km -> 50 km) for qualified, available workers.
     * Sorts returned workers by distance ascending (nearest first).
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

        // Tiered Search Radii: 10 km -> 25 km -> 50 km (unless an explicit radius is requested)
        int[] tiers = (requestedRadius != null) ? new int[]{requestedRadius} : new int[]{10, 25, 50};

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
                } else if (tierRadius == 25) {
                    tierMessage = "No suitable workers found within 10 km. Expanded search to 25 km (" + matchedWorkers.size() + " worker" + (matchedWorkers.size() == 1 ? "" : "s") + " found).";
                } else {
                    tierMessage = "No suitable workers found within 25 km. Expanded search to 50 km (" + matchedWorkers.size() + " worker" + (matchedWorkers.size() == 1 ? "" : "s") + " found).";
                }

                return new NearbyWorkerSearchResult(matchedWorkers, tierRadius, tierMessage);
            }
        }

        // Zero workers found within 50 km
        return new NearbyWorkerSearchResult(
                List.of(),
                50,
                "No suitable workers found within 50 km. Try selecting another service location or try again later."
        );
    }

    private boolean isExactLocationMatch(String reqLoc, String workerLoc) {
        if (reqLoc == null || workerLoc == null) return false;
        return reqLoc.trim().equalsIgnoreCase(workerLoc.trim());
    }
}
