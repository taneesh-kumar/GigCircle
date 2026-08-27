package com.sih.cooperative.dto;

import com.sih.cooperative.entity.Job;
import com.sih.cooperative.entity.JobStatus;
import com.sih.cooperative.entity.ServiceCategory;
import com.sih.cooperative.entity.ServiceRequestStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class JobResponse {

    private Long id;
    private Long serviceRequestId;
    private Long workerId;
    private String workerName;
    private Long customerId;
    private String customerName;
    private ServiceCategory category;
    private String description;
    private String location;
    private BigDecimal budget;
    private LocalDateTime preferredTime;
    private JobStatus jobStatus;
    private ServiceRequestStatus requestStatus;
    private LocalDateTime createdAt;
    private LocalDateTime acceptedAt;

    public JobResponse() {
    }

    public JobResponse(Long id, Long serviceRequestId, Long workerId, String workerName, Long customerId, String customerName, ServiceCategory category, String description, String location, BigDecimal budget, LocalDateTime preferredTime, JobStatus jobStatus, ServiceRequestStatus requestStatus, LocalDateTime createdAt, LocalDateTime acceptedAt) {
        this.id = id;
        this.serviceRequestId = serviceRequestId;
        this.workerId = workerId;
        this.workerName = workerName;
        this.customerId = customerId;
        this.customerName = customerName;
        this.category = category;
        this.description = description;
        this.location = location;
        this.budget = budget;
        this.preferredTime = preferredTime;
        this.jobStatus = jobStatus;
        this.requestStatus = requestStatus;
        this.createdAt = createdAt;
        this.acceptedAt = acceptedAt;
    }

    public static JobResponse fromEntity(Job job) {
        return new JobResponse(
                job.getId(),
                job.getServiceRequest() != null ? job.getServiceRequest().getId() : null,
                job.getWorker() != null ? job.getWorker().getId() : null,
                job.getWorker() != null ? job.getWorker().getName() : null,
                (job.getServiceRequest() != null && job.getServiceRequest().getCustomer() != null) ? job.getServiceRequest().getCustomer().getId() : null,
                (job.getServiceRequest() != null && job.getServiceRequest().getCustomer() != null) ? job.getServiceRequest().getCustomer().getName() : null,
                job.getServiceRequest() != null ? job.getServiceRequest().getCategory() : null,
                job.getServiceRequest() != null ? job.getServiceRequest().getDescription() : null,
                job.getServiceRequest() != null ? job.getServiceRequest().getLocation() : null,
                job.getServiceRequest() != null ? job.getServiceRequest().getBudget() : null,
                job.getServiceRequest() != null ? job.getServiceRequest().getPreferredTime() : null,
                job.getStatus(),
                job.getServiceRequest() != null ? job.getServiceRequest().getStatus() : null,
                job.getCreatedAt(),
                job.getAcceptedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getServiceRequestId() {
        return serviceRequestId;
    }

    public void setServiceRequestId(Long serviceRequestId) {
        this.serviceRequestId = serviceRequestId;
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

    public JobStatus getJobStatus() {
        return jobStatus;
    }

    public void setJobStatus(JobStatus jobStatus) {
        this.jobStatus = jobStatus;
    }

    public ServiceRequestStatus getRequestStatus() {
        return requestStatus;
    }

    public void setRequestStatus(ServiceRequestStatus requestStatus) {
        this.requestStatus = requestStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
    }
}
