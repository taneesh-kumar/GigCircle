package com.sih.cooperative.service;

import com.sih.cooperative.dto.NotificationResponse;
import com.sih.cooperative.dto.NotificationSummary;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.NotificationRepository;
import com.sih.cooperative.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(String email, Role requiredRole) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (requiredRole != null && user.getRole() != requiredRole) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: insufficient role privileges");
        }

        return user;
    }

    @Transactional
    public Notification createNotification(User recipient, NotificationType type, String title, String message, String relatedEntityType, Long relatedEntityId) {
        if (recipient == null) {
            log.warn("Cannot create notification for null recipient");
            return null;
        }

        try {
            Notification notification = new Notification(recipient, type, title, message, relatedEntityType, relatedEntityId);
            return notificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Failed to create notification of type {} for user {}: {}", type, recipient.getEmail(), e.getMessage());
            return null;
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(String userEmail, Role requiredRole) {
        User user = getAuthenticatedUser(userEmail, requiredRole);
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public NotificationSummary getNotificationSummary(String userEmail, Role requiredRole) {
        User user = getAuthenticatedUser(userEmail, requiredRole);
        long unread = notificationRepository.countByRecipientIdAndReadFalse(user.getId());
        long total = notificationRepository.countByRecipientId(user.getId());
        return new NotificationSummary(total, unread);
    }

    @Transactional
    public NotificationResponse markAsRead(Long notificationId, String userEmail, Role requiredRole) {
        User user = getAuthenticatedUser(userEmail, requiredRole);

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: notification belongs to another user");
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notification = notificationRepository.save(notification);
        }

        return NotificationResponse.fromEntity(notification);
    }

    @Transactional
    public NotificationSummary markAllAsRead(String userEmail, Role requiredRole) {
        User user = getAuthenticatedUser(userEmail, requiredRole);
        notificationRepository.markAllAsReadForRecipient(user.getId(), LocalDateTime.now());
        long total = notificationRepository.countByRecipientId(user.getId());
        return new NotificationSummary(total, 0);
    }
}
