package com.sih.cooperative.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class PhonePePayResponse {

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

        @JsonProperty("redirectUrl")
        private String redirectUrl;

        @JsonProperty("instrumentResponse")
        private Object instrumentResponse;

        public String getMerchantId() { return merchantId; }
        public void setMerchantId(String merchantId) { this.merchantId = merchantId; }
        public String getMerchantTransactionId() { return merchantTransactionId; }
        public void setMerchantTransactionId(String merchantTransactionId) { this.merchantTransactionId = merchantTransactionId; }
        public String getTransactionId() { return transactionId; }
        public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
        public String getRedirectUrl() { return redirectUrl; }
        public void setRedirectUrl(String redirectUrl) { this.redirectUrl = redirectUrl; }
        public Object getInstrumentResponse() { return instrumentResponse; }
        public void setInstrumentResponse(Object instrumentResponse) { this.instrumentResponse = instrumentResponse; }
    }
}
