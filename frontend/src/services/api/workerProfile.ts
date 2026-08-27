import apiClient from './client';
import type { CreateWorkerProfileInput, UpdateWorkerProfileInput, WorkerProfile } from '@/types/worker-profile';

export async function getWorkerProfileApi(): Promise<WorkerProfile> {
  const response = await apiClient.get<WorkerProfile>('/worker/profile');
  return response.data;
}

export async function createWorkerProfileApi(input: CreateWorkerProfileInput): Promise<WorkerProfile> {
  const response = await apiClient.post<WorkerProfile>('/worker/profile', input);
  return response.data;
}

export async function updateWorkerProfileApi(input: UpdateWorkerProfileInput): Promise<WorkerProfile> {
  const response = await apiClient.put<WorkerProfile>('/worker/profile', input);
  return response.data;
}

export async function toggleAvailabilityApi(isAvailable: boolean): Promise<WorkerProfile> {
  const response = await apiClient.patch<WorkerProfile>('/worker/profile/availability', { isAvailable });
  return response.data;
}
