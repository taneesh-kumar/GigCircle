package com.sih.cooperative.dto;

import com.sih.cooperative.entity.Earning;
import com.sih.cooperative.entity.EarningStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class EarningResponse {

    private Long id;
    private Long jobId;
    private Long serviceRequestId;
    private String serviceCategory;
    private Long workerId;
    private String workerName;
    private Long customerId;
    private String customerName;
    private BigDecimal grossAmount;
    private BigDecimal platformFee;
    private BigDecimal workerEarning;
    private BigDecimal feePercentage;
    private EarningStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime availableAt;

    public EarningResponse() {
    }

    public EarningResponse(Long id, Long jobId, Long serviceRequestId, String serviceCategory, Long workerId, String workerName, Long customerId, String customerName, BigDecimal grossAmount, BigDecimal platformFee, BigDecimal workerEarning, BigDecimal feePercentage, EarningStatus status, LocalDateTime createdAt, LocalDateTime availableAt) {
        this.id = id;
        this.jobId = jobId;
        this.serviceRequestId = serviceRequestId;
        this.serviceCategory = serviceCategory;
        this.workerId = workerId;
        this.workerName = workerName;
        this.customerId = customerId;
        this.customerName = customerName;
        this.grossAmount = grossAmount;
        this.platformFee = platformFee;
        this.workerEarning = workerEarning;
        this.feePercentage = feePercentage;
        this.status = status;
        this.createdAt = createdAt;
        this.availableAt = availableAt;
    }

    public static EarningResponse fromEntity(Earning earning) {
        if (earning == null) return null;

        Long sReqId = null;
        String sCat = null;
        if (earning.getJob() != null && earning.getJob().getServiceRequest() != null) {
            sReqId = earning.getJob().getServiceRequest().getId();
            if (earning.getJob().getServiceRequest().getCategory() != null) {
                sCat = earning.getJob().getServiceRequest().getCategory().name();
            }
        }

        return new EarningResponse(
                earning.getId(),
                earning.getJob() != null ? earning.getJob().getId() : null,
                sReqId,
                sCat,
                earning.getWorker() != null ? earning.getWorker().getId() : null,
                earning.getWorker() != null ? earning.getWorker().getName() : null,
                earning.getCustomer() != null ? earning.getCustomer().getId() : null,
                earning.getCustomer() != null ? earning.getCustomer().getName() : null,
                earning.getGrossAmount(),
                earning.getPlatformFee(),
                earning.getWorkerEarning(),
                earning.getFeePercentage(),
                earning.getStatus(),
                earning.getCreatedAt(),
                earning.getAvailableAt()
        );
    }

    public Long getId() {
        return id;
    }

    public Long getJobId() {
        return jobId;
    }

    public Long getServiceRequestId() {
        return serviceRequestId;
    }

    public String getServiceCategory() {
        return serviceCategory;
    }

    public Long getWorkerId() {
        return workerId;
    }

    public String getWorkerName() {
        return workerName;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public BigDecimal getGrossAmount() {
        return grossAmount;
    }

    public BigDecimal getPlatformFee() {
        return platformFee;
    }

    public BigDecimal getWorkerEarning() {
        return workerEarning;
    }

    public BigDecimal getFeePercentage() {
        return feePercentage;
    }

    public EarningStatus getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getAvailableAt() {
        return availableAt;
    }
}
