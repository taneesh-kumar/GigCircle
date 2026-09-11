export type EarningStatus = 'PENDING' | 'AVAILABLE';

export interface Earning {
  id: number;
  jobId: number;
  serviceRequestId: number;
  serviceCategory?: string;
  workerId: number;
  workerName: string;
  customerId: number;
  customerName: string;
  grossAmount: number;
  platformFee: number;
  workerEarning: number;
  feePercentage: number;
  status: EarningStatus;
  createdAt: string;
  availableAt?: string;
}

export interface WorkerEarningsSummary {
  workerId: number;
  totalGross: number;
  totalPlatformFees: number;
  totalWorkerEarnings: number;
  availableEarnings: number;
  totalJobs: number;
}

export interface PlatformRevenueSummary {
  totalGrossRevenue: number;
  totalPlatformFees: number;
  totalWorkerEarnings: number;
  totalCompletedJobsWithEarnings: number;
  totalAvailableWorkerEarnings: number;
  totalSuccessfulPayments?: number;
  totalPendingPayments?: number;
  totalFailedPayments?: number;
  upiPaymentCount?: number;
  cardPaymentCount?: number;
  walletPaymentCount?: number;
}
