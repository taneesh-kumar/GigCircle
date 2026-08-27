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
  Tag,
  Power,
  Check,
  User,
  Lock,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import {
  acceptWorkerJobApi,
  getPlatformInfo,
  getServiceRequestsApi,
  getWorkerJobsApi,
  getWorkerProfileApi,
  pingRoleApi,
  toggleAvailabilityApi,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { PlatformShell } from '@/components/platform-shell';
import { FoundationStatus } from '@/components/status-panel';
import { CreateRequestModal } from '@/components/create-request-modal';
import { RequestDetailModal } from '@/components/request-detail-modal';
import { WorkerProfileModal } from '@/components/worker-profile-modal';
import { CATEGORY_LABELS, type ServiceRequest, type ServiceRequestStatus } from '@/types/service-request';
import type { WorkerProfile } from '@/types/worker-profile';
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
    eyebrow: 'Customer Dashboard · Service Request & Assignment Active',
    title: 'A clearer way to ask for help.',
    intro: 'Describe what your household needs, set your budget and schedule, and track assigned workers in real-time.',
    accent: 'bg-secondary',
    textColor: 'text-secondary-foreground',
    icon: House,
    stat: '01',
    statLabel: 'authenticated customer',
    steps: [
      { title: 'Create service request', copy: 'Submit plumbing, electrical, cleaning, and home repair needs.', icon: Wrench },
      { title: 'Persisted & verified', copy: 'Your requests are stored securely with ownership tracking.', icon: ShieldCheck },
      { title: 'Manage & track', copy: 'Inspect details, track assigned workers, or cancel unassigned requests.', icon: BellRing },
    ],
  },
  worker: {
    eyebrow: 'Worker Dashboard · Profile & Job Feed Active',
    title: 'Good work should find good people.',
    intro: 'Manage your skills and availability, view eligible local household requests, and accept jobs in real-time.',
    accent: 'bg-accent',
    textColor: 'text-accent-foreground',
    icon: HandHeart,
    stat: '02',
    statLabel: 'authenticated worker',
    steps: [
      { title: 'Build worker profile', copy: 'Set your experience, skills, and service categories.', icon: Briefcase },
      { title: 'Matching job feed', copy: 'View eligible service requests matching your categories and location.', icon: MapPin },
      { title: 'Accept & work', copy: 'Accept open jobs with one click and get assigned.', icon: CheckCircle2 },
    ],
  },
  admin: {
    eyebrow: 'Cooperative Dashboard · Segment 1 Active',
    title: 'Make the work visible.',
    intro: 'An oversight view for platform stewards — grounded in participation, transparency, and cooperative trust.',
    accent: 'bg-primary',
    textColor: 'text-primary-foreground',
    icon: ShieldCheck,
    stat: '03',
    statLabel: 'authenticated admin',
    steps: [
      { title: 'See the network breathe', copy: 'A living view of local activity and participation.', icon: UsersRound },
      { title: 'Keep standards clear', copy: 'Shared signals for trust, quality, and care.', icon: ShieldCheck },
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

  // Customer State (Segment 2 & 4)
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(role === 'customer');
  const [requestError, setRequestError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | ServiceRequestStatus>('ALL');

  // Customer Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Worker Profile State (Segment 3)
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(role === 'worker');
  const [profileNotFound, setProfileNotFound] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);

  // Worker Job Feed State (Segment 4)
  const [availableJobs, setAvailableJobs] = useState<ServiceRequest[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(role === 'worker');
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [acceptingRequestId, setAcceptingRequestId] = useState<number | null>(null);

  const fetchCustomerRequests = async () => {
    if (role !== 'customer') return;
    setIsLoadingRequests(true);
    setRequestError(null);
    try {
      const data = await getServiceRequestsApi();
      setRequests(data);
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
      const jobs = await getWorkerJobsApi();
      setAvailableJobs(jobs);
    } catch (err: any) {
      setJobsError(err?.response?.data?.message || 'Failed to load eligible service requests.');
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (role === 'customer') {
      fetchCustomerRequests();
    } else if (role === 'worker') {
      fetchWorkerProfile();
      fetchWorkerJobs();
    }
  }, [role]);

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
        description: `You have successfully accepted the ${response.category} job.`,
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

  const formatDate = (isoStr: string) => {
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
          <button
            onClick={handleLogout}
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-destructive transition-colors hover:border-destructive/40 hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
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

        {/* Customer Functional Workflow (Segment 2 & 4) */}
        {role === 'customer' && (
          <div className="mt-14 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6 md:p-8">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  PostgreSQL Persisted
                </span>
                <h2 className="mt-1 font-display text-3xl font-semibold text-primary">My Service Requests</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Track request assignments, inspect details, or cancel unassigned requests.
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
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                <User className="h-3 w-3" /> Assigned
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

                        {/* Assigned Worker Badge */}
                        {isAssigned && req.workerName && (
                          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-xs">
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">Worker:</span>
                            <span className="font-bold text-primary">{req.workerName}</span>
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

                          {isOpenStatus && !isAssigned && (
                            <button
                              onClick={() => handleOpenDetail(req)}
                              className="focus-ring inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-bold text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
                            >
                              <Ban className="h-3.5 w-3.5" /> Cancel
                            </button>
                          )}

                          {isOpenStatus && isAssigned && (
                            <span
                              className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted px-3 py-1.5 text-[11px] font-semibold text-muted-foreground"
                              title="Assigned service requests cannot be cancelled"
                            >
                              <Lock className="h-3 w-3" /> Cancellation Locked
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
        )}

        {/* Worker Functional Workflow (Segment 3 & 4) */}
        {role === 'worker' && (
          <div className="mt-14 space-y-10">
            {/* Worker Profile Overview Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6 md:p-8">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  Worker Operations
                </span>
                <h2 className="mt-1 font-display text-3xl font-semibold text-primary">Profile & Job Matching</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your skills, toggle availability, and accept matching household requests.
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

                {/* Available Service Requests Section (Segment 4 Matching Feed) */}
                <div className="space-y-6">
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

        {/* Admin Dashboard view (Segment 1 intact) */}
        {role === 'admin' && (
          <div className="mt-14 grid gap-5 md:grid-cols-[1.4fr_.6fr]">
            <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">Journey map</p>
                  <h2 className="mt-2 font-display text-3xl font-semibold text-primary">Future feature workflow</h2>
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
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            Segment 4 Worker Matching & Job Acceptance System active.
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