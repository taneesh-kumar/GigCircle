package com.sih.cooperative.controller;

import com.sih.cooperative.dto.NotificationResponse;
import com.sih.cooperative.dto.NotificationSummary;
import com.sih.cooperative.entity.Role;
import com.sih.cooperative.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/worker/notifications")
@PreAuthorize("hasRole('WORKER')")
public class WorkerNotificationController {

    private final NotificationService notificationService;

    public WorkerNotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(Principal principal) {
        List<NotificationResponse> notifications = notificationService.getUserNotifications(principal.getName(), Role.WORKER);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<NotificationSummary> getUnreadCount(Principal principal) {
        NotificationSummary summary = notificationService.getNotificationSummary(principal.getName(), Role.WORKER);
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable Long notificationId, Principal principal) {
        NotificationResponse response = notificationService.markAsRead(notificationId, principal.getName(), Role.WORKER);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/read-all")
    public ResponseEntity<NotificationSummary> markAllAsRead(Principal principal) {
        NotificationSummary summary = notificationService.markAllAsRead(principal.getName(), Role.WORKER);
        return ResponseEntity.ok(summary);
    }
}
