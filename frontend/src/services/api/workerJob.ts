import apiClient from './client';
import type { ServiceRequest } from '@/types/service-request';
import type { JobResponse } from '@/types/worker-job';

export const getWorkerJobsApi = async (): Promise<ServiceRequest[]> => {
  const response = await apiClient.get<ServiceRequest[]>('/api/worker/jobs');
  return response.data;
};

export const acceptWorkerJobApi = async (requestId: number): Promise<JobResponse> => {
  const response = await apiClient.post<JobResponse>(`/api/worker/jobs/${requestId}/accept`);
  return response.data;
};
