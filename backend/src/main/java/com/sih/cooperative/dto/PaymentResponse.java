package com.sih.cooperative.dto;

import com.sih.cooperative.entity.Payment;
import com.sih.cooperative.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentResponse {

    private Long id;
    private Long jobId;
    private Long customerId;
    private BigDecimal amount;
    private PaymentStatus status;
    private String paymentMethod;
    private String transactionReference;
    private String failureReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PaymentResponse() {
    }

    public static PaymentResponse fromEntity(Payment payment) {
        if (payment == null) {
            return null;
        }
        PaymentResponse res = new PaymentResponse();
        res.setId(payment.getId());
        if (payment.getJob() != null) {
            res.setJobId(payment.getJob().getId());
        }
        if (payment.getCustomer() != null) {
            res.setCustomerId(payment.getCustomer().getId());
        }
        res.setAmount(payment.getAmount());
        res.setStatus(payment.getStatus());
        res.setPaymentMethod(payment.getPaymentMethod());
        res.setTransactionReference(payment.getTransactionReference());
        res.setFailureReason(payment.getFailureReason());
        res.setCreatedAt(payment.getCreatedAt());
        res.setUpdatedAt(payment.getUpdatedAt());
        return res;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getJobId() {
        return jobId;
    }

    public void setJobId(Long jobId) {
        this.jobId = jobId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
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
}
