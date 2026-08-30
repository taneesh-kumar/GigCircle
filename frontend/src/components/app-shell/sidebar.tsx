import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { navigationByRole, type NavItem } from '@/config/navigation';
import { LogOut, X } from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  if (!user) return null;

  const roleNavItems: NavItem[] = navigationByRole[user.role] || [];
  const currentTab = searchParams.get('tab');
  const rolePath = `/${user.role.toLowerCase()}/dashboard`;

  const isNavActive = (itemHref: string, tabKey?: string) => {
    if (tabKey) {
      if (!currentTab) {
        if (user.role === 'CUSTOMER' && tabKey === 'dashboard') return true;
        if (user.role === 'WORKER' && tabKey === 'overview') return true;
        if (user.role === 'ADMIN' && tabKey === 'overview') return true;
      }
      return currentTab === tabKey;
    }
    return location.pathname === itemHref;
  };

  const getRoleBadgeStyle = () => {
    switch (user.role) {
      case 'CUSTOMER':
        return 'bg-accent/10 text-accent border-accent/30';
      case 'WORKER':
        return 'bg-secondary text-primary border-primary/20';
      case 'ADMIN':
        return 'bg-primary/10 text-primary border-primary/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-primary/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-border bg-card text-foreground shadow-lg lg:shadow-none transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Branding Section */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-border/80">
          <Link
            to={rolePath}
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            title={`Go to ${user.role} Dashboard`}
          >
            <img
              src="/gigcircle-logo.png"
              alt="GigCircle Logo"
              className="h-8 w-8 rounded-xl object-cover shadow-xs border border-border"
            />
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold tracking-tight leading-none text-primary">
                GigCircle
              </span>
              <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mt-0.5">
                {user.role} WORKSPACE
              </span>
            </div>
          </Link>

          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary lg:hidden"
            aria-label="Close Sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role Badge Indicator */}
        <div className="px-4 pt-4">
          <div className={`px-3 py-1.5 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-wider text-center ${getRoleBadgeStyle()}`}>
            {user.role} PORTAL
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
            Navigation
          </p>

          {roleNavItems.map((item: NavItem) => {
            const Icon = item.icon;
            const active = isNavActive(item.href, item.tabKey);

            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-secondary hover:text-primary'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                <span className="truncate">{item.label}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
              </Link>
            );
          })}
        </div>

        {/* User Identity & Logout at Bottom */}
        <div className="border-t border-border p-3 space-y-2">
          <div className="flex items-center gap-3 rounded-xl bg-secondary/60 p-2.5 border border-border">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs uppercase shadow-2xs">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-primary truncate">{user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 hover:border-destructive/40 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
