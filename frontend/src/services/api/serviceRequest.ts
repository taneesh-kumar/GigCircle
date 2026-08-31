import apiClient from './client';
import type { CreateServiceRequestInput, ServiceRequest, ServiceCategory, NearbyWorkerSearchResult } from '@/types/service-request';

export async function createServiceRequestApi(input: CreateServiceRequestInput): Promise<ServiceRequest> {
  const response = await apiClient.post<ServiceRequest>('/customer/requests', input);
  return response.data;
}

export async function getServiceRequestsApi(): Promise<ServiceRequest[]> {
  const response = await apiClient.get<ServiceRequest[]>('/customer/requests');
  return response.data;
}

export async function getServiceRequestDetailApi(id: number): Promise<ServiceRequest> {
  const response = await apiClient.get<ServiceRequest>(`/customer/requests/${id}`);
  return response.data;
}

export async function cancelServiceRequestApi(id: number): Promise<ServiceRequest> {
  const response = await apiClient.patch<ServiceRequest>(`/customer/requests/${id}/cancel`);
  return response.data;
}

export async function getNearbyWorkersApi(params: {
  latitude?: number | null;
  longitude?: number | null;
  category?: ServiceCategory;
  radiusKm?: number;
}): Promise<NearbyWorkerSearchResult> {
  const response = await apiClient.get<NearbyWorkerSearchResult>('/customer/requests/nearby-workers', { params });
  return response.data;
}

export async function getNearbyWorkersForRequestApi(id: number): Promise<NearbyWorkerSearchResult> {
  const response = await apiClient.get<NearbyWorkerSearchResult>(`/customer/requests/${id}/nearby-workers`);
  return response.data;
}

