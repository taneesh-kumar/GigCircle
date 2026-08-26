package com.sih.cooperative.service;

import com.sih.cooperative.dto.HealthResponse;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

@Service
public class HealthService {

    private final Environment environment;

    public HealthService(Environment environment) {
        this.environment = environment;
    }

    public HealthResponse getHealth() {
        String databaseUrl = environment.getProperty("spring.datasource.url");
        boolean databaseConfigured = databaseUrl != null && !databaseUrl.isBlank();

        return new HealthResponse(
                "UP",
                "cooperative-gig-platform-backend",
                databaseConfigured
        );
    }
}