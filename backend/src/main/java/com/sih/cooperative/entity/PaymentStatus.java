package com.sih.cooperative.entity;

public enum PaymentStatus {
    PENDING,
    PROCESSING,
    SUCCESS,
    FAILED,
    CANCELLED,
    REFUNDED,
    PAID;

    /** Returns true if the payment is considered successfully paid. */
    public boolean isPaid() {
        return this == SUCCESS || this == PAID;
    }

    /** Returns true if the payment has reached a terminal state. */
    public boolean isTerminal() {
        return isPaid() || this == FAILED;
    }
}