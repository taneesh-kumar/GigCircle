import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { NotificationPanel } from '@/components/notification-panel';
import { Menu, User as UserIcon, LogOut, ChevronDown, ShieldCheck, House, HandHeart } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

interface TopbarProps {
  onOpenMobile: () => void;
}

export function Topbar({ onOpenMobile }: TopbarProps) {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const currentTab = searchParams.get('tab');

  const getPageTitle = () => {
    if (user.role === 'CUSTOMER') {
      if (currentTab === 'requests') return 'My Service Requests';
      if (currentTab === 'notifications') return 'Notifications';
      if (currentTab === 'profile') return 'My Profile';
      return 'Customer Dashboard';
    }
    if (user.role === 'WORKER') {
      if (currentTab === 'available') return 'Available Jobs Feed';
      if (currentTab === 'assigned') return 'Assigned Jobs Execution';
      if (currentTab === 'earnings') return 'Earnings Ledger';
      if (currentTab === 'ratings') return 'Ratings & Reviews';
      if (currentTab === 'profile') return 'Worker Profile';
      if (currentTab === 'notifications') return 'Notifications';
      return 'Worker Dashboard';
    }
    if (user.role === 'ADMIN') {
      if (currentTab === 'workers') return 'Worker Governance';
      if (currentTab === 'users') return 'User Directory';
      if (currentTab === 'requests') return 'Service Requests Oversight';
      if (currentTab === 'jobs') return 'Jobs Oversight';
      if (currentTab === 'ratings') return 'Ratings Audit';
      if (currentTab === 'activity') return 'Activity Audit Stream';
      if (currentTab === 'notifications') return 'Notifications';
      return 'Admin Operational Console';
    }
    return 'Dashboard';
  };

  const getRoleIcon = () => {
    if (user.role === 'WORKER') return <HandHeart className="h-4 w-4 text-blue-600" />;
    if (user.role === 'ADMIN') return <ShieldCheck className="h-4 w-4 text-purple-600" />;
    return <House className="h-4 w-4 text-emerald-600" />;
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
      {/* Mobile Drawer Trigger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center justify-center p-2 rounded-xl bg-slate-100 border border-slate-200/60">
            {getRoleIcon()}
          </div>
          <div>
            <h1 className="font-display text-base sm:text-lg font-bold text-slate-900 leading-none">
              {getPageTitle()}
            </h1>
            <p className="text-[11px] font-medium text-slate-500 hidden sm:block mt-0.5">
              GigCircle Platform • {user.role} Workspace
            </p>
          </div>
        </div>
      </div>

      {/* Right Action Bar: Notifications & User Profile Menu */}
      <div className="flex items-center gap-3">
        {/* Notification Panel Trigger */}
        <NotificationPanel role={user.role} />

        {/* User Profile Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 pr-3 hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs">
              {user.name.charAt(0)}
            </div>
            <span className="text-xs font-bold text-slate-800 hidden md:block">
              {user.name}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu Overlay */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 uppercase">
                  Role: {user.role}
                </span>
              </div>

              <div className="py-1">
                <Link
                  to={`/${user.role.toLowerCase()}/dashboard?tab=profile`}
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <UserIcon className="h-3.5 w-3.5 text-slate-400" /> My Profile
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
