package com.sih.cooperative.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * PhonePe configuration — values come from environment variables.
 * This class avoids needing phonepe.* YAML properties,
 * which is useful when the resources directory is read-only.
 */
@Configuration
public class PhonePeConfig {

    @Value("${PHONEPE_BASE_URL:https://api-preprod.phonepe.com/apis/pg-sandbox}")
    private String baseUrl;

    @Value("${PHONEPE_MERCHANT_ID:}")
    private String merchantId;

    @Value("${PHONEPE_SALT_KEY:}")
    private String saltKey;

    @Value("${PHONEPE_SALT_INDEX:1}")
    private String saltIndex;

    @Value("${PHONEPE_REDIRECT_URL:http://localhost:5173/payment/callback}")
    private String redirectUrl;

    @Value("${PHONEPE_CALLBACK_URL:http://localhost:8080/api/webhooks/phonepe}")
    private String callbackUrl;

    @Value("${PHONEPE_CONNECT_TIMEOUT_MS:10000}")
    private int connectTimeout;

    @Value("${PHONEPE_READ_TIMEOUT_MS:30000}")
    private int readTimeout;

    public String getBaseUrl() { return baseUrl; }
    public String getMerchantId() { return merchantId; }
    public String getSaltKey() { return saltKey; }
    public String getSaltIndex() { return saltIndex; }
    public String getRedirectUrl() { return redirectUrl; }
    public String getCallbackUrl() { return callbackUrl; }
    public int getConnectTimeout() { return connectTimeout; }
    public int getReadTimeout() { return readTimeout; }
}
