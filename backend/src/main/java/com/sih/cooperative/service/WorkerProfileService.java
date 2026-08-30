package com.sih.cooperative.service;

import com.sih.cooperative.dto.CreateWorkerProfileRequest;
import com.sih.cooperative.dto.UpdateWorkerProfileRequest;
import com.sih.cooperative.dto.WorkerProfileResponse;
import com.sih.cooperative.entity.Role;
import com.sih.cooperative.entity.User;
import com.sih.cooperative.entity.WorkerProfile;
import com.sih.cooperative.repository.UserRepository;
import com.sih.cooperative.repository.WorkerProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class WorkerProfileService {

    private final WorkerProfileRepository workerProfileRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public WorkerProfileService(WorkerProfileRepository workerProfileRepository, UserRepository userRepository, NotificationService notificationService) {
        this.workerProfileRepository = workerProfileRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    private User getAuthenticatedWorker(String email) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole() != Role.WORKER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only workers can access worker profile management");
        }

        return user;
    }

    private Set<String> sanitizeSkills(Set<String> skills) {
        if (skills == null) return Set.of();
        return skills.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    @Transactional(readOnly = true)
    public WorkerProfileResponse getWorkerProfile(String workerEmail) {
        User worker = getAuthenticatedWorker(workerEmail);

        WorkerProfile profile = workerProfileRepository.findByWorkerId(worker.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worker profile not found"));

        return WorkerProfileResponse.fromEntity(profile);
    }

    @Transactional
    public WorkerProfileResponse createWorkerProfile(CreateWorkerProfileRequest request, String workerEmail) {
        User worker = getAuthenticatedWorker(workerEmail);

        if (workerProfileRepository.existsByWorkerId(worker.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Worker profile already exists");
        }

        Set<String> cleanSkills = sanitizeSkills(request.getSkills());
        if (cleanSkills.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one non-empty skill is required");
        }

        boolean available = request.getIsAvailable() != null ? request.getIsAvailable() : true;

        WorkerProfile profile = new WorkerProfile(
                worker,
                request.getBio() != null ? request.getBio().trim() : null,
                request.getExperienceYears(),
                request.getHourlyRate(),
                cleanSkills,
                request.getServiceCategories(),
                available,
                request.getServiceLocation() != null ? request.getServiceLocation().trim() : null,
                request.getServiceRadiusKm()
        );

        WorkerProfile savedProfile = workerProfileRepository.save(profile);

        notificationService.createAdminNotification(
                com.sih.cooperative.entity.NotificationType.NEW_WORKER_REGISTERED,
                "New worker registered",
                worker.getName() + " has registered as a worker and is available for work in " + (profile.getServiceLocation() != null ? profile.getServiceLocation() : "unspecified location") + ".",
                "USER",
                worker.getId()
        );

        return WorkerProfileResponse.fromEntity(savedProfile);
    }

    @Transactional
    public WorkerProfileResponse updateWorkerProfile(UpdateWorkerProfileRequest request, String workerEmail) {
        User worker = getAuthenticatedWorker(workerEmail);

        WorkerProfile profile = workerProfileRepository.findByWorkerId(worker.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worker profile not found"));

        Set<String> cleanSkills = sanitizeSkills(request.getSkills());
        if (cleanSkills.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one non-empty skill is required");
        }

        profile.setBio(request.getBio() != null ? request.getBio().trim() : null);
        profile.setExperienceYears(request.getExperienceYears());
        profile.setHourlyRate(request.getHourlyRate());
        profile.setSkills(cleanSkills);
        profile.setServiceCategories(request.getServiceCategories());
        if (request.getIsAvailable() != null) {
            profile.setAvailable(request.getIsAvailable());
        }
        profile.setServiceLocation(request.getServiceLocation() != null ? request.getServiceLocation().trim() : null);
        profile.setServiceRadiusKm(request.getServiceRadiusKm());

        WorkerProfile updatedProfile = workerProfileRepository.save(profile);
        return WorkerProfileResponse.fromEntity(updatedProfile);
    }

    @Transactional
    public WorkerProfileResponse toggleAvailability(Boolean isAvailable, String workerEmail) {
        User worker = getAuthenticatedWorker(workerEmail);

        WorkerProfile profile = workerProfileRepository.findByWorkerId(worker.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worker profile not found"));

        profile.setAvailable(isAvailable != null ? isAvailable : !profile.isAvailable());
        WorkerProfile updatedProfile = workerProfileRepository.save(profile);
        return WorkerProfileResponse.fromEntity(updatedProfile);
    }
}
