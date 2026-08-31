package com.sih.cooperative.service;

import com.sih.cooperative.dto.CreateServiceRequestRequest;
import com.sih.cooperative.dto.ServiceRequestResponse;
import com.sih.cooperative.dto.WorkerRatingSummary;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.JobRepository;
import com.sih.cooperative.repository.RatingRepository;
import com.sih.cooperative.repository.ServiceRequestRepository;
import com.sih.cooperative.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ServiceRequestService {

    private final ServiceRequestRepository serviceRequestRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final RatingRepository ratingRepository;
    private final NotificationService notificationService;

    public ServiceRequestService(ServiceRequestRepository serviceRequestRepository,
                                 UserRepository userRepository,
                                 JobRepository jobRepository,
                                 RatingRepository ratingRepository,
                                 NotificationService notificationService) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.ratingRepository = ratingRepository;
        this.notificationService = notificationService;
    }

    private User getAuthenticatedCustomer(String email) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole() != Role.CUSTOMER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only customers can manage service requests");
        }

        return user;
    }

    private ServiceRequestResponse mapToResponse(ServiceRequest req) {
        Optional<Job> assignedJobOpt = jobRepository.findByServiceRequestId(req.getId());
        if (assignedJobOpt.isPresent()) {
            Job job = assignedJobOpt.get();
            WorkerRatingSummary summary = null;
            if (job.getWorker() != null) {
                Long workerId = job.getWorker().getId();
                Double avg = ratingRepository.findAverageScoreByWorkerId(workerId);
                Long count = ratingRepository.countByWorkerId(workerId);
                summary = new WorkerRatingSummary(workerId, avg, count);
            }
            boolean isRated = ratingRepository.existsByJobId(job.getId());
            return ServiceRequestResponse.fromEntity(req, job, summary, isRated);
        }
        return ServiceRequestResponse.fromEntity(req, null, null, false);
    }

    @Transactional
    public ServiceRequestResponse createServiceRequest(CreateServiceRequestRequest request, String customerEmail) {
        User customer = getAuthenticatedCustomer(customerEmail);

        if (request.getPreferredTime().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preferred time must be in the future");
        }

        String locationStr = request.getLocation() != null ? request.getLocation().trim() : "";
        String addressStr = request.getAddress() != null ? request.getAddress().trim() : locationStr;
        String cityStr = request.getCity() != null ? request.getCity().trim() : null;

        ServiceRequest serviceRequest = new ServiceRequest(
                customer,
                request.getCategory(),
                request.getDescription().trim(),
                locationStr,
                request.getBudget(),
                request.getPreferredTime(),
                request.getLatitude(),
                request.getLongitude(),
                addressStr,
                cityStr
        );

        ServiceRequest savedRequest = serviceRequestRepository.save(serviceRequest);

        // Segment 8: Trigger Notification
        notificationService.createNotification(
                customer,
                NotificationType.SERVICE_REQUEST_CREATED,
                "Service request created",
                "Your service request for " + savedRequest.getCategory() + " has been created successfully.",
                "SERVICE_REQUEST",
                savedRequest.getId()
        );

        return ServiceRequestResponse.fromEntity(savedRequest);
    }

    @Transactional(readOnly = true)
    public List<ServiceRequestResponse> getServiceRequestsForCustomer(String customerEmail) {
        User customer = getAuthenticatedCustomer(customerEmail);
        return serviceRequestRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ServiceRequestResponse getServiceRequestDetail(Long id, String customerEmail) {
        User customer = getAuthenticatedCustomer(customerEmail);

        ServiceRequest request = serviceRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service request not found"));

        if (!request.getCustomer().getId().equals(customer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to requested service request");
        }

        return mapToResponse(request);
    }

    @Transactional
    public ServiceRequestResponse cancelServiceRequest(Long id, String customerEmail) {
        User customer = getAuthenticatedCustomer(customerEmail);

        ServiceRequest request = serviceRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service request not found"));

        if (!request.getCustomer().getId().equals(customer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to requested service request");
        }

        if (jobRepository.existsByServiceRequestId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Assigned service requests cannot be cancelled.");
        }

        if (request.getStatus() != ServiceRequestStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only OPEN requests can be cancelled");
        }

        request.setStatus(ServiceRequestStatus.CANCELLED);
        ServiceRequest updatedRequest = serviceRequestRepository.save(request);

        // Segment 8: Trigger Notification
        notificationService.createNotification(
                customer,
                NotificationType.SERVICE_REQUEST_CANCELLED,
                "Request cancelled",
                "Your service request has been cancelled.",
                "SERVICE_REQUEST",
                updatedRequest.getId()
        );

        notificationService.createAdminNotification(
                NotificationType.SERVICE_REQUEST_CANCELLED,
                "Service request cancelled",
                customer.getName() + " cancelled the '" + updatedRequest.getDescription() + "' request.",
                "SERVICE_REQUEST",
                updatedRequest.getId()
        );

        return ServiceRequestResponse.fromEntity(updatedRequest);
    }
}
