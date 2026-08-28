package com.sih.cooperative.dto;

import com.sih.cooperative.entity.Job;
import com.sih.cooperative.entity.ServiceCategory;
import com.sih.cooperative.entity.ServiceRequest;
import com.sih.cooperative.entity.ServiceRequestStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AdminServiceRequestResponse {

    private Long id;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private ServiceCategory category;
    private String description;
    private BigDecimal budget;
    private LocalDateTime preferredTime;
    private String location;
    private ServiceRequestStatus status;
    private String assignmentStatus;
    private Long assignedWorkerId;
    private String assignedWorkerName;
    private LocalDateTime createdAt;

    public AdminServiceRequestResponse() {
    }

    public AdminServiceRequestResponse(Long id, Long customerId, String customerName, String customerEmail,
                                       ServiceCategory category, String description, BigDecimal budget,
                                       LocalDateTime preferredTime, String location, ServiceRequestStatus status,
                                       String assignmentStatus, Long assignedWorkerId, String assignedWorkerName,
                                       LocalDateTime createdAt) {
        this.id = id;
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.category = category;
        this.description = description;
        this.budget = budget;
        this.preferredTime = preferredTime;
        this.location = location;
        this.status = status;
        this.assignmentStatus = assignmentStatus;
        this.assignedWorkerId = assignedWorkerId;
        this.assignedWorkerName = assignedWorkerName;
        this.createdAt = createdAt;
    }

    public static AdminServiceRequestResponse fromEntity(ServiceRequest request, Job assignedJob) {
        if (request == null) return null;
        boolean isAssigned = assignedJob != null;
        return new AdminServiceRequestResponse(
                request.getId(),
                request.getCustomer().getId(),
                request.getCustomer().getName(),
                request.getCustomer().getEmail(),
                request.getCategory(),
                request.getDescription(),
                request.getBudget(),
                request.getPreferredTime(),
                request.getLocation(),
                request.getStatus(),
                isAssigned ? "ASSIGNED" : "UNASSIGNED",
                isAssigned ? assignedJob.getWorker().getId() : null,
                isAssigned ? assignedJob.getWorker().getName() : null,
                request.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
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

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public ServiceRequestStatus getStatus() {
        return status;
    }

    public void setStatus(ServiceRequestStatus status) {
        this.status = status;
    }

    public String getAssignmentStatus() {
        return assignmentStatus;
    }

    public void setAssignmentStatus(String assignmentStatus) {
        this.assignmentStatus = assignmentStatus;
    }

    public Long getAssignedWorkerId() {
        return assignedWorkerId;
    }

    public void setAssignedWorkerId(Long assignedWorkerId) {
        this.assignedWorkerId = assignedWorkerId;
    }

    public String getAssignedWorkerName() {
        return assignedWorkerName;
    }

    public void setAssignedWorkerName(String assignedWorkerName) {
        this.assignedWorkerName = assignedWorkerName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
