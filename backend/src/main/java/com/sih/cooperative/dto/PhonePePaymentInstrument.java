package com.sih.cooperative.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class PhonePePaymentInstrument {

    private String type;

    public PhonePePaymentInstrument() {
    }

    public PhonePePaymentInstrument(String type) {
        this.type = type;
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}
