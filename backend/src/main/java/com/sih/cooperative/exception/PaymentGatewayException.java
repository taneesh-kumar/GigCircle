package com.sih.cooperative.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class PaymentGatewayException extends ResponseStatusException {

    public PaymentGatewayException(String reason) {
        super(HttpStatus.BAD_GATEWAY, reason);
    }

    public PaymentGatewayException(String reason, Throwable cause) {
        super(HttpStatus.BAD_GATEWAY, reason, cause);
    }
}
