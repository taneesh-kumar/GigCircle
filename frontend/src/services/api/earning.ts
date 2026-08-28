import api from './client';
import type { Earning, PlatformRevenueSummary, WorkerEarningsSummary } from '@/types/earning';

export const getWorkerEarningsApi = async (): Promise<Earning[]> => {
  const response = await api.get<Earning[]>('/worker/earnings');
  return response.data;
};

export const getWorkerEarningsSummaryApi = async (): Promise<WorkerEarningsSummary> => {
  const response = await api.get<WorkerEarningsSummary>('/worker/earnings/summary');
  return response.data;
};

export const getWorkerEarningApi = async (earningId: number): Promise<Earning> => {
  const response = await api.get<Earning>(`/worker/earnings/${earningId}`);
  return response.data;
};

export const getCustomerJobEarningApi = async (jobId: number): Promise<Earning> => {
  const response = await api.get<Earning>(`/customer/earnings/job/${jobId}`);
  return response.data;
};

export const getAdminRevenueSummaryApi = async (): Promise<PlatformRevenueSummary> => {
  const response = await api.get<PlatformRevenueSummary>('/admin/revenue/summary');
  return response.data;
};

export const getAdminEarningsApi = async (): Promise<Earning[]> => {
  const response = await api.get<Earning[]>('/admin/revenue/earnings');
  return response.data;
};
