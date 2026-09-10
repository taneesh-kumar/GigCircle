package com.sih.cooperative.dto;

import jakarta.validation.constraints.NotBlank;

public class CompletePaymentRequest {

    @NotBlank(message = "Payment method is required")
    private String paymentMethod;

    private String upiId;

    public CompletePaymentRequest() {
    }

    public CompletePaymentRequest(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public CompletePaymentRequest(String paymentMethod, String upiId) {
        this.paymentMethod = paymentMethod;
        this.upiId = upiId;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getUpiId() {
        return upiId;
    }

    public void setUpiId(String upiId) {
        this.upiId = upiId;
    }
}