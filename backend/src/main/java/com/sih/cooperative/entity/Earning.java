package com.sih.cooperative.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "earnings",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"job_id"})
        }
)
public class Earning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false, unique = true)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "worker_id", nullable = false)
    private User worker;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @Column(name = "gross_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal grossAmount;

    @Column(name = "platform_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal platformFee;

    @Column(name = "worker_earning", nullable = false, precision = 12, scale = 2)
    private BigDecimal workerEarning;

    @Column(name = "fee_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal feePercentage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EarningStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "available_at")
    private LocalDateTime availableAt;

    public Earning() {
    }

    public Earning(Job job, User worker, User customer, BigDecimal grossAmount, BigDecimal platformFee, BigDecimal workerEarning, BigDecimal feePercentage, EarningStatus status) {
        this.job = job;
        this.worker = worker;
        this.customer = customer;
        this.grossAmount = grossAmount;
        this.platformFee = platformFee;
        this.workerEarning = workerEarning;
        this.feePercentage = feePercentage;
        this.status = status;
        if (status == EarningStatus.AVAILABLE) {
            this.availableAt = LocalDateTime.now();
        }
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == EarningStatus.AVAILABLE && this.availableAt == null) {
            this.availableAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Job getJob() {
        return job;
    }

    public void setJob(Job job) {
        this.job = job;
    }

    public User getWorker() {
        return worker;
    }

    public void setWorker(User worker) {
        this.worker = worker;
    }

    public User getCustomer() {
        return customer;
    }

    public void setCustomer(User customer) {
        this.customer = customer;
    }

    public BigDecimal getGrossAmount() {
        return grossAmount;
    }

    public void setGrossAmount(BigDecimal grossAmount) {
        this.grossAmount = grossAmount;
    }

    public BigDecimal getPlatformFee() {
        return platformFee;
    }

    public void setPlatformFee(BigDecimal platformFee) {
        this.platformFee = platformFee;
    }

    public BigDecimal getWorkerEarning() {
        return workerEarning;
    }

    public void setWorkerEarning(BigDecimal workerEarning) {
        this.workerEarning = workerEarning;
    }

    public BigDecimal getFeePercentage() {
        return feePercentage;
    }

    public void setFeePercentage(BigDecimal feePercentage) {
        this.feePercentage = feePercentage;
    }

    public EarningStatus getStatus() {
        return status;
    }

    public void setStatus(EarningStatus status) {
        this.status = status;
        if (status == EarningStatus.AVAILABLE && this.availableAt == null) {
            this.availableAt = LocalDateTime.now();
        }
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public LocalDateTime getAvailableAt() {
        return availableAt;
    }

    public void setAvailableAt(LocalDateTime availableAt) {
        this.availableAt = availableAt;
    }
}
