package com.sih.cooperative.dto;

import com.sih.cooperative.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;

public class CreatePaymentRequest {

    @NotNull(message = "Job ID is required")
    private Long jobId;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    private String upiId;
    private String cardNumber;
    private String cardExpiry;
    private String cardCvv;

    public CreatePaymentRequest() {
    }

    public CreatePaymentRequest(Long jobId, PaymentMethod paymentMethod, String upiId, String cardNumber, String cardExpiry, String cardCvv) {
        this.jobId = jobId;
        this.paymentMethod = paymentMethod;
        this.upiId = upiId;
        this.cardNumber = cardNumber;
        this.cardExpiry = cardExpiry;
        this.cardCvv = cardCvv;
    }

    public Long getJobId() {
        return jobId;
    }

    public void setJobId(Long jobId) {
        this.jobId = jobId;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getUpiId() {
        return upiId;
    }

    public void setUpiId(String upiId) {
        this.upiId = upiId;
    }

    public String getCardNumber() {
        return cardNumber;
    }

    public void setCardNumber(String cardNumber) {
        this.cardNumber = cardNumber;
    }

    public String getCardExpiry() {
        return cardExpiry;
    }

    public void setCardExpiry(String cardExpiry) {
        this.cardExpiry = cardExpiry;
    }

    public String getCardCvv() {
        return cardCvv;
    }

    public void setCardCvv(String cardCvv) {
        this.cardCvv = cardCvv;
    }
}
