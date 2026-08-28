package com.sih.cooperative.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Configuration
public class EarningsConfig {

    public static final BigDecimal DEFAULT_PLATFORM_FEE_PERCENTAGE = new BigDecimal("10.00");

    @Value("${gigcircle.platform-fee-percentage:10.00}")
    private BigDecimal platformFeePercentage;

    public BigDecimal getPlatformFeePercentage() {
        if (platformFeePercentage == null || platformFeePercentage.compareTo(BigDecimal.ZERO) < 0 || platformFeePercentage.compareTo(new BigDecimal("100")) > 0) {
            return DEFAULT_PLATFORM_FEE_PERCENTAGE;
        }
        return platformFeePercentage.setScale(2, RoundingMode.HALF_UP);
    }
}
