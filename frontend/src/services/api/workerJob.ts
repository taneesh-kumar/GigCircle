import apiClient from './client';
import type { ServiceRequest } from '@/types/service-request';
import type { JobResponse } from '@/types/worker-job';

export const getWorkerJobsApi = async (): Promise<ServiceRequest[]> => {
  const response = await apiClient.get<ServiceRequest[]>('/worker/jobs');
  return response.data;
};

export const getWorkerAssignedJobsApi = async (): Promise<JobResponse[]> => {
  const response = await apiClient.get<JobResponse[]>('/worker/jobs/assigned');
  return response.data;
};

export const acceptWorkerJobApi = async (requestId: number): Promise<JobResponse> => {
  const response = await apiClient.post<JobResponse>(`/worker/jobs/${requestId}/accept`);
  return response.data;
};

export const startWorkerJobApi = async (jobId: number): Promise<JobResponse> => {
  const response = await apiClient.post<JobResponse>(`/worker/jobs/${jobId}/start`);
  return response.data;
};

export const completeWorkerJobApi = async (jobId: number): Promise<JobResponse> => {
  const response = await apiClient.post<JobResponse>(`/worker/jobs/${jobId}/complete`);
  return response.data;
};
