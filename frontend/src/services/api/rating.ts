import apiClient from './client';
import type { CreateRatingInput, Rating, WorkerRatingSummary } from '@/types/rating';

export const createRatingApi = async (jobId: number, data: CreateRatingInput): Promise<Rating> => {
  const response = await apiClient.post<Rating>(`/customer/ratings/${jobId}`, data);
  return response.data;
};

export const getCustomerJobRatingApi = async (jobId: number): Promise<Rating> => {
  const response = await apiClient.get<Rating>(`/customer/ratings/job/${jobId}`);
  return response.data;
};

export const getWorkerRatingsApi = async (): Promise<Rating[]> => {
  const response = await apiClient.get<Rating[]>('/worker/ratings');
  return response.data;
};

export const getWorkerRatingSummaryApi = async (): Promise<WorkerRatingSummary> => {
  const response = await apiClient.get<WorkerRatingSummary>('/worker/ratings/summary');
  return response.data;
};
