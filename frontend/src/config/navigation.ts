import {
  LayoutDashboard,
  Wrench,
  Bell,
  User,
  Briefcase,
  CheckSquare,
  Wallet,
  Star,
  TrendingUp,
  Users,
  ShieldCheck,
  Activity,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/types/auth';

export interface NavItem {
  label: string;
  href: string;
  tabKey?: string;
  icon: LucideIcon;
  exactPath?: boolean;
}

export const navigationByRole: Record<Role, NavItem[]> = {
  CUSTOMER: [
    { label: 'Dashboard', href: '/customer/dashboard', tabKey: 'dashboard', icon: LayoutDashboard },
    { label: 'My Requests', href: '/customer/dashboard?tab=requests', tabKey: 'requests', icon: Wrench },
    { label: 'Notifications', href: '/customer/dashboard?tab=notifications', tabKey: 'notifications', icon: Bell },
    { label: 'Profile', href: '/customer/dashboard?tab=profile', tabKey: 'profile', icon: User },
  ],
  WORKER: [
    { label: 'Dashboard', href: '/worker/dashboard', tabKey: 'overview', icon: LayoutDashboard },
    { label: 'Available Jobs', href: '/worker/dashboard?tab=available', tabKey: 'available', icon: Briefcase },
    { label: 'Assigned Jobs', href: '/worker/dashboard?tab=assigned', tabKey: 'assigned', icon: CheckSquare },
    { label: 'Earnings Ledger', href: '/worker/dashboard?tab=earnings', tabKey: 'earnings', icon: Wallet },
    { label: 'Ratings & Reviews', href: '/worker/dashboard?tab=ratings', tabKey: 'ratings', icon: Star },
    { label: 'Worker Profile', href: '/worker/dashboard?tab=profile', tabKey: 'profile', icon: User },
    { label: 'Notifications', href: '/worker/dashboard?tab=notifications', tabKey: 'notifications', icon: Bell },
  ],
  ADMIN: [
    { label: 'Overview & Stats', href: '/admin/dashboard', tabKey: 'overview', icon: TrendingUp },
    { label: 'Workers Governance', href: '/admin/dashboard?tab=workers', tabKey: 'workers', icon: ShieldCheck },
    { label: 'Users Directory', href: '/admin/dashboard?tab=users', tabKey: 'users', icon: Users },
    { label: 'Service Requests', href: '/admin/dashboard?tab=requests', tabKey: 'requests', icon: Wrench },
    { label: 'Jobs Oversight', href: '/admin/dashboard?tab=jobs', tabKey: 'jobs', icon: CheckSquare },
    { label: 'Ratings Audit', href: '/admin/dashboard?tab=ratings', tabKey: 'ratings', icon: Star },
    { label: 'Activity Audit Stream', href: '/admin/dashboard?tab=activity', tabKey: 'activity', icon: Activity },
    { label: 'Notifications', href: '/admin/dashboard?tab=notifications', tabKey: 'notifications', icon: Bell },
  ],
};
