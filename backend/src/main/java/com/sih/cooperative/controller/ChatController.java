package com.sih.cooperative.controller;

import com.sih.cooperative.dto.ChatConversationResponse;
import com.sih.cooperative.dto.ChatMessageRequest;
import com.sih.cooperative.dto.ChatMessageResponse;
import com.sih.cooperative.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat/job")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<ChatConversationResponse> getConversation(
            @PathVariable Long jobId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ChatConversationResponse response = chatService.getConversationResponse(jobId, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{jobId}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(
            @PathVariable Long jobId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<ChatMessageResponse> messages = chatService.getMessagesForJob(jobId, userDetails.getUsername());
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/{jobId}/messages")
    public ResponseEntity<ChatMessageResponse> sendMessage(
            @PathVariable Long jobId,
            @Valid @RequestBody ChatMessageRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ChatMessageResponse response = chatService.sendMessage(jobId, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{jobId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long jobId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        chatService.markMessagesAsRead(jobId, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }
}
