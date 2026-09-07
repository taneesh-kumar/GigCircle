package com.sih.cooperative.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class PhonePeStatusResponse {

    private boolean success;
    private String code;
    private String message;

    @JsonProperty("data")
    private Data data;

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Data getData() { return data; }
    public void setData(Data data) { this.data = data; }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Data {
        @JsonProperty("merchantId")
        private String merchantId;

        @JsonProperty("merchantTransactionId")
        private String merchantTransactionId;

        @JsonProperty("transactionId")
        private String transactionId;

        @JsonProperty("amount")
        private Long amount;

        @JsonProperty("state")
        private String state;

        @JsonProperty("responseCode")
        private String responseCode;

        @JsonProperty("paymentInstrument")
        private Object paymentInstrument;

        public String getMerchantId() { return merchantId; }
        public void setMerchantId(String merchantId) { this.merchantId = merchantId; }
        public String getMerchantTransactionId() { return merchantTransactionId; }
        public void setMerchantTransactionId(String merchantTransactionId) { this.merchantTransactionId = merchantTransactionId; }
        public String getTransactionId() { return transactionId; }
        public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
        public Long getAmount() { return amount; }
        public void setAmount(Long amount) { this.amount = amount; }
        public String getState() { return state; }
        public void setState(String state) { this.state = state; }
        public String getResponseCode() { return responseCode; }
        public void setResponseCode(String responseCode) { this.responseCode = responseCode; }
        public Object getPaymentInstrument() { return paymentInstrument; }
        public void setPaymentInstrument(Object paymentInstrument) { this.paymentInstrument = paymentInstrument; }
    }
}
