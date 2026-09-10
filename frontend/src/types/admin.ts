import { Role } from './auth';
import { ServiceCategory, ServiceRequestStatus } from './service-request';
import { JobStatus } from './worker-job';

export interface PlatformOverviewSummary {
  totalUsers: number;
  totalCustomers: number;
  totalWorkers: number;
  activeUsers: number;
  suspendedUsers: number;
  deactivatedUsers: number;
  totalServiceRequests: number;
  openRequests: number;
  assignedRequests: number;
  activeJobs: number;
  completedJobs: number;
  cancelledRequests: number;
  completionRate: number;
  cancellationRate: number;
  totalRatings: number;
  averageRating: number;
  totalGrossVolume: number;
  totalPlatformFees: number;
  totalWorkerEarnings: number;
  pendingVerifications?: number;
  unresolvedDisputes?: number;
  recentlyResolvedDisputes?: number;
}

export interface ServiceDemandResponse {
  category: ServiceCategory;
  requestCount: number;
  completedJobCount: number;
  grossServiceValue: number;
  demandPercentage: number;
}

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface OperationalAlertResponse {
  alertType: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  relatedEntityType: string;
  relatedEntityId?: number;
  detectedTimestamp: string;
  count: number;
}

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';


export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  active: boolean;
  status: AccountStatus;
  createdAt: string;
}

export interface AdminWorker {
  workerId: number;
  profileId: number;
  name: string;
  email: string;
  phone: string;
  bio?: string;
  experienceYears: number;
  hourlyRate: number;
  skills: string[];
  serviceCategories: ServiceCategory[];
  available: boolean;
  serviceLocation?: string;
  serviceRadiusKm?: number;
  active: boolean;
  averageRating: number;
  totalRatings: number;
  createdAt: string;
  isVerified?: boolean;
}


export interface AdminServiceRequest {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  category: ServiceCategory;
  description: string;
  budget: number;
  preferredTime: string;
  location: string;
  status: ServiceRequestStatus;
  assignmentStatus: 'ASSIGNED' | 'UNASSIGNED';
  assignedWorkerId?: number;
  assignedWorkerName?: string;
  createdAt: string;
}

export interface AdminJob {
  id: number;
  serviceRequestId: number;
  customerId: number;
  customerName: string;
  workerId: number;
  workerName: string;
  status: JobStatus;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface AdminRating {
  id: number;
  jobId: number;
  customerId: number;
  customerName: string;
  workerId: number;
  workerName: string;
  score: number;
  review?: string;
  createdAt: string;
}

export interface AdminActivity {
  id: number;
  actorUserId: number;
  actorRole: Role;
  actionType: string;
  entityType: string;
  entityId?: number;
  description: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface AdminUserDetail extends AdminUser {
  serviceRequestsCreatedCount?: number;
  openRequestsCount?: number;
  completedRequestsCount?: number;
  cancelledRequestsCount?: number;

  jobsAssignedCount?: number;
  jobsCompletedCount?: number;
  activeJobsCount?: number;

  ratingsSubmittedCount?: number;
  ratingsReceivedCount?: number;
  averageRatingReceived?: number;

  totalGrossVolume?: number;
  totalPlatformFees?: number;
  totalWorkerEarnings?: number;

  workerProfileId?: number;
  bio?: string;
  experienceYears?: number;
  hourlyRate?: number;
  skills?: string[];
  serviceCategories?: ServiceCategory[];
  available?: boolean;
  serviceLocation?: string;
  serviceRadiusKm?: number;

  verificationStatus?: string;
  verificationSubmittedAt?: string;
  verificationReviewedAt?: string;

  recentActivity?: AdminActivity[];
}

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
export type PaymentMethod = 'UPI' | 'CARD' | 'CASH';

export interface AdminFinancialSummary {
  totalGrossVolume: number;
  totalPlatformFees: number;
  totalWorkerEarnings: number;
  completedPaymentAmount: number;
  pendingPaymentAmount: number;
  failedPaymentAmount: number;
  refundedAmount: number;
  totalTransactions: number;
  completedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  refundedTransactions: number;
  fromDate?: string;
  toDate?: string;
}

export interface AdminFinancialTransaction {
  id: number;
  jobId?: number;
  serviceRequestId?: number;
  jobTitle?: string;
  customerId?: number;
  customerName?: string;
  workerId?: number;
  workerName?: string;
  amount: number;
  platformFee: number;
  workerEarning: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionReference: string;
  invoiceId?: number;
  invoiceNumber?: string;
  hasDispute?: boolean;
  disputeId?: number;
  disputeStatus?: string;
  createdAt: string;
  paidAt?: string;
}

export interface AdminFinancialTransactionDetail {
  id: number;
  transactionReference: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentMethodDetails?: string;
  currency?: string;
  serviceAmount: number;
  platformFee: number;
  amount: number;
  workerEarning: number;
  refundAmount?: number;
  createdAt: string;
  paidAt?: string;
  refundedAt?: string;
  failureReason?: string;
  customerId?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  workerId?: number;
  workerName?: string;
  workerEmail?: string;
  workerPhone?: string;
  jobId?: number;
  serviceRequestId?: number;
  jobTitle?: string;
  jobStatus?: string;
  invoiceId?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceStatus?: string;
  disputeId?: number;
  disputeReason?: string;
  disputeStatus?: string;
  disputeResolution?: string;
  auditLogs?: AdminActivity[];
}


