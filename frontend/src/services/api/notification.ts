import api from './client';
import type { Notification, NotificationSummary } from '@/types/notification';

// Customer APIs
export const getCustomerNotificationsApi = async (): Promise<Notification[]> => {
  const response = await api.get<Notification[]>('/customer/notifications');
  return response.data;
};

export const getCustomerUnreadCountApi = async (): Promise<NotificationSummary> => {
  const response = await api.get<NotificationSummary>('/customer/notifications/unread-count');
  return response.data;
};

export const markCustomerNotificationReadApi = async (notificationId: number): Promise<Notification> => {
  const response = await api.post<Notification>(`/customer/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllCustomerNotificationsReadApi = async (): Promise<NotificationSummary> => {
  const response = await api.post<NotificationSummary>('/customer/notifications/read-all');
  return response.data;
};

// Worker APIs
export const getWorkerNotificationsApi = async (): Promise<Notification[]> => {
  const response = await api.get<Notification[]>('/worker/notifications');
  return response.data;
};

export const getWorkerUnreadCountApi = async (): Promise<NotificationSummary> => {
  const response = await api.get<NotificationSummary>('/worker/notifications/unread-count');
  return response.data;
};

export const markWorkerNotificationReadApi = async (notificationId: number): Promise<Notification> => {
  const response = await api.post<Notification>(`/worker/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllWorkerNotificationsReadApi = async (): Promise<NotificationSummary> => {
  const response = await api.post<NotificationSummary>('/worker/notifications/read-all');
  return response.data;
};

// Admin APIs
export const getAdminNotificationsApi = async (): Promise<Notification[]> => {
  const response = await api.get<Notification[]>('/admin/notifications');
  return response.data;
};

export const getAdminUnreadCountApi = async (): Promise<NotificationSummary> => {
  const response = await api.get<NotificationSummary>('/admin/notifications/unread-count');
  return response.data;
};

export const markAdminNotificationReadApi = async (notificationId: number): Promise<Notification> => {
  const response = await api.post<Notification>(`/admin/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllAdminNotificationsReadApi = async (): Promise<NotificationSummary> => {
  const response = await api.post<NotificationSummary>('/admin/notifications/read-all');
  return response.data;
};
