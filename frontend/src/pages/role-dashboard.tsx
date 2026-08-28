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
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { PlatformShell } from '@/components/platform-shell';
import { FoundationStatus } from '@/components/status-panel';
import { CreateRequestModal } from '@/components/create-request-modal';
import { RequestDetailModal } from '@/components/request-detail-modal';
import { WorkerProfileModal } from '@/components/worker-profile-modal';
import { RatingModal } from '@/components/rating-modal';
import { NotificationPanel } from '@/components/notification-panel';
import { CATEGORY_LABELS, type ServiceRequest, type ServiceRequestStatus } from '@/types/service-request';
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
import { useToast } from '@/hooks/use-toast';

type RoleKey = 'customer' | 'worker' | 'admin';

const roleContent: Record<
  RoleKey,
  {
    eyebrow: string;
    title: string;
    intro: string;
    accent: string;
    textColor: string;
    icon: typeof House;
    steps: { title: string; copy: string; icon: typeof House }[];
    stat: string;
    statLabel: string;
  }
> = {
  customer: {
    eyebrow: 'Customer Dashboard · Earnings Ledger Active',
    title: 'A clearer way to ask for help.',
    intro: 'Describe what your household needs, set your budget, track job progress, rate services, and view transparent job financials.',
    accent: 'bg-secondary',
    textColor: 'text-secondary-foreground',
    icon: House,
    stat: '01',
    statLabel: 'authenticated customer',
    steps: [
      { title: 'Create service request', copy: 'Submit plumbing, electrical, cleaning, and home repair needs.', icon: Wrench },
      { title: 'Worker assignment', copy: 'Eligible local workers view and accept your request.', icon: UserCheck },
      { title: 'Rate completed work', copy: 'Follow status to completion, review financials, and leave honest ratings.', icon: Star },
    ],
  },
  worker: {
    eyebrow: 'Worker Dashboard · Earnings Ledger Active',
    title: 'Good work should find good people.',
    intro: 'Manage your skills, accept matching requests, control job execution, build ratings, and track transparent earnings.',
    accent: 'bg-accent',
    textColor: 'text-accent-foreground',
    icon: HandHeart,
    stat: '02',
    statLabel: 'authenticated worker',
    steps: [
      { title: 'Build worker profile', copy: 'Set your experience, skills, and service categories.', icon: Briefcase },
      { title: 'Accept matching jobs', copy: 'View eligible service requests matching your categories and location.', icon: MapPin },
      { title: 'Track V1 earnings', copy: 'Earn 90% net payout on completed services with 10% cooperative fee transparency.', icon: Wallet },
    ],
  },
  admin: {
    eyebrow: 'Cooperative Dashboard · Revenue Ledger Active',
    title: 'Make the work visible.',
    intro: 'An oversight view for platform stewards — grounded in participation, transparency, cooperative revenue, and trust.',
    accent: 'bg-primary',
    textColor: 'text-primary-foreground',
    icon: ShieldCheck,
    stat: '03',
    statLabel: 'authenticated admin',
    steps: [
      { title: 'See the network breathe', copy: 'A living view of local activity and participation.', icon: UsersRound },
      { title: 'Cooperative revenue ledger', copy: 'Inspect platform fees (10%), gross volume, and net worker payouts.', icon: Receipt },
      { title: 'Strengthen the cooperative', copy: 'Turn community insight into better systems.', icon: Sparkles },
    ],
  },
};

export default function RoleDashboard({ role }: { role: RoleKey }) {
  const { toast } = useToast();
  const content = roleContent[role];
  const platformQuery = useApi(getPlatformInfo);
  const rbacPingQuery = useApi(() => pingRoleApi(role));
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Customer State (Segment 2, 4, 5, 6, 7)
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(role === 'customer');
  const [requestError, setRequestError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | ServiceRequestStatus>('ALL');
  const [customerJobEarnings, setCustomerJobEarnings] = useState<Record<number, Earning>>({});

  // Customer Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Segment 6 Rating Modal State
  const [ratingJobId, setRatingJobId] = useState<number | null>(null);
  const [ratingWorkerName, setRatingWorkerName] = useState<string | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  // Worker Profile State (Segment 3)
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(role === 'worker');
  const [profileNotFound, setProfileNotFound] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);

  // Worker Job Feed & Lifecycle State (Segment 4 & 5)
  const [availableJobs, setAvailableJobs] = useState<ServiceRequest[]>([]);
  const [assignedJobs, setAssignedJobs] = useState<JobResponse[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(role === 'worker');
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [acceptingRequestId, setAcceptingRequestId] = useState<number | null>(null);
  const [operatingJobId, setOperatingJobId] = useState<number | null>(null);

  // Segment 6 Worker Ratings State
  const [workerRatings, setWorkerRatings] = useState<Rating[]>([]);
  const [workerRatingSummary, setWorkerRatingSummary] = useState<WorkerRatingSummary | null>(null);
  const [isLoadingWorkerRatings, setIsLoadingWorkerRatings] = useState<boolean>(role === 'worker');

  // Segment 7 Worker Earnings State
  const [workerEarnings, setWorkerEarnings] = useState<Earning[]>([]);
  const [workerEarningsSummary, setWorkerEarningsSummary] = useState<WorkerEarningsSummary | null>(null);
  const [isLoadingWorkerEarnings, setIsLoadingWorkerEarnings] = useState<boolean>(role === 'worker');

  // Segment 7 & Segment 9 Admin State
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
  const [adminTab, setAdminTab] = useState<'overview' | 'workers' | 'users' | 'requests' | 'jobs' | 'ratings' | 'activity'>('overview');
  const [confirmToggleWorker, setConfirmToggleWorker] = useState<AdminWorker | null>(null);
  const [operatingWorkerId, setOperatingWorkerId] = useState<number | null>(null);

  const fetchCustomerRequests = async () => {
    if (role !== 'customer') return;
    setIsLoadingRequests(true);
    setRequestError(null);
    try {
      const data = await getServiceRequestsApi();
      setRequests(data);

      // Fetch financial details for completed assigned jobs
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
  }, [role]);

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
      setConfirmToggleWorker(null);
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
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || 'Failed to accept job.';
      if (status === 409) {
        toast({
          title: 'Request Already Assigned',
          description: 'This service request was already accepted by another worker.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Acceptance Failed',
          description: msg,
          variant: 'destructive',
        });
      }
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

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleOpenDetail = (req: ServiceRequest) => {
    setSelectedRequest(req);
    setIsDetailModalOpen(true);
  };

  const filteredRequests = requests.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  const Icon = content.icon;

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(isoStr));
    } catch {
      return isoStr;
    }
  };

  return (
    <PlatformShell>
      <div className="mx-auto max-w-[1240px] px-5 py-9 md:px-10 md:py-14">
        {/* User Session Banner */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-accent/30 bg-accent/10 p-5 md:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground font-bold font-mono text-lg shadow-xs">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-primary">{user?.name}</span>
                <span className="rounded-full bg-accent/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-accent uppercase">
                  {user?.role}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <UserCheck className="h-3.5 w-3.5" /> Authenticated ✓
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {user?.email} • {user?.phone}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user?.role && <NotificationPanel role={user.role as any} />}
            <button
              onClick={handleLogout}
              className="focus-ring inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-destructive transition-colors hover:border-destructive/40 hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>

        {/* Dashboard Header */}
        <div className="animate-rise-in">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              {content.eyebrow}
            </span>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              JWT Session Verified
            </span>
          </div>
          <div className="mt-7 grid gap-10 md:grid-cols-[1fr_300px] md:items-end">
            <div>
              <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[.98] tracking-[-.04em] text-primary md:text-7xl">
                {content.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{content.intro}</p>
            </div>
            <div
              className={`relative flex h-40 w-40 flex-col justify-between overflow-hidden rounded-[32px] p-5 ${content.textColor} md:justify-end ${content.accent}`}
            >
              <Icon className="absolute -right-2 -top-3 h-28 w-28 opacity-15" strokeWidth={1} />
              <span className="font-mono text-xs opacity-70">{content.stat}</span>
              <span className="mt-3 max-w-[120px] text-sm font-semibold leading-5">{content.statLabel}</span>
            </div>
          </div>
        </div>

        {/* Customer Functional Workflow (Segment 2, 4, 5, 6, 7) */}
        {role === 'customer' && (
          <div className="mt-14 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6 md:p-8">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  PostgreSQL Persisted
                </span>
                <h2 className="mt-1 font-display text-3xl font-semibold text-primary">My Service Requests</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Track request assignments, worker job progress, financial breakdowns, and rate completed services.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-2xl border border-border bg-background p-1 text-xs">
                  {(['ALL', 'OPEN', 'CANCELLED'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={`rounded-xl px-3 py-1.5 font-bold transition-colors ${
                        filterStatus === st
                          ? 'bg-accent text-accent-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-primary'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button
                  onClick={fetchCustomerRequests}
                  disabled={isLoadingRequests}
                  className="focus-ring p-2.5 rounded-2xl border border-border bg-background text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                  title="Refresh requests"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingRequests ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="focus-ring inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-xs font-bold text-accent-foreground shadow-md transition-opacity hover:opacity-90"
                >
                  <Plus className="h-4 w-4" /> Request a Service
                </button>
              </div>
            </div>

            {isLoadingRequests ? (
              <div className="grid gap-5 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse rounded-3xl border border-border bg-card p-6 space-y-4">
                    <div className="h-4 w-28 bg-muted rounded" />
                    <div className="h-6 w-3/4 bg-muted rounded" />
                    <div className="h-4 w-1/2 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : requestError ? (
              <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-8 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
                <h3 className="mt-3 font-display text-lg font-semibold text-destructive">Failed to Load Requests</h3>
                <p className="mt-1 text-sm text-destructive/80">{requestError}</p>
                <button
                  onClick={fetchCustomerRequests}
                  className="mt-4 focus-ring inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Try Again
                </button>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center md:p-14">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Wrench className="h-7 w-7" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-semibold text-primary">No service requests yet</h3>
                <p className="mt-2 mx-auto max-w-md text-sm text-muted-foreground">
                  Tell us what you need help with and create your first service request.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-6 focus-ring inline-flex items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-xs font-bold text-accent-foreground shadow-md transition-opacity hover:opacity-90"
                >
                  <Plus className="h-4 w-4" /> Request a Service
                </button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {filteredRequests.map((req) => {
                  const categoryInfo = CATEGORY_LABELS[req.category] || { label: req.category, description: '' };
                  const isOpenStatus = req.status === 'OPEN';
                  const isAssigned = req.assignmentStatus === 'ASSIGNED';
                  const jobStatus = req.jobStatus;
                  const isCompleted = jobStatus === 'COMPLETED';
                  const earningInfo = req.jobId ? customerJobEarnings[req.jobId] : undefined;

                  return (
                    <div
                      key={req.id}
                      className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 transition-all hover:border-accent/60 hover:shadow-lg"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="rounded-xl bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                            {categoryInfo.label}
                          </span>
                          <div className="flex items-center gap-2">
                            {isAssigned && (
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                                  jobStatus === 'COMPLETED'
                                    ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : jobStatus === 'IN_PROGRESS'
                                    ? 'border border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                    : 'border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {jobStatus === 'COMPLETED' ? (
                                  <>
                                    <CheckCheck className="h-3 w-3" /> COMPLETED
                                  </>
                                ) : jobStatus === 'IN_PROGRESS' ? (
                                  <>
                                    <Play className="h-3 w-3" /> IN_PROGRESS
                                  </>
                                ) : (
                                  <>
                                    <User className="h-3 w-3" /> ASSIGNED
                                  </>
                                )}
                              </span>
                            )}
                            <span
                              className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                                isOpenStatus
                                  ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'border border-slate-500/30 bg-slate-500/10 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                        </div>

                        <p className="mt-4 text-sm font-medium text-primary line-clamp-2 leading-relaxed">
                          {req.description}
                        </p>

                        {/* Assigned Worker & Financial Breakdown strip */}
                        {isAssigned && req.workerName && (
                          <div className="mt-4 space-y-2 rounded-2xl border border-border/80 bg-background/60 p-3.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-muted-foreground">Assigned Worker:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-primary">{req.workerName}</span>
                                {req.workerAverageRating && req.workerAverageRating > 0 ? (
                                  <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                    <span>{req.workerAverageRating.toFixed(1)}</span>
                                    <span className="text-muted-foreground font-normal">({req.workerTotalRatings})</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">(No ratings yet)</span>
                                )}
                              </div>
                            </div>

                            {/* Segment 7 Financial Summary */}
                            {isCompleted && earningInfo && (
                              <div className="mt-2 border-t border-border/60 pt-2 space-y-1 text-[11px]">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Service Agreed Budget:</span>
                                  <span className="font-mono font-bold text-primary">₹{earningInfo.grossAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                                  <span>Worker Net Earning (90%):</span>
                                  <span className="font-mono font-bold">₹{earningInfo.workerEarning.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between text-muted-foreground">
                                  <span>Cooperative Platform Fee ({earningInfo.feePercentage}%):</span>
                                  <span className="font-mono">₹{earningInfo.platformFee.toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-6 border-t border-border/60 pt-4">
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" />
                            <span className="truncate">{req.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono font-bold text-primary">
                            <span className="text-accent">₹</span>
                            <span>₹{req.budget.toLocaleString()}</span>
                          </div>
                          <div className="col-span-2 flex items-center gap-1.5 text-[11px]">
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-accent" />
                            <span>Preferred: {formatDate(req.preferredTime)}</span>
                          </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-3 pt-2">
                          <button
                            onClick={() => handleOpenDetail(req)}
                            className="focus-ring inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-bold text-primary hover:bg-secondary transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5 text-accent" /> View Details
                          </button>

                          {/* Rating Action or Status */}
                          {isCompleted && (
                            req.isRated ? (
                              <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Rated ✓
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  if (req.jobId) {
                                    setRatingJobId(req.jobId);
                                    setRatingWorkerName(req.workerName || 'Worker');
                                    setIsRatingModalOpen(true);
                                  }
                                }}
                                className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-600 transition-all"
                              >
                                <Star className="h-3.5 w-3.5 fill-white" /> Rate Worker
                              </button>
                            )
                          )}

                          {isOpenStatus && !isAssigned && (
                            <button
                              onClick={() => handleOpenDetail(req)}
                              className="focus-ring inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-bold text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
                            >
                              <Ban className="h-3.5 w-3.5" /> Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Worker Functional Workflow (Segment 3, 4, 5, 6, 7) */}
        {role === 'worker' && (
          <div className="mt-14 space-y-10">
            {/* Worker Profile Overview Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6 md:p-8">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  Worker Operations
                </span>
                <h2 className="mt-1 font-display text-3xl font-semibold text-primary">Profile, Execution & Ledger</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your skills, toggle availability, accept matching requests, control job execution, build ratings, and inspect earnings.
                </p>
              </div>

              {workerProfile && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleToggleAvailability}
                    disabled={isTogglingAvailability}
                    className={`focus-ring inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs ${
                      workerProfile.available
                        ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                        : 'border border-slate-500/40 bg-slate-500/10 text-slate-500 dark:text-slate-400 hover:bg-slate-500/20'
                    }`}
                  >
                    <Power className="h-4 w-4" />
                    <span>{workerProfile.available ? 'Status: Available' : 'Status: Unavailable'}</span>
                  </button>

                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="focus-ring inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-xs font-bold text-accent-foreground shadow-md transition-opacity hover:opacity-90"
                  >
                    <Edit className="h-4 w-4" /> Edit Profile
                  </button>
                </div>
              )}
            </div>

            {isLoadingProfile ? (
              <div className="animate-pulse rounded-3xl border border-border bg-card p-8 space-y-6">
                <div className="h-6 w-1/3 bg-muted rounded" />
                <div className="h-4 w-2/3 bg-muted rounded" />
                <div className="h-20 w-full bg-muted rounded" />
              </div>
            ) : profileError ? (
              <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-8 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
                <h3 className="mt-3 font-display text-lg font-semibold text-destructive">Failed to Load Profile</h3>
                <p className="mt-1 text-sm text-destructive/80">{profileError}</p>
                <button
                  onClick={fetchWorkerProfile}
                  className="mt-4 focus-ring inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Retry
                </button>
              </div>
            ) : profileNotFound ? (
              <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center md:p-14">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Briefcase className="h-7 w-7" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-semibold text-primary">Set up your worker profile</h3>
                <p className="mt-2 mx-auto max-w-md text-sm text-muted-foreground">
                  Tell customers what services you provide, your experience, skills, and when you are available for work.
                </p>
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="mt-6 focus-ring inline-flex items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-xs font-bold text-accent-foreground shadow-md transition-opacity hover:opacity-90"
                >
                  <Plus className="h-4 w-4" /> Create Worker Profile
                </button>
              </div>
            ) : workerProfile ? (
              <div className="space-y-10">
                {/* Profile Summary Strip */}
                <div className="rounded-3xl border border-border/80 bg-card p-6 md:p-8 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-xl font-bold text-primary">{workerProfile.workerName}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                            workerProfile.available
                              ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'border border-slate-500/30 bg-slate-500/10 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {workerProfile.available ? 'AVAILABLE FOR WORK' : 'UNAVAILABLE'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {workerProfile.workerEmail} • ₹{workerProfile.hourlyRate}/hr • {workerProfile.experienceYears} Years Exp • {workerProfile.serviceLocation || 'Any Location'} ({workerProfile.serviceRadiusKm} km)
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {workerProfile.serviceCategories?.map((cat) => (
                        <span key={cat} className="rounded-xl border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
                          {CATEGORY_LABELS[cat]?.label || cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 1: Segment 7 Worker Earnings Ledger */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
                        Segment 7 Financial Ledger
                      </span>
                      <h3 className="font-display text-2xl font-semibold text-primary">💰 Earnings Ledger</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Transparent record of completed job earnings with 10% cooperative fee deduction.
                      </p>
                    </div>

                    <button
                      onClick={fetchWorkerEarnings}
                      disabled={isLoadingWorkerEarnings}
                      className="focus-ring p-2.5 rounded-2xl border border-border bg-background text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                      title="Refresh earnings"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingWorkerEarnings ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-4 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold shadow-xs">
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-display text-2xl font-bold text-primary">
                          ₹{workerEarningsSummary?.totalWorkerEarnings ? workerEarningsSummary.totalWorkerEarnings.toFixed(2) : '0.00'}
                        </div>
                        <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Available in GigCircle Ledger</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/20 text-accent font-bold shadow-xs">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-display text-2xl font-bold text-primary">
                          ₹{workerEarningsSummary?.totalGross ? workerEarningsSummary.totalGross.toFixed(2) : '0.00'}
                        </div>
                        <p className="text-[11px] text-muted-foreground">Total Gross Job Value</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-500/20 text-slate-600 dark:text-slate-300 font-bold shadow-xs">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-display text-2xl font-bold text-primary">
                          ₹{workerEarningsSummary?.totalPlatformFees ? workerEarningsSummary.totalPlatformFees.toFixed(2) : '0.00'}
                        </div>
                        <p className="text-[11px] text-muted-foreground">Cooperative Fees (10%)</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold shadow-xs">
                        <CheckCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-display text-2xl font-bold text-primary">
                          {workerEarningsSummary?.totalJobs || 0}
                        </div>
                        <p className="text-[11px] text-muted-foreground">Completed Jobs</p>
                      </div>
                    </div>
                  </div>

                  {/* Earnings List */}
                  {isLoadingWorkerEarnings ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="animate-pulse rounded-2xl border border-border bg-card p-4 space-y-2">
                          <div className="h-4 w-40 bg-muted rounded" />
                          <div className="h-5 w-1/3 bg-muted rounded" />
                        </div>
                      ))}
                    </div>
                  ) : workerEarnings.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border bg-card/60 p-8 text-center">
                      <Wallet className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <h4 className="mt-3 font-display text-lg font-semibold text-primary">No earnings yet</h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Your earnings ledger will automatically update as soon as you complete assigned jobs!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {workerEarnings.map((earning) => (
                        <div key={earning.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-accent/40">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-accent">Job #{earning.jobId}</span>
                              <span className="rounded-lg bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                                {earning.serviceCategory || 'SERVICE'}
                              </span>
                              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                {earning.status}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Customer: <span className="font-semibold text-primary">{earning.customerName}</span> • Date: <span className="font-mono">{formatDate(earning.createdAt)}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-6 text-xs text-right">
                            <div>
                              <div className="text-[10px] text-muted-foreground">Gross Value</div>
                              <div className="font-mono font-semibold text-primary">₹{earning.grossAmount.toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-muted-foreground">Fee ({earning.feePercentage}%)</div>
                              <div className="font-mono text-muted-foreground">-₹{earning.platformFee.toFixed(2)}</div>
                            </div>
                            <div className="rounded-xl bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/30">
                              <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Your Earnings</div>
                              <div className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{earning.workerEarning.toFixed(2)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 2: Active & Assigned Jobs (Segment 5 Lifecycle Operations) */}
                <div className="space-y-6 border-t border-border pt-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
                        Segment 5 Job Execution
                      </span>
                      <h3 className="font-display text-2xl font-semibold text-primary">My Active & Assigned Jobs</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Jobs you have accepted. Start the job when arriving and mark complete when finished.
                      </p>
                    </div>

                    <button
                      onClick={fetchWorkerJobs}
                      disabled={isLoadingJobs}
                      className="focus-ring p-2.5 rounded-2xl border border-border bg-background text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                      title="Refresh jobs"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingJobs ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {assignedJobs.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border bg-card/60 p-8 text-center">
                      <p className="text-xs text-muted-foreground">
                        You have no active or accepted jobs yet. Accept an available service request below to start work!
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-5 md:grid-cols-2">
                      {assignedJobs.map((job) => {
                        const categoryInfo = CATEGORY_LABELS[job.category] || { label: job.category, description: '' };
                        const isOperating = operatingJobId === job.id;

                        return (
                          <div
                            key={job.id}
                            className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 transition-all hover:border-accent/60 hover:shadow-lg"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="rounded-xl bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                                  {categoryInfo.label}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                                    job.jobStatus === 'COMPLETED'
                                      ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                      : job.jobStatus === 'IN_PROGRESS'
                                      ? 'border border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                      : 'border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  }`}
                                >
                                  {job.jobStatus === 'COMPLETED' ? (
                                    <>
                                      <CheckCheck className="h-3 w-3" /> COMPLETED ✓
                                    </>
                                  ) : job.jobStatus === 'IN_PROGRESS' ? (
                                    <>
                                      <Play className="h-3 w-3" /> IN_PROGRESS
                                    </>
                                  ) : (
                                    <>
                                      <User className="h-3 w-3" /> ACCEPTED
                                    </>
                                  )}
                                </span>
                              </div>

                              <p className="mt-4 text-sm font-medium text-primary line-clamp-2 leading-relaxed">
                                {job.description}
                              </p>

                              <p className="mt-2 text-xs text-muted-foreground">
                                Customer: <span className="font-semibold text-primary">{job.customerName}</span>
                              </p>

                              {/* Timestamps */}
                              <div className="mt-3 space-y-1 rounded-xl bg-background/50 p-2.5 text-[11px] text-muted-foreground">
                                {job.acceptedAt && <div>Accepted: {formatDate(job.acceptedAt)}</div>}
                                {job.startedAt && <div className="text-blue-600 dark:text-blue-400">Started: {formatDate(job.startedAt)}</div>}
                                {job.completedAt && <div className="text-emerald-600 dark:text-emerald-400 font-semibold">Completed: {formatDate(job.completedAt)}</div>}
                              </div>
                            </div>

                            <div className="mt-6 border-t border-border/60 pt-4">
                              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5 truncate">
                                  <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" />
                                  <span className="truncate">{job.location}</span>
                                </div>
                                <div className="flex items-center gap-1.5 font-mono font-bold text-primary">
                                  <span className="text-accent">₹</span>
                                  <span>₹{job.budget.toLocaleString()}</span>
                                </div>
                              </div>

                              {/* Lifecycle Action Buttons */}
                              <div className="mt-5 flex items-center justify-end gap-3 pt-2">
                                {job.jobStatus === 'ACCEPTED' && (
                                  <button
                                    onClick={() => handleStartJob(job.id)}
                                    disabled={isOperating || operatingJobId !== null}
                                    className="focus-ring inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    {isOperating ? (
                                      <>
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Starting...
                                      </>
                                    ) : (
                                      <>
                                        <Play className="h-3.5 w-3.5" /> Start Job
                                      </>
                                    )}
                                  </button>
                                )}

                                {job.jobStatus === 'IN_PROGRESS' && (
                                  <button
                                    onClick={() => handleCompleteJob(job.id)}
                                    disabled={isOperating || operatingJobId !== null}
                                    className="focus-ring inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-700 disabled:opacity-50"
                                  >
                                    {isOperating ? (
                                      <>
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Completing...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCheck className="h-3.5 w-3.5" /> Complete Job
                                      </>
                                    )}
                                  </button>
                                )}

                                {job.jobStatus === 'COMPLETED' && (
                                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    <CheckCheck className="h-4 w-4" /> Service Completed
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section 3: Segment 6 Worker Ratings & Customer Reviews */}
                <div className="space-y-6 border-t border-border pt-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
                        Segment 6 Feedback Engine
                      </span>
                      <h3 className="font-display text-2xl font-semibold text-primary">Ratings & Customer Reviews</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Transparent feedback submitted by customers after completed services.
                      </p>
                    </div>

                    <button
                      onClick={fetchWorkerRatings}
                      disabled={isLoadingWorkerRatings}
                      className="focus-ring p-2.5 rounded-2xl border border-border bg-background text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                      title="Refresh ratings"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingWorkerRatings ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-4 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white font-bold shadow-xs">
                        <Star className="h-6 w-6 fill-white" />
                      </div>
                      <div>
                        <div className="font-display text-3xl font-bold text-primary">
                          {workerRatingSummary?.averageRating ? workerRatingSummary.averageRating.toFixed(1) : '0.0'}
                          <span className="text-sm font-normal text-muted-foreground"> / 5.0</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Average Rating Score</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20 text-accent font-bold shadow-xs">
                        <UserCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-display text-3xl font-bold text-primary">
                          {workerRatingSummary?.totalRatings || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Total Customer Reviews</p>
                      </div>
                    </div>
                  </div>

                  {/* Reviews Feed */}
                  {isLoadingWorkerRatings ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="animate-pulse rounded-3xl border border-border bg-card p-6 space-y-3">
                          <div className="h-4 w-32 bg-muted rounded" />
                          <div className="h-6 w-1/2 bg-muted rounded" />
                        </div>
                      ))}
                    </div>
                  ) : workerRatings.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
                      <Star className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <h4 className="mt-3 font-display text-lg font-semibold text-primary">No reviews yet</h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Customer ratings and reviews will appear here as soon as customers rate your completed services.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {workerRatings.map((rating) => (
                        <div key={rating.id} className="rounded-3xl border border-border/80 bg-card p-6 transition-all hover:border-accent/40">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 rounded-xl bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                <span>{rating.score}.0</span>
                              </div>
                              <span className="text-xs font-semibold text-primary">{rating.customerName}</span>
                            </div>
                            <span className="font-mono text-[11px] text-muted-foreground">{formatDate(rating.createdAt)}</span>
                          </div>

                          {rating.review ? (
                            <p className="mt-3 text-xs text-primary leading-relaxed bg-background/50 p-3 rounded-2xl border border-border/50">
                              "{rating.review}"
                            </p>
                          ) : (
                            <p className="mt-2 text-[11px] italic text-muted-foreground">No written review provided.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 4: Available Service Requests Section (Segment 4 Matching Feed) */}
                <div className="space-y-6 border-t border-border pt-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
                        Segment 4 Matching Feed
                      </span>
                      <h3 className="font-display text-2xl font-semibold text-primary">Available Service Requests</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Service requests matching your categories and location.
                      </p>
                    </div>

                    <button
                      onClick={fetchWorkerJobs}
                      disabled={isLoadingJobs}
                      className="focus-ring p-2.5 rounded-2xl border border-border bg-background text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                      title="Refresh job feed"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingJobs ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {!workerProfile.available ? (
                    <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
                      <Power className="mx-auto h-8 w-8 text-amber-600 dark:text-amber-400" />
                      <h4 className="mt-3 font-display text-lg font-semibold text-amber-900 dark:text-amber-200">
                        You are currently marked as Unavailable
                      </h4>
                      <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-300/80">
                        Toggle your status to Available above to view and accept matching service requests.
                      </p>
                      <button
                        onClick={handleToggleAvailability}
                        className="mt-4 focus-ring inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs"
                      >
                        <Power className="h-3.5 w-3.5" /> Set Available
                      </button>
                    </div>
                  ) : isLoadingJobs ? (
                    <div className="grid gap-5 md:grid-cols-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="animate-pulse rounded-3xl border border-border bg-card p-6 space-y-4">
                          <div className="h-4 w-28 bg-muted rounded" />
                          <div className="h-6 w-3/4 bg-muted rounded" />
                          <div className="h-4 w-1/2 bg-muted rounded" />
                        </div>
                      ))}
                    </div>
                  ) : jobsError ? (
                    <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-8 text-center">
                      <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
                      <h4 className="mt-3 font-display text-lg font-semibold text-destructive">Failed to Load Job Feed</h4>
                      <p className="mt-1 text-xs text-destructive/80">{jobsError}</p>
                      <button
                        onClick={fetchWorkerJobs}
                        className="mt-4 focus-ring inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Try Again
                      </button>
                    </div>
                  ) : availableJobs.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center md:p-12">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <h4 className="mt-3 font-display text-xl font-semibold text-primary">
                        No matching service requests available right now
                      </h4>
                      <p className="mt-1.5 mx-auto max-w-md text-xs text-muted-foreground">
                        We'll show requests here as soon as households submit jobs matching your categories ({workerProfile.serviceCategories?.map(c => CATEGORY_LABELS[c]?.label || c).join(', ')}) and location ({workerProfile.serviceLocation || 'Any'}).
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-5 md:grid-cols-2">
                      {availableJobs.map((req) => {
                        const categoryInfo = CATEGORY_LABELS[req.category] || { label: req.category, description: '' };
                        const isAccepting = acceptingRequestId === req.id;

                        return (
                          <div
                            key={req.id}
                            className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 transition-all hover:border-accent/60 hover:shadow-lg"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="rounded-xl bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                                  {categoryInfo.label}
                                </span>
                                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  MATCHED
                                </span>
                              </div>

                              <p className="mt-4 text-sm font-medium text-primary line-clamp-2 leading-relaxed">
                                {req.description}
                              </p>

                              <p className="mt-2 text-xs text-muted-foreground">
                                Customer: <span className="font-semibold text-primary">{req.customerName}</span>
                              </p>
                            </div>

                            <div className="mt-6 border-t border-border/60 pt-4">
                              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5 truncate">
                                  <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" />
                                  <span className="truncate">{req.location}</span>
                                </div>
                                <div className="flex items-center gap-1.5 font-mono font-bold text-primary">
                                  <span className="text-accent">₹</span>
                                  <span>₹{req.budget.toLocaleString()}</span>
                                </div>
                                <div className="col-span-2 flex items-center gap-1.5 text-[11px]">
                                  <Calendar className="h-3.5 w-3.5 shrink-0 text-accent" />
                                  <span>Preferred: {formatDate(req.preferredTime)}</span>
                                </div>
                              </div>

                              <div className="mt-5 flex items-center justify-end gap-3 pt-2">
                                <button
                                  onClick={() => handleAcceptJob(req.id)}
                                  disabled={isAccepting || acceptingRequestId !== null}
                                  className="focus-ring inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-xs font-bold text-accent-foreground shadow-md transition-all hover:opacity-90 disabled:opacity-50"
                                >
                                  {isAccepting ? (
                                    <>
                                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Accepting...
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4" /> Accept Job
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Admin Dashboard view (Segment 9 Governance & Operations) */}
        {role === 'admin' && (
          <div className="mt-14 space-y-10">
            {/* Header & Tab Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6 md:p-8">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  Segment 9 Governance Layer
                </span>
                <h2 className="mt-1 font-display text-3xl font-semibold text-primary">Admin Operations & Platform Audit</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Platform oversight, user & worker account governance, operational monitoring, and server-derived activity logs.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchAdminData}
                  disabled={isLoadingAdminData}
                  className="focus-ring p-2.5 rounded-2xl border border-border bg-background text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                  title="Refresh admin data"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingAdminData ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Admin Operations Sub-Navigation Tabs */}
            <div className="flex overflow-x-auto items-center rounded-2xl border border-border bg-card p-1.5 text-xs gap-1">
              {(
                [
                  { key: 'overview', label: 'Overview & Stats', icon: TrendingUp },
                  { key: 'workers', label: `Workers (${adminWorkers.length})`, icon: Briefcase },
                  { key: 'users', label: `Users (${adminUsers.length})`, icon: UsersRound },
                  { key: 'requests', label: `Service Requests (${adminRequests.length})`, icon: Wrench },
                  { key: 'jobs', label: `Jobs (${adminJobs.length})`, icon: CheckCheck },
                  { key: 'ratings', label: `Ratings (${adminRatings.length})`, icon: Star },
                  { key: 'activity', label: `Audit Stream (${adminActivity.length})`, icon: Activity },
                ] as const
              ).map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setAdminTab(tab.key)}
                    className={`flex items-center gap-2 shrink-0 rounded-xl px-4 py-2.5 font-bold transition-all ${
                      adminTab === tab.key
                        ? 'bg-accent text-accent-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-primary hover:bg-background/50'
                    }`}
                  >
                    <TabIcon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: OVERVIEW & STATS */}
            {adminTab === 'overview' && (
              <div className="space-y-8 animate-rise-in">
                {/* Platform Overview Metrics */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center gap-4 rounded-3xl border border-accent/30 bg-accent/10 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground font-bold shadow-xs">
                      <UsersRound className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-display text-3xl font-bold text-primary">
                        {adminOverview?.totalUsers ?? adminUsers.length}
                      </div>
                      <p className="text-xs text-muted-foreground">Total Registered Users</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary font-bold shadow-xs">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-display text-3xl font-bold text-primary">
                        {adminOverview?.totalCustomers ?? 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Active Customers</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20 text-accent font-bold shadow-xs">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-display text-3xl font-bold text-primary">
                        {adminOverview?.totalWorkers ?? adminWorkers.length}
                      </div>
                      <p className="text-xs text-muted-foreground">Registered Workers</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white font-bold shadow-xs">
                      <Star className="h-6 w-6 fill-white" />
                    </div>
                    <div>
                      <div className="font-display text-3xl font-bold text-amber-600 dark:text-amber-400">
                        {adminOverview?.averageRating ? adminOverview.averageRating.toFixed(2) : '0.00'}
                      </div>
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Avg Platform Rating</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold shadow-xs">
                      <Wrench className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-display text-3xl font-bold text-primary">
                        {adminOverview?.totalServiceRequests ?? adminRequests.length}
                      </div>
                      <p className="text-xs text-muted-foreground">Total Service Requests</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold shadow-xs">
                      <CheckCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-display text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {adminOverview?.completedJobs ?? 0}
                      </div>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Completed Jobs</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold shadow-xs">
                      <Receipt className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-display text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{adminRevenueSummary?.totalPlatformFees ? adminRevenueSummary.totalPlatformFees.toFixed(2) : '0.00'}
                      </div>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Cooperative Fees (10%)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-3xl border border-accent/30 bg-accent/10 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground font-bold shadow-xs">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-display text-3xl font-bold text-primary">
                        ₹{adminRevenueSummary?.totalGrossRevenue ? adminRevenueSummary.totalGrossRevenue.toFixed(2) : '0.00'}
                      </div>
                      <p className="text-xs text-muted-foreground">Gross Transaction Volume</p>
                    </div>
                  </div>
                </div>

                {/* Cooperative Revenue Ledger Strip */}
                <div className="space-y-4 rounded-3xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-semibold text-primary">Platform Financial Ledger</h3>
                    <span className="font-mono text-xs font-bold text-accent">Segment 7 Financial Integration</span>
                  </div>
                  {adminEarningsLedger.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">No financial earnings recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {adminEarningsLedger.slice(0, 5).map((earning) => (
                        <div key={earning.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/60 p-3.5 text-xs">
                          <div>
                            <span className="font-mono font-bold text-accent">Job #{earning.jobId}</span> • <span className="font-semibold text-primary">{earning.customerName}</span> → <span className="font-semibold text-primary">{earning.workerName}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div>Gross: <span className="font-mono font-bold">₹{earning.grossAmount.toFixed(2)}</span></div>
                            <div className="text-emerald-600 dark:text-emerald-400 font-semibold">Coop Fee: <span className="font-mono font-bold">₹{earning.platformFee.toFixed(2)}</span></div>
                            <div>Worker Net: <span className="font-mono font-bold">₹{earning.workerEarning.toFixed(2)}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: WORKER MANAGEMENT & ACTIVATION/DEACTIVATION */}
            {adminTab === 'workers' && (
              <div className="space-y-6 animate-rise-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-primary">Worker Account Governance</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Inspect workers, verify skills/categories, and control platform eligibility via activation/deactivation.
                    </p>
                  </div>
                </div>

                {adminWorkers.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
                    <Briefcase className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <h4 className="mt-3 font-display text-lg font-semibold text-primary">No worker profiles found</h4>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {adminWorkers.map((worker) => {
                      const isOperating = operatingWorkerId === worker.workerId;
                      return (
                        <div
                          key={worker.profileId}
                          className={`flex flex-col justify-between rounded-3xl border p-6 transition-all ${
                            worker.active
                              ? 'border-border/80 bg-card hover:border-accent/40'
                              : 'border-destructive/30 bg-destructive/5'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-display text-lg font-semibold text-primary">{worker.name}</span>
                                  <span
                                    className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                                      worker.active
                                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        : 'border border-destructive/30 bg-destructive/10 text-destructive'
                                    }`}
                                  >
                                    {worker.active ? 'ACTIVE' : 'DEACTIVATED'}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{worker.email} • {worker.phone}</p>
                              </div>

                              {worker.averageRating > 0 ? (
                                <div className="flex items-center gap-1 rounded-xl bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                  <span>{worker.averageRating.toFixed(1)}</span>
                                  <span className="font-normal text-[10px] text-muted-foreground">({worker.totalRatings})</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground font-mono">No ratings</span>
                              )}
                            </div>

                            {/* Skills & Categories */}
                            <div className="mt-4 space-y-2 text-xs">
                              <div>
                                <span className="font-semibold text-muted-foreground">Categories: </span>
                                <span className="font-medium text-primary">
                                  {worker.serviceCategories?.map(c => CATEGORY_LABELS[c]?.label || c).join(', ') || 'None'}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-muted-foreground">Skills: </span>
                                <span className="font-medium text-primary">{worker.skills?.join(', ') || 'None'}</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                                <span>Rate: <strong className="text-primary font-mono">₹{worker.hourlyRate}/hr</strong></span>
                                <span>Location: <strong className="text-primary">{worker.serviceLocation || 'Any'}</strong></span>
                                <span>Availability: <strong className={worker.available ? 'text-emerald-600' : 'text-slate-500'}>{worker.available ? 'Available' : 'Unavailable'}</strong></span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="mt-6 border-t border-border/60 pt-4 flex items-center justify-between">
                            <span className="font-mono text-[10px] text-muted-foreground">Worker ID #{worker.workerId}</span>

                            {confirmToggleWorker?.workerId === worker.workerId ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-destructive">Confirm?</span>
                                <button
                                  onClick={() => handleToggleWorkerStatus(worker)}
                                  disabled={isOperating}
                                  className="focus-ring rounded-xl bg-destructive px-3 py-1.5 text-xs font-bold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
                                >
                                  {isOperating ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Yes, proceed'}
                                </button>
                                <button
                                  onClick={() => setConfirmToggleWorker(null)}
                                  className="focus-ring rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-primary"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : worker.active ? (
                              <button
                                onClick={() => setConfirmToggleWorker(worker)}
                                className="focus-ring inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-bold text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
                              >
                                <UserX className="h-3.5 w-3.5" /> Deactivate Worker
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleWorkerStatus(worker)}
                                disabled={isOperating}
                                className="focus-ring inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
                              >
                                {isOperating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />} Activate Worker
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: USERS LISTING */}
            {adminTab === 'users' && (
              <div className="space-y-4 animate-rise-in">
                <h3 className="font-display text-2xl font-semibold text-primary">Platform Registered Users</h3>
                <div className="rounded-3xl border border-border bg-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-background/80 border-b border-border font-mono text-[11px] font-bold text-muted-foreground uppercase">
                        <tr>
                          <th className="p-4">ID</th>
                          <th className="p-4">Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Role</th>
                          <th className="p-4">Account Status</th>
                          <th className="p-4">Registered Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {adminUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-background/40 transition-colors">
                            <td className="p-4 font-mono font-bold text-accent">#{u.id}</td>
                            <td className="p-4 font-semibold text-primary">{u.name}</td>
                            <td className="p-4 text-muted-foreground">{u.email}</td>
                            <td className="p-4">
                              <span className="rounded-full bg-accent/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-accent uppercase">
                                {u.role}
                              </span>
                            </td>
                            <td className="p-4">
                              <span
                                className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                                  u.active
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-destructive/10 text-destructive'
                                }`}
                              >
                                {u.active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="p-4 font-mono text-muted-foreground">{formatDate(u.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SERVICE REQUESTS MONITORING */}
            {adminTab === 'requests' && (
              <div className="space-y-4 animate-rise-in">
                <h3 className="font-display text-2xl font-semibold text-primary">Service Requests Monitoring</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {adminRequests.map((req) => (
                    <div key={req.id} className="rounded-3xl border border-border/80 bg-card p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-accent">Req #{req.id}</span>
                        <div className="flex items-center gap-2">
                          <span className="rounded-xl bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
                            {CATEGORY_LABELS[req.category]?.label || req.category}
                          </span>
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            {req.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-primary">{req.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground border-t border-border/60 pt-3">
                        <div>Customer: <strong className="text-primary">{req.customerName}</strong></div>
                        <div>Budget: <strong className="text-primary font-mono">₹{req.budget.toLocaleString()}</strong></div>
                        <div>Location: <strong className="text-primary">{req.location}</strong></div>
                        <div>Assigned: <strong className={req.assignedWorkerName ? 'text-emerald-600' : 'text-slate-400'}>{req.assignedWorkerName || 'Unassigned'}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: JOBS MONITORING */}
            {adminTab === 'jobs' && (
              <div className="space-y-4 animate-rise-in">
                <h3 className="font-display text-2xl font-semibold text-primary">Jobs Monitoring</h3>
                <div className="rounded-3xl border border-border bg-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-background/80 border-b border-border font-mono text-[11px] font-bold text-muted-foreground uppercase">
                        <tr>
                          <th className="p-4">Job ID</th>
                          <th className="p-4">Req ID</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4">Worker</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Accepted At</th>
                          <th className="p-4">Completed At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {adminJobs.map((j) => (
                          <tr key={j.id} className="hover:bg-background/40 transition-colors">
                            <td className="p-4 font-mono font-bold text-accent">#{j.id}</td>
                            <td className="p-4 font-mono text-muted-foreground">#{j.serviceRequestId}</td>
                            <td className="p-4 font-semibold text-primary">{j.customerName}</td>
                            <td className="p-4 font-semibold text-primary">{j.workerName}</td>
                            <td className="p-4">
                              <span
                                className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                                  j.status === 'COMPLETED'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : j.status === 'IN_PROGRESS'
                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {j.status}
                              </span>
                            </td>
                            <td className="p-4 font-mono text-muted-foreground">{formatDate(j.acceptedAt)}</td>
                            <td className="p-4 font-mono text-muted-foreground">{formatDate(j.completedAt) || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: RATINGS MONITORING */}
            {adminTab === 'ratings' && (
              <div className="space-y-4 animate-rise-in">
                <h3 className="font-display text-2xl font-semibold text-primary">Platform Ratings Monitoring</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {adminRatings.map((r) => (
                    <div key={r.id} className="rounded-3xl border border-border/80 bg-card p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 rounded-xl bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span>{r.score}.0</span>
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">Job #{r.jobId}</span>
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground">{formatDate(r.createdAt)}</span>
                      </div>
                      <p className="text-xs text-primary bg-background/50 p-3 rounded-2xl border border-border/50">
                        "{r.review || 'No written review'}"
                      </p>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span>By: <strong className="text-primary">{r.customerName}</strong></span>
                        <span>Worker: <strong className="text-primary">{r.workerName}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 7: ADMIN AUDIT STREAM */}
            {adminTab === 'activity' && (
              <div className="space-y-4 animate-rise-in">
                <h3 className="font-display text-2xl font-semibold text-primary">Administrative Activity Audit Log</h3>
                <div className="rounded-3xl border border-border bg-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-background/80 border-b border-border font-mono text-[11px] font-bold text-muted-foreground uppercase">
                        <tr>
                          <th className="p-4">Log ID</th>
                          <th className="p-4">Action</th>
                          <th className="p-4">Entity</th>
                          <th className="p-4">Description</th>
                          <th className="p-4">Actor Role</th>
                          <th className="p-4">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {adminActivity.map((act) => (
                          <tr key={act.id} className="hover:bg-background/40 transition-colors">
                            <td className="p-4 font-mono font-bold text-accent">#{act.id}</td>
                            <td className="p-4 font-bold text-primary">{act.actionType}</td>
                            <td className="p-4 font-mono text-muted-foreground">{act.entityType} #{act.entityId}</td>
                            <td className="p-4 text-primary">{act.description}</td>
                            <td className="p-4">
                              <span className="rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[10px] font-bold text-accent">
                                {act.actorRole}
                              </span>
                            </td>
                            <td className="p-4 font-mono text-muted-foreground">{formatDate(act.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Admin RBAC and Platform Metadata Footer */}
            <div className="grid gap-5 md:grid-cols-[1.4fr_.6fr] border-t border-border pt-10">
              <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">Journey map</p>
                    <h2 className="mt-2 font-display text-3xl font-semibold text-primary">Cooperative Stewardship</h2>
                  </div>
                  <Clock3 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="mt-8 space-y-3">
                  {content.steps.map((step, index) => {
                    const StepIcon = step.icon;
                    return (
                      <div
                        key={step.title}
                        className="group flex items-center gap-4 rounded-2xl border border-border/80 bg-background p-4 transition-colors hover:border-accent/60"
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            index === 1 ? 'bg-accent text-accent-foreground' : 'bg-secondary text-primary'
                          }`}
                        >
                          <StepIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-primary">{step.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{step.copy}</p>
                        </div>
                        <span className="ml-auto hidden font-mono text-[10px] text-muted-foreground sm:block">
                          0{index + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              <aside className="space-y-5">
                <div className="rounded-3xl bg-primary p-6 text-primary-foreground">
                  <div className="flex items-center gap-2 text-accent">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">Backend RBAC Ping</span>
                  </div>
                  {rbacPingQuery.isLoading ? (
                    <div className="mt-4 h-4 w-32 animate-pulse rounded bg-primary-foreground/20" />
                  ) : rbacPingQuery.isError ? (
                    <p className="mt-3 text-sm text-destructive font-semibold">RBAC ping failed: Access Denied.</p>
                  ) : (
                    <>
                      <p className="mt-4 font-display text-xl font-semibold leading-tight text-accent">
                        {rbacPingQuery.data?.message}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-primary-foreground/75">
                        Authorized API endpoint <code className="font-mono text-accent">/api/{role}/ping</code> verified with Bearer token.
                      </p>
                    </>
                  )}
                </div>

                <FoundationStatus />

                <div className="rounded-3xl border border-border bg-card p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <CheckCircle2 className="h-4 w-4 text-accent" /> Platform metadata
                  </div>
                  {platformQuery.isLoading ? (
                    <div className="mt-4 h-4 w-36 animate-pulse rounded bg-muted" />
                  ) : platformQuery.isError ? (
                    <p className="mt-3 text-sm text-destructive">Metadata unavailable right now.</p>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {platformQuery.data?.tagline ?? 'A foundation for local cooperative services.'}
                    </p>
                  )}
                </div>
              </aside>
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            Segment 7 Earnings & Cooperative Revenue Ledger active.
          </p>
          <Link
            to="/"
            data-testid="link-dashboard-home"
            className="focus-ring inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-accent"
          >
            Back to Home <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
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
      )}
    </PlatformShell>
  );
}