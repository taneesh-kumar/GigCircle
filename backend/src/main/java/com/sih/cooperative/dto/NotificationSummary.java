package com.sih.cooperative.dto;

public class NotificationSummary {

    private long totalNotifications;
    private long unreadNotifications;

    public NotificationSummary() {
    }

    public NotificationSummary(long totalNotifications, long unreadNotifications) {
        this.totalNotifications = totalNotifications;
        this.unreadNotifications = unreadNotifications;
    }

    public long getTotalNotifications() {
        return totalNotifications;
    }

    public long getUnreadNotifications() {
        return unreadNotifications;
    }
}
