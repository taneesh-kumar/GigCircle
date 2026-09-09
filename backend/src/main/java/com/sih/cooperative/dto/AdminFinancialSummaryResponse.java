package com.sih.cooperative.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class AdminFinancialSummaryResponse {

    private BigDecimal totalGrossVolume;
    private BigDecimal totalPlatformFees;
    private BigDecimal totalWorkerEarnings;
    private BigDecimal completedPaymentAmount;
    private BigDecimal pendingPaymentAmount;
    private BigDecimal failedPaymentAmount;
    private BigDecimal refundedAmount;

    private long totalTransactions;
    private long completedTransactions;
    private long pendingTransactions;
    private long failedTransactions;
    private long refundedTransactions;

    private LocalDate fromDate;
    private LocalDate toDate;

    public AdminFinancialSummaryResponse() {
    }

    public AdminFinancialSummaryResponse(BigDecimal totalGrossVolume, BigDecimal totalPlatformFees, BigDecimal totalWorkerEarnings,
                                        BigDecimal completedPaymentAmount, BigDecimal pendingPaymentAmount, BigDecimal failedPaymentAmount,
                                        BigDecimal refundedAmount, long totalTransactions, long completedTransactions,
                                        long pendingTransactions, long failedTransactions, long refundedTransactions,
                                        LocalDate fromDate, LocalDate toDate) {
        this.totalGrossVolume = totalGrossVolume;
        this.totalPlatformFees = totalPlatformFees;
        this.totalWorkerEarnings = totalWorkerEarnings;
        this.completedPaymentAmount = completedPaymentAmount;
        this.pendingPaymentAmount = pendingPaymentAmount;
        this.failedPaymentAmount = failedPaymentAmount;
        this.refundedAmount = refundedAmount;
        this.totalTransactions = totalTransactions;
        this.completedTransactions = completedTransactions;
        this.pendingTransactions = pendingTransactions;
        this.failedTransactions = failedTransactions;
        this.refundedTransactions = refundedTransactions;
        this.fromDate = fromDate;
        this.toDate = toDate;
    }

    public BigDecimal getTotalGrossVolume() {
        return totalGrossVolume;
    }

    public void setTotalGrossVolume(BigDecimal totalGrossVolume) {
        this.totalGrossVolume = totalGrossVolume;
    }

    public BigDecimal getTotalPlatformFees() {
        return totalPlatformFees;
    }

    public void setTotalPlatformFees(BigDecimal totalPlatformFees) {
        this.totalPlatformFees = totalPlatformFees;
    }

    public BigDecimal getTotalWorkerEarnings() {
        return totalWorkerEarnings;
    }

    public void setTotalWorkerEarnings(BigDecimal totalWorkerEarnings) {
        this.totalWorkerEarnings = totalWorkerEarnings;
    }

    public BigDecimal getCompletedPaymentAmount() {
        return completedPaymentAmount;
    }

    public void setCompletedPaymentAmount(BigDecimal completedPaymentAmount) {
        this.completedPaymentAmount = completedPaymentAmount;
    }

    public BigDecimal getPendingPaymentAmount() {
        return pendingPaymentAmount;
    }

    public void setPendingPaymentAmount(BigDecimal pendingPaymentAmount) {
        this.pendingPaymentAmount = pendingPaymentAmount;
    }

    public BigDecimal getFailedPaymentAmount() {
        return failedPaymentAmount;
    }

    public void setFailedPaymentAmount(BigDecimal failedPaymentAmount) {
        this.failedPaymentAmount = failedPaymentAmount;
    }

    public BigDecimal getRefundedAmount() {
        return refundedAmount;
    }

    public void setRefundedAmount(BigDecimal refundedAmount) {
        this.refundedAmount = refundedAmount;
    }

    public long getTotalTransactions() {
        return totalTransactions;
    }

    public void setTotalTransactions(long totalTransactions) {
        this.totalTransactions = totalTransactions;
    }

    public long getCompletedTransactions() {
        return completedTransactions;
    }

    public void setCompletedTransactions(long completedTransactions) {
        this.completedTransactions = completedTransactions;
    }

    public long getPendingTransactions() {
        return pendingTransactions;
    }

    public void setPendingTransactions(long pendingTransactions) {
        this.pendingTransactions = pendingTransactions;
    }

    public long getFailedTransactions() {
        return failedTransactions;
    }

    public void setFailedTransactions(long failedTransactions) {
        this.failedTransactions = failedTransactions;
    }

    public long getRefundedTransactions() {
        return refundedTransactions;
    }

    public void setRefundedTransactions(long refundedTransactions) {
        this.refundedTransactions = refundedTransactions;
    }

    public LocalDate getFromDate() {
        return fromDate;
    }

    public void setFromDate(LocalDate fromDate) {
        this.fromDate = fromDate;
    }

    public LocalDate getToDate() {
        return toDate;
    }

    public void setToDate(LocalDate toDate) {
        this.toDate = toDate;
    }
}
