package com.sih.cooperative.dto;

import com.sih.cooperative.entity.PaymentStatus;
import com.sih.cooperative.entity.ServiceCategory;

import java.math.BigDecimal;

public class PaymentSummaryResponse {

    private Long jobId;
    private ServiceCategory serviceCategory;
    private String serviceDescription;
    private String workerName;
    private BigDecimal serviceAmount;
    private BigDecimal platformFee;
    private BigDecimal feePercentage;
    private BigDecimal totalAmount;
    private String currency;
    private boolean isAlreadyPaid;
    private PaymentStatus existingPaymentStatus;
    private String existingTransactionReference;

    public PaymentSummaryResponse() {
    }

    public Long getJobId() {
        return jobId;
    }

    public void setJobId(Long jobId) {
        this.jobId = jobId;
    }

    public ServiceCategory getServiceCategory() {
        return serviceCategory;
    }

    public void setServiceCategory(ServiceCategory serviceCategory) {
        this.serviceCategory = serviceCategory;
    }

    public String getServiceDescription() {
        return serviceDescription;
    }

    public void setServiceDescription(String serviceDescription) {
        this.serviceDescription = serviceDescription;
    }

    public String getWorkerName() {
        return workerName;
    }

    public void setWorkerName(String workerName) {
        this.workerName = workerName;
    }

    public BigDecimal getServiceAmount() {
        return serviceAmount;
    }

    public void setServiceAmount(BigDecimal serviceAmount) {
        this.serviceAmount = serviceAmount;
    }

    public BigDecimal getPlatformFee() {
        return platformFee;
    }

    public void setPlatformFee(BigDecimal platformFee) {
        this.platformFee = platformFee;
    }

    public BigDecimal getFeePercentage() {
        return feePercentage;
    }

    public void setFeePercentage(BigDecimal feePercentage) {
        this.feePercentage = feePercentage;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public boolean isAlreadyPaid() {
        return isAlreadyPaid;
    }

    public void setAlreadyPaid(boolean alreadyPaid) {
        isAlreadyPaid = alreadyPaid;
    }

    public PaymentStatus getExistingPaymentStatus() {
        return existingPaymentStatus;
    }

    public void setExistingPaymentStatus(PaymentStatus existingPaymentStatus) {
        this.existingPaymentStatus = existingPaymentStatus;
    }

    public String getExistingTransactionReference() {
        return existingTransactionReference;
    }

    public void setExistingTransactionReference(String existingTransactionReference) {
        this.existingTransactionReference = existingTransactionReference;
    }
}
