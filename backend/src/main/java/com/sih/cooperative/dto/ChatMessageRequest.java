package com.sih.cooperative.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ChatMessageRequest {

    @NotBlank(message = "Message text cannot be blank")
    @Size(max = 2000, message = "Message text cannot exceed 2000 characters")
    private String messageText;

    public ChatMessageRequest() {
    }

    public ChatMessageRequest(String messageText) {
        this.messageText = messageText;
    }

    public String getMessageText() {
        return messageText;
    }

    public void setMessageText(String messageText) {
        this.messageText = messageText;
    }
}
