package com.sih.cooperative.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class PhonePePayRequest {

    @JsonProperty("merchantId")
    private String merchantId;

    @JsonProperty("merchantTransactionId")
    private String merchantTransactionId;

    @JsonProperty("merchantUserId")
    private String merchantUserId;

    @JsonProperty("amount")
    private Long amount;

    @JsonProperty("redirectUrl")
    private String redirectUrl;

    @JsonProperty("redirectMode")
    private String redirectMode;

    @JsonProperty("callbackUrl")
    private String callbackUrl;

    @JsonProperty("paymentInstrument")
    private PhonePePaymentInstrument paymentInstrument;

    public PhonePePayRequest() {
    }

    public PhonePePayRequest(String merchantId, String merchantTransactionId, String merchantUserId,
                             Long amount, String redirectUrl, String redirectMode, String callbackUrl,
                             PhonePePaymentInstrument paymentInstrument) {
        this.merchantId = merchantId;
        this.merchantTransactionId = merchantTransactionId;
        this.merchantUserId = merchantUserId;
        this.amount = amount;
        this.redirectUrl = redirectUrl;
        this.redirectMode = redirectMode;
        this.callbackUrl = callbackUrl;
        this.paymentInstrument = paymentInstrument;
    }

    public String getMerchantId() { return merchantId; }
    public void setMerchantId(String merchantId) { this.merchantId = merchantId; }
    public String getMerchantTransactionId() { return merchantTransactionId; }
    public void setMerchantTransactionId(String merchantTransactionId) { this.merchantTransactionId = merchantTransactionId; }
    public String getMerchantUserId() { return merchantUserId; }
    public void setMerchantUserId(String merchantUserId) { this.merchantUserId = merchantUserId; }
    public Long getAmount() { return amount; }
    public void setAmount(Long amount) { this.amount = amount; }
    public String getRedirectUrl() { return redirectUrl; }
    public void setRedirectUrl(String redirectUrl) { this.redirectUrl = redirectUrl; }
    public String getRedirectMode() { return redirectMode; }
    public void setRedirectMode(String redirectMode) { this.redirectMode = redirectMode; }
    public String getCallbackUrl() { return callbackUrl; }
    public void setCallbackUrl(String callbackUrl) { this.callbackUrl = callbackUrl; }
    public PhonePePaymentInstrument getPaymentInstrument() { return paymentInstrument; }
    public void setPaymentInstrument(PhonePePaymentInstrument paymentInstrument) { this.paymentInstrument = paymentInstrument; }
}
