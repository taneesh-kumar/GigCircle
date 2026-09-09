package com.sih.cooperative.dto;

import java.time.LocalDateTime;

public class OperationalAlertResponse {

    public enum AlertSeverity {
        INFO, WARNING, CRITICAL
    }

    private String alertType;
    private AlertSeverity severity;
    private String title;
    private String description;
    private String relatedEntityType;
    private Long relatedEntityId;
    private LocalDateTime detectedTimestamp;
    private Long count;

    public OperationalAlertResponse() {
    }

    public OperationalAlertResponse(String alertType, AlertSeverity severity, String title, String description, String relatedEntityType, Long relatedEntityId, LocalDateTime detectedTimestamp, Long count) {
        this.alertType = alertType;
        this.severity = severity;
        this.title = title;
        this.description = description;
        this.relatedEntityType = relatedEntityType;
        this.relatedEntityId = relatedEntityId;
        this.detectedTimestamp = detectedTimestamp;
        this.count = count;
    }

    public String getAlertType() {
        return alertType;
    }

    public void setAlertType(String alertType) {
        this.alertType = alertType;
    }

    public AlertSeverity getSeverity() {
        return severity;
    }

    public void setSeverity(AlertSeverity severity) {
        this.severity = severity;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRelatedEntityType() {
        return relatedEntityType;
    }

    public void setRelatedEntityType(String relatedEntityType) {
        this.relatedEntityType = relatedEntityType;
    }

    public Long getRelatedEntityId() {
        return relatedEntityId;
    }

    public void setRelatedEntityId(Long relatedEntityId) {
        this.relatedEntityId = relatedEntityId;
    }

    public LocalDateTime getDetectedTimestamp() {
        return detectedTimestamp;
    }

    public void setDetectedTimestamp(LocalDateTime detectedTimestamp) {
        this.detectedTimestamp = detectedTimestamp;
    }

    public Long getCount() {
        return count;
    }

    public void setCount(Long count) {
        this.count = count;
    }
}
