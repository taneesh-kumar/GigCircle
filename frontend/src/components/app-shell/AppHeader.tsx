import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bell,
  LogOut,
  User as UserIcon,
  CheckCheck,
  ChevronDown,
  AlertCircle,
  FileText,
  CheckCircle2,
  Clock3,
  Briefcase,
  Star,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  getCustomerNotificationsApi,
  getWorkerNotificationsApi,
  getAdminNotificationsApi,
  markCustomerNotificationReadApi,
  markWorkerNotificationReadApi,
  markAdminNotificationReadApi,
  markAllCustomerNotificationsReadApi,
  markAllWorkerNotificationsReadApi,
  markAllAdminNotificationsReadApi,
} from '@/services/api';
import type { Notification } from '@/types/notification';

interface AppHeaderProps {
  sectionTitle?: string;
}

export function AppHeader({ sectionTitle }: AppHeaderProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Notification Popover state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated || !user) return;
    try {
      let data: Notification[] = [];
      if (user.role === 'WORKER') {
        data = await getWorkerNotificationsApi();
      } else if (user.role === 'ADMIN') {
        data = await getAdminNotificationsApi();
      } else {
        data = await getCustomerNotificationsApi();
      }
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.read).length);
    } catch {
      // Non-blocking error handling
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);

    const handleGlobalSync = () => {
      fetchNotifications();
    };
    window.addEventListener('gigcircle-notifications-updated', handleGlobalSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('gigcircle-notifications-updated', handleGlobalSync);
    };
  }, [isAuthenticated, user?.role]);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      if (user?.role === 'WORKER') {
        await markWorkerNotificationReadApi(id);
      } else if (user?.role === 'ADMIN') {
        await markAdminNotificationReadApi(id);
      } else {
        await markCustomerNotificationReadApi(id);
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(new CustomEvent('gigcircle-notifications-updated'));
    } catch {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      if (user?.role === 'WORKER') {
        await markAllWorkerNotificationsReadApi();
      } else if (user?.role === 'ADMIN') {
        await markAllAdminNotificationsReadApi();
      } else {
        await markAllCustomerNotificationsReadApi();
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('gigcircle-notifications-updated'));
    } catch {
      // Ignore
    }
  };

  const navigateToNotificationsTab = () => {
    setIsNotifOpen(false);
    setSearchParams({ tab: 'notifications' });
  };

  // Avatar Initials calculation
  const getInitials = () => {
    if (!user?.name) {
      if (user?.role === 'CUSTOMER') return 'JC';
      if (user?.role === 'WORKER') return 'JW';
      if (user?.role === 'ADMIN') return 'AD';
      return 'GC';
    }
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentTab = searchParams.get('tab') || 'overview';
  
  // Format current section title cleanly
  const title =
    sectionTitle ||
    (currentTab === 'requests' || currentTab === 'available' || currentTab === 'assigned'
      ? 'Service Requests & Jobs'
      : currentTab === 'earnings'
      ? 'Earnings Ledger'
      : currentTab === 'notifications'
      ? 'Notifications'
      : currentTab === 'profile'
      ? 'User Profile'
      : currentTab === 'ratings'
      ? 'Ratings & Reviews'
      : currentTab === 'users'
      ? 'User Management'
      : currentTab === 'workers'
      ? 'Worker Management'
      : currentTab === 'jobs'
      ? 'Platform Jobs'
      : currentTab === 'activity'
      ? 'Activity Audit'
      : user?.role === 'WORKER'
      ? 'Worker Dashboard'
      : user?.role === 'ADMIN'
      ? 'Admin Dashboard'
      : 'Customer Dashboard');

  const getNotificationIcon = (noti: Notification) => {
    const type = (noti.type || '').toUpperCase();
    const title = (noti.title || '').toLowerCase();

    if (type.includes('CANCEL') || title.includes('cancel')) {
      return (
        <div className="h-8 w-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
          <AlertCircle className="h-4 w-4" />
        </div>
      );
    }
    if (type.includes('RATING') || title.includes('rating') || title.includes('review')) {
      return (
        <div className="h-8 w-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        </div>
      );
    }
    if (type.includes('EARNING') || title.includes('earning') || title.includes('payout') || title.includes('ledger')) {
      return (
        <div className="h-8 w-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <Wallet className="h-4 w-4" />
        </div>
      );
    }
    if (type.includes('CREATED') || title.includes('created') || title.includes('request')) {
      return (
        <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
          <FileText className="h-4 w-4" />
        </div>
      );
    }
    if (type.includes('COMPLETED') || title.includes('completed') || title.includes('complete')) {
      return (
        <div className="h-8 w-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <CheckCircle2 className="h-4 w-4" />
        </div>
      );
    }
    if (type.includes('STARTED') || title.includes('started') || title.includes('start')) {
      return (
        <div className="h-8 w-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
          <Clock3 className="h-4 w-4" />
        </div>
      );
    }
    if (type.includes('ASSIGNED') || title.includes('assigned') || title.includes('worker') || title.includes('job')) {
      return (
        <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
          <Briefcase className="h-4 w-4" />
        </div>
      );
    }
    return (
      <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
        <Bell className="h-4 w-4" />
      </div>
    );
  };

  const formatTime = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* LEFT: Branding & Section Title */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/" className="flex items-center gap-2.5 focus:outline-none" data-testid="header-logo-link">
            <img
              src="/gigcircle-logo.png?v=4"
              alt="GigCircle Logo"
              className="h-9 w-9 rounded-xl object-cover shadow-sm transition-transform hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold tracking-tight text-slate-900 leading-none">
                GigCircle
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 leading-tight">
                Cooperative
              </span>
            </div>
          </Link>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">{title}</span>
          </div>
        </div>

        {/* RIGHT: User Profile & Notifications */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none transition-colors"
              aria-label="Notifications"
              data-testid="header-notification-bell"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Standardized Notification Popover Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200/90 bg-white shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.slice(0, 6).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.read) handleMarkAsRead(n.id);
                        }}
                        className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50/80 ${
                          !n.read ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        {getNotificationIcon(n)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs font-bold ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                              {n.title}
                            </p>
                            <span className="font-mono text-[10px] font-medium text-slate-400 whitespace-nowrap">
                              {formatTime(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                        </div>
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-slate-100 pt-2 px-3 text-center">
                  <button
                    type="button"
                    onClick={navigateToNotificationsTab}
                    className="w-full rounded-lg bg-slate-100 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-slate-200" />

          {/* User Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-slate-100 focus:outline-none transition-colors text-left"
              data-testid="header-user-menu-button"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-xs">
                {getInitials()}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {user?.name || 'Authenticated User'}
                </span>
                <span className="text-[11px] font-medium text-slate-500 leading-tight">
                  {user?.email || `${user?.role?.toLowerCase()}@gigcircle.coop`}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 hidden md:block" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <span className="mt-1 inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                    {user?.role}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setSearchParams({ tab: 'profile' });
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                >
                  <UserIcon className="h-4 w-4 text-slate-500" /> My Profile
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                  data-testid="header-logout-button"
                >
                  <LogOut className="h-4 w-4 text-red-500" /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
