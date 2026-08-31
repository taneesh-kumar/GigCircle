package com.sih.cooperative.dto;

import com.sih.cooperative.entity.Payment;
import com.sih.cooperative.entity.PaymentMethod;
import com.sih.cooperative.entity.PaymentStatus;
import com.sih.cooperative.entity.ServiceCategory;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentResponse {

    private Long id;
    private Long jobId;
    private ServiceCategory serviceCategory;
    private String serviceDescription;
    private Long customerId;
    private String customerName;
    private Long workerId;
    private String workerName;
    private BigDecimal serviceAmount;
    private BigDecimal platformFee;
    private BigDecimal amount;
    private String currency;
    private PaymentMethod paymentMethod;
    private String paymentMethodDetails;
    private PaymentStatus status;
    private String transactionReference;
    private LocalDateTime paidAt;
    private String failureReason;
    private BigDecimal refundAmount;
    private LocalDateTime refundedAt;
    private LocalDateTime createdAt;

    public PaymentResponse() {
    }

    public static PaymentResponse fromEntity(Payment payment) {
        PaymentResponse res = new PaymentResponse();
        res.setId(payment.getId());
        res.setJobId(payment.getJob().getId());
        if (payment.getJob().getServiceRequest() != null) {
            res.setServiceCategory(payment.getJob().getServiceRequest().getCategory());
            res.setServiceDescription(payment.getJob().getServiceRequest().getDescription());
        }
        res.setCustomerId(payment.getCustomer().getId());
        res.setCustomerName(payment.getCustomer().getName());
        if (payment.getJob().getWorker() != null) {
            res.setWorkerId(payment.getJob().getWorker().getId());
            res.setWorkerName(payment.getJob().getWorker().getName());
        }
        res.setServiceAmount(payment.getServiceAmount());
        res.setPlatformFee(payment.getPlatformFee());
        res.setAmount(payment.getAmount());
        res.setCurrency(payment.getCurrency());
        res.setPaymentMethod(payment.getPaymentMethod());
        res.setPaymentMethodDetails(payment.getPaymentMethodDetails());
        res.setStatus(payment.getStatus());
        res.setTransactionReference(payment.getTransactionReference());
        res.setPaidAt(payment.getPaidAt());
        res.setFailureReason(payment.getFailureReason());
        res.setRefundAmount(payment.getRefundAmount());
        res.setRefundedAt(payment.getRefundedAt());
        res.setCreatedAt(payment.getCreatedAt());
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

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentMethodDetails() {
        return paymentMethodDetails;
    }

    public void setPaymentMethodDetails(String paymentMethodDetails) {
        this.paymentMethodDetails = paymentMethodDetails;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public BigDecimal getRefundAmount() {
        return refundAmount;
    }

    public void setRefundAmount(BigDecimal refundAmount) {
        this.refundAmount = refundAmount;
    }

    public LocalDateTime getRefundedAt() {
        return refundedAt;
    }

    public void setRefundedAt(LocalDateTime refundedAt) {
        this.refundedAt = refundedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
