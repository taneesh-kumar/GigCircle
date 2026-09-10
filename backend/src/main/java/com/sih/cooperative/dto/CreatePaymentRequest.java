package com.sih.cooperative.dto;

import com.sih.cooperative.entity.PaymentMethod;

public class CreatePaymentRequest {

    private Long jobId;
    private PaymentMethod paymentMethod;
    private String upiId;
    private String cardNumber;
    private String expiryMonth;
    private String expiryYear;

    public CreatePaymentRequest() {
    }

    public CreatePaymentRequest(Long jobId) {
        this.jobId = jobId;
    }

    public CreatePaymentRequest(Long jobId, PaymentMethod paymentMethod) {
        this.jobId = jobId;
        this.paymentMethod = paymentMethod;
    }

    public CreatePaymentRequest(Long jobId, PaymentMethod paymentMethod, String upiId) {
        this.jobId = jobId;
        this.paymentMethod = paymentMethod;
        this.upiId = upiId;
    }

    public CreatePaymentRequest(Long jobId, PaymentMethod paymentMethod, String upiId, String cardNumber, String expiryMonth, String expiryYear) {
        this.jobId = jobId;
        this.paymentMethod = paymentMethod;
        this.upiId = upiId;
        this.cardNumber = cardNumber;
        this.expiryMonth = expiryMonth;
        this.expiryYear = expiryYear;
    }

    public Long getJobId() { return jobId; }
    public void setJobId(Long jobId) { this.jobId = jobId; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }

    public String getCardNumber() { return cardNumber; }
    public void setCardNumber(String cardNumber) { this.cardNumber = cardNumber; }

    public String getExpiryMonth() { return expiryMonth; }
    public void setExpiryMonth(String expiryMonth) { this.expiryMonth = expiryMonth; }

    public String getExpiryYear() { return expiryYear; }
    public void setExpiryYear(String expiryYear) { this.expiryYear = expiryYear; }
}
