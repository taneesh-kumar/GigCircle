import { useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Bell,
  User,
  Search,
  Briefcase,
  Wallet,
  Star,
  UsersRound,
  HandHeart,
  Activity,
  Receipt,
  LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const customerNav: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'requests', label: 'My Requests', icon: FileText },
  { id: 'payments', label: 'Payments', icon: Receipt },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
];

const workerNav: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'available', label: 'Available Jobs', icon: Search },
  { id: 'assigned', label: 'Assigned Jobs', icon: Briefcase },
  { id: 'earnings', label: 'Earnings', icon: Wallet },
  { id: 'ratings', label: 'Ratings & Reviews', icon: Star },
  { id: 'profile', label: 'Worker Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

const adminNav: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: UsersRound },
  { id: 'workers', label: 'Workers', icon: HandHeart },
  { id: 'requests', label: 'Requests', icon: FileText },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'payments', label: 'Payments', icon: Receipt },
  { id: 'ratings', label: 'Ratings', icon: Star },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export function HorizontalNav() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const role = user?.role?.toUpperCase();
  const items = role === 'WORKER' ? workerNav : role === 'ADMIN' ? adminNav : customerNav;

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="w-full my-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs">
        <nav
          className="flex w-full items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5"
          aria-label="Application Navigation"
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabChange(item.id)}
                data-testid={`nav-tab-${item.id}`}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 min-w-[110px] ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
