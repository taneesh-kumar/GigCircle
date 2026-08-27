import apiClient from './client';
import type { CreateServiceRequestInput, ServiceRequest } from '@/types/service-request';

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
