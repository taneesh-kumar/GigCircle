package com.sih.cooperative.entity;

public enum PaymentMethod {
    UPI("UPI"),
    CARD("CARD"),
    CASH("CASH");

    private final String value;

    PaymentMethod(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static PaymentMethod from(String value) {
        for (PaymentMethod m : values()) {
            if (m.value.equalsIgnoreCase(value)) {
                return m;
            }
        }
        throw new IllegalArgumentException("Invalid payment method: " + value);
    }
}