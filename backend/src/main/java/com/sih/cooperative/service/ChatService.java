package com.sih.cooperative.service;

import com.sih.cooperative.dto.ChatConversationResponse;
import com.sih.cooperative.dto.ChatMessageRequest;
import com.sih.cooperative.dto.ChatMessageResponse;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.ChatConversationRepository;
import com.sih.cooperative.repository.ChatMessageRepository;
import com.sih.cooperative.repository.JobRepository;
import com.sih.cooperative.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ChatService(ChatConversationRepository conversationRepository,
                       ChatMessageRepository messageRepository,
                       JobRepository jobRepository,
                       UserRepository userRepository,
                       NotificationService notificationService) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    private User getAuthenticatedUser(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private Job validateJobAndParticipant(Long jobId, User user) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (user.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Admins cannot participate in chat");
        }

        User customer = job.getServiceRequest() != null ? job.getServiceRequest().getCustomer() : null;
        User workerUser = job.getWorker();

        boolean isCustomer = customer != null && customer.getId().equals(user.getId());
        boolean isWorker = workerUser != null && workerUser.getId().equals(user.getId());

        if (!isCustomer && !isWorker) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: User is not an assigned participant for this job");
        }

        return job;
    }

    @Transactional
    public ChatConversation getOrCreateConversationForJob(Long jobId, String currentUserEmail) {
        User user = getAuthenticatedUser(currentUserEmail);
        Job job = validateJobAndParticipant(jobId, user);

        return conversationRepository.findByJobId(jobId)
                .orElseGet(() -> {
                    try {
                        ChatConversation conversation = new ChatConversation(job);
                        return conversationRepository.save(conversation);
                    } catch (DataIntegrityViolationException e) {
                        log.info("Conversation already exists for job {}, retrieving existing conversation", jobId);
                        return conversationRepository.findByJobId(jobId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to resolve conversation"));
                    }
                });
    }

    @Transactional
    public ChatConversationResponse getConversationResponse(Long jobId, String currentUserEmail) {
        ChatConversation conversation = getOrCreateConversationForJob(jobId, currentUserEmail);
        return ChatConversationResponse.fromEntity(conversation);
    }

    @Transactional
    public List<ChatMessageResponse> getMessagesForJob(Long jobId, String currentUserEmail) {
        ChatConversation conversation = getOrCreateConversationForJob(jobId, currentUserEmail);
        List<ChatMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
        return messages.stream()
                .map(ChatMessageResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageResponse sendMessage(Long jobId, ChatMessageRequest request, String currentUserEmail) {
        if (request == null || request.getMessageText() == null || request.getMessageText().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message text cannot be blank");
        }

        String trimmedText = request.getMessageText().trim();
        if (trimmedText.length() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message text cannot exceed 2000 characters");
        }

        User sender = getAuthenticatedUser(currentUserEmail);
        Job job = validateJobAndParticipant(jobId, sender);

        ChatConversation conversation = getOrCreateConversationForJob(jobId, currentUserEmail);

        ChatMessage message = new ChatMessage(conversation, sender, trimmedText);
        ChatMessage savedMessage = messageRepository.save(message);

        // Notify recipient (the other participant)
        try {
            User customer = job.getServiceRequest() != null ? job.getServiceRequest().getCustomer() : null;
            User workerUser = job.getWorker();
            User recipient = (customer != null && customer.getId().equals(sender.getId())) ? workerUser : customer;

            if (recipient != null) {
                notificationService.createNotification(
                        recipient,
                        NotificationType.SERVICE_REQUEST_CREATED, // fallback type if missing CHAT_MESSAGE type
                        "New Message",
                        "You received a new message regarding Job #" + job.getId(),
                        "Job",
                        job.getId()
                );
            }
        } catch (Exception e) {
            log.error("Failed to send notification for chat message on job #{}: {}", job.getId(), e.getMessage());
        }

        return ChatMessageResponse.fromEntity(savedMessage);
    }

    @Transactional
    public void markMessagesAsRead(Long jobId, String currentUserEmail) {
        User user = getAuthenticatedUser(currentUserEmail);
        ChatConversation conversation = getOrCreateConversationForJob(jobId, currentUserEmail);

        List<ChatMessage> unreadMessages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
        LocalDateTime now = LocalDateTime.now();

        boolean updated = false;
        for (ChatMessage msg : unreadMessages) {
            if (!msg.getSender().getId().equals(user.getId()) && !msg.isRead()) {
                msg.setRead(true);
                msg.setReadAt(now);
                updated = true;
            }
        }

        if (updated) {
            messageRepository.saveAll(unreadMessages);
        }
    }
}
