package com.sih.cooperative.controller;

import com.sih.cooperative.service.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/phonepe")
public class PhonePeWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(PhonePeWebhookController.class);

    private final PaymentService paymentService;

    public PhonePeWebhookController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<Void> handleCallback(@RequestBody Map<String, Object> payload) {
        logger.info("PhonePe webhook received: {}", payload);

        try {
            // PhonePe webhook payload structure (v1):
            // { "responseCode": "...", "merchantId": "...", "merchantTransactionId": "...",
            //   "transactionId": "...", "amount": 0, "state": "COMPLETED|FAILED", "paymentInstrument": {...} }
            // For newer S2S callbacks, it may be wrapped in { "event": "...", "payload": {...} }
            // Handle both shapes:
            Map<String, Object> body = payload;
            if (payload.containsKey("payload") && payload.get("payload") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> wrapped = (Map<String, Object>) payload.get("payload");
                body = wrapped;
            }

            String merchantTransactionId = (String) body.get("merchantTransactionId");
            String state = (String) body.get("state");
            Object paymentInstrument = body.get("paymentInstrument");

            if (merchantTransactionId == null) {
                logger.warn("PhonePe webhook missing merchantTransactionId: {}", payload);
                return ResponseEntity.badRequest().build();
            }

            paymentService.handlePhonePeCallback(merchantTransactionId, state, paymentInstrument);

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error processing PhonePe webhook", e);
            // Return 200 anyway to prevent PhonePe from retrying indefinitely
            return ResponseEntity.ok().build();
        }
    }
}
