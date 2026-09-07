package com.sih.cooperative.dto;

import com.sih.cooperative.entity.Job;
import com.sih.cooperative.entity.Payment;
import com.sih.cooperative.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentResponse {

    private Long id;
    private Long jobId;
    private Long serviceRequestId;
    private Long customerId;
    private String customerName;
    private Long workerId;
    private String workerName;
    private Long earningId;
    private BigDecimal amount;
    private BigDecimal platformFee;
    private BigDecimal workerEarning;
    private String paymentMethod;
    private PaymentStatus paymentStatus;
    private String transactionId;
    private String merchantOrderId;
    private String phonepeTransactionId;
    private String paymentInstrument;
    private String redirectUrl;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;

    public PaymentResponse() {
    }

    public PaymentResponse(Long id, Long jobId, Long serviceRequestId, Long customerId, String customerName,
                           Long workerId, String workerName, Long earningId, BigDecimal amount,
                           BigDecimal platformFee, BigDecimal workerEarning, String paymentMethod,
                           PaymentStatus paymentStatus, String transactionId, String merchantOrderId,
                           String phonepeTransactionId, String paymentInstrument, String redirectUrl,
                           LocalDateTime createdAt, LocalDateTime paidAt) {
        this.id = id;
        this.jobId = jobId;
        this.serviceRequestId = serviceRequestId;
        this.customerId = customerId;
        this.customerName = customerName;
        this.workerId = workerId;
        this.workerName = workerName;
        this.earningId = earningId;
        this.amount = amount;
        this.platformFee = platformFee;
        this.workerEarning = workerEarning;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
        this.transactionId = transactionId;
        this.merchantOrderId = merchantOrderId;
        this.phonepeTransactionId = phonepeTransactionId;
        this.paymentInstrument = paymentInstrument;
        this.redirectUrl = redirectUrl;
        this.createdAt = createdAt;
        this.paidAt = paidAt;
    }

    public static PaymentResponse fromEntity(Payment payment) {
        if (payment == null) return null;

        Job job = payment.getJob();
        Long serviceRequestId = (job != null && job.getServiceRequest() != null) ? job.getServiceRequest().getId() : null;
        Long workerId = (job != null && job.getWorker() != null) ? job.getWorker().getId() : null;
        String workerName = (job != null && job.getWorker() != null) ? job.getWorker().getName() : null;
        Long earningId = (payment.getEarning() != null) ? payment.getEarning().getId() : null;

        return new PaymentResponse(
                payment.getId(),
                job != null ? job.getId() : null,
                serviceRequestId,
                payment.getCustomer() != null ? payment.getCustomer().getId() : null,
                payment.getCustomer() != null ? payment.getCustomer().getName() : null,
                workerId,
                workerName,
                earningId,
                payment.getAmount(),
                payment.getPlatformFee(),
                payment.getWorkerEarning(),
                payment.getPaymentMethod(),
                payment.getPaymentStatus(),
                payment.getTransactionId(),
                payment.getMerchantOrderId(),
                payment.getPhonepeTransactionId(),
                payment.getPaymentInstrument(),
                payment.getRedirectUrl(),
                payment.getCreatedAt(),
                payment.getPaidAt()
        );
    }

    public Long getId() { return id; }
    public Long getJobId() { return jobId; }
    public Long getServiceRequestId() { return serviceRequestId; }
    public Long getCustomerId() { return customerId; }
    public String getCustomerName() { return customerName; }
    public Long getWorkerId() { return workerId; }
    public String getWorkerName() { return workerName; }
    public Long getEarningId() { return earningId; }
    public BigDecimal getAmount() { return amount; }
    public BigDecimal getPlatformFee() { return platformFee; }
    public BigDecimal getWorkerEarning() { return workerEarning; }
    public String getPaymentMethod() { return paymentMethod; }
    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public String getTransactionId() { return transactionId; }
    public String getMerchantOrderId() { return merchantOrderId; }
    public String getPhonepeTransactionId() { return phonepeTransactionId; }
    public String getPaymentInstrument() { return paymentInstrument; }
    public String getRedirectUrl() { return redirectUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getPaidAt() { return paidAt; }

    public void setId(Long id) { this.id = id; }
    public void setJobId(Long jobId) { this.jobId = jobId; }
    public void setServiceRequestId(Long serviceRequestId) { this.serviceRequestId = serviceRequestId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public void setWorkerId(Long workerId) { this.workerId = workerId; }
    public void setWorkerName(String workerName) { this.workerName = workerName; }
    public void setEarningId(Long earningId) { this.earningId = earningId; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public void setPlatformFee(BigDecimal platformFee) { this.platformFee = platformFee; }
    public void setWorkerEarning(BigDecimal workerEarning) { this.workerEarning = workerEarning; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public void setMerchantOrderId(String merchantOrderId) { this.merchantOrderId = merchantOrderId; }
    public void setPhonepeTransactionId(String phonepeTransactionId) { this.phonepeTransactionId = phonepeTransactionId; }
    public void setPaymentInstrument(String paymentInstrument) { this.paymentInstrument = paymentInstrument; }
    public void setRedirectUrl(String redirectUrl) { this.redirectUrl = redirectUrl; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
}
