package com.sih.cooperative.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "admin_activity", indexes = {
    @Index(name = "idx_admin_activity_created_at", columnList = "created_at"),
    @Index(name = "idx_admin_activity_actor_user_id", columnList = "actor_user_id")
})
public class AdminActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_user_id", nullable = false)
    private Long actorUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "actor_role", nullable = false)
    private Role actorRole;

    @Column(name = "action_type", nullable = false)
    private String actionType;

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public AdminActivity() {
    }

    public AdminActivity(Long actorUserId, Role actorRole, String actionType, String entityType, Long entityId, String description) {
        this.actorUserId = actorUserId;
        this.actorRole = actorRole;
        this.actionType = actionType;
        this.entityType = entityType;
        this.entityId = entityId;
        this.description = description;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
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
