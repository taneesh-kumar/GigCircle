package com.sih.cooperative.service;

import com.sih.cooperative.entity.ServiceRequest;
import com.sih.cooperative.entity.WorkerProfile;
import org.springframework.stereotype.Service;

import java.util.Comparator;

@Service
public class WorkerMatchingService {

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

        // 3. Text locality match check
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

    private boolean isExactLocationMatch(String reqLoc, String workerLoc) {
        if (reqLoc == null || workerLoc == null) return false;
        return reqLoc.trim().equalsIgnoreCase(workerLoc.trim());
    }
}
