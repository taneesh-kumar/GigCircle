package com.sih.cooperative.dto;

public record HealthResponse(
        String status,
        String service,
        boolean databaseConfigured
) {
}