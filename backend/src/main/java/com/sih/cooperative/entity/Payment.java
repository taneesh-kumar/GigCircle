package com.sih.cooperative.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "payments",
    uniqueConstraints = {
            @UniqueConstraint(columnNames = {"job_id"})
    }
)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false, unique = true)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "earning_id", nullable = false)
    private Earning earning;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "platform_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal platformFee;

    @Column(name = "worker_earning", nullable = false, precision = 12, scale = 2)
    private BigDecimal workerEarning;

    @Column(name = "payment_method", nullable = false, length = 50)
    private String paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus;

    @Column(name = "transaction_id", nullable = false, unique = true, length = 64)
    private String transactionId;

    @Column(name = "merchant_order_id", length = 80)
    private String merchantOrderId;

    @Column(name = "phonepe_transaction_id", length = 64)
    private String phonepeTransactionId;

    @Column(name = "payment_instrument", length = 32)
    private String paymentInstrument;

    @Column(name = "gateway_response", columnDefinition = "TEXT")
    private String gatewayResponse;

    @Column(name = "redirect_url", length = 1024)
    private String redirectUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    public Payment() {
    }

    public Payment(Job job, User customer, Earning earning, BigDecimal amount,
                   BigDecimal platformFee, BigDecimal workerEarning, String paymentMethod,
                   PaymentStatus paymentStatus, String transactionId) {
        this.job = job;
        this.customer = customer;
        this.earning = earning;
        this.amount = amount;
        this.platformFee = platformFee;
        this.workerEarning = workerEarning;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
        this.transactionId = transactionId;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Job getJob() { return job; }
    public User getCustomer() { return customer; }
    public Earning getEarning() { return earning; }
    public BigDecimal getAmount() { return amount; }
    public BigDecimal getPlatformFee() { return platformFee; }
    public BigDecimal getWorkerEarning() { return workerEarning; }
    public String getPaymentMethod() { return paymentMethod; }
    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public String getTransactionId() { return transactionId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getPaidAt() { return paidAt; }

    public void setId(Long id) { this.id = id; }
    public void setJob(Job job) { this.job = job; }
    public void setCustomer(User customer) { this.customer = customer; }
    public void setEarning(Earning earning) { this.earning = earning; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public void setPlatformFee(BigDecimal platformFee) { this.platformFee = platformFee; }
    public void setWorkerEarning(BigDecimal workerEarning) { this.workerEarning = workerEarning; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }

    public String getMerchantOrderId() { return merchantOrderId; }
    public void setMerchantOrderId(String merchantOrderId) { this.merchantOrderId = merchantOrderId; }
    public String getPhonepeTransactionId() { return phonepeTransactionId; }
    public void setPhonepeTransactionId(String phonepeTransactionId) { this.phonepeTransactionId = phonepeTransactionId; }
    public String getPaymentInstrument() { return paymentInstrument; }
    public void setPaymentInstrument(String paymentInstrument) { this.paymentInstrument = paymentInstrument; }
    public String getGatewayResponse() { return gatewayResponse; }
    public void setGatewayResponse(String gatewayResponse) { this.gatewayResponse = gatewayResponse; }
    public String getRedirectUrl() { return redirectUrl; }
    public void setRedirectUrl(String redirectUrl) { this.redirectUrl = redirectUrl; }
}
