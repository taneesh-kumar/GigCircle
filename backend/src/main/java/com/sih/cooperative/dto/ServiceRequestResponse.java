package com.sih.cooperative.dto;

import com.sih.cooperative.entity.Job;
import com.sih.cooperative.entity.JobStatus;
import com.sih.cooperative.entity.ServiceCategory;
import com.sih.cooperative.entity.ServiceRequest;
import com.sih.cooperative.entity.ServiceRequestStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ServiceRequestResponse {

    private Long id;
    private ServiceCategory category;
    private String description;
    private String location;
    private Double latitude;
    private Double longitude;
    private String address;
    private String city;
    private BigDecimal budget;
    private LocalDateTime preferredTime;
    private ServiceRequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long customerId;
    private String customerName;

    // Segment 4 & 5 Assignment & Job Lifecycle Details
    private String assignmentStatus;
    private Long jobId;
    private Long workerId;
    private String workerName;
    private JobStatus jobStatus;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    // Segment 6 Rating Summary & Status Details
    private Double workerAverageRating;
    private Long workerTotalRatings;
    private Boolean isRated;
    private Boolean isWorkerVerified = false;

    public ServiceRequestResponse() {
    }


    public ServiceRequestResponse(Long id, ServiceCategory category, String description, String location, BigDecimal budget, LocalDateTime preferredTime, ServiceRequestStatus status, LocalDateTime createdAt, LocalDateTime updatedAt, Long customerId, String customerName, String assignmentStatus, Long jobId, Long workerId, String workerName, JobStatus jobStatus, LocalDateTime startedAt, LocalDateTime completedAt, Double workerAverageRating, Long workerTotalRatings, Boolean isRated) {
        this(id, category, description, location, null, null, null, null, budget, preferredTime, status, createdAt, updatedAt, customerId, customerName, assignmentStatus, jobId, workerId, workerName, jobStatus, startedAt, completedAt, workerAverageRating, workerTotalRatings, isRated);
    }

    public ServiceRequestResponse(Long id, ServiceCategory category, String description, String location, Double latitude, Double longitude, String address, String city, BigDecimal budget, LocalDateTime preferredTime, ServiceRequestStatus status, LocalDateTime createdAt, LocalDateTime updatedAt, Long customerId, String customerName, String assignmentStatus, Long jobId, Long workerId, String workerName, JobStatus jobStatus, LocalDateTime startedAt, LocalDateTime completedAt, Double workerAverageRating, Long workerTotalRatings, Boolean isRated) {
        this.id = id;
        this.category = category;
        this.description = description;
        this.location = location;
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
        this.city = city;
        this.budget = budget;
        this.preferredTime = preferredTime;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.customerId = customerId;
        this.customerName = customerName;
        this.assignmentStatus = assignmentStatus != null ? assignmentStatus : "UNASSIGNED";
        this.jobId = jobId;
        this.workerId = workerId;
        this.workerName = workerName;
        this.jobStatus = jobStatus;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
        this.workerAverageRating = workerAverageRating != null ? workerAverageRating : 0.0;
        this.workerTotalRatings = workerTotalRatings != null ? workerTotalRatings : 0L;
        this.isRated = isRated != null ? isRated : false;
    }

    public static ServiceRequestResponse fromEntity(ServiceRequest request) {
        return fromEntity(request, null, null, false);
    }

    public static ServiceRequestResponse fromEntity(ServiceRequest request, Job assignedJob) {
        return fromEntity(request, assignedJob, null, false);
    }

    public static ServiceRequestResponse fromEntity(ServiceRequest request, Job assignedJob, WorkerRatingSummary ratingSummary, boolean isRated) {
        boolean isAssigned = assignedJob != null;
        return new ServiceRequestResponse(
                request.getId(),
                request.getCategory(),
                request.getDescription(),
                request.getLocation(),
                request.getLatitude(),
                request.getLongitude(),
                request.getAddress(),
                request.getCity(),
                request.getBudget(),
                request.getPreferredTime(),
                request.getStatus(),
                request.getCreatedAt(),
                request.getUpdatedAt(),
                request.getCustomer() != null ? request.getCustomer().getId() : null,
                request.getCustomer() != null ? request.getCustomer().getName() : null,
                isAssigned ? "ASSIGNED" : "UNASSIGNED",
                isAssigned ? assignedJob.getId() : null,
                isAssigned && assignedJob.getWorker() != null ? assignedJob.getWorker().getId() : null,
                isAssigned && assignedJob.getWorker() != null ? assignedJob.getWorker().getName() : null,
                isAssigned ? assignedJob.getStatus() : null,
                isAssigned ? assignedJob.getStartedAt() : null,
                isAssigned ? assignedJob.getCompletedAt() : null,
                ratingSummary != null ? ratingSummary.getAverageRating() : 0.0,
                ratingSummary != null ? ratingSummary.getTotalRatings() : 0L,
                isRated
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ServiceCategory getCategory() {
        return category;
    }

    public void setCategory(ServiceCategory category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public BigDecimal getBudget() {
        return budget;
    }

    public void setBudget(BigDecimal budget) {
        this.budget = budget;
    }

    public LocalDateTime getPreferredTime() {
        return preferredTime;
    }

    public void setPreferredTime(LocalDateTime preferredTime) {
        this.preferredTime = preferredTime;
    }

    public ServiceRequestStatus getStatus() {
        return status;
    }

    public void setStatus(ServiceRequestStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getAssignmentStatus() {
        return assignmentStatus;
    }

    public void setAssignmentStatus(String assignmentStatus) {
        this.assignmentStatus = assignmentStatus;
    }

    public Long getJobId() {
        return jobId;
    }

    public void setJobId(Long jobId) {
        this.jobId = jobId;
    }

    public Long getWorkerId() {
        return workerId;
    }

    public void setWorkerId(Long workerId) {
        this.workerId = workerId;
    }

    public String getWorkerName() {
        return workerName;
    }

    public void setWorkerName(String workerName) {
        this.workerName = workerName;
    }

    public JobStatus getJobStatus() {
        return jobStatus;
    }

    public void setJobStatus(JobStatus jobStatus) {
        this.jobStatus = jobStatus;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public Double getWorkerAverageRating() {
        return workerAverageRating;
    }

    public void setWorkerAverageRating(Double workerAverageRating) {
        this.workerAverageRating = workerAverageRating;
    }

    public Long getWorkerTotalRatings() {
        return workerTotalRatings;
    }

    public void setWorkerTotalRatings(Long workerTotalRatings) {
        this.workerTotalRatings = workerTotalRatings;
    }

    public Boolean getIsRated() {
        return isRated;
    }

    public void setIsRated(Boolean isRated) {
        this.isRated = isRated;
    }

    public Boolean getIsWorkerVerified() {
        return isWorkerVerified;
    }

    public void setIsWorkerVerified(Boolean isWorkerVerified) {
        this.isWorkerVerified = isWorkerVerified != null ? isWorkerVerified : false;
    }
}

