import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, CheckCircle2, DollarSign, Star, Briefcase, FileText, AlertCircle } from 'lucide-react';
import type { Notification, NotificationSummary } from '@/types/notification';
import {
  getCustomerNotificationsApi,
  getCustomerUnreadCountApi,
  markCustomerNotificationReadApi,
  markAllCustomerNotificationsReadApi,
  getWorkerNotificationsApi,
  getWorkerUnreadCountApi,
  markWorkerNotificationReadApi,
  markAllWorkerNotificationsReadApi,
  getAdminNotificationsApi,
  getAdminUnreadCountApi,
  markAdminNotificationReadApi,
  markAllAdminNotificationsReadApi,
} from '@/services/api';

interface NotificationPanelProps {
  role: 'CUSTOMER' | 'WORKER' | 'ADMIN';
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ role }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [summary, setSummary] = useState<NotificationSummary>({ totalNotifications: 0, unreadNotifications: 0 });
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let notis: Notification[] = [];
      let sum: NotificationSummary = { totalNotifications: 0, unreadNotifications: 0 };

      if (role === 'CUSTOMER') {
        notis = await getCustomerNotificationsApi();
        sum = await getCustomerUnreadCountApi();
      } else if (role === 'WORKER') {
        notis = await getWorkerNotificationsApi();
        sum = await getWorkerUnreadCountApi();
      } else if (role === 'ADMIN') {
        notis = await getAdminNotificationsApi();
        sum = await getAdminUnreadCountApi();
      }

      setNotifications(notis);
      setSummary(sum);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, [role]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      if (role === 'CUSTOMER') {
        await markCustomerNotificationReadApi(notificationId);
      } else if (role === 'WORKER') {
        await markWorkerNotificationReadApi(notificationId);
      } else if (role === 'ADMIN') {
        await markAdminNotificationReadApi(notificationId);
      }
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (role === 'CUSTOMER') {
        await markAllCustomerNotificationsReadApi();
      } else if (role === 'WORKER') {
        await markAllWorkerNotificationsReadApi();
      } else if (role === 'ADMIN') {
        await markAllAdminNotificationsReadApi();
      }
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNotificationClick = async (noti: Notification) => {
    if (!noti.read) {
      await handleMarkAsRead(noti.id);
    }
    if (noti.relatedEntityType === 'WORKER_VERIFICATION') {
      if (role === 'ADMIN') {
        window.location.href = '/dashboard?tab=verifications';
      } else if (role === 'WORKER') {
        window.location.href = '/dashboard?tab=verification';
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SERVICE_REQUEST_CREATED':
      case 'VERIFICATION_SUBMITTED':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'WORKER_ASSIGNED':
        return <Briefcase className="w-4 h-4 text-indigo-500" />;
      case 'JOB_STARTED':
        return <CheckCircle2 className="w-4 h-4 text-amber-500" />;
      case 'JOB_COMPLETED':
      case 'VERIFICATION_APPROVED':
      case 'VERIFICATION_REINSTATED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'RATING_RECEIVED':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'EARNING_GENERATED':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'SERVICE_REQUEST_CANCELLED':
      case 'VERIFICATION_REJECTED':
      case 'VERIFICATION_SUSPENDED':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'VERIFICATION_CHANGES_REQUIRED':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {summary.unreadNotifications > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-rose-500 rounded-full animate-pulse">
            {summary.unreadNotifications}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-slate-700" />
              <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
              {summary.unreadNotifications > 0 && (
                <span className="px-2 py-0.5 text-xs bg-rose-100 text-rose-700 font-medium rounded-full">
                  {summary.unreadNotifications} unread
                </span>
              )}
            </div>
            {summary.unreadNotifications > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No notifications yet</div>
            ) : (
              notifications.map((noti) => (
                <div
                  key={noti.id}
                  onClick={() => handleNotificationClick(noti)}
                  className={`p-3.5 flex items-start space-x-3 transition-colors cursor-pointer ${
                    noti.read ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/40 hover:bg-indigo-50/80'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0 mt-0.5">{getIcon(noti.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-xs font-semibold ${noti.read ? 'text-slate-700' : 'text-slate-900'}`}>
                        {noti.title}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(noti.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-snug line-clamp-2">{noti.message}</p>
                  </div>
                  {!noti.read && <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0 mt-1.5" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
