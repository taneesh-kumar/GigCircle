import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Clock3,
  HandHeart,
  House,
  LogOut,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UsersRound,
  Wrench,
  Ban,
  Eye,
  Calendar,
  AlertCircle,
  Briefcase,
  Edit,
  Power,
  Check,
  User,
  Lock,
  Play,
  CheckCheck,
  Star,
  Wallet,
  TrendingUp,
  Receipt,
  IndianRupee,
  ShieldAlert,
  Activity,
  UserX,
  Search,
  FileText,
  Layers,
  Bell,
  ChevronRight,
  Hammer,
  Paintbrush,
  Sprout,
  Tv,
  HelpCircle,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import {
  acceptWorkerJobApi,
  activateWorkerApi,
  completeWorkerJobApi,
  deactivateWorkerApi,
  getAdminActivityApi,
  getAdminEarningsApi,
  getAdminJobsApi,
  getAdminOverviewApi,
  getAdminRatingsApi,
  getAdminRevenueSummaryApi,
  getAdminServiceRequestsApi,
  getAdminUsersApi,
  getAdminWorkersApi,
  getCustomerJobEarningApi,
  getPlatformInfo,
  getServiceRequestsApi,
  getWorkerAssignedJobsApi,
  getWorkerEarningsApi,
  getWorkerEarningsSummaryApi,
  getWorkerJobsApi,
  getWorkerProfileApi,
  getWorkerRatingsApi,
  getWorkerRatingSummaryApi,
  pingRoleApi,
  startWorkerJobApi,
  toggleAvailabilityApi,
  getCustomerNotificationsApi,
  getWorkerNotificationsApi,
  getAdminNotificationsApi,
  markCustomerNotificationReadApi,
  markWorkerNotificationReadApi,
  markAdminNotificationReadApi,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { PlatformShell } from '@/components/platform-shell';
import { AppHeader } from '@/components/app-shell/AppHeader';
import { HorizontalNav } from '@/components/app-shell/HorizontalNav';
import { FoundationStatus } from '@/components/status-panel';
import { CreateRequestModal } from '@/components/create-request-modal';
import { RequestDetailModal } from '@/components/request-detail-modal';
import { WorkerProfileModal } from '@/components/worker-profile-modal';
import { RatingModal } from '@/components/rating-modal';
import { CATEGORY_LABELS, type ServiceRequest } from '@/types/service-request';
import type { WorkerProfile } from '@/types/worker-profile';
import type { JobResponse } from '@/types/worker-job';
import type { Rating, WorkerRatingSummary } from '@/types/rating';
import type { Earning, PlatformRevenueSummary, WorkerEarningsSummary } from '@/types/earning';
import type {
  AdminActivity,
  AdminJob,
  AdminRating,
  AdminServiceRequest,
  AdminUser,
  AdminWorker,
  PlatformOverviewSummary,
} from '@/types/admin';
import type { Notification } from '@/types/notification';
import { useToast } from '@/hooks/use-toast';

type RoleKey = 'customer' | 'worker' | 'admin';

const roleContent: Record<
  RoleKey,
  {
    eyebrow: string;
    title: string;
    intro: string;
    stat: string;
    statLabel: string;
    icon: typeof House;
  }
> = {
  customer: {
    eyebrow: 'CUSTOMER DASHBOARD · EARNINGS LEDGER ACTIVE',
    title: 'A clearer way to ask for help.',
    intro:
      'Describe what your household needs, set your budget, track job progress, rate services, and view transparent job financials.',
    stat: '01',
    statLabel: 'authenticated customer',
    icon: House,
  },
  worker: {
    eyebrow: 'WORKER DASHBOARD · EARNINGS LEDGER ACTIVE',
    title: 'Good work should find good people.',
    intro:
      'Manage your skills, accept matching requests, control job execution, build ratings, and track transparent earnings.',
    stat: '02',
    statLabel: 'authenticated worker',
    icon: HandHeart,
  },
  admin: {
    eyebrow: 'COOPERATIVE DASHBOARD · REVENUE LEDGER ACTIVE',
    title: 'Make the work visible.',
    intro:
      'An oversight view for platform stewards — grounded in participation, transparency, cooperative revenue, and trust.',
    stat: '03',
    statLabel: 'authenticated admin',
    icon: ShieldCheck,
  },
};

const getCategoryIcon = (category: string) => {
  const catLower = (category || '').toUpperCase();
  switch (catLower) {
    case 'PLUMBING':
      return <Wrench className="h-5 w-5 text-emerald-600" />;
    case 'ELECTRICAL':
      return <Activity className="h-5 w-5 text-amber-600 animate-pulse" />;
    case 'CLEANING':
      return <Sparkles className="h-5 w-5 text-teal-600" />;
    case 'CARPENTRY':
      return <Hammer className="h-5 w-5 text-orange-600" />;
    case 'PAINTING':
      return <Paintbrush className="h-5 w-5 text-pink-600" />;
    case 'GARDENING':
      return <Sprout className="h-5 w-5 text-green-600" />;
    case 'APPLIANCE_REPAIR':
      return <Tv className="h-5 w-5 text-sky-600" />;
    default:
      return <HelpCircle className="h-5 w-5 text-slate-500" />;
  }
};

export default function RoleDashboard({ role }: { role: RoleKey }) {
  const { toast } = useToast();
  const content = roleContent[role];
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'overview';

  // Customer State
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(role === 'customer');
  const [requestError, setRequestError] = useState<string | null>(null);
  
  // EXACTLY THREE CUSTOMER STATUS TABS: OPEN | COMPLETED | CANCELLED
  const [filterStatus, setFilterStatus] = useState<'OPEN' | 'COMPLETED' | 'CANCELLED'>('OPEN');
  const [customerJobEarnings, setCustomerJobEarnings] = useState<Record<number, Earning>>({});

  // Customer Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Customer Rating Modal State
  const [ratingJobId, setRatingJobId] = useState<number | null>(null);
  const [ratingWorkerName, setRatingWorkerName] = useState<string | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  // Worker State
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(role === 'worker');
  const [profileNotFound, setProfileNotFound] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);

  // Worker Jobs State & Filters
  const [availableJobs, setAvailableJobs] = useState<ServiceRequest[]>([]);
  const [assignedJobs, setAssignedJobs] = useState<JobResponse[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(role === 'worker');
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [acceptingRequestId, setAcceptingRequestId] = useState<number | null>(null);
  const [operatingJobId, setOperatingJobId] = useState<number | null>(null);
  const [assignedFilterStatus, setAssignedFilterStatus] = useState<'ALL' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  // Worker Ratings State
  const [workerRatings, setWorkerRatings] = useState<Rating[]>([]);
  const [workerRatingSummary, setWorkerRatingSummary] = useState<WorkerRatingSummary | null>(null);
  const [isLoadingWorkerRatings, setIsLoadingWorkerRatings] = useState<boolean>(role === 'worker');

  // Worker Earnings State
  const [workerEarnings, setWorkerEarnings] = useState<Earning[]>([]);
  const [workerEarningsSummary, setWorkerEarningsSummary] = useState<WorkerEarningsSummary | null>(null);
  const [isLoadingWorkerEarnings, setIsLoadingWorkerEarnings] = useState<boolean>(role === 'worker');

  // Notifications Page State
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState<boolean>(false);

  // Admin State
  const [adminRevenueSummary, setAdminRevenueSummary] = useState<PlatformRevenueSummary | null>(null);
  const [adminEarningsLedger, setAdminEarningsLedger] = useState<Earning[]>([]);
  const [adminOverview, setAdminOverview] = useState<PlatformOverviewSummary | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminWorkers, setAdminWorkers] = useState<AdminWorker[]>([]);
  const [adminRequests, setAdminRequests] = useState<AdminServiceRequest[]>([]);
  const [adminJobs, setAdminJobs] = useState<AdminJob[]>([]);
  const [adminRatings, setAdminRatings] = useState<AdminRating[]>([]);
  const [adminActivity, setAdminActivity] = useState<AdminActivity[]>([]);
  const [isLoadingAdminData, setIsLoadingAdminData] = useState<boolean>(role === 'admin');
  const [adminUserFilter, setAdminUserFilter] = useState<'ALL' | 'CUSTOMER' | 'WORKER' | 'ADMIN'>('ALL');
  const [operatingWorkerId, setOperatingWorkerId] = useState<number | null>(null);

  const fetchCustomerRequests = async () => {
    if (role !== 'customer') return;
    setIsLoadingRequests(true);
    setRequestError(null);
    try {
      const data = await getServiceRequestsApi();
      setRequests(data);

      for (const req of data) {
        if (req.jobId && req.jobStatus === 'COMPLETED' && !customerJobEarnings[req.jobId]) {
          try {
            const earning = await getCustomerJobEarningApi(req.jobId);
            setCustomerJobEarnings((prev) => ({ ...prev, [req.jobId!]: earning }));
          } catch {
            // Non-critical fallback
          }
        }
      }
    } catch (err: any) {
      setRequestError(err?.response?.data?.message || 'Failed to load your service requests.');
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const fetchWorkerProfile = async () => {
    if (role !== 'worker') return;
    setIsLoadingProfile(true);
    setProfileError(null);
    setProfileNotFound(false);
    try {
      const profile = await getWorkerProfileApi();
      setWorkerProfile(profile);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setProfileNotFound(true);
        setWorkerProfile(null);
      } else {
        setProfileError(err?.response?.data?.message || 'Failed to load your worker profile.');
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchWorkerJobs = async () => {
    if (role !== 'worker') return;
    setIsLoadingJobs(true);
    setJobsError(null);
    try {
      const [avail, assigned] = await Promise.all([getWorkerJobsApi(), getWorkerAssignedJobsApi()]);
      setAvailableJobs(avail);
      setAssignedJobs(assigned);
    } catch (err: any) {
      setJobsError(err?.response?.data?.message || 'Failed to load worker jobs.');
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const fetchWorkerRatings = async () => {
    if (role !== 'worker') return;
    setIsLoadingWorkerRatings(true);
    try {
      const [ratingsList, summary] = await Promise.all([
        getWorkerRatingsApi(),
        getWorkerRatingSummaryApi(),
      ]);
      setWorkerRatings(ratingsList);
      setWorkerRatingSummary(summary);
    } catch {
      // Non-critical fallback
    } finally {
      setIsLoadingWorkerRatings(false);
    }
  };

  const fetchWorkerEarnings = async () => {
    if (role !== 'worker') return;
    setIsLoadingWorkerEarnings(true);
    try {
      const [earningsList, summary] = await Promise.all([
        getWorkerEarningsApi(),
        getWorkerEarningsSummaryApi(),
      ]);
      setWorkerEarnings(earningsList);
      setWorkerEarningsSummary(summary);
    } catch {
      // Non-critical fallback
    } finally {
      setIsLoadingWorkerEarnings(false);
    }
  };

  const fetchNotificationsPage = async () => {
    setIsLoadingNotifications(true);
    try {
      let notifs: Notification[] = [];
      if (role === 'worker') {
        notifs = await getWorkerNotificationsApi();
      } else if (role === 'admin') {
        notifs = await getAdminNotificationsApi();
      } else {
        notifs = await getCustomerNotificationsApi();
      }
      setNotificationsList(notifs);
    } catch {
      // Non-critical
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const fetchAdminData = async () => {
    if (role !== 'admin') return;
    setIsLoadingAdminData(true);
    try {
      const [overview, users, workers, reqs, jobs, ratings, activity, revenueSummary, revenueLedger] = await Promise.all([
        getAdminOverviewApi(),
        getAdminUsersApi(),
        getAdminWorkersApi(),
        getAdminServiceRequestsApi(),
        getAdminJobsApi(),
        getAdminRatingsApi(),
        getAdminActivityApi(),
        getAdminRevenueSummaryApi(),
        getAdminEarningsApi(),
      ]);
      setAdminOverview(overview);
      setAdminUsers(users);
      setAdminWorkers(workers);
      setAdminRequests(reqs);
      setAdminJobs(jobs);
      setAdminRatings(ratings);
      setAdminActivity(activity);
      setAdminRevenueSummary(revenueSummary);
      setAdminEarningsLedger(revenueLedger);
    } catch (err: any) {
      toast({
        title: 'Failed to load Admin Operations data',
        description: err?.response?.data?.message || 'Please refresh page.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAdminData(false);
    }
  };

  useEffect(() => {
    if (role === 'customer') {
      fetchCustomerRequests();
    } else if (role === 'worker') {
      fetchWorkerProfile();
      fetchWorkerJobs();
      fetchWorkerRatings();
      fetchWorkerEarnings();
    } else if (role === 'admin') {
      fetchAdminData();
    }

    if (activeTab === 'notifications') {
      fetchNotificationsPage();
    }

    const handleSync = () => {
      fetchNotificationsPage();
      if (role === 'customer') fetchCustomerRequests();
      if (role === 'worker') {
        fetchWorkerJobs();
        fetchWorkerEarnings();
        fetchWorkerRatings();
      }
    };
    window.addEventListener('gigcircle-notifications-updated', handleSync);
    return () => window.removeEventListener('gigcircle-notifications-updated', handleSync);
  }, [role, activeTab]);

  const handleToggleWorkerStatus = async (worker: AdminWorker) => {
    if (operatingWorkerId !== null) return;
    setOperatingWorkerId(worker.workerId);
    try {
      if (worker.active) {
        await deactivateWorkerApi(worker.workerId);
        toast({
          title: 'Worker Account Deactivated',
          description: `${worker.name} has been deactivated. They will no longer be eligible for new job matching.`,
        });
      } else {
        await activateWorkerApi(worker.workerId);
        toast({
          title: 'Worker Account Reactivated',
          description: `${worker.name} has been reactivated. Profile availability will resume for matching.`,
        });
      }
      fetchAdminData();
    } catch (err: any) {
      toast({
        title: 'Worker Status Change Failed',
        description: err?.response?.data?.message || 'Failed to update worker status.',
        variant: 'destructive',
      });
    } finally {
      setOperatingWorkerId(null);
    }
  };

  const handleToggleAvailability = async () => {
    if (!workerProfile || isTogglingAvailability) return;
    setIsTogglingAvailability(true);
    const newStatus = !workerProfile.available;
    try {
      const updated = await toggleAvailabilityApi(newStatus);
      setWorkerProfile(updated);
      toast({
        title: newStatus ? 'Status: Available' : 'Status: Unavailable',
        description: newStatus
          ? 'You are now marked as available for service requests.'
          : 'You are now marked as unavailable.',
      });
      fetchWorkerJobs();
    } catch (err: any) {
      toast({
        title: 'Failed to update availability',
        description: err?.response?.data?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  const handleAcceptJob = async (requestId: number) => {
    if (acceptingRequestId !== null) return;
    setAcceptingRequestId(requestId);
    try {
      const response = await acceptWorkerJobApi(requestId);
      toast({
        title: 'Job Accepted!',
        description: `You have accepted the ${response.category} job. Ready to start!`,
      });
      fetchWorkerJobs();
      window.dispatchEvent(new CustomEvent('gigcircle-notifications-updated'));
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to accept job.';
      toast({
        title: 'Acceptance Failed',
        description: msg,
        variant: 'destructive',
      });
      fetchWorkerJobs();
    } finally {
      setAcceptingRequestId(null);
    }
  };

  const handleStartJob = async (jobId: number) => {
    if (operatingJobId !== null) return;
    setOperatingJobId(jobId);
    try {
      const updated = await startWorkerJobApi(jobId);
      toast({
        title: 'Job Started!',
        description: `Job status is now IN_PROGRESS.`,
      });
      setAssignedJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)));
      window.dispatchEvent(new CustomEvent('gigcircle-notifications-updated'));
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to start job.';
      toast({
        title: 'Action Failed',
        description: msg,
        variant: 'destructive',
      });
      fetchWorkerJobs();
    } finally {
      setOperatingJobId(null);
    }
  };

  const handleCompleteJob = async (jobId: number) => {
    if (operatingJobId !== null) return;
    setOperatingJobId(jobId);
    try {
      const updated = await completeWorkerJobApi(jobId);
      toast({
        title: 'Job Completed!',
        description: `Service COMPLETED! Earnings record generated in GigCircle ledger.`,
      });
      setAssignedJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)));
      fetchWorkerEarnings();
      window.dispatchEvent(new CustomEvent('gigcircle-notifications-updated'));
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to complete job.';
      toast({
        title: 'Action Failed',
        description: msg,
        variant: 'destructive',
      });
      fetchWorkerJobs();
    } finally {
      setOperatingJobId(null);
    }
  };

  const handleOpenDetail = (req: ServiceRequest) => {
    setSelectedRequest(req);
    setIsDetailModalOpen(true);
  };

  // CUSTOMER REQUEST FILTERING BY EXACTLY 3 TABS: OPEN | COMPLETED | CANCELLED
  const filteredRequests = requests.filter((r) => {
    if (filterStatus === 'OPEN') {
      return r.status === 'OPEN' && r.jobStatus !== 'COMPLETED';
    }
    if (filterStatus === 'COMPLETED') {
      return r.jobStatus === 'COMPLETED';
    }
    if (filterStatus === 'CANCELLED') {
      return r.status === 'CANCELLED';
    }
    return true;
  });

  // WORKER ASSIGNED JOBS FILTERING
  const filteredAssignedJobs = assignedJobs.filter((j) => {
    if (assignedFilterStatus === 'ALL') return true;
    return j.jobStatus === assignedFilterStatus;
  });

  const filteredAdminUsers = adminUsers.filter((u) => {
    if (adminUserFilter === 'ALL') return true;
    return u.role === adminUserFilter;
  });

  const Icon = content.icon;

  const getNotificationIcon = (noti: Notification) => {
    const type = (noti.type || '').toUpperCase();
    const title = (noti.title || '').toLowerCase();

    if (type.includes('CANCEL') || title.includes('cancel')) {
      return (
        <div className="h-9 w-9 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
          <AlertCircle className="h-4.5 w-4.5" />
        </div>
      );
    }
    if (type.includes('RATING') || title.includes('rating') || title.includes('review')) {
      return (
        <div className="h-9 w-9 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
          <Star className="h-4.5 w-4.5 fill-amber-400 text-amber-400" />
        </div>
      );
    }
    if (type.includes('EARNING') || title.includes('earning') || title.includes('payout') || title.includes('ledger')) {
      return (
        <div className="h-9 w-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <Wallet className="h-4.5 w-4.5" />
        </div>
      );
    }
    if (type.includes('CREATED') || title.includes('created') || title.includes('request')) {
      return (
        <div className="h-9 w-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
          <FileText className="h-4.5 w-4.5" />
        </div>
      );
    }
    if (type.includes('COMPLETED') || title.includes('completed') || title.includes('complete')) {
      return (
        <div className="h-9 w-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <CheckCircle2 className="h-4.5 w-4.5" />
        </div>
      );
    }
    if (type.includes('STARTED') || title.includes('started') || title.includes('start')) {
      return (
        <div className="h-9 w-9 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
          <Clock3 className="h-4.5 w-4.5" />
        </div>
      );
    }
    if (type.includes('ASSIGNED') || title.includes('assigned') || title.includes('worker') || title.includes('job')) {
      return (
        <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
          <Briefcase className="h-4.5 w-4.5" />
        </div>
      );
    }
    return (
      <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
        <Bell className="h-4.5 w-4.5" />
      </div>
    );
  };

  const formatNotificationTime = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  const renderNotificationsView = () => (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-xs space-y-6">
      {/* CARD HEADER WITH GREEN BELL CIRCLE */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
        <div className="h-10 w-10 rounded-full bg-emerald-100/80 border border-emerald-200/70 flex items-center justify-center text-emerald-600 shrink-0">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Notifications</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Recent updates and activity alerts</p>
        </div>
      </div>

      {/* NOTIFICATIONS LIST CONTAINER */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden divide-y divide-slate-100">
        {isLoadingNotifications ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading updates...</div>
        ) : notificationsList.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">You're all caught up.</p>
            <p className="text-xs text-slate-500 mt-1">No new activity requires your attention.</p>
          </div>
        ) : (
          notificationsList.map((n) => (
            <div
              key={n.id}
              className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
            >
              <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                {getNotificationIcon(n)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 tracking-tight">{n.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5 font-normal leading-relaxed">{n.message}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono text-xs font-semibold text-slate-400 whitespace-nowrap ml-4">
                  {formatNotificationTime(n.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <PlatformShell>
      <div className="py-4 space-y-6">
        {/* HERO SECTION FOR CUSTOMER AND ADMIN (WORKER HAS HERO EXCLUSIVELY ON OVERVIEW TAB) */}
        {role !== 'worker' && (
          <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-blue-50/40 to-emerald-50/30 p-6 md:p-10 shadow-xs relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
              <div className="space-y-3 max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  {content.eyebrow}
                </div>
                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.05]">
                  {content.title}
                </h1>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                  {content.intro}
                </p>
              </div>

              {/* ROLE INDICATOR CARD */}
              <div className="relative flex h-36 w-36 sm:h-44 sm:w-44 flex-col justify-between overflow-hidden rounded-3xl border border-blue-900/20 bg-gradient-to-br from-blue-950 via-slate-900 to-emerald-950 p-5 text-white shadow-lg">
                <Icon className="absolute -right-3 -top-3 h-28 w-28 opacity-15 text-emerald-400" strokeWidth={1} />
                <span className="font-mono text-2xl font-bold text-emerald-400">{content.stat}</span>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300 block">
                    AUTHENTICATED
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mt-0.5">
                    {user?.role || role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HORIZONTAL NAVIGATION BAR - DISTRIBUTED EVENLY ACROSS ALL VIEWS */}
        <HorizontalNav />

        {/* CUSTOMER VIEWS */}
        {role === 'customer' && (
          <div className="space-y-8">
            {/* TAB: OVERVIEW / COMMAND CENTER */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* 4 STATISTIC METRIC CARDS WITH SUBTLE GIGCIRCLE GRADIENTS */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 p-5 shadow-xs flex items-center justify-between hover:shadow-md hover:border-emerald-300 transition-all">
                    <div>
                      <span className="text-xs font-semibold text-slate-600 block">Active Requests</span>
                      <div className="mt-1 text-3xl font-bold text-slate-900">
                        {requests.filter((r) => r.status === 'OPEN' && r.jobStatus !== 'COMPLETED').length}
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 mt-1 block">In Progress or Open</span>
                    </div>
                    <div className="h-11 w-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Wrench className="h-5.5 w-5.5" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-teal-200/90 bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/40 p-5 shadow-xs flex items-center justify-between hover:shadow-md hover:border-teal-300 transition-all">
                    <div>
                      <span className="text-xs font-semibold text-slate-600 block">Completed Services</span>
                      <div className="mt-1 text-3xl font-bold text-slate-900">
                        {requests.filter((r) => r.jobStatus === 'COMPLETED').length}
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 mt-1 block">Verified Work Done</span>
                    </div>
                    <div className="h-11 w-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <CheckCheck className="h-5.5 w-5.5" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/70 via-white to-slate-50/40 p-5 shadow-xs flex items-center justify-between hover:shadow-md hover:border-blue-300 transition-all">
                    <div>
                      <span className="text-xs font-semibold text-slate-600 block">Total Investment</span>
                      <div className="mt-1 text-3xl font-bold text-slate-900">
                        ₹{requests.reduce((acc, r) => acc + (r.budget || 0), 0).toLocaleString()}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 mt-1 block">Transparent Budget</span>
                    </div>
                    <div className="h-11 w-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <IndianRupee className="h-5.5 w-5.5" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/40 p-5 shadow-xs flex items-center justify-between hover:shadow-md hover:border-indigo-300 transition-all">
                    <div>
                      <span className="text-xs font-semibold text-slate-600 block">Total Requests</span>
                      <div className="mt-1 text-3xl font-bold text-slate-900">{requests.length}</div>
                      <span className="text-[10px] font-semibold text-slate-500 mt-1 block">Lifetime Requests</span>
                    </div>
                    <div className="h-11 w-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <FileText className="h-5.5 w-5.5" />
                    </div>
                  </div>
                </div>

                {/* QUICK ACTIONS BANNER */}
                <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50/80 via-white to-emerald-50/60 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Need help with household repairs or services?</h3>
                    <p className="text-xs text-slate-600 mt-1">Submit a transparent service request and match with trusted local workers.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" /> Request a Service
                    </button>
                    <button
                      onClick={() => setSearchParams({ tab: 'requests' })}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      View All Requests <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* RECENT SERVICE ACTIVITY / ACTIVE EXECUTION SECTION */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-xs space-y-5 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100/80 pb-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                          ACTIVE EXECUTION
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Recent Service Activity</h3>
                      <p className="text-xs text-slate-500">Your latest requested services and live execution progress.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSearchParams({ tab: 'requests' })}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-3.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-2xs"
                    >
                      View all requests <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {requests.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/50 p-8 text-center space-y-2">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                          <Wrench className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-800">No service requests created yet</p>
                        <p className="text-[11px] text-slate-500">Click "Request a Service" above to match with verified local workers.</p>
                      </div>
                    ) : (
                      requests.slice(0, 4).map((req) => {
                        const statusStr = req.jobStatus || req.status;
                        const categoryInfo = CATEGORY_LABELS[req.category] || { label: req.category, description: '' };
                        return (
                          <div
                            key={req.id}
                            className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-all duration-200 hover:bg-white hover:border-emerald-200 hover:shadow-md hover:-translate-y-0.5 group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                              <div className="h-10 w-10 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                {getCategoryIcon(req.category)}
                              </div>
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-emerald-950 transition-colors truncate">
                                    {req.description}
                                  </span>
                                  <span className="rounded-lg bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                                    {categoryInfo.label}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                                      statusStr === 'COMPLETED'
                                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                        : statusStr === 'IN_PROGRESS'
                                        ? 'bg-blue-50 border border-blue-200 text-blue-700'
                                        : statusStr === 'ACCEPTED'
                                        ? 'bg-amber-50 border border-amber-200 text-amber-700'
                                        : statusStr === 'CANCELLED'
                                        ? 'bg-red-50 border border-red-200 text-red-700'
                                        : 'bg-slate-50 border border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {statusStr === 'COMPLETED' ? (
                                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                    ) : statusStr === 'IN_PROGRESS' ? (
                                      <Activity className="h-3 w-3 text-blue-600 animate-pulse" />
                                    ) : (
                                      <Clock3 className="h-3 w-3 text-amber-600" />
                                    )}
                                    {statusStr}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                                  {req.workerName ? (
                                    <span className="flex items-center gap-1 font-medium text-slate-600">
                                      <User className="h-3.5 w-3.5 text-slate-400" /> Assigned Worker: <strong className="text-slate-800 font-semibold">{req.workerName}</strong>
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-slate-400 italic">
                                      <Clock3 className="h-3.5 w-3.5 text-slate-400" /> Awaiting Worker Assignment
                                    </span>
                                  )}
                                  {req.location && (
                                    <span className="flex items-center gap-1 hidden sm:flex">
                                      <MapPin className="h-3.5 w-3.5 text-slate-400" /> {req.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-2 text-right shrink-0 self-end sm:self-center hover:bg-emerald-100/50 transition-colors">
                              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                                Budget
                              </span>
                              <span className="text-sm font-black text-emerald-700 font-mono">
                                ₹{req.budget.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* THE COOPERATIVE LOOP CARD */}
                <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-900 via-blue-950 to-emerald-950 p-6 md:p-8 text-white shadow-md space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                      COOPERATIVE WORKFLOW
                    </span>
                    <h3 className="text-xl font-bold text-white">The Cooperative Loop</h3>
                    <p className="text-xs text-slate-300">Your request strengthens the local neighborhood network.</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-4 pt-2 text-xs">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                      <span className="font-mono text-emerald-400 font-bold">01</span>
                      <p className="font-bold text-white mt-1">Request a service</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">Describe your household need & set budget.</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                      <span className="font-mono text-emerald-400 font-bold">02</span>
                      <p className="font-bold text-white mt-1">Connect with worker</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">Match with verified local skills nearby.</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                      <span className="font-mono text-emerald-400 font-bold">03</span>
                      <p className="font-bold text-white mt-1">Complete the job</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">Track work & transparent 90/10 ledger payout.</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                      <span className="font-mono text-emerald-400 font-bold">04</span>
                      <p className="font-bold text-white mt-1">Rate & strengthen</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">Build community trust through real ratings.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MY REQUESTS */}
            {(activeTab === 'requests' || activeTab === 'overview') && activeTab !== 'overview' && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                        CUSTOMER WORKSPACE
                      </span>
                      <h2 className="text-2xl font-bold text-slate-900 mt-0.5">My Service Requests</h2>
                      <p className="text-xs text-slate-600 mt-1">
                        Manage the services you've requested and track their execution progress.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs">
                        {(['OPEN', 'COMPLETED', 'CANCELLED'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setFilterStatus(st)}
                            className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
                              filterStatus === st
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={fetchCustomerRequests}
                        disabled={isLoadingRequests}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
                        title="Refresh requests"
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoadingRequests ? 'animate-spin' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" /> Request a Service
                      </button>
                    </div>
                  </div>

                  <div className="mt-6">
                    {isLoadingRequests ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {[1, 2].map((i) => (
                          <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-3">
                            <div className="h-4 w-28 bg-slate-200 rounded" />
                            <div className="h-6 w-3/4 bg-slate-200 rounded" />
                          </div>
                        ))}
                      </div>
                    ) : filteredRequests.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
                        <Wrench className="mx-auto h-8 w-8 text-slate-400" />
                        <h3 className="mt-3 text-base font-bold text-slate-900">No {filterStatus.toLowerCase()} service requests</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {filterStatus === 'OPEN'
                            ? 'Create a service request to get started.'
                            : `You currently have no ${filterStatus.toLowerCase()} requests.`}
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-6 md:grid-cols-2">
                        {filteredRequests.map((req) => {
                          const categoryInfo = CATEGORY_LABELS[req.category] || { label: req.category, description: '' };
                          const statusStr = req.jobStatus || req.status;
                          const currentStage =
                            statusStr === 'COMPLETED'
                              ? 4
                              : statusStr === 'IN_PROGRESS'
                              ? 3
                              : req.workerName || statusStr === 'ACCEPTED'
                              ? 2
                              : 1;

                          return (
                            <div
                              key={req.id}
                              className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 transition-all space-y-4 group"
                            >
                              <div className="space-y-4">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                                    {categoryInfo.label}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                                      statusStr === 'COMPLETED'
                                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                        : statusStr === 'IN_PROGRESS'
                                        ? 'bg-blue-50 border border-blue-200 text-blue-700'
                                        : statusStr === 'ACCEPTED' || req.workerName
                                        ? 'bg-amber-50 border border-amber-200 text-amber-700'
                                        : statusStr === 'CANCELLED'
                                        ? 'bg-red-50 border border-red-200 text-red-700'
                                        : 'bg-slate-50 border border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {statusStr === 'COMPLETED' ? (
                                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                    ) : statusStr === 'IN_PROGRESS' ? (
                                      <Activity className="h-3 w-3 text-blue-600 animate-pulse" />
                                    ) : (
                                      <Clock3 className="h-3 w-3 text-amber-600" />
                                    )}
                                    {statusStr}
                                  </span>
                                </div>

                                <div className="flex items-start gap-4">
                                  <div className="h-10 w-10 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                    {getCategoryIcon(req.category)}
                                  </div>
                                  <div className="flex-1 min-w-0 space-y-1.5">
                                    <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-emerald-950 transition-colors">
                                      {req.description}
                                    </h3>
                                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-slate-500">
                                      <span className="flex items-center gap-1 font-medium text-slate-600">
                                        <MapPin className="h-3.5 w-3.5 text-slate-400" /> Location: <strong className="text-slate-800 font-semibold">{req.location}</strong>
                                      </span>
                                      <span className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-1 text-xs font-bold text-emerald-700">
                                        Budget: <strong className="text-emerald-800 font-extrabold font-mono text-sm">₹{req.budget.toLocaleString()}</strong>
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {statusStr !== 'CANCELLED' && (
                                  <div className="pt-2.5 space-y-2">
                                    <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                                      <span className={currentStage >= 1 ? 'text-emerald-700 flex items-center gap-1' : 'flex items-center gap-1'}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${currentStage >= 1 ? 'bg-emerald-500' : 'bg-slate-300'}`} /> Requested
                                      </span>
                                      <span className={currentStage >= 2 ? 'text-amber-700 flex items-center gap-1' : 'flex items-center gap-1'}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${currentStage >= 2 ? 'bg-amber-500' : 'bg-slate-300'}`} /> Assigned
                                      </span>
                                      <span className={currentStage >= 3 ? 'text-blue-700 flex items-center gap-1' : 'flex items-center gap-1'}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${currentStage >= 3 ? 'bg-blue-500' : 'bg-slate-300'}`} /> In Progress
                                      </span>
                                      <span className={currentStage >= 4 ? 'text-emerald-700 flex items-center gap-1' : 'flex items-center gap-1'}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${currentStage >= 4 ? 'bg-emerald-500' : 'bg-slate-300'}`} /> Completed
                                      </span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200/40">
                                      <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          currentStage === 4
                                            ? 'w-full bg-gradient-to-r from-emerald-500 to-teal-500'
                                            : currentStage === 3
                                            ? 'w-3/4 bg-gradient-to-r from-blue-500 to-indigo-500'
                                            : currentStage === 2
                                            ? 'w-1/2 bg-gradient-to-r from-amber-400 to-amber-500'
                                            : 'w-1/4 bg-gradient-to-r from-emerald-400 to-emerald-500'
                                        }`}
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className="rounded-2xl bg-slate-50/50 border border-slate-100 p-3.5 flex items-center justify-between text-xs transition-all hover:bg-white hover:border-slate-200">
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-900 text-white font-extrabold text-[10px] flex items-center justify-center shadow-xs shrink-0">
                                      {req.workerName ? req.workerName.substring(0, 2).toUpperCase() : 'GC'}
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Assigned Worker</span>
                                      <span className="font-bold text-slate-900">
                                        {req.workerName || 'Awaiting Worker Match'}
                                      </span>
                                    </div>
                                  </div>
                                  {!req.workerName && (
                                    <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" title="Searching for worker" />
                                  )}
                                </div>
                              </div>

                              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenDetail(req)}
                                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                                >
                                  <Eye className="h-3.5 w-3.5 text-slate-400" /> View Details
                                </button>
                                {statusStr === 'COMPLETED' && (
                                  req.isRated ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200/80 px-3.5 py-2 text-xs font-extrabold text-amber-700">
                                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Rated
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (req.jobId) {
                                          setRatingJobId(req.jobId);
                                          setRatingWorkerName(req.workerName || 'Worker');
                                          setIsRatingModalOpen(true);
                                        }
                                      }}
                                      className="rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all inline-flex items-center gap-1.5"
                                    >
                                      <Star className="h-3.5 w-3.5" /> Rate Service
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: NOTIFICATIONS */}
            {activeTab === 'notifications' && renderNotificationsView()}

            {/* TAB: PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-6 max-w-3xl mx-auto">
                {/* PROFILE IDENTITY HEADER */}
                <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-50/65 via-white to-emerald-50/20 p-6 md:p-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6 hover:shadow-sm transition-all">
                  <div className="relative shrink-0">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-950 text-white font-black text-2xl flex items-center justify-center shadow-md">
                      {user?.name ? user.name.substring(0, 2).toUpperCase() : 'JC'}
                    </div>
                    <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h2 className="text-2xl font-black text-slate-900">{user?.name || 'Customer Account'}</h2>
                      <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
                        Authenticated Customer
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">{user?.email || 'customer@example.com'}</p>

                    <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-600 font-medium">
                      <span className="flex items-center gap-1.5 text-emerald-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Account Active & Verified
                      </span>
                    </div>
                  </div>
                </div>

                {/* ACCOUNT INFORMATION CARD */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5 mb-2">
                    <div className="h-7 w-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900">Account Details</h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Full Name</span>
                      <strong className="text-sm font-extrabold text-slate-900 block mt-1">{user?.name || 'John customer'}</strong>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email Address</span>
                      <strong className="text-sm font-extrabold text-slate-900 block mt-1 truncate">{user?.email || 'customer@example.com'}</strong>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Role</span>
                      <strong className="text-sm font-black text-emerald-700 font-mono block mt-1 uppercase">{user?.role || 'CUSTOMER'}</strong>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Security Status</span>
                      <strong className="text-sm font-extrabold text-slate-900 block mt-1">JWT Secured</strong>
                    </div>
                  </div>
                </div>

                {/* CUSTOMER ACTIVITY SUMMARY */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5 mb-2">
                    <div className="h-7 w-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Activity className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900">Activity Summary</h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3 pt-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Requests</span>
                      <strong className="text-lg font-black text-slate-900 font-mono block mt-1">{requests.length}</strong>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Completed Services</span>
                      <strong className="text-lg font-black text-emerald-700 font-mono block mt-1">
                        {requests.filter((r) => r.jobStatus === 'COMPLETED').length}
                      </strong>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Investment</span>
                      <strong className="text-lg font-black text-slate-900 font-mono block mt-1">
                        ₹{requests.reduce((acc, r) => acc + (r.budget || 0), 0).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* WORKER VIEWS — REDESIGNED WITH DEDICATED OVERVIEW HERO AND ACCURATE IA */}
        {role === 'worker' && (
          <div className="space-y-8">
            {/* WORKER OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* WORKER OPERATIONS PANEL & PROFILE STRIP */}
                <div className="rounded-3xl border border-blue-200/70 bg-gradient-to-br from-blue-900 via-slate-900 to-emerald-950 p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                        WORKER WORKSPACE
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                        Worker Operations & Execution
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                        Manage your availability, discover jobs, execute assigned work, and track your cooperative earnings.
                      </p>
                    </div>

                    {workerProfile && (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleToggleAvailability}
                          disabled={isTogglingAvailability}
                          className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                            workerProfile.available
                              ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                              : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                          }`}
                        >
                          {workerProfile.available ? 'Status: Available' : 'Status: Unavailable'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsProfileModalOpen(true)}
                          className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700"
                        >
                          Edit Profile
                        </button>
                      </div>
                    )}
                  </div>

                  {workerProfile && (
                    <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-white">{workerProfile.workerName}</span>
                          <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
                            {workerProfile.available ? 'AVAILABLE FOR WORK' : 'UNAVAILABLE'}
                          </span>
                        </div>
                        <p className="text-slate-400">
                          ₹{workerProfile.hourlyRate}/hr • {workerProfile.experienceYears} Years Exp • {workerProfile.serviceLocation || 'Goa'} ({workerProfile.serviceRadiusKm || 15} km)
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {workerProfile.serviceCategories?.map((cat) => (
                          <span key={cat} className="rounded-lg bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                            {CATEGORY_LABELS[cat]?.label || cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 5 WORKER SUMMARY METRIC CARDS WITH GRADIENT STYLING */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all">
                    <span className="text-xs font-semibold text-slate-600 block">Available Jobs</span>
                    <div className="mt-1 text-2xl font-bold text-slate-900">{availableJobs.length}</div>
                    <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">Matching Skills</span>
                  </div>

                  <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all">
                    <span className="text-xs font-semibold text-slate-600 block">Assigned Jobs</span>
                    <div className="mt-1 text-2xl font-bold text-slate-900">{assignedJobs.length}</div>
                    <span className="text-[10px] text-blue-700 font-semibold mt-1 block">Active Execution</span>
                  </div>

                  <div className="rounded-2xl border border-teal-200/90 bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/40 p-5 shadow-xs hover:shadow-md hover:border-teal-300 transition-all">
                    <span className="text-xs font-semibold text-slate-600 block">Completed Jobs</span>
                    <div className="mt-1 text-2xl font-bold text-slate-900">
                      {workerEarningsSummary?.totalJobs || assignedJobs.filter((j) => j.jobStatus === 'COMPLETED').length}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">Verified Work</span>
                  </div>

                  <div className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-100/60 via-white to-emerald-50/80 p-5 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all">
                    <span className="text-xs font-bold text-emerald-800 block">Ledger Balance</span>
                    <div className="mt-1 text-2xl font-bold text-emerald-950">
                      ₹{workerEarningsSummary?.totalWorkerEarnings?.toFixed(2) || '0.00'}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold mt-1 block">Net 90% Payout</span>
                  </div>

                  <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 p-5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all">
                    <span className="text-xs font-semibold text-slate-600 block">Average Rating</span>
                    <div className="mt-1 text-2xl font-bold text-amber-600 flex items-center gap-1">
                      <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                      {workerRatingSummary?.averageRating ? workerRatingSummary.averageRating.toFixed(1) : '5.0'}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      ({workerRatingSummary?.totalRatings || 0} reviews)
                    </span>
                  </div>
                </div>

                {/* OVERVIEW SUMMARY GRID: RECENT JOBS & EARNINGS / RATINGS COMPACT BOXES */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* RECENT JOBS LIST / ACTIVE EXECUTION CARD */}
                  <div className="lg:col-span-2 rounded-3xl border border-slate-200/90 bg-white p-6 md:p-7 shadow-xs space-y-5 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100/80 pb-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                            ACTIVE EXECUTION
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          Recent Jobs Summary
                        </h3>
                      </div>
                      <button
                        onClick={() => setSearchParams({ tab: 'assigned' })}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-3.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-2xs"
                      >
                        View all assigned <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {assignedJobs.length === 0 && availableJobs.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/50 p-8 text-center space-y-2">
                          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <Briefcase className="h-5 w-5" />
                          </div>
                          <p className="text-xs font-bold text-slate-800">No active or assigned jobs</p>
                          <p className="text-[11px] text-slate-500">Check "Available Jobs" to discover and accept work nearby.</p>
                        </div>
                      ) : (
                        assignedJobs.slice(0, 3).map((job) => {
                          const status = job.jobStatus || 'ASSIGNED';
                          return (
                            <div
                              key={job.id}
                              className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-all duration-200 hover:bg-white hover:border-emerald-200 hover:shadow-md hover:-translate-y-0.5 group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                                <div className="h-10 w-10 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                  {getCategoryIcon(job.category)}
                                </div>
                                <div className="min-w-0 space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-emerald-950 transition-colors truncate">
                                      {job.description}
                                    </span>
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                                        status === 'COMPLETED'
                                          ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-200'
                                          : status === 'IN_PROGRESS'
                                          ? 'bg-blue-100/90 text-blue-800 border border-blue-200'
                                          : 'bg-amber-100/90 text-amber-800 border border-amber-200'
                                      }`}
                                    >
                                      {status === 'COMPLETED' ? (
                                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                      ) : status === 'IN_PROGRESS' ? (
                                        <Activity className="h-3 w-3 text-blue-600 animate-pulse" />
                                      ) : (
                                        <Clock3 className="h-3 w-3 text-amber-600" />
                                      )}
                                      {status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                    <span className="flex items-center gap-1 font-medium text-slate-600">
                                      <User className="h-3.5 w-3.5 text-slate-400" /> Customer: <strong className="text-slate-800 font-semibold">{job.customerName || 'Customer'}</strong>
                                    </span>
                                    {job.location && (
                                      <span className="flex items-center gap-1 hidden sm:flex">
                                        <MapPin className="h-3.5 w-3.5 text-slate-400" /> {job.location}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3.5 py-1.5 text-right shrink-0 self-end sm:self-center">
                                <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                                  Job Budget
                                </span>
                                <span className="text-sm font-black text-emerald-800 font-mono">
                                  ₹{job.budget}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* OVERVIEW SIDE SUMMARY BOXES WITH SUBTLE GRADIENTS */}
                  <div className="space-y-6">
                    {/* OVERVIEW EARNINGS SUMMARY */}
                    <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/30 p-6 shadow-xs space-y-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                        FINANCIAL SUMMARY
                      </span>
                      <h4 className="text-base font-bold text-slate-900">Earnings Summary</h4>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Available in Ledger</span>
                          <strong className="text-emerald-700 font-bold">
                            ₹{workerEarningsSummary?.totalWorkerEarnings?.toFixed(2) || '0.00'}
                          </strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Gross Job Value</span>
                          <strong className="text-slate-900">
                            ₹{workerEarningsSummary?.totalGross?.toFixed(2) || '0.00'}
                          </strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Cooperative Fees (10%)</span>
                          <strong className="text-slate-600">
                            ₹{workerEarningsSummary?.totalPlatformFees?.toFixed(2) || '0.00'}
                          </strong>
                        </div>
                      </div>

                      <button
                        onClick={() => setSearchParams({ tab: 'earnings' })}
                        className="w-full mt-2 rounded-xl border border-slate-200 bg-white py-2 text-center text-xs font-bold text-slate-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors shadow-xs"
                      >
                        View Full Earnings Ledger →
                      </button>
                    </div>

                    {/* OVERVIEW RATING SUMMARY */}
                    <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/30 p-6 shadow-xs space-y-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                        REPUTATION SUMMARY
                      </span>
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-slate-900">Ratings & Reviews</h4>
                        <div className="flex items-center gap-1 text-amber-600 font-bold text-sm">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          {workerRatingSummary?.averageRating ? workerRatingSummary.averageRating.toFixed(1) : '5.0'}
                        </div>
                      </div>

                      <p className="text-xs text-slate-500">
                        Based on {workerRatingSummary?.totalRatings || 0} verified customer job reviews.
                      </p>

                      <button
                        onClick={() => setSearchParams({ tab: 'ratings' })}
                        className="w-full mt-2 rounded-xl border border-slate-200 bg-white py-2 text-center text-xs font-bold text-slate-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors shadow-xs"
                      >
                        View All Reviews →
                      </button>
                    </div>
                  </div>
                </div>

                {/* WORKER QUICK ACTIONS ROW */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                    QUICK ACTIONS
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setSearchParams({ tab: 'available' })}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                    >
                      <Search className="h-4 w-4" /> Find Available Jobs
                    </button>
                    <button
                      onClick={() => setSearchParams({ tab: 'assigned' })}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <Briefcase className="h-4 w-4 text-slate-500" /> View Assigned Jobs
                    </button>
                    <button
                      onClick={() => setSearchParams({ tab: 'earnings' })}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <Wallet className="h-4 w-4 text-slate-500" /> View Earnings
                    </button>
                    <button
                      onClick={() => setSearchParams({ tab: 'ratings' })}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <Star className="h-4 w-4 text-slate-500" /> View Reviews
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: AVAILABLE JOBS */}
            {activeTab === 'available' && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                        JOB DISCOVERY WORKSPACE
                      </span>
                      <h2 className="text-2xl font-bold text-slate-900 mt-0.5">Available Jobs</h2>
                      <p className="text-xs text-slate-600 mt-1">
                        Find service requests that match your skills and availability.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={fetchWorkerJobs}
                      disabled={isLoadingJobs}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
                      title="Refresh available jobs"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingJobs ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {isLoadingJobs ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-3">
                          <div className="h-4 w-28 bg-slate-200 rounded" />
                          <div className="h-6 w-3/4 bg-slate-200 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : availableJobs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-3">
                      <Search className="mx-auto h-8 w-8 text-slate-400" />
                      <h3 className="text-base font-bold text-slate-900">No available jobs right now</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        New service opportunities will appear here when customers submit requests matching your skills.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                      {availableJobs.map((job) => (
                        <div
                          key={job.id}
                          className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 transition-all space-y-4 group"
                        >
                          <div className="space-y-4">
                            <div className="flex items-center justify-between gap-2">
                              <span className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                                {CATEGORY_LABELS[job.category]?.label || job.category}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                                <Clock3 className="h-3 w-3 text-slate-600 animate-pulse" /> OPEN
                              </span>
                            </div>

                            <div className="flex items-start gap-4">
                              <div className="h-10 w-10 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                {getCategoryIcon(job.category)}
                              </div>
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-emerald-950 transition-colors">{job.description}</h3>
                                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-slate-500">
                                  <span className="flex items-center gap-1 font-medium text-slate-600">
                                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> {job.location || 'Goa'}
                                  </span>
                                  <span className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-1 text-xs font-bold text-emerald-700">
                                    Budget: <strong className="text-emerald-800 font-extrabold font-mono text-sm">₹{job.budget.toLocaleString()}</strong>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(job)}
                              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-400" /> View Details
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAcceptJob(job.id)}
                              disabled={acceptingRequestId === job.id}
                              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                            >
                              {acceptingRequestId === job.id ? (
                                <>
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Accepting...
                                </>
                              ) : (
                                'Accept Job'
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: ASSIGNED JOBS */}
            {activeTab === 'assigned' && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                        JOB EXECUTION WORKSPACE
                      </span>
                      <h2 className="text-2xl font-bold text-slate-900 mt-0.5">Assigned Jobs</h2>
                      <p className="text-xs text-slate-600 mt-1">
                        Manage accepted service jobs and track execution progress.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs">
                        {(['ALL', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setAssignedFilterStatus(st)}
                            className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
                              assignedFilterStatus === st
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={fetchWorkerJobs}
                        disabled={isLoadingJobs}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
                        title="Refresh assigned jobs"
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoadingJobs ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {filteredAssignedJobs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-3">
                      <Briefcase className="mx-auto h-8 w-8 text-slate-400" />
                      <h3 className="text-base font-bold text-slate-900">No assigned jobs</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Accept jobs from the Available Jobs tab to manage job execution here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                      {filteredAssignedJobs.map((job) => {
                        const isCompleted = job.jobStatus === 'COMPLETED';
                        const isInProgress = job.jobStatus === 'IN_PROGRESS';
                        const isAccepted = job.jobStatus === 'ACCEPTED';
                        const status = job.jobStatus || 'ASSIGNED';

                        return (
                          <div
                            key={job.id}
                            className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 transition-all space-y-4 group"
                          >
                            <div className="space-y-4">
                              <div className="flex items-center justify-between gap-2">
                                <span className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                                  {CATEGORY_LABELS[job.category]?.label || job.category}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                                    isCompleted
                                      ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-200'
                                      : isInProgress
                                      ? 'bg-blue-100/90 text-blue-800 border border-blue-200'
                                      : 'bg-amber-100/90 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  ) : isInProgress ? (
                                    <Activity className="h-3 w-3 text-blue-600 animate-pulse" />
                                  ) : (
                                    <Clock3 className="h-3 w-3 text-amber-600" />
                                  )}
                                  {status}
                                </span>
                              </div>

                              <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                  {getCategoryIcon(job.category)}
                                </div>
                                <div className="flex-1 min-w-0 space-y-1.5">
                                  <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-emerald-950 transition-colors">
                                    {job.description}
                                  </h3>
                                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <User className="h-3.5 w-3.5 text-slate-400" /> Customer: <strong className="text-slate-800 font-semibold">{job.customerName || 'Customer'}</strong>
                                    </span>
                                    <span className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-1 text-xs font-bold text-emerald-700">
                                      Budget: <strong className="text-emerald-800 font-extrabold font-mono text-sm">₹{job.budget.toLocaleString()}</strong>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* 3-STAGE WORKER EXECUTION PIPELINE LINE */}
                              <div className="pt-2.5 space-y-2">
                                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wide">
                                  <span className="text-emerald-700 flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Assigned
                                  </span>
                                  <span className={isInProgress || isCompleted ? 'text-blue-700 flex items-center gap-1' : 'text-slate-400 flex items-center gap-1'}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${isInProgress || isCompleted ? 'bg-blue-500' : 'bg-slate-300'}`} /> In Progress
                                  </span>
                                  <span className={isCompleted ? 'text-emerald-700 flex items-center gap-1' : 'text-slate-400 flex items-center gap-1'}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`} /> Completed
                                  </span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200/40">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isCompleted
                                        ? 'w-full bg-gradient-to-r from-emerald-500 to-teal-500'
                                        : isInProgress
                                        ? 'w-2/3 bg-gradient-to-r from-blue-500 to-indigo-500'
                                        : 'w-1/3 bg-gradient-to-r from-emerald-400 to-emerald-500'
                                    }`}
                                  />
                                </div>
                              </div>
                            </div>

                             <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenDetail({
                                  id: job.serviceRequestId,
                                  category: job.category,
                                  description: job.description,
                                  location: job.location,
                                  budget: job.budget,
                                  preferredTime: job.preferredTime,
                                  status: job.requestStatus || 'OPEN',
                                  createdAt: job.createdAt,
                                  updatedAt: job.createdAt,
                                  customerId: job.customerId,
                                  customerName: job.customerName,
                                  assignmentStatus: 'ASSIGNED',
                                  jobId: job.id,
                                  workerId: job.workerId,
                                  workerName: job.workerName,
                                  jobStatus: job.jobStatus,
                                  startedAt: job.startedAt,
                                  completedAt: job.completedAt,
                                })}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                              >
                                <Eye className="h-3.5 w-3.5 text-slate-400" /> View Details
                              </button>

                              {isAccepted && (
                                <button
                                  type="button"
                                  onClick={() => handleStartJob(job.id)}
                                  disabled={operatingJobId === job.id}
                                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50"
                                >
                                  {operatingJobId === job.id ? (
                                    <>
                                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Starting...
                                    </>
                                  ) : (
                                    'Start Job Execution'
                                  )}
                                </button>
                              )}

                              {isInProgress && (
                                <button
                                  type="button"
                                  onClick={() => handleCompleteJob(job.id)}
                                  disabled={operatingJobId === job.id}
                                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50"
                                >
                                  {operatingJobId === job.id ? (
                                    <>
                                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Completing...
                                    </>
                                  ) : (
                                    'Complete Job'
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: EARNINGS LEDGER — MATCHING REFERENCE IMAGE & SUBTLE GRADIENTS */}
            {activeTab === 'earnings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                      FINANCIAL TRANSPARENCY
                    </span>
                    <h2 className="text-2xl font-bold text-slate-900 mt-0.5">💰 Earnings Ledger</h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Transparent record of completed job earnings with 10% cooperative fee deduction.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchWorkerEarnings}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                {/* 4 SUMMARY CARDS MATCHING REFERENCE SCREENSHOT WITH RICH GRADIENTS */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* CARD 1: GREEN BORDER + BG */}
                  <div className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-100/70 via-white to-teal-50/50 p-5 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">
                        ₹{workerEarningsSummary?.totalWorkerEarnings?.toFixed(2) || '0.00'}
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 block">Available in GigCircle Ledger</span>
                    </div>
                  </div>

                  {/* CARD 2: BLUE ACCENT */}
                  <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 p-5 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">
                        ₹{workerEarningsSummary?.totalGross?.toFixed(2) || '0.00'}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 block">Total Gross Job Value</span>
                    </div>
                  </div>

                  {/* CARD 3: GRAY ACCENT */}
                  <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50/80 via-white to-slate-100/40 p-5 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0 font-bold">
                      ₹
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">
                        ₹{workerEarningsSummary?.totalPlatformFees?.toFixed(2) || '0.00'}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 block">Cooperative Fees (10%)</span>
                    </div>
                  </div>

                  {/* CARD 4: INDIGO ACCENT */}
                  <div className="rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/40 p-5 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
                      ✓
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">
                        {workerEarningsSummary?.totalJobs || 0}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 block">Completed Jobs</span>
                    </div>
                  </div>
                </div>

                {/* TRANSPARENT FORMULA BANNER */}
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50/60 p-4 text-xs flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Transparent Cooperative Ledger Formula:</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono font-bold text-slate-800">
                    <span>Gross Job Value</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-slate-600">10% Cooperative Fee</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-emerald-700">90% Worker Payout</span>
                  </div>
                </div>

                {/* COMPLETED JOBS EARNINGS LEDGER TABLE */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-xs space-y-5 transition-all">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5 mb-2">
                    <div className="h-7 w-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900">Completed Job Transactions</h3>
                  </div>

                  <div className="space-y-3">
                    {workerEarnings.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/50 p-8 text-center space-y-2">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                          <Receipt className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-800">No earnings transactions recorded yet</p>
                        <p className="text-[11px] text-slate-500">Complete assigned jobs to generate payouts and ledger entries.</p>
                      </div>
                    ) : (
                      workerEarnings.map((e) => (
                        <div
                          key={e.id}
                          className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-all duration-200 hover:bg-white hover:border-emerald-200 hover:shadow-xs group flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-700 border border-emerald-200/50 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                              #{e.jobId}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-sm group-hover:text-emerald-950 block">
                                Job Contract #{e.jobId}
                              </span>
                              <span className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                                Gross Amount: <strong className="text-slate-700 font-semibold">₹{e.grossAmount?.toFixed(2)}</strong>
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <span className="text-emerald-700 font-extrabold text-sm block leading-tight">
                                +₹{e.workerEarning?.toFixed(2)}
                              </span>
                              <span className="text-slate-400 text-[10px]">Cooperative Payout (90%)</span>
                            </div>
                            <div className="rounded-xl bg-slate-100 border border-slate-200/60 px-3 py-1.5 text-right hidden sm:block">
                              <span className="text-slate-600 font-extrabold text-[10px] block leading-none">Coop Fee</span>
                              <span className="text-slate-500 text-[10px] font-medium block mt-0.5">
                                ₹{e.platformFee?.toFixed(2)} (10%)
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: RATINGS & REVIEWS */}
            {activeTab === 'ratings' && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 p-6 md:p-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700">
                        PUBLIC REPUTATION
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                      Ratings & Reviews
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Verified customer ratings & feedback from completed community service jobs.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 bg-white/90 backdrop-blur-md border border-amber-200/80 rounded-2xl p-4 shrink-0 shadow-sm hover:shadow-md transition-all">
                    <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-2xl font-black text-amber-950 block leading-none">
                        {workerRatingSummary?.averageRating ? workerRatingSummary.averageRating.toFixed(1) : '5.0'}
                      </span>
                      <span className="text-[11px] font-bold text-amber-700 block mt-1">
                        {workerRatingSummary?.totalRatings || 0} verified reviews
                      </span>
                    </div>
                  </div>
                </div>

                {/* REVIEWS LIST / CUSTOMER FEEDBACK */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-5">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
                    <div className="h-7 w-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900">Customer Feedback</h3>
                  </div>

                  {workerRatings.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/50 p-10 text-center space-y-2.5">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                        <Star className="h-5.5 w-5.5 fill-amber-400 text-amber-400 animate-pulse" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">No reviews received yet</h4>
                      <p className="text-xs text-slate-500">Complete assigned community jobs to start receiving verified customer ratings.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {workerRatings.map((rating) => (
                        <div
                          key={rating.id}
                          className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-3.5 hover:bg-white hover:border-amber-300 hover:shadow-xs transition-all group relative overflow-hidden"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-slate-900 text-white font-extrabold text-[10px] flex items-center justify-center shadow-xs shrink-0">
                                {(rating.customerName || 'Customer').substring(0, 2).toUpperCase()}
                              </div>
                              <span className="font-extrabold text-slate-900 text-xs truncate">
                                {rating.customerName || `Customer #${rating.customerId}`}
                              </span>
                            </div>
                            <div className="inline-flex items-center gap-1 rounded-xl bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-amber-700 font-extrabold text-xs shrink-0 shadow-2xs">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {rating.score?.toFixed(1)}
                            </div>
                          </div>
                          <div className="relative">
                            <span className="absolute -top-3 -left-1 text-slate-200 text-3xl font-serif select-none pointer-events-none">“</span>
                            <p className="text-xs text-slate-600 italic pl-3 relative z-10 leading-relaxed font-medium">
                              {rating.review || 'Great service quality!'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: WORKER PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-6 max-w-3xl mx-auto">
                 {/* PROFILE IDENTITY HEADER */}
                <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-50/65 via-white to-emerald-50/20 p-6 md:p-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6 hover:shadow-sm transition-all">
                  <div className="relative shrink-0">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-950 text-white font-black text-2xl flex items-center justify-center shadow-md">
                      {workerProfile?.workerName ? workerProfile.workerName.substring(0, 2).toUpperCase() : 'JW'}
                    </div>
                    <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${workerProfile?.available ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h2 className="text-2xl font-black text-slate-900">{workerProfile?.workerName || 'Worker Profile'}</h2>
                      <span className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                        workerProfile?.available
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-slate-100 border-slate-200 text-slate-500'
                      }`}>
                        {workerProfile?.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">{user?.email || 'worker@example.com'}</p>

                    <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-600 font-medium">
                      <span className="flex items-center gap-1 text-amber-600 font-bold">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {workerRatingSummary?.averageRating ? workerRatingSummary.averageRating.toFixed(1) : '5.0'} ({workerRatingSummary?.totalRatings || 0} reviews)
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" /> {workerProfile?.serviceLocation || 'Goa'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    <Edit className="h-3.5 w-3.5 text-slate-400" /> Edit Profile
                  </button>
                </div>

                {/* PROFESSIONAL INFORMATION CARD */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5 mb-2">
                    <div className="h-7 w-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900">Professional Information</h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Hourly Rate</span>
                      <strong className="text-lg font-black text-emerald-700 font-mono block mt-1">₹{workerProfile?.hourlyRate || 100}/hr</strong>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Experience</span>
                      <strong className="text-lg font-extrabold text-slate-900 block mt-1">{workerProfile?.experienceYears || 2} Years</strong>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Service Radius</span>
                      <strong className="text-lg font-extrabold text-slate-900 block mt-1">{workerProfile?.serviceRadiusKm || 15} km</strong>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Skills & Categories</span>
                      <div className="flex flex-wrap gap-1.5">
                        {workerProfile?.serviceCategories?.map((c) => (
                          <span key={c} className="rounded-lg bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700 uppercase tracking-wide">
                            {CATEGORY_LABELS[c]?.label || c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: WORKER NOTIFICATIONS */}
            {activeTab === 'notifications' && renderNotificationsView()}
          </div>
        )}

        {/* ADMIN VIEWS */}
        {role === 'admin' && (
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Cooperative Operations Dashboard</h2>
                <button
                  type="button"
                  onClick={fetchAdminData}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {/* METRIC CARDS WITH GRADIENT STYLING */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 p-5 shadow-xs hover:shadow-md transition-all">
                  <span className="text-xs text-slate-600 font-semibold">Total Users</span>
                  <div className="mt-2 text-3xl font-bold text-slate-900">{adminUsers.length}</div>
                </div>
                <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 p-5 shadow-xs hover:shadow-md transition-all">
                  <span className="text-xs text-slate-600 font-semibold">Active Workers</span>
                  <div className="mt-2 text-3xl font-bold text-slate-900">{adminWorkers.length}</div>
                </div>
                <div className="rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/40 p-5 shadow-xs hover:shadow-md transition-all">
                  <span className="text-xs text-slate-600 font-semibold">Total Service Requests</span>
                  <div className="mt-2 text-3xl font-bold text-slate-900">{adminRequests.length}</div>
                </div>
              </div>

              {/* USERS DIRECTORY TABLE / LIST */}
              {(activeTab === 'users' || activeTab === 'overview') && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-slate-900">User Directory</h3>
                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs">
                      {(['ALL', 'CUSTOMER', 'WORKER', 'ADMIN'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setAdminUserFilter(r)}
                          className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
                            adminUserFilter === r
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 overflow-x-auto">
                    {filteredAdminUsers.map((u) => (
                      <div key={u.id} className="py-3 flex items-center justify-between text-xs min-w-[500px]">
                        <div>
                          <strong className="text-slate-900">{u.name}</strong> ({u.email})
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                            {u.role}
                          </span>
                          <span className="text-slate-400">{u.phone}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WORKERS GOVERNANCE DIRECTORY */}
              {(activeTab === 'workers' || activeTab === 'overview') && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">Worker Governance & Activation</h3>
                  <div className="divide-y divide-slate-100 overflow-x-auto">
                    {adminWorkers.map((w) => (
                      <div key={w.workerId} className="py-3.5 flex items-center justify-between text-xs min-w-[550px]">
                        <div>
                          <strong className="text-slate-900">{w.name}</strong> ({w.email})
                          <p className="text-slate-500 mt-0.5">{w.serviceCategories?.join(', ')} • ₹{w.hourlyRate}/hr</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleWorkerStatus(w)}
                          disabled={operatingWorkerId === w.workerId}
                          className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                            w.active
                              ? 'bg-rose-600 text-white hover:bg-rose-700'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {w.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ADMIN NOTIFICATIONS */}
              {activeTab === 'notifications' && renderNotificationsView()}
            </div>
          </div>
        )}
      </div>

      {/* Customer Modals */}
      {role === 'customer' && (
        <>
          <CreateRequestModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={fetchCustomerRequests}
          />
          <RequestDetailModal
            request={selectedRequest}
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedRequest(null);
            }}
            onStatusChange={fetchCustomerRequests}
          />
          <RatingModal
            isOpen={isRatingModalOpen}
            onClose={() => setIsRatingModalOpen(false)}
            jobId={ratingJobId}
            workerName={ratingWorkerName}
            onSuccess={fetchCustomerRequests}
          />
        </>
      )}

      {/* Worker Modals */}
      {role === 'worker' && (
        <>
          <WorkerProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            onSuccess={(profile) => {
              setWorkerProfile(profile);
              setProfileNotFound(false);
              fetchWorkerJobs();
            }}
            existingProfile={workerProfile}
          />
          <RequestDetailModal
            request={selectedRequest}
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedRequest(null);
            }}
            onStatusChange={fetchWorkerJobs}
          />
        </>
      )}
    </PlatformShell>
  );
}