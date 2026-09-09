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
  QrCode,
  CreditCard,
  Banknote,
  RotateCcw,
  XCircle,
  Loader2,
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
  declineWorkerJobApi,
  deactivateWorkerApi,
  activateUserApi,
  deactivateUserApi,
  suspendUserApi,
  reactivateUserApi,
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
  markAllAdminNotificationsReadApi,
  getAdminPaymentsApi,
  getAdminPaymentSummaryApi,
  getServiceDemandApi,
  getOperationalAlertsApi,
  getCustomerPaymentsApi,
  refundPaymentApi,
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
import { PaymentModal } from '@/components/payment-modal';
import { CustomerPaymentHistoryModal } from '@/components/customer-payment-history-modal';
import { WorkerVerificationSection } from '@/components/worker-verification-section';
import { AdminVerificationSection } from '@/components/admin-verification-section';
import { VerifiedWorkerBadge } from '@/components/verified-worker-badge';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { DisputeCreateForm } from '@/components/dispute/DisputeCreateForm';
import { DisputeDetailPanel } from '@/components/dispute/DisputeDetailPanel';
import { AdminDisputeControls } from '@/components/dispute/AdminDisputeControls';
import { getDisputeForJobApi } from '@/services/api/dispute';
import type { DisputeDetailResponse } from '@/types/dispute';


import { CATEGORY_LABELS, type ServiceRequest } from '@/types/service-request';
import type { WorkerProfile } from '@/types/worker-profile';
import type { JobResponse } from '@/types/worker-job';
import type { Rating, WorkerRatingSummary } from '@/types/rating';
import type { Earning, PlatformRevenueSummary, WorkerEarningsSummary } from '@/types/earning';
import type { PaymentResponse, AdminPaymentSummary } from '@/types/payment';
import type {
  AdminActivity,
  AdminFinancialSummary,
  AdminFinancialTransaction,
  AdminFinancialTransactionDetail,
  AdminJob,
  AdminRating,
  AdminServiceRequest,
  AdminUser,
  AdminWorker,
  OperationalAlertResponse,
  PlatformOverviewSummary,
  ServiceDemandResponse,
} from '@/types/admin';
import { AdminUserDetailModal } from '@/components/admin-user-detail-modal';
import { AdminFinancialDetailModal } from '@/components/admin-financial-detail-modal';
import {
  getFinancialSummaryApi,
  getFinancialTransactionsApi,
  getFinancialTransactionDetailApi,
} from '@/services/api/admin';
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

  // Customer Payment Simulation State
  const [paymentJobId, setPaymentJobId] = useState<number | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] = useState(false);
  const [customerPayments, setCustomerPayments] = useState<PaymentResponse[]>([]);
  const [isLoadingCustomerPayments, setIsLoadingCustomerPayments] = useState(false);
  const [customerPaymentsError, setCustomerPaymentsError] = useState<string | null>(null);
  const [refundingPaymentId, setRefundingPaymentId] = useState<number | null>(null);

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
  const [assignedFilterStatus, setAssignedFilterStatus] = useState<'ALL' | 'ACCEPTED' | 'IN_PROGRESS' | 'PAYMENT_REQUIRED' | 'COMPLETED'>('ALL');

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
  const [adminUserSearch, setAdminUserSearch] = useState<string>('');
  const [adminUserStatusFilter, setAdminUserStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'>('ALL');
  const [adminUserPage, setAdminUserPage] = useState<number>(0);
  const [adminUserTotalElements, setAdminUserTotalElements] = useState<number>(0);
  const [adminUserTotalPages, setAdminUserTotalPages] = useState<number>(1);
  const [selectedDetailUserId, setSelectedDetailUserId] = useState<number | null>(null);

  // Status Action Modal State
  const [statusModalUser, setStatusModalUser] = useState<AdminUser | null>(null);
  const [statusModalAction, setStatusModalAction] = useState<'suspend' | 'deactivate' | null>(null);
  const [statusModalReason, setStatusModalReason] = useState<string>('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState<boolean>(false);

  const [adminWorkers, setAdminWorkers] = useState<AdminWorker[]>([]);
  const [adminRequests, setAdminRequests] = useState<AdminServiceRequest[]>([]);
  const [adminJobs, setAdminJobs] = useState<AdminJob[]>([]);
  const [adminRatings, setAdminRatings] = useState<AdminRating[]>([]);
  const [adminActivity, setAdminActivity] = useState<AdminActivity[]>([]);
  const [adminPayments, setAdminPayments] = useState<PaymentResponse[]>([]);
  const [adminPaymentSummary, setAdminPaymentSummary] = useState<AdminPaymentSummary | null>(null);
  const [serviceDemand, setServiceDemand] = useState<ServiceDemandResponse[]>([]);
  const [operationalAlerts, setOperationalAlerts] = useState<OperationalAlertResponse[]>([]);
  const [adminJobStatusFilter, setAdminJobStatusFilter] = useState<string>('ALL');
  const [isLoadingAdminData, setIsLoadingAdminData] = useState<boolean>(role === 'admin');
  const [adminUserFilter, setAdminUserFilter] = useState<'ALL' | 'CUSTOMER' | 'WORKER' | 'ADMIN'>('ALL');
  const [adminNotifFilter, setAdminNotifFilter] = useState<'all' | 'unread' | 'alerts'>('all');
  const [operatingWorkerId, setOperatingWorkerId] = useState<number | null>(null);

  // Phase 4: Financial Audit & Detail State
  const [financialSummary, setFinancialSummary] = useState<AdminFinancialSummary | null>(null);
  const [financialTransactions, setFinancialTransactions] = useState<AdminFinancialTransaction[]>([]);
  const [financialPage, setFinancialPage] = useState<number>(0);
  const [financialTotalPages, setFinancialTotalPages] = useState<number>(0);
  const [financialTotalElements, setFinancialTotalElements] = useState<number>(0);
  const [financialStatusFilter, setFinancialStatusFilter] = useState<string>('ALL');
  const [financialSearch, setFinancialSearch] = useState<string>('');
  const [financialFromDate, setFinancialFromDate] = useState<string>('');
  const [financialToDate, setFinancialToDate] = useState<string>('');
  const [selectedFinancialTxnId, setSelectedFinancialTxnId] = useState<number | null>(null);
  const [isLoadingFinancial, setIsLoadingFinancial] = useState<boolean>(false);
  const [financialError, setFinancialError] = useState<string | null>(null);

  // Phase 4: Audit Activity Pagination & Filtering State
  const [activityPage, setActivityPage] = useState<number>(0);
  const [activityTotalPages, setActivityTotalPages] = useState<number>(0);
  const [activityTotalElements, setActivityTotalElements] = useState<number>(0);
  const [activityActionTypeFilter, setActivityActionTypeFilter] = useState<string>('ALL');
  const [activitySearch, setActivitySearch] = useState<string>('');
  const [activityFromDate, setActivityFromDate] = useState<string>('');
  const [activityToDate, setActivityToDate] = useState<string>('');


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

  const fetchCustomerPayments = async () => {
    if (role !== 'customer') return;
    setIsLoadingCustomerPayments(true);
    setCustomerPaymentsError(null);
    try {
      const data = await getCustomerPaymentsApi();
      setCustomerPayments(data);
    } catch (err: any) {
      setCustomerPaymentsError(err?.response?.data?.message || 'Failed to load payment history.');
    } finally {
      setIsLoadingCustomerPayments(false);
    }
  };

  const handleCustomerRefund = async (paymentId: number) => {
    setRefundingPaymentId(paymentId);
    try {
      const updated = await refundPaymentApi(paymentId);
      toast({
        title: 'Simulated Refund Processed',
        description: `Simulated refund of ₹${updated.refundAmount} initiated.`,
      });
      fetchCustomerPayments();
    } catch (err: any) {
      toast({
        title: 'Refund Failed',
        description: err?.response?.data?.message || 'Failed to process refund.',
        variant: 'destructive',
      });
    } finally {
      setRefundingPaymentId(null);
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
      setWorkerEarnings(earningsList || []);
      setWorkerEarningsSummary(summary || null);
    } catch (err: any) {
      console.warn('Unable to load worker earnings ledger:', err?.message);
      setWorkerEarnings([]);
      setWorkerEarningsSummary({
        workerId: 0,
        totalGross: 0,
        totalPlatformFees: 0,
        totalWorkerEarnings: 0,
        availableEarnings: 0,
        totalJobs: 0,
      });
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

  const fetchAdminUsers = async (page: number = adminUserPage) => {
    if (role !== 'admin') return;
    try {
      const userRes = await getAdminUsersApi({
        role: adminUserFilter === 'ALL' ? undefined : adminUserFilter,
        status: adminUserStatusFilter === 'ALL' ? undefined : adminUserStatusFilter,
        search: adminUserSearch.trim() || undefined,
        page,
        size: 10,
      });
      setAdminUsers(userRes.content);
      setAdminUserPage(userRes.page);
      setAdminUserTotalElements(userRes.totalElements);
      setAdminUserTotalPages(userRes.totalPages);
    } catch (err: any) {
      console.error('Failed to fetch admin users:', err);
    }
  };

  const fetchFinancialData = async (page: number = financialPage) => {
    if (role !== 'admin') return;
    setIsLoadingFinancial(true);
    setFinancialError(null);
    try {
      const [summary, txnsRes] = await Promise.all([
        getFinancialSummaryApi(
          financialFromDate.trim() || undefined,
          financialToDate.trim() || undefined
        ),
        getFinancialTransactionsApi({
          page,
          size: 15,
          status: financialStatusFilter === 'ALL' ? undefined : financialStatusFilter,
          search: financialSearch.trim() || undefined,
          from: financialFromDate.trim() || undefined,
          to: financialToDate.trim() || undefined,
        }),
      ]);
      setFinancialSummary(summary);
      setFinancialTransactions(txnsRes.content);
      setFinancialPage(txnsRes.page);
      setFinancialTotalPages(txnsRes.totalPages);
      setFinancialTotalElements(txnsRes.totalElements);
    } catch (err: any) {
      setFinancialError(err?.response?.data?.message || 'Failed to load financial audit data.');
    } finally {
      setIsLoadingFinancial(false);
    }
  };

  const fetchAdminActivity = async (page: number = activityPage) => {
    if (role !== 'admin') return;
    try {
      const activityRes = await getAdminActivityApi({
        page,
        size: 15,
        actionType: activityActionTypeFilter === 'ALL' ? undefined : activityActionTypeFilter,
        search: activitySearch.trim() || undefined,
        from: activityFromDate.trim() || undefined,
        to: activityToDate.trim() || undefined,
      });
      setAdminActivity(activityRes.content);
      setActivityPage(activityRes.page);
      setActivityTotalPages(activityRes.totalPages);
      setActivityTotalElements(activityRes.totalElements);
    } catch (err) {
      console.error('Failed to fetch audit activity:', err);
    }
  };

  const fetchAdminData = async () => {
    if (role !== 'admin') return;
    setIsLoadingAdminData(true);
    try {
      const [overview, userRes, workers, reqs, jobs, ratings, activityRes, revenueSummary, revenueLedger, payments, paymentSummary, demand, alerts] = await Promise.all([
        getAdminOverviewApi(),
        getAdminUsersApi({
          role: adminUserFilter === 'ALL' ? undefined : adminUserFilter,
          status: adminUserStatusFilter === 'ALL' ? undefined : adminUserStatusFilter,
          search: adminUserSearch.trim() || undefined,
          page: adminUserPage,
          size: 10,
        }),
        getAdminWorkersApi(),
        getAdminServiceRequestsApi(),
        getAdminJobsApi(adminJobStatusFilter === 'ALL' ? undefined : adminJobStatusFilter),
        getAdminRatingsApi(),
        getAdminActivityApi({ page: 0, size: 15 }),
        getAdminRevenueSummaryApi(),
        getAdminEarningsApi(),
        getAdminPaymentsApi(),

        getAdminPaymentSummaryApi(),
        getServiceDemandApi(),
        getOperationalAlertsApi(),
      ]);
      setAdminOverview(overview);
      setAdminUsers(userRes.content);
      setAdminUserPage(userRes.page);
      setAdminUserTotalElements(userRes.totalElements);
      setAdminUserTotalPages(userRes.totalPages);
      setAdminWorkers(workers);
      setAdminRequests(reqs);
      setAdminJobs(jobs);
      setAdminRatings(ratings);
      setAdminActivity(activityRes.content);
      setActivityPage(activityRes.page);
      setActivityTotalPages(activityRes.totalPages);
      setActivityTotalElements(activityRes.totalElements);
      setAdminRevenueSummary(revenueSummary);
      setAdminEarningsLedger(revenueLedger);
      setAdminPayments(payments);
      setAdminPaymentSummary(paymentSummary);
      setServiceDemand(demand);
      setOperationalAlerts(alerts);

      fetchFinancialData(0);

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
      fetchCustomerPayments();
    } else if (role === 'worker') {
      fetchWorkerProfile();
      fetchWorkerJobs();
      fetchWorkerRatings();
      fetchWorkerEarnings();
    } else if (role === 'admin') {
      fetchAdminData();
    }
  }, [role]);

  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotificationsPage();
    } else if (activeTab === 'earnings' && role === 'worker') {
      fetchWorkerEarnings();
    } else if (activeTab === 'payments' && role === 'customer') {
      fetchCustomerPayments();
    }

    const handleSync = () => {
      fetchNotificationsPage();
      if (role === 'customer') {
        fetchCustomerRequests();
        fetchCustomerPayments();
      }
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
    if (!workerProfile) {
      setIsProfileModalOpen(true);
      toast({
        title: 'Profile Required',
        description: 'Please set up your worker profile to manage availability.',
      });
      return;
    }
    if (isTogglingAvailability) return;
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
    if (!workerProfile) {
      setIsProfileModalOpen(true);
      toast({
        title: 'Profile Required',
        description: 'Please complete your worker profile setup before accepting jobs.',
        variant: 'destructive',
      });
      return;
    }
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
        title: 'Completion Requested',
        description: `Job completion requested! Customer needs to complete payment before this job is marked as completed.`,
      });
      setAssignedJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)));
      window.dispatchEvent(new CustomEvent('gigcircle-notifications-updated'));
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to request job completion.';
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

  const handleDeclineJob = async (jobId: number) => {
    if (operatingJobId !== null) return;
    setOperatingJobId(jobId);
    try {
      await declineWorkerJobApi(jobId);
      toast({
        title: 'Job Declined',
        description: 'You have declined this job assignment. It is now open to other workers.',
      });
      setAssignedJobs((prev) => prev.filter((j) => j.id !== jobId));
      fetchWorkerJobs();
      window.dispatchEvent(new CustomEvent('gigcircle-notifications-updated'));
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to decline job.';
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

  const displayUsers = activeTab === 'overview' ? filteredAdminUsers.slice(0, 5) : filteredAdminUsers;
  const displayWorkers = activeTab === 'overview' ? adminWorkers.slice(0, 5) : adminWorkers;
  const displayRequests = activeTab === 'overview' ? adminRequests.slice(0, 5) : adminRequests;
  const displayJobs = activeTab === 'overview' ? adminJobs.slice(0, 5) : adminJobs;
  const displayRatings = activeTab === 'overview' ? adminRatings.slice(0, 5) : adminRatings;
  const displayActivity = activeTab === 'overview' ? adminActivity.slice(0, 5) : adminActivity;

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

  const getAdminNotifIcon = (type: string) => {
    switch (type) {
      case 'NEW_WORKER_REGISTERED':
        return (
          <div className="h-9 w-9 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shrink-0 shadow-3xs">
            <Sprout className="h-4.5 w-4.5" />
          </div>
        );
      case 'SERVICE_REQUEST_CANCELLED':
        return (
          <div className="h-9 w-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0 shadow-3xs">
            <AlertCircle className="h-4.5 w-4.5" />
          </div>
        );
      case 'WORKER_DECLINED_JOB':
        return (
          <div className="h-9 w-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0 shadow-3xs">
            <Ban className="h-4.5 w-4.5" />
          </div>
        );
      case 'LOW_WORKER_RATING':
        return (
          <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0 shadow-3xs">
            <Star className="h-4.5 w-4.5 fill-amber-400 text-amber-400" />
          </div>
        );
      case 'LEDGER_ERROR':
        return (
          <div className="h-9 w-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0 animate-pulse shadow-3xs">
            <ShieldAlert className="h-4.5 w-4.5" />
          </div>
        );
      case 'SYSTEM_ERROR':
        return (
          <div className="h-9 w-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-3xs">
            <AlertCircle className="h-4.5 w-4.5" />
          </div>
        );
      default:
        return (
          <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 shadow-3xs">
            <Bell className="h-4.5 w-4.5" />
          </div>
        );
    }
  };

  const renderNotificationsView = () => {
    if (role === 'admin') {
      const filtered = notificationsList.filter((n) => {
        if (adminNotifFilter === 'unread') return !n.read;
        if (adminNotifFilter === 'alerts') return n.type === 'SYSTEM_ERROR' || n.type === 'LEDGER_ERROR';
        return true;
      });

      return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Cooperative Operations Alerts</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Monitor system exceptions and operation notifications</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs">
                {(['all', 'unread', 'alerts'] as const).map((filterOpt) => (
                  <button
                    key={filterOpt}
                    type="button"
                    onClick={() => setAdminNotifFilter(filterOpt)}
                    className={`rounded-lg px-3.5 py-1.5 font-extrabold uppercase tracking-wider transition-all ${
                      adminNotifFilter === filterOpt
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {filterOpt}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await markAllAdminNotificationsReadApi();
                    setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
                    window.dispatchEvent(new CustomEvent('gigcircle-notifications-updated'));
                    toast({ title: 'Marked all read', description: 'All admin alerts marked as read.' });
                  } catch {
                    // Fallback
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
              >
                <CheckCheck className="h-4 w-4" /> Mark all read
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden divide-y divide-slate-100">
            {isLoadingNotifications ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading alerts...</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Bell className="mx-auto h-8 w-8 text-slate-300" />
                <p className="text-sm font-bold text-slate-800">No alerts found</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">There are no operational events matching the selected filter.</p>
              </div>
            ) : (
              filtered.map((n) => {
                const isCritical = n.type === 'LEDGER_ERROR';
                const isHigh = n.type === 'SYSTEM_ERROR';
                const priority = isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'MEDIUM';

                return (
                  <div
                    key={n.id}
                    onClick={async () => {
                      if (!n.read) {
                        try {
                          await markAdminNotificationReadApi(n.id);
                          setNotificationsList((prev) =>
                            prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
                          );
                          window.dispatchEvent(new CustomEvent('gigcircle-notifications-updated'));
                        } catch {
                          // Fallback
                        }
                      }
                      
                      if (n.relatedEntityType === 'USER') {
                        setSearchParams({ tab: 'workers' });
                      } else if (n.relatedEntityType === 'SERVICE_REQUEST') {
                        setSearchParams({ tab: 'requests' });
                      } else if (n.relatedEntityType === 'JOB') {
                        setSearchParams({ tab: 'jobs' });
                      } else if (n.type === 'SYSTEM_ERROR') {
                        setSearchParams({ tab: 'activity' });
                      }
                    }}
                    className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors cursor-pointer ${
                      !n.read ? 'bg-slate-50/40 border-l-2 border-l-emerald-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {getAdminNotifIcon(n.type)}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <p className={`text-sm font-black tracking-tight ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                            {n.title}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider border ${
                              isCritical
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : isHigh
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {priority}
                          </span>
                          {!n.read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">{n.message}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0 self-end sm:self-center">
                      <span className="font-mono text-[10px] font-semibold text-slate-400 whitespace-nowrap">
                        {formatNotificationTime(n.createdAt)}
                      </span>
                      <button
                        type="button"
                        className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-3xs"
                      >
                        Action →
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
    }

    return (
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
  };

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
                                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                                      <User className="h-3.5 w-3.5 text-slate-400" /> Assigned Worker: <strong className="text-slate-800 font-semibold">{req.workerName}</strong>
                                      <VerifiedWorkerBadge isVerified={req.isWorkerVerified || req.isVerified} size="sm" />
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
                        onClick={() => setIsPaymentHistoryModalOpen(true)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                      >
                        <Receipt className="h-4 w-4 text-emerald-600" /> Payment History
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
                              : statusStr === 'PAYMENT_REQUIRED'
                              ? 3.5
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
                                        : statusStr === 'PAYMENT_REQUIRED'
                                        ? 'bg-amber-100 border border-amber-300 text-amber-900 font-black'
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
                                    ) : statusStr === 'PAYMENT_REQUIRED' ? (
                                      <IndianRupee className="h-3 w-3 text-amber-700" />
                                    ) : statusStr === 'IN_PROGRESS' ? (
                                      <Activity className="h-3 w-3 text-blue-600 animate-pulse" />
                                    ) : (
                                      <Clock3 className="h-3 w-3 text-amber-600" />
                                    )}
                                    {statusStr === 'PAYMENT_REQUIRED' ? 'PAYMENT REQUIRED' : statusStr}
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
                                            : currentStage === 3.5
                                            ? 'w-5/6 bg-gradient-to-r from-amber-500 to-emerald-500'
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

                              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDetail(req)}
                                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-slate-400" /> View Details
                                  </button>

                                  {req.jobId && statusStr === 'PAYMENT_REQUIRED' ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPaymentJobId(req.jobId!);
                                        setIsPaymentModalOpen(true);
                                      }}
                                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-black shadow-md transition-all inline-flex items-center gap-1.5 animate-pulse"
                                    >
                                      <IndianRupee className="h-4 w-4 text-emerald-200" /> Pay Now (₹{req.budget.toLocaleString()})
                                    </button>
                                  ) : req.jobId && statusStr === 'COMPLETED' ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPaymentJobId(req.jobId!);
                                        setIsPaymentModalOpen(true);
                                      }}
                                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                                    >
                                      <Receipt className="h-3.5 w-3.5 text-emerald-600" /> View Receipt
                                    </button>
                                  ) : null}
                                </div>
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
                                      className="rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all inline-flex items-center gap-1.5"
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

            {/* TAB: PAYMENTS */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">Payment Receipts & History</h2>
                        <p className="text-xs text-slate-500">Track simulated payments and cooperative service invoices</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsPaymentHistoryModalOpen(true)}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
                    >
                      Open Receipts Manager
                    </button>
                  </div>

                  {isLoadingCustomerPayments ? (
                    <div className="py-12 text-center space-y-3">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-500">Loading your transactions...</p>
                    </div>
                  ) : customerPaymentsError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
                      {customerPaymentsError}
                    </div>
                  ) : customerPayments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center space-y-3">
                      <Receipt className="mx-auto h-8 w-8 text-slate-400" />
                      <p className="text-sm font-bold text-slate-800">No payment records found</p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Payments made for completed or assigned service jobs will appear here with transparent transaction receipts.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {customerPayments.map((p) => {
                        const categoryLabel = p.serviceCategory ? CATEGORY_LABELS[p.serviceCategory]?.label : 'Service';
                        return (
                          <div
                            key={p.id}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-all space-y-3"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-display text-sm font-black text-slate-900">
                                    {categoryLabel}
                                  </span>
                                  <span className="font-mono text-[11px] font-bold text-slate-400">
                                    • Job #{p.jobId}
                                  </span>
                                </div>
                                <p className="font-mono text-xs text-slate-500 mt-0.5 font-semibold">
                                  Txn: {p.transactionReference}
                                </p>
                              </div>

                              <div className="text-right">
                                <span className="font-display text-base font-black text-slate-900">
                                  ₹{p.amount.toFixed(2)}
                                </span>
                                <div>
                                  {p.status === 'SUCCESS' ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200">
                                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                      Paid
                                    </span>
                                  ) : p.status === 'REFUNDED' ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-extrabold text-purple-700 border border-purple-200">
                                      <RotateCcw className="h-3 w-3 text-purple-600" />
                                      Refunded
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-extrabold text-red-700 border border-red-200">
                                      <XCircle className="h-3 w-3 text-red-600" />
                                      {p.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500 font-medium">
                              <div className="flex items-center gap-2">
                                {p.paymentMethod === 'UPI' ? (
                                  <QrCode className="h-3.5 w-3.5 text-emerald-600" />
                                ) : p.paymentMethod === 'CARD' ? (
                                  <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                                )}
                                <span>{p.paymentMethodDetails || p.paymentMethod}</span>
                              </div>

                              {p.status === 'SUCCESS' && (
                                <button
                                  type="button"
                                  onClick={() => handleCustomerRefund(p.id)}
                                  disabled={refundingPaymentId === p.id}
                                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                                >
                                  {refundingPaymentId === p.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RotateCcw className="h-3 w-3" />
                                  )}
                                  Simulate Refund
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
                          onClick={() => {
                            fetchWorkerProfile();
                            fetchWorkerJobs();
                            fetchWorkerRatings();
                            fetchWorkerEarnings();
                            toast({
                              title: 'Dashboard Refreshed',
                              description: 'Worker profile, jobs, and earnings updated.',
                            });
                          }}
                          disabled={isLoadingProfile || isLoadingJobs || isLoadingWorkerEarnings}
                          className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
                          title="Refresh worker workspace"
                        >
                          <RefreshCw className={`h-4 w-4 ${(isLoadingProfile || isLoadingJobs || isLoadingWorkerEarnings) ? 'animate-spin' : ''}`} />
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
                  <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 p-5 shadow-xs flex flex-col justify-between h-36 hover:shadow-md hover:border-emerald-300 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 leading-tight">Available Jobs</span>
                      <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Briefcase className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 select-none leading-none">
                        {availableJobs.length}
                      </div>
                      <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100/70 rounded-full px-2.5 py-0.5">
                        Matching Skills
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 p-5 shadow-xs flex flex-col justify-between h-36 hover:shadow-md hover:border-blue-300 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 leading-tight">Assigned Jobs</span>
                      <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Clock3 className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 select-none leading-none">
                        {assignedJobs.length}
                      </div>
                      <span className="inline-block text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100/70 rounded-full px-2.5 py-0.5">
                        Active Execution
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-teal-200/90 bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/40 p-5 shadow-xs flex flex-col justify-between h-36 hover:shadow-md hover:border-teal-300 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 leading-tight">Completed Jobs</span>
                      <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <CheckCheck className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 select-none leading-none">
                        {workerEarningsSummary?.totalJobs || assignedJobs.filter((j) => j.jobStatus === 'COMPLETED').length}
                      </div>
                      <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100/70 rounded-full px-2.5 py-0.5">
                        Verified Work
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-100/60 via-white to-emerald-50/80 p-5 shadow-xs flex flex-col justify-between h-36 hover:shadow-md hover:border-emerald-400 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-800 leading-tight">Ledger Balance</span>
                      <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <IndianRupee className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-xl sm:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-teal-700 select-none leading-none">
                        ₹{workerEarningsSummary?.totalWorkerEarnings?.toFixed(2) || '0.00'}
                      </div>
                      <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/50 rounded-full px-2.5 py-0.5">
                        Net 90% Payout
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 p-5 shadow-xs flex flex-col justify-between h-36 hover:shadow-md hover:border-amber-300 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 leading-tight">Average Rating</span>
                      <div className="h-9 w-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Star className="h-4.5 w-4.5 fill-white text-white" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-500 select-none leading-none">
                        {workerRatingSummary?.averageRating ? workerRatingSummary.averageRating.toFixed(1) : '5.0'}
                      </div>
                      <span className="inline-block text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100/70 rounded-full px-2.5 py-0.5">
                        ({workerRatingSummary?.totalRatings || 0} reviews)
                      </span>
                    </div>
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
                        {(['ALL', 'ACCEPTED', 'IN_PROGRESS', 'PAYMENT_REQUIRED', 'COMPLETED'] as const).map((st) => (
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
                            {st === 'PAYMENT_REQUIRED' ? 'AWAITING PAYMENT' : st}
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
                        const isPaymentRequired = job.jobStatus === 'PAYMENT_REQUIRED';
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
                                      : isPaymentRequired
                                      ? 'bg-amber-100/90 text-amber-900 border border-amber-300 font-black'
                                      : isInProgress
                                      ? 'bg-blue-100/90 text-blue-800 border border-blue-200'
                                      : 'bg-amber-100/90 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  ) : isPaymentRequired ? (
                                    <IndianRupee className="h-3 w-3 text-amber-700" />
                                  ) : isInProgress ? (
                                    <Activity className="h-3 w-3 text-blue-600 animate-pulse" />
                                  ) : (
                                    <Clock3 className="h-3 w-3 text-amber-600" />
                                  )}
                                  {isPaymentRequired ? 'AWAITING PAYMENT' : status}
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

                              {/* 4-STAGE WORKER EXECUTION PIPELINE LINE */}
                              <div className="pt-2.5 space-y-2">
                                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wide">
                                  <span className="text-emerald-700 flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Assigned
                                  </span>
                                  <span className={isInProgress || isPaymentRequired || isCompleted ? 'text-blue-700 flex items-center gap-1' : 'text-slate-400 flex items-center gap-1'}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${isInProgress || isPaymentRequired || isCompleted ? 'bg-blue-500' : 'bg-slate-300'}`} /> In Progress
                                  </span>
                                  <span className={isPaymentRequired || isCompleted ? 'text-amber-700 flex items-center gap-1' : 'text-slate-400 flex items-center gap-1'}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${isPaymentRequired || isCompleted ? 'bg-amber-500' : 'bg-slate-300'}`} /> Awaiting Payment
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
                                        : isPaymentRequired
                                        ? 'w-3/4 bg-gradient-to-r from-amber-500 to-amber-600'
                                        : isInProgress
                                        ? 'w-1/2 bg-gradient-to-r from-blue-500 to-indigo-500'
                                        : 'w-1/4 bg-gradient-to-r from-emerald-400 to-emerald-500'
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
                                <div className="flex-1 flex gap-2">
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
                                  <button
                                    type="button"
                                    onClick={() => handleDeclineJob(job.id)}
                                    disabled={operatingJobId === job.id}
                                    className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 px-3.5 py-2.5 text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-2xs"
                                  >
                                    Decline
                                  </button>
                                </div>
                              )}

                              {isInProgress && (
                                <div className="flex-1 flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleCompleteJob(job.id)}
                                    disabled={operatingJobId === job.id}
                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50"
                                  >
                                    {operatingJobId === job.id ? (
                                      <>
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Requesting...
                                      </>
                                    ) : (
                                      'Complete Job'
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeclineJob(job.id)}
                                    disabled={operatingJobId === job.id}
                                    className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 px-3.5 py-2.5 text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-2xs"
                                  >
                                    Decline
                                  </button>
                                </div>
                              )}

                              {isPaymentRequired && (
                                <div className="flex-1 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2 text-xs font-bold text-amber-800 flex items-center gap-2">
                                  <Clock3 className="h-4 w-4 text-amber-600 shrink-0" />
                                  <span>Awaiting Customer Payment</span>
                                </div>
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
                    onClick={async () => {
                      await Promise.all([fetchWorkerEarnings(), fetchWorkerJobs()]);
                      toast({
                        title: 'Earnings Refreshed',
                        description: 'Your cooperative earnings ledger has been updated.',
                      });
                    }}
                    disabled={isLoadingWorkerEarnings}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
                    title="Refresh Earnings Ledger"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingWorkerEarnings ? 'animate-spin' : ''}`} />
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

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={async () => {
                        await fetchWorkerRatings();
                        toast({
                          title: 'Ratings Refreshed',
                          description: 'Customer ratings and review summaries updated.',
                        });
                      }}
                      disabled={isLoadingWorkerRatings}
                      className="p-2.5 rounded-xl border border-amber-200 bg-white text-amber-700 hover:text-amber-900 transition-colors disabled:opacity-50"
                      title="Refresh reviews"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingWorkerRatings ? 'animate-spin' : ''}`} />
                    </button>

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

            {/* TAB: WORKER VERIFICATION */}
            {activeTab === 'verification' && <WorkerVerificationSection />}

            {/* TAB: WORKER NOTIFICATIONS */}
            {activeTab === 'notifications' && renderNotificationsView()}

          </div>
        )}

        {/* ADMIN VIEWS */}
        {role === 'admin' && (
          <div className="space-y-8">
            <div className="space-y-6">
              {activeTab === 'overview' && (
                <>
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
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 p-5 shadow-xs flex flex-col justify-between h-36 hover:shadow-md hover:border-blue-300 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 leading-tight">Users Overview</span>
                        <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                          <UsersRound className="h-4.5 w-4.5" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 select-none leading-none">
                          {adminOverview?.totalUsers ?? adminUsers.length}
                        </div>
                        <p className="text-[10px] font-semibold text-slate-500">
                          Active: <strong className="text-emerald-700">{adminOverview?.activeUsers ?? 0}</strong> | Susp: <strong className="text-amber-700">{adminOverview?.suspendedUsers ?? 0}</strong> | Deact: <strong className="text-rose-700">{adminOverview?.deactivatedUsers ?? 0}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 p-5 shadow-xs flex flex-col justify-between h-36 hover:shadow-md hover:border-emerald-300 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 leading-tight">Active Jobs & Rate</span>
                        <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                          <Activity className="h-4.5 w-4.5" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 select-none leading-none">
                          {adminOverview?.activeJobs ?? 0}
                        </div>
                        <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100/70 rounded-full px-2.5 py-0.5">
                          Completion Rate: {adminOverview?.completionRate ?? '0.00'}%
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 p-5 shadow-xs flex flex-col justify-between h-36 hover:shadow-md hover:border-amber-300 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 leading-tight">Cancellation Rate</span>
                        <div className="h-9 w-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                          <AlertCircle className="h-4.5 w-4.5" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600 select-none leading-none">
                          {adminOverview?.cancellationRate ?? '0.00'}%
                        </div>
                        <span className="inline-block text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100/70 rounded-full px-2.5 py-0.5">
                          Cancelled: {adminOverview?.cancelledRequests ?? 0} requests
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/40 p-5 shadow-xs flex flex-col justify-between h-36 hover:shadow-md hover:border-indigo-300 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 leading-tight">Gross Volume</span>
                        <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                          <IndianRupee className="h-4.5 w-4.5" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-blue-500 select-none leading-none font-mono">
                          ₹{adminOverview?.totalGrossVolume?.toFixed(2) ?? '0.00'}
                        </div>
                        <span className="inline-block text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100/70 rounded-full px-2.5 py-0.5">
                          Fees: ₹{adminOverview?.totalPlatformFees?.toFixed(2) ?? '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* OPERATIONAL ALERTS SECTION */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-amber-600" />
                        <h3 className="text-lg font-bold text-slate-900">Operational System Alerts</h3>
                      </div>
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 rounded-full px-3 py-1">
                        {operationalAlerts.length} Active
                      </span>
                    </div>

                    {operationalAlerts.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
                        <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500 mb-1" />
                        No operational alerts detected. All systems are functioning normally.
                      </div>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {operationalAlerts.map((alert, idx) => (
                          <div
                            key={idx}
                            className={`rounded-2xl border p-4 space-y-1.5 transition-all ${
                              alert.severity === 'CRITICAL'
                                ? 'border-red-200 bg-red-50/50 text-red-900'
                                : alert.severity === 'WARNING'
                                ? 'border-amber-200 bg-amber-50/50 text-amber-900'
                                : 'border-blue-200 bg-blue-50/50 text-blue-900'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-extrabold text-sm tracking-tight">{alert.title}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                alert.severity === 'CRITICAL' ? 'bg-red-100 border-red-300 text-red-800' :
                                alert.severity === 'WARNING' ? 'bg-amber-100 border-amber-300 text-amber-800' :
                                'bg-blue-100 border-blue-300 text-blue-800'
                              }`}>
                                {alert.severity}
                              </span>
                            </div>
                            <p className="text-xs opacity-90 leading-relaxed">{alert.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SERVICE DEMAND ANALYTICS SECTION */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-900">Service Demand by Category</h3>
                      <span className="text-xs text-slate-500 font-semibold">Backend aggregated metrics</span>
                    </div>

                    {serviceDemand.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
                        No service demand data available.
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {serviceDemand.map((item) => (
                          <div key={item.category} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-2 hover:bg-white hover:border-emerald-200 transition-all">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-sm">{CATEGORY_LABELS[item.category]?.label || item.category}</span>
                              <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5">
                                {item.demandPercentage}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>Requests: <strong className="text-slate-800">{item.requestCount}</strong></span>
                              <span>Completed: <strong className="text-slate-800">{item.completedJobCount}</strong></span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.demandPercentage}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </>
              )}

              {/* FINANCIAL AUDIT TAB */}
              {activeTab === 'financial' && (
                <div className="space-y-6">
                  {/* Financial Overview Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-emerald-600" /> Financial Audit & Ledger Oversight
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Read-only administrative financial view with fee tracking and transaction breakdown
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => fetchFinancialData(0)}
                      disabled={isLoadingFinancial}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50 flex items-center gap-2 text-xs font-bold shadow-2xs"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingFinancial ? 'animate-spin' : ''}`} /> Refresh Financials
                    </button>
                  </div>

                  {/* Summary Metric Cards */}
                  {financialSummary && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 p-5 shadow-xs flex flex-col justify-between h-36 hover:shadow-md hover:border-emerald-300 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 leading-tight">Gross Transaction Volume</span>
                          <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                            <IndianRupee className="h-4.5 w-4.5" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-black text-slate-900 font-mono">
                            ₹{financialSummary.totalGrossVolume.toFixed(2)}
                          </div>
                          <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100/70 rounded-full px-2.5 py-0.5">
                            Total Volume Processed
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 p-5 shadow-xs flex flex-col justify-between h-36 hover:shadow-md hover:border-blue-300 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 leading-tight">Cooperative Fees (10%)</span>
                          <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                            <Wallet className="h-4.5 w-4.5" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-black text-slate-900 font-mono">
                            ₹{financialSummary.totalPlatformFees.toFixed(2)}
                          </div>
                          <span className="inline-block text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100/70 rounded-full px-2.5 py-0.5">
                            Cooperative Platform Revenue
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/40 p-5 shadow-xs flex flex-col justify-between h-36 hover:shadow-md hover:border-indigo-300 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 leading-tight">Worker Payouts (90%)</span>
                          <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                            <HandHeart className="h-4.5 w-4.5" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-black text-slate-900 font-mono">
                            ₹{financialSummary.totalWorkerEarnings.toFixed(2)}
                          </div>
                          <span className="inline-block text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100/70 rounded-full px-2.5 py-0.5">
                            Distributed to Workers
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-purple-200/90 bg-gradient-to-br from-purple-50/70 via-white to-violet-50/40 p-5 shadow-xs flex flex-col justify-between h-36 hover:shadow-md hover:border-purple-300 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 leading-tight">Transaction Stats</span>
                          <div className="h-9 w-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                            <Receipt className="h-4.5 w-4.5" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xl font-black text-slate-900 font-mono">
                            {financialSummary.completedTransactions} Succ / {financialSummary.refundedTransactions} Ref
                          </div>
                          <span className="inline-block text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-100/70 rounded-full px-2.5 py-0.5">
                            Failed: {financialSummary.failedTransactions} | Total: {financialSummary.totalTransactions}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Financial Transactions Directory */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Financial Audit Transactions</h3>
                        <p className="text-xs text-slate-500">Filterable transaction audit ledger</p>
                      </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search by ref, customer, worker..."
                            value={financialSearch}
                            onChange={(e) => setFinancialSearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') fetchFinancialData(0);
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => fetchFinancialData(0)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                        >
                          Search
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={financialStatusFilter}
                          onChange={(e) => {
                            setFinancialStatusFilter(e.target.value);
                            setTimeout(() => fetchFinancialData(0), 50);
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="ALL">All Statuses</option>
                          <option value="SUCCESS">SUCCESS</option>
                          <option value="REFUNDED">REFUNDED</option>
                          <option value="FAILED">FAILED</option>
                        </select>

                        <input
                          type="date"
                          value={financialFromDate}
                          onChange={(e) => setFinancialFromDate(e.target.value)}
                          className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                        />
                        <span className="text-xs text-slate-400 font-bold">to</span>
                        <input
                          type="date"
                          value={financialToDate}
                          onChange={(e) => setFinancialToDate(e.target.value)}
                          className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                        />

                        {(financialSearch || financialStatusFilter !== 'ALL' || financialFromDate || financialToDate) && (
                          <button
                            type="button"
                            onClick={() => {
                              setFinancialSearch('');
                              setFinancialStatusFilter('ALL');
                              setFinancialFromDate('');
                              setFinancialToDate('');
                              setTimeout(() => fetchFinancialData(0), 50);
                            }}
                            className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-800 font-bold"
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="divide-y divide-slate-100 overflow-x-auto">
                      {financialTransactions.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500">
                          No financial transactions found matching the filter criteria.
                        </div>
                      ) : (
                        financialTransactions.map((tx) => (
                          <div key={tx.id} className="py-3.5 px-2 flex items-center justify-between text-xs min-w-[800px] hover:bg-slate-50/60 rounded-2xl transition-all gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                              <div className="h-9 w-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                                <Receipt className="h-4.5 w-4.5" />
                              </div>
                              <div>
                                <strong className="text-slate-800 font-extrabold text-xs block">{tx.jobTitle || 'Service Job'} • Job #{tx.jobId || tx.id}</strong>
                                <span className="font-mono text-[11px] text-slate-400 font-semibold">{tx.transactionReference}</span>
                              </div>
                            </div>

                            <div className="w-[140px] shrink-0">
                              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Customer ➔ Worker</span>
                              <div className="mt-0.5 leading-snug">
                                <span className="text-slate-800 font-extrabold block truncate">{tx.customerName || 'Customer'}</span>
                                <span className="text-slate-500 font-semibold block truncate">to {tx.workerName || 'Worker'}</span>
                              </div>
                            </div>

                            <div className="w-[130px] shrink-0">
                              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Gross / Fee / Net</span>
                              <div className="mt-0.5 font-mono">
                                <strong className="text-slate-900 font-extrabold">₹{tx.amount.toFixed(2)}</strong>
                                <span className="text-[10px] text-slate-400 block">(Fee: ₹{tx.platformFee.toFixed(2)} | Net: ₹{tx.workerEarning.toFixed(2)})</span>
                              </div>
                            </div>

                            <div className="w-[90px] shrink-0">
                              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Method</span>
                              <span className="font-bold text-slate-600 block mt-0.5">{tx.paymentMethod}</span>
                            </div>

                            <div className="w-[80px] shrink-0 flex justify-end">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase border ${
                                tx.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                tx.status === 'REFUNDED' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {tx.status}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedFinancialTxnId(tx.id)}
                              className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-700 transition-colors inline-flex items-center gap-1 shrink-0"
                            >
                              <Eye className="h-3 w-3 text-slate-400" /> View Audit
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Pagination Controls */}
                    {financialTotalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                        <span>
                          Showing Page <strong className="text-slate-800">{financialPage + 1}</strong> of <strong className="text-slate-800">{financialTotalPages}</strong> ({financialTotalElements} total transactions)
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={financialPage === 0}
                            onClick={() => fetchFinancialData(financialPage - 1)}
                            className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 font-bold"
                          >
                            Previous
                          </button>
                          <button
                            type="button"
                            disabled={financialPage >= financialTotalPages - 1}
                            onClick={() => fetchFinancialData(financialPage + 1)}
                            className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 font-bold"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* USERS DIRECTORY TABLE / LIST */}
              {(activeTab === 'users' || activeTab === 'overview') && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">User Directory</h3>
                      <p className="text-xs text-slate-500">System user registrations, status management, and detail inspection</p>
                    </div>
                    {activeTab === 'overview' && (
                      <button
                        type="button"
                        onClick={() => setSearchParams({ tab: 'users' })}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        View All Users →
                      </button>
                    )}
                  </div>

                  {/* Filters and Search Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
                    <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search users by name or email..."
                          value={adminUserSearch}
                          onChange={(e) => setAdminUserSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') fetchAdminUsers(0);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => fetchAdminUsers(0)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Search
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Role Filter */}
                      <select
                        value={adminUserFilter}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setAdminUserFilter(val);
                          setTimeout(() => fetchAdminUsers(0), 50);
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="ALL">All Roles</option>
                        <option value="CUSTOMER">Customer</option>
                        <option value="WORKER">Worker</option>
                        <option value="ADMIN">Admin</option>
                      </select>

                      {/* Status Filter */}
                      <select
                        value={adminUserStatusFilter}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setAdminUserStatusFilter(val);
                          setTimeout(() => fetchAdminUsers(0), 50);
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="DEACTIVATED">Deactivated</option>
                      </select>

                      {(adminUserSearch || adminUserFilter !== 'ALL' || adminUserStatusFilter !== 'ALL') && (
                        <button
                          type="button"
                          onClick={() => {
                            setAdminUserSearch('');
                            setAdminUserFilter('ALL');
                            setAdminUserStatusFilter('ALL');
                            setTimeout(() => fetchAdminUsers(0), 50);
                          }}
                          className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-800 font-bold"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Users List */}
                  <div className="divide-y divide-slate-100 overflow-x-auto">
                    {adminUsers.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500">
                        No users match the selected search criteria.
                      </div>
                    ) : (
                      adminUsers.map((u) => (
                        <div key={u.id} className="py-3.5 px-2 flex items-center justify-between text-xs min-w-[750px] hover:bg-slate-50/60 rounded-2xl transition-all gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                              <User className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <strong className="text-slate-800 font-extrabold text-sm block">{u.name}</strong>
                              <span className="text-[11px] text-slate-500 font-mono block mt-0.5">{u.email}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`inline-block border rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-50 text-purple-700 border-purple-100'
                                : u.role === 'WORKER'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                              {u.role}
                            </span>

                            <span className={`inline-block border rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : u.status === 'SUSPENDED'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {u.status || (u.active ? 'ACTIVE' : 'DEACTIVATED')}
                            </span>

                            <button
                              type="button"
                              onClick={() => setSelectedDetailUserId(u.id)}
                              className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-700 transition-colors inline-flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3 text-slate-400" /> View Details
                            </button>

                            {user?.id !== u.id && (
                              <div className="flex items-center gap-1.5 ml-2">
                                {(u.status === 'SUSPENDED' || u.status === 'DEACTIVATED' || !u.active) ? (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        await reactivateUserApi(u.id);
                                        toast({ title: 'User Reactivated', description: `${u.name} is now active.` });
                                        fetchAdminUsers();
                                      } catch (err: any) {
                                        toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Error', variant: 'destructive' });
                                      }
                                    }}
                                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-[10px] font-bold text-white transition-colors"
                                  >
                                    Reactivate
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setStatusModalUser(u);
                                        setStatusModalAction('suspend');
                                        setStatusModalReason('');
                                      }}
                                      className="rounded-lg bg-amber-500 hover:bg-amber-600 px-2.5 py-1 text-[10px] font-bold text-white transition-colors"
                                    >
                                      Suspend
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setStatusModalUser(u);
                                        setStatusModalAction('deactivate');
                                        setStatusModalReason('');
                                      }}
                                      className="rounded-lg bg-rose-600 hover:bg-rose-700 px-2.5 py-1 text-[10px] font-bold text-white transition-colors"
                                    >
                                      Deactivate
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {activeTab === 'users' && adminUserTotalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <span>
                        Showing Page <strong className="text-slate-800">{adminUserPage + 1}</strong> of <strong className="text-slate-800">{adminUserTotalPages}</strong> ({adminUserTotalElements} total users)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={adminUserPage === 0}
                          onClick={() => fetchAdminUsers(adminUserPage - 1)}
                          className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 font-bold"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          disabled={adminUserPage >= adminUserTotalPages - 1}
                          onClick={() => fetchAdminUsers(adminUserPage + 1)}
                          className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 font-bold"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* WORKER VERIFICATION AUDIT TAB */}
              {activeTab === 'verifications' && <AdminVerificationSection />}

              {/* WORKERS GOVERNANCE DIRECTORY */}
              {(activeTab === 'workers' || activeTab === 'overview') && (

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Worker Governance & Activation</h3>
                      <p className="text-xs text-slate-500">Worker professional status and activation control</p>
                    </div>
                    {activeTab === 'overview' && (
                      <button
                        type="button"
                        onClick={() => setSearchParams({ tab: 'workers' })}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        View All Workers →
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100 overflow-x-auto">
                    {displayWorkers.map((w) => (
                      <div key={w.workerId} className="py-3 px-2 flex items-center justify-between text-xs min-w-[550px] hover:bg-slate-50/60 rounded-2xl transition-all gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                            <Wrench className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <strong className="text-slate-800 font-extrabold text-sm block">{w.name}</strong>
                              <VerifiedWorkerBadge isVerified={w.isVerified} size="sm" />
                              <span className="text-[10px] text-slate-400 font-mono">({w.email})</span>
                              {!w.active && (
                                <span className="inline-block bg-rose-50 text-rose-600 border border-rose-100 rounded-full px-2 py-0.5 text-[9px] font-bold">
                                  Inactive
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1 mt-1">
                              {w.serviceCategories?.map((cat) => (
                                <span key={cat} className="inline-block bg-slate-50 border border-slate-200/60 text-slate-500 text-[10px] rounded-full px-2 py-0.5 font-bold">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <strong className="text-emerald-700 font-extrabold font-mono bg-emerald-50 border border-emerald-100 rounded-xl px-2.5 py-1 text-xs shrink-0">
                            ₹{w.hourlyRate}/hr
                          </strong>
                          <button
                            type="button"
                            onClick={() => handleToggleWorkerStatus(w)}
                            disabled={operatingWorkerId === w.workerId}
                            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                              w.active
                                ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white'
                                : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white'
                            }`}
                          >
                            {w.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SERVICE REQUESTS DIRECTORY */}
              {(activeTab === 'requests' || activeTab === 'overview') && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Service Requests</h3>
                      <p className="text-xs text-slate-500">Service request postings and assignment status</p>
                    </div>
                    {activeTab === 'overview' && (
                      <button
                        type="button"
                        onClick={() => setSearchParams({ tab: 'requests' })}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        View All Requests →
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100 overflow-x-auto">
                    {displayRequests.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No service requests found.</p>
                    ) : (
                      displayRequests.map((r) => (
                        <div key={r.id} className="py-3 px-2 flex flex-wrap items-center justify-between text-xs gap-4 min-w-[600px] hover:bg-slate-50/60 rounded-2xl transition-all">
                          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                            <div className="h-9 w-9 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 text-purple-600">
                              <FileText className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <strong className="text-slate-800 font-extrabold text-sm block">{r.category}</strong>
                              <p className="text-slate-500 mt-0.5 max-w-md truncate font-medium">{r.description}</p>
                            </div>
                          </div>
                          <div className="w-[120px] shrink-0">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Budget & Location</span>
                            <div className="mt-0.5">
                              <strong className="text-slate-800 font-extrabold font-mono">₹{r.budget}</strong>
                              <span className="text-slate-400 mx-1">•</span>
                              <span className="text-slate-600 font-semibold">{r.location}</span>
                            </div>
                          </div>
                          <div className="w-[130px] shrink-0">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Customer</span>
                            <span className="inline-flex items-center gap-1.5 mt-1 font-extrabold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-0.5">
                              <User className="h-3 w-3 text-slate-400 shrink-0" />
                              {r.customerName}
                            </span>
                          </div>
                          <div className="w-[140px] shrink-0">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Worker Match</span>
                            {r.assignmentStatus === 'ASSIGNED' ? (
                              <span className="inline-flex items-center gap-1.5 mt-1 font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-2.5 py-0.5">
                                <Wrench className="h-3 w-3 text-emerald-500 shrink-0" />
                                {r.assignedWorkerName || 'Assigned'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 mt-1 font-extrabold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-2.5 py-0.5">
                                <Clock3 className="h-3 w-3 text-amber-500 shrink-0" />
                                Unassigned
                              </span>
                            )}
                          </div>
                          <div className="shrink-0 w-[70px] flex justify-end">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider border ${
                              r.status === 'OPEN'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {r.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* JOBS TRACKING DIRECTORY */}
              {(activeTab === 'jobs' || activeTab === 'overview') && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Job Executions & Operational Status</h3>
                      <p className="text-xs text-slate-500">Live worker performance, contract tracking, and operational status filters</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {activeTab === 'jobs' && (
                        <div className="flex items-center flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs">
                          {(['ALL', 'ACTIVE', 'ACCEPTED', 'IN_PROGRESS', 'PAYMENT_REQUIRED', 'COMPLETED', 'UNASSIGNED', 'UNRESOLVED_DISPUTE', 'OVERDUE'] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={async () => {
                                setAdminJobStatusFilter(st);
                                try {
                                  let filterParam: string | undefined = st;
                                  if (st === 'ALL') filterParam = undefined;
                                  const filtered = await getAdminJobsApi(filterParam);
                                  setAdminJobs(filtered);
                                } catch {
                                  // Fallback
                                }
                              }}
                              className={`rounded-lg px-2.5 py-1 font-bold transition-all ${
                                adminJobStatusFilter === st
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {st === 'UNASSIGNED' ? 'UNASSIGNED REQS' : st === 'UNRESOLVED_DISPUTE' ? 'DISPUTED' : st}
                            </button>
                          ))}
                        </div>
                      )}
                      {activeTab === 'overview' && (
                        <button
                          type="button"
                          onClick={() => setSearchParams({ tab: 'jobs' })}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          View All Jobs →
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 overflow-x-auto">
                    {displayJobs.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No job records found.</p>
                    ) : (
                      displayJobs.map((j) => (
                        <div key={j.id} className="py-3 px-2 flex flex-wrap items-center justify-between text-xs gap-4 min-w-[600px] hover:bg-slate-50/60 rounded-2xl transition-all">
                          <div className="flex items-center gap-3 flex-1 min-w-[150px]">
                            <div className="h-9 w-9 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 text-teal-600">
                              <Activity className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <strong className="text-slate-800 font-extrabold text-sm block">Job #{j.id}</strong>
                              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{formatNotificationTime(j.createdAt)}</span>
                            </div>
                          </div>
                          <div className="w-[150px] shrink-0">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Customer</span>
                            <span className="inline-flex items-center gap-1.5 mt-1 font-extrabold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-0.5">
                              <User className="h-3 w-3 text-slate-400 shrink-0" />
                              {j.customerName}
                            </span>
                          </div>
                          <div className="w-[150px] shrink-0">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Assigned Worker</span>
                            <span className="inline-flex items-center gap-1.5 mt-1 font-extrabold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-0.5">
                              <Wrench className="h-3 w-3 text-slate-400 shrink-0" />
                              {j.workerName || 'Unassigned'}
                            </span>
                          </div>
                          <div className="w-[100px] shrink-0 flex flex-col items-start">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Status</span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase border tracking-wider ${
                              j.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                              j.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              j.status === 'DECLINED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {j.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* PAYMENTS & TRANSACTIONS DIRECTORY */}
              {(activeTab === 'payments' || activeTab === 'overview') && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">Payments & Transactions Ledger</h3>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200">
                          Simulated
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Live platform payment simulation transactions and cooperative platform fee ledger</p>
                    </div>
                    {activeTab === 'overview' && (
                      <button
                        type="button"
                        onClick={() => setSearchParams({ tab: 'payments' })}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        View All Payments →
                      </button>
                    )}
                  </div>

                  {/* Summary Metrics */}
                  {adminPaymentSummary && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Volume</span>
                        <p className="font-mono text-base font-black text-slate-900">₹{adminPaymentSummary.totalSimulatedVolume?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3.5 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Platform Fees</span>
                        <p className="font-mono text-base font-black text-emerald-800">₹{adminPaymentSummary.totalSimulatedPlatformFees?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Successful</span>
                        <p className="font-mono text-base font-black text-emerald-700">{adminPaymentSummary.successfulTransactions}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Refunded / Failed</span>
                        <p className="font-mono text-base font-black text-slate-700">
                          {adminPaymentSummary.refundedTransactions} / {adminPaymentSummary.failedTransactions}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="divide-y divide-slate-100 overflow-x-auto">
                    {adminPayments.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">No payment transactions recorded yet.</p>
                    ) : (
                      (activeTab === 'overview' ? adminPayments.slice(0, 5) : adminPayments).map((p) => (
                        <div key={p.id} className="py-3 px-2 flex flex-wrap items-center justify-between text-xs gap-4 min-w-[650px] hover:bg-slate-50/60 rounded-2xl transition-all">
                          <div className="flex items-center gap-3 flex-1 min-w-[180px]">
                            <div className="h-9 w-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                              <Receipt className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <strong className="text-slate-800 font-extrabold text-xs block">{p.serviceCategory}</strong>
                              <span className="font-mono text-[11px] text-slate-400 font-semibold">{p.transactionReference}</span>
                            </div>
                          </div>
                          <div className="w-[120px] shrink-0">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Amount & Fee</span>
                            <div className="mt-0.5">
                              <strong className="text-slate-900 font-extrabold font-mono">₹{p.amount.toFixed(2)}</strong>
                              <span className="text-[10px] text-slate-400 block font-mono font-medium">(Fee: ₹{p.platformFee.toFixed(2)})</span>
                            </div>
                          </div>
                          <div className="w-[130px] shrink-0">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Customer</span>
                            <span className="font-bold text-slate-700 block mt-0.5 truncate">{p.customerName}</span>
                          </div>
                          <div className="w-[110px] shrink-0">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Method</span>
                            <span className="font-bold text-slate-600 block mt-0.5">{p.paymentMethod}</span>
                          </div>
                          <div className="w-[90px] shrink-0 flex justify-end">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase border ${
                              p.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              p.status === 'REFUNDED' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {p.status === 'SUCCESS' ? 'Paid' : p.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* RATINGS & REVIEWS DIRECTORY */}
              {(activeTab === 'ratings' || activeTab === 'overview') && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Ratings & Customer Reviews</h3>
                      <p className="text-xs text-slate-500">Star ratings and qualitative feedback submitted by customers</p>
                    </div>
                    {activeTab === 'overview' && (
                      <button
                        type="button"
                        onClick={() => setSearchParams({ tab: 'ratings' })}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        View All Ratings →
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100 overflow-x-auto">
                    {displayRatings.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No customer reviews found.</p>
                    ) : (
                      displayRatings.map((r) => (
                        <div key={r.id} className="py-3.5 px-2 flex flex-wrap items-start justify-between text-xs gap-4 min-w-[600px] hover:bg-slate-50/60 rounded-2xl transition-all">
                          <div className="flex items-start gap-3 w-[220px] shrink-0">
                            <div className="h-9 w-9 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 text-amber-600">
                              <Star className="h-4.5 w-4.5 fill-amber-400 text-amber-400" />
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Customer ➔ Worker</span>
                              <div className="mt-0.5 leading-snug">
                                <span className="text-slate-800 font-extrabold">{r.customerName}</span>
                                <span className="text-slate-400 mx-1">to</span>
                                <span className="text-slate-700 font-bold">{r.workerName}</span>
                              </div>
                            </div>
                          </div>
                          <div className="w-[100px] shrink-0">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Score</span>
                            <div className="flex items-center gap-1.5 mt-1 text-amber-500 bg-amber-50 border border-amber-100/70 rounded-xl px-2.5 py-0.5 w-max">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <strong className="text-slate-800 text-xs font-black">{r.score}.0</strong>
                            </div>
                          </div>
                          <div className="flex-1 min-w-[200px]">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Review Comment</span>
                            <p className="text-slate-600 font-medium italic mt-1 bg-slate-50 border border-slate-100/70 rounded-2xl px-3 py-2 leading-relaxed">
                              "{r.review || "No qualitative feedback left."}"
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ACTIVITY LOGS DIRECTORY */}
              {(activeTab === 'activity' || activeTab === 'overview') && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">System Activity Audit Log</h3>
                      <p className="text-xs text-slate-500">Audit trail trace logs generated from cooperative activities</p>
                    </div>
                    {activeTab === 'overview' && (
                      <button
                        type="button"
                        onClick={() => setSearchParams({ tab: 'activity' })}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        View All Logs →
                      </button>
                    )}
                  </div>

                  {/* Filter Bar for Activity Log (Active when activeTab === 'activity') */}
                  {activeTab === 'activity' && (
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search activity description or entity ID..."
                            value={activitySearch}
                            onChange={(e) => setActivitySearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') fetchAdminActivity(0);
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => fetchAdminActivity(0)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                        >
                          Search
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={activityActionTypeFilter}
                          onChange={(e) => {
                            setActivityActionTypeFilter(e.target.value);
                            setTimeout(() => fetchAdminActivity(0), 50);
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="ALL">All Actions</option>
                          <option value="USER_SUSPENDED">USER_SUSPENDED</option>
                          <option value="USER_DEACTIVATED">USER_DEACTIVATED</option>
                          <option value="USER_REACTIVATED">USER_REACTIVATED</option>
                          <option value="WORKER_ACTIVATED">WORKER_ACTIVATED</option>
                          <option value="WORKER_DEACTIVATED">WORKER_DEACTIVATED</option>
                          <option value="WORKER_VERIFIED">WORKER_VERIFIED</option>
                          <option value="WORKER_REJECTED">WORKER_REJECTED</option>
                          <option value="DISPUTE_CREATED">DISPUTE_CREATED</option>
                          <option value="DISPUTE_RESOLVED">DISPUTE_RESOLVED</option>
                        </select>

                        <input
                          type="date"
                          value={activityFromDate}
                          onChange={(e) => setActivityFromDate(e.target.value)}
                          className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                        />
                        <span className="text-xs text-slate-400 font-bold">to</span>
                        <input
                          type="date"
                          value={activityToDate}
                          onChange={(e) => setActivityToDate(e.target.value)}
                          className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                        />

                        {(activitySearch || activityActionTypeFilter !== 'ALL' || activityFromDate || activityToDate) && (
                          <button
                            type="button"
                            onClick={() => {
                              setActivitySearch('');
                              setActivityActionTypeFilter('ALL');
                              setActivityFromDate('');
                              setActivityToDate('');
                              setTimeout(() => fetchAdminActivity(0), 50);
                            }}
                            className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-800 font-bold"
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="divide-y divide-slate-100 overflow-x-auto">
                    {displayActivity.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No trace activities recorded.</p>
                    ) : (
                      displayActivity.map((act) => (
                        <div key={act.id} className="py-3 px-2 flex items-start justify-between text-xs gap-4 min-w-[600px] hover:bg-slate-50/60 rounded-2xl transition-all">
                          <div className="flex items-center gap-3 w-[150px] shrink-0">
                            <div className="h-9 w-9 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0 text-slate-500">
                              <ShieldCheck className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Timestamp</span>
                              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{formatNotificationTime(act.createdAt)}</span>
                            </div>
                          </div>
                          <div className="w-[120px] shrink-0">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Actor</span>
                            <span className={`inline-block border rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase mt-1 ${
                              act.actorRole === 'ADMIN'
                                ? 'bg-purple-50 text-purple-700 border-purple-100'
                                : act.actorRole === 'WORKER'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                              {act.actorRole}
                            </span>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: #{act.actorUserId}</p>
                          </div>
                          <div className="w-[150px] shrink-0">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Action</span>
                            <span className="text-slate-800 font-extrabold block mt-0.5">{act.actionType}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{act.entityType} #{act.entityId}</span>
                          </div>
                          <div className="flex-1 min-w-[200px]">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Description</span>
                            <p className="text-slate-600 font-semibold mt-1 leading-relaxed bg-slate-50 border border-slate-100/70 rounded-2xl px-3 py-2">
                              {act.description}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Pagination Controls for Activity Log */}
                  {activeTab === 'activity' && activityTotalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <span>
                        Showing Page <strong className="text-slate-800">{activityPage + 1}</strong> of <strong className="text-slate-800">{activityTotalPages}</strong> ({activityTotalElements} total log entries)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={activityPage === 0}
                          onClick={() => fetchAdminActivity(activityPage - 1)}
                          className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 font-bold"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          disabled={activityPage >= activityTotalPages - 1}
                          onClick={() => fetchAdminActivity(activityPage + 1)}
                          className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 font-bold"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
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
            showCancelButton={true}
          />
          <RatingModal
            isOpen={isRatingModalOpen}
            onClose={() => setIsRatingModalOpen(false)}
            jobId={ratingJobId}
            workerName={ratingWorkerName}
            onSuccess={fetchCustomerRequests}
          />
          <PaymentModal
            isOpen={isPaymentModalOpen}
            jobId={paymentJobId}
            onClose={() => {
              setIsPaymentModalOpen(false);
              setPaymentJobId(null);
            }}
            onPaymentSuccess={() => {
              fetchCustomerRequests();
              fetchWorkerJobs();
              window.dispatchEvent(new CustomEvent('gigcircle-notifications-updated'));
            }}
          />
          <CustomerPaymentHistoryModal
            isOpen={isPaymentHistoryModalOpen}
            onClose={() => setIsPaymentHistoryModalOpen(false)}
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
            showCancelButton={false}
          />
        </>
      )}

      {/* Admin Modals */}
      {role === 'admin' && (
        <>
          <AdminUserDetailModal
            userId={selectedDetailUserId}
            onClose={() => setSelectedDetailUserId(null)}
          />

          <AdminFinancialDetailModal
            transactionId={selectedFinancialTxnId}
            onClose={() => setSelectedFinancialTxnId(null)}
          />

          {/* Status Action Confirmation Modal */}
          {statusModalUser && statusModalAction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-gray-900 border border-gray-800 text-gray-100 rounded-xl shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <h3 className="text-lg font-bold text-white capitalize">
                    {statusModalAction} User Account
                  </h3>
                  <button
                    onClick={() => {
                      setStatusModalUser(null);
                      setStatusModalAction(null);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-gray-300">
                  Are you sure you want to <strong>{statusModalAction}</strong> user <strong>{statusModalUser.name}</strong> ({statusModalUser.email})?
                  Current status: <span className="font-semibold">{statusModalUser.status || (statusModalUser.active ? 'ACTIVE' : 'DEACTIVATED')}</span>.
                </p>

                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1">
                    Reason for {statusModalAction} <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    value={statusModalReason}
                    onChange={(e) => setStatusModalReason(e.target.value)}
                    placeholder={`Enter explicit administrative reason to ${statusModalAction} user...`}
                    rows={3}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusModalUser(null);
                      setStatusModalAction(null);
                    }}
                    className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingStatus || !statusModalReason.trim()}
                    onClick={async () => {
                      if (!statusModalReason.trim()) return;
                      setIsSubmittingStatus(true);
                      try {
                        if (statusModalAction === 'suspend') {
                          await suspendUserApi(statusModalUser.id, statusModalReason.trim());
                          toast({ title: 'User Suspended', description: `${statusModalUser.name} suspended.` });
                        } else {
                          await deactivateUserApi(statusModalUser.id, statusModalReason.trim());
                          toast({ title: 'User Deactivated', description: `${statusModalUser.name} deactivated.` });
                        }
                        setStatusModalUser(null);
                        setStatusModalAction(null);
                        fetchAdminUsers();
                      } catch (err: any) {
                        toast({
                          title: 'Action Failed',
                          description: err?.response?.data?.message || 'Status change failed.',
                          variant: 'destructive',
                        });
                      } finally {
                        setIsSubmittingStatus(false);
                      }
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50 ${
                      statusModalAction === 'suspend'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {isSubmittingStatus ? 'Processing...' : `Confirm ${statusModalAction}`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </PlatformShell>
  );
}
