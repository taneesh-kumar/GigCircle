package com.sih.cooperative.dto;

import com.sih.cooperative.entity.Job;
import com.sih.cooperative.entity.JobStatus;

import java.time.LocalDateTime;

public class AdminJobResponse {

    private Long id;
    private Long serviceRequestId;
    private Long customerId;
    private String customerName;
    private Long workerId;
    private String workerName;
    private JobStatus status;
    private LocalDateTime acceptedAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;

    public AdminJobResponse() {
    }

    public AdminJobResponse(Long id, Long serviceRequestId, Long customerId, String customerName,
                            Long workerId, String workerName, JobStatus status,
                            LocalDateTime acceptedAt, LocalDateTime startedAt, LocalDateTime completedAt,
                            LocalDateTime createdAt) {
        this.id = id;
        this.serviceRequestId = serviceRequestId;
        this.customerId = customerId;
        this.customerName = customerName;
        this.workerId = workerId;
        this.workerName = workerName;
        this.status = status;
        this.acceptedAt = acceptedAt;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
        this.createdAt = createdAt;
    }

    public static AdminJobResponse fromEntity(Job job) {
        if (job == null) return null;
        return new AdminJobResponse(
                job.getId(),
                job.getServiceRequest().getId(),
                job.getServiceRequest().getCustomer().getId(),
                job.getServiceRequest().getCustomer().getName(),
                job.getWorker().getId(),
                job.getWorker().getName(),
                job.getStatus(),
                job.getAcceptedAt(),
                job.getStartedAt(),
                job.getCompletedAt(),
                job.getCreatedAt()
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

    public JobStatus getStatus() {
        return status;
    }

    public void setStatus(JobStatus status) {
        this.status = status;
    }

    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
