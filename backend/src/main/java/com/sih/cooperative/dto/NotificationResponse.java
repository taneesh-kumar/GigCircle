package com.sih.cooperative.dto;

import com.sih.cooperative.entity.Notification;
import com.sih.cooperative.entity.NotificationType;

import java.time.LocalDateTime;

public class NotificationResponse {

    private Long id;
    private NotificationType type;
    private String title;
    private String message;
    private String relatedEntityType;
    private Long relatedEntityId;
    private boolean read;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;

    public NotificationResponse() {
    }

    public NotificationResponse(Long id, NotificationType type, String title, String message, String relatedEntityType, Long relatedEntityId, boolean read, LocalDateTime createdAt, LocalDateTime readAt) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.message = message;
        this.relatedEntityType = relatedEntityType;
        this.relatedEntityId = relatedEntityId;
        this.read = read;
        this.createdAt = createdAt;
        this.readAt = readAt;
    }

    public static NotificationResponse fromEntity(Notification notification) {
        if (notification == null) return null;
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getRelatedEntityType(),
                notification.getRelatedEntityId(),
                notification.isRead(),
                notification.getCreatedAt(),
                notification.getReadAt()
        );
    }

    public Long getId() {
        return id;
    }

    public NotificationType getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public String getRelatedEntityType() {
        return relatedEntityType;
    }

    public Long getRelatedEntityId() {
        return relatedEntityId;
    }

    public boolean isRead() {
        return read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }
}
