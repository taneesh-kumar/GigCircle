package com.sih.cooperative.service;

import com.sih.cooperative.dto.CreateServiceRequestRequest;
import com.sih.cooperative.dto.ServiceRequestResponse;
import com.sih.cooperative.entity.Job;
import com.sih.cooperative.entity.Role;
import com.sih.cooperative.entity.ServiceRequest;
import com.sih.cooperative.entity.ServiceRequestStatus;
import com.sih.cooperative.entity.User;
import com.sih.cooperative.repository.JobRepository;
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

    public ServiceRequestService(ServiceRequestRepository serviceRequestRepository,
                                 UserRepository userRepository,
                                 JobRepository jobRepository) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
    }

    private User getAuthenticatedCustomer(String email) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole() != Role.CUSTOMER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only customers can manage service requests");
        }

        return user;
    }

    @Transactional
    public ServiceRequestResponse createServiceRequest(CreateServiceRequestRequest request, String customerEmail) {
        User customer = getAuthenticatedCustomer(customerEmail);

        if (request.getPreferredTime().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preferred time must be in the future");
        }

        ServiceRequest serviceRequest = new ServiceRequest(
                customer,
                request.getCategory(),
                request.getDescription().trim(),
                request.getLocation().trim(),
                request.getBudget(),
                request.getPreferredTime()
        );

        ServiceRequest savedRequest = serviceRequestRepository.save(serviceRequest);
        return ServiceRequestResponse.fromEntity(savedRequest);
    }

    @Transactional(readOnly = true)
    public List<ServiceRequestResponse> getServiceRequestsForCustomer(String customerEmail) {
        User customer = getAuthenticatedCustomer(customerEmail);
        return serviceRequestRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                .stream()
                .map(req -> {
                    Optional<Job> assignedJob = jobRepository.findByServiceRequestId(req.getId());
                    return ServiceRequestResponse.fromEntity(req, assignedJob.orElse(null));
                })
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

        Optional<Job> assignedJob = jobRepository.findByServiceRequestId(request.getId());
        return ServiceRequestResponse.fromEntity(request, assignedJob.orElse(null));
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
        return ServiceRequestResponse.fromEntity(updatedRequest);
    }
}
