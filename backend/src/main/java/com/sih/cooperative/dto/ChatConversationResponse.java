package com.sih.cooperative.dto;

import com.sih.cooperative.entity.ChatConversation;
import java.time.LocalDateTime;

public class ChatConversationResponse {

    private Long id;
    private Long jobId;
    private UserResponse customer;
    private UserResponse worker;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ChatConversationResponse() {
    }

    public ChatConversationResponse(Long id, Long jobId, UserResponse customer, UserResponse worker, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.jobId = jobId;
        this.customer = customer;
        this.worker = worker;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static ChatConversationResponse fromEntity(ChatConversation conversation) {
        UserResponse customerResp = conversation.getJob().getServiceRequest() != null && conversation.getJob().getServiceRequest().getCustomer() != null
                ? UserResponse.fromEntity(conversation.getJob().getServiceRequest().getCustomer())
                : null;
        UserResponse workerResp = conversation.getJob().getWorker() != null
                ? UserResponse.fromEntity(conversation.getJob().getWorker())
                : null;

        return new ChatConversationResponse(
                conversation.getId(),
                conversation.getJob().getId(),
                customerResp,
                workerResp,
                conversation.getCreatedAt(),
                conversation.getUpdatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getJobId() {
        return jobId;
    }

    public void setJobId(Long jobId) {
        this.jobId = jobId;
    }

    public UserResponse getCustomer() {
        return customer;
    }

    public void setCustomer(UserResponse customer) {
        this.customer = customer;
    }

    public UserResponse getWorker() {
        return worker;
    }

    public void setWorker(UserResponse worker) {
        this.worker = worker;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
