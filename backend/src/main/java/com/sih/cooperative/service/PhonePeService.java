package com.sih.cooperative.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.cooperative.config.PhonePeConfig;
import com.sih.cooperative.dto.PhonePePayRequest;
import com.sih.cooperative.dto.PhonePePayResponse;
import com.sih.cooperative.dto.PhonePePaymentInstrument;
import com.sih.cooperative.dto.PhonePeStatusResponse;
import com.sih.cooperative.entity.Payment;
import com.sih.cooperative.exception.PaymentGatewayException;
import com.sih.cooperative.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

@Service
public class PhonePeService {

    private static final Logger logger = LoggerFactory.getLogger(PhonePeService.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final PaymentRepository paymentRepository;
    private final PhonePeConfig config;

    public PhonePeService(
            RestTemplate restTemplate,
            ObjectMapper objectMapper,
            PaymentRepository paymentRepository,
            PhonePeConfig config) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.paymentRepository = paymentRepository;
        this.config = config;
    }

    /**
     * Calls PhonePe /pg/v1/order to initiate a payment.
     * Returns the redirect URL to send the customer to.
     */
    public String initiatePayment(Payment payment, Long customerDbId) {
        try {
            long amountInPaise = payment.getAmount().multiply(java.math.BigDecimal.valueOf(100)).longValue();

            PhonePePayRequest request = new PhonePePayRequest(
                    config.getMerchantId(),
                    payment.getMerchantOrderId(),
                    "GC-USER-" + customerDbId,
                    amountInPaise,
                    buildRedirectUrl(payment.getId()),
                    "POST",
                    config.getCallbackUrl(),
                    new PhonePePaymentInstrument("PAYMENT_PAGE")
            );

            String payloadJson = objectMapper.writeValueAsString(request);
            String payloadBase64 = Base64.getEncoder().encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));

            String xVerify = generateXVerify(payloadBase64, "/pg/v1/order");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-VERIFY", xVerify);
            headers.set("accept", "application/json");

            HttpEntity<String> entity = new HttpEntity<>(payloadJson, headers);

            String url = config.getBaseUrl() + "/pg/v1/order";
            ResponseEntity<PhonePePayResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    PhonePePayResponse.class
            );

            PhonePePayResponse body = response.getBody();
            if (body == null || !body.isSuccess()) {
                String msg = body != null ? body.getMessage() : "Empty response from PhonePe";
                logger.error("PhonePe pay API failed: code={}, message={}", body != null ? body.getCode() : "null", msg);
                throw new PaymentGatewayException("PhonePe payment initiation failed: " + msg);
            }

            if (body.getData() == null || body.getData().getRedirectUrl() == null) {
                logger.error("PhonePe pay API returned success but no redirectUrl in data");
                throw new PaymentGatewayException("PhonePe did not return a checkout URL");
            }

            String phonePeTransactionId = body.getData().getTransactionId();
            payment.setPhonepeTransactionId(phonePeTransactionId);
            payment.setPaymentInstrument("PENDING");
            paymentRepository.save(payment);

            logger.info("PhonePe payment initiated: merchantOrderId={}, phonepeTxnId={}",
                    payment.getMerchantOrderId(), phonePeTransactionId);

            return body.getData().getRedirectUrl();

        } catch (PaymentGatewayException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error initiating PhonePe payment", e);
            throw new PaymentGatewayException("Failed to initiate payment with gateway", e);
        }
    }

    /**
     * Verifies the payment status for a given payment record by calling PhonePe's status API.
     * Used by the webhook handler and frontend status polling.
     */
    public boolean verifyAndUpdatePaymentStatus(Payment payment) {
        try {
            String merchantTransactionId = payment.getMerchantOrderId();

            String indexString = "/pg/v1/order/" + merchantTransactionId + "/status" + config.getSaltKey();
            String xVerify = sha256Base64(indexString) + "###" + config.getSaltIndex();

            HttpHeaders headers = new HttpHeaders();
            headers.set("X-VERIFY", xVerify);
            headers.set("accept", "application/json");

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            String url = config.getBaseUrl() + "/pg/v1/order/" + merchantTransactionId + "/status";
            ResponseEntity<PhonePeStatusResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    PhonePeStatusResponse.class
            );

            PhonePeStatusResponse body = response.getBody();
            if (body == null || body.getData() == null) {
                logger.warn("PhonePe status API returned null for merchantOrderId={}", merchantTransactionId);
                return false;
            }

            String state = body.getData().getState();
            logger.info("PhonePe status check: merchantOrderId={}, state={}", merchantTransactionId, state);

            if ("COMPLETED".equalsIgnoreCase(state)) {
                return true;
            } else if ("FAILED".equalsIgnoreCase(state)) {
                return false;
            } else {
                // PENDING, PENDING_AWAITED, etc. — not terminal
                return false;
            }

        } catch (Exception e) {
            logger.error("Error verifying PhonePe payment status for merchantOrderId={}", payment.getMerchantOrderId(), e);
            return false;
        }
    }

    /**
     * Extracts the payment instrument type from a PhonePe status response data object.
     */
    public String extractPaymentInstrument(Object paymentInstrumentData) {
        if (paymentInstrumentData == null) return "UNKNOWN";
        try {
            if (paymentInstrumentData instanceof java.util.Map) {
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> map = (java.util.Map<String, Object>) paymentInstrumentData;
                Object type = map.get("type");
                return type != null ? type.toString() : "UNKNOWN";
            }
            return "UNKNOWN";
        } catch (Exception e) {
            return "UNKNOWN";
        }
    }

    private String generateXVerify(String payloadBase64, String endpoint) {
        String data = payloadBase64 + endpoint + config.getSaltKey();
        return sha256Base64(data) + "###" + config.getSaltIndex();
    }

    private String sha256Base64(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private String buildRedirectUrl(Long paymentId) {
        return config.getRedirectUrl() + "?paymentId=" + paymentId;
    }
}
