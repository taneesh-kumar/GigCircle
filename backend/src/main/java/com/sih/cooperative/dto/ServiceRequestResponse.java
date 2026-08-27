package com.sih.cooperative.dto;

import com.sih.cooperative.entity.Job;
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
    private BigDecimal budget;
    private LocalDateTime preferredTime;
    private ServiceRequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long customerId;
    private String customerName;

    // Segment 4 Assignment Details
    private String assignmentStatus;
    private Long workerId;
    private String workerName;

    public ServiceRequestResponse() {
    }

    public ServiceRequestResponse(Long id, ServiceCategory category, String description, String location, BigDecimal budget, LocalDateTime preferredTime, ServiceRequestStatus status, LocalDateTime createdAt, LocalDateTime updatedAt, Long customerId, String customerName, String assignmentStatus, Long workerId, String workerName) {
        this.id = id;
        this.category = category;
        this.description = description;
        this.location = location;
        this.budget = budget;
        this.preferredTime = preferredTime;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.customerId = customerId;
        this.customerName = customerName;
        this.assignmentStatus = assignmentStatus != null ? assignmentStatus : "UNASSIGNED";
        this.workerId = workerId;
        this.workerName = workerName;
    }

    public static ServiceRequestResponse fromEntity(ServiceRequest request) {
        return fromEntity(request, null);
    }

    public static ServiceRequestResponse fromEntity(ServiceRequest request, Job assignedJob) {
        boolean isAssigned = assignedJob != null;
        return new ServiceRequestResponse(
                request.getId(),
                request.getCategory(),
                request.getDescription(),
                request.getLocation(),
                request.getBudget(),
                request.getPreferredTime(),
                request.getStatus(),
                request.getCreatedAt(),
                request.getUpdatedAt(),
                request.getCustomer() != null ? request.getCustomer().getId() : null,
                request.getCustomer() != null ? request.getCustomer().getName() : null,
                isAssigned ? "ASSIGNED" : "UNASSIGNED",
                isAssigned && assignedJob.getWorker() != null ? assignedJob.getWorker().getId() : null,
                isAssigned && assignedJob.getWorker() != null ? assignedJob.getWorker().getName() : null
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
}
