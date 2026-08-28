export type NotificationType =
  | 'SERVICE_REQUEST_CREATED'
  | 'WORKER_ASSIGNED'
  | 'JOB_STARTED'
  | 'JOB_COMPLETED'
  | 'RATING_RECEIVED'
  | 'EARNING_GENERATED'
  | 'SERVICE_REQUEST_CANCELLED';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  read: boolean;
  createdAt: string;
  readAt?: string;
}

export interface NotificationSummary {
  totalNotifications: number;
  unreadNotifications: number;
}
