package com.sih.cooperative.entity;

public enum PaymentMethod {
    UPI("UPI"),
    CARD("CARD"),
    NETBANKING("NETBANKING"),
    CASH("CASH"),
    DEMO_UPI("DEMO_UPI"),
    DEMO_CARD("DEMO_CARD"),
    DEMO_NETBANKING("DEMO_NETBANKING"),
    PHONEPE("PHONEPE");

    private final String value;

    PaymentMethod(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static PaymentMethod from(String value) {
        if (value == null) return UPI;
        for (PaymentMethod m : values()) {
            if (m.value.equalsIgnoreCase(value) || m.name().equalsIgnoreCase(value)) {
                return m;
            }
        }
        throw new IllegalArgumentException("Invalid payment method: " + value);
    }
}