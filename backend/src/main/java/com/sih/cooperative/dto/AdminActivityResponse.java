package com.sih.cooperative.dto;

import com.sih.cooperative.entity.AdminActivity;
import com.sih.cooperative.entity.Role;

import java.time.LocalDateTime;

public class AdminActivityResponse {

    private Long id;
    private Long actorUserId;
    private Role actorRole;
    private String actionType;
    private String entityType;
    private Long entityId;
    private String description;
    private LocalDateTime createdAt;

    public AdminActivityResponse() {
    }

    public AdminActivityResponse(Long id, Long actorUserId, Role actorRole, String actionType,
                                 String entityType, Long entityId, String description,
                                 LocalDateTime createdAt) {
        this.id = id;
        this.actorUserId = actorUserId;
        this.actorRole = actorRole;
        this.actionType = actionType;
        this.entityType = entityType;
        this.entityId = entityId;
        this.description = description;
        this.createdAt = createdAt;
    }

    public static AdminActivityResponse fromEntity(AdminActivity activity) {
        if (activity == null) return null;
        return new AdminActivityResponse(
                activity.getId(),
                activity.getActorUserId(),
                activity.getActorRole(),
                activity.getActionType(),
                activity.getEntityType(),
                activity.getEntityId(),
                activity.getDescription(),
                activity.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getActorUserId() {
        return actorUserId;
    }

    public void setActorUserId(Long actorUserId) {
        this.actorUserId = actorUserId;
    }

    public Role getActorRole() {
        return actorRole;
    }

    public void setActorRole(Role actorRole) {
        this.actorRole = actorRole;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public Long getEntityId() {
        return entityId;
    }

    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
