import apiClient from './client';
import type {
  AdminDismissRequest,
  AdminRequestResponseRequest,
  AdminResolutionRequest,
  CreateDisputeRequest,
  DisputeDetailResponse,
  DisputeResponseRequest,
  DisputeStatus,
} from '@/types/dispute';

// Customer / Worker Participant API calls
export async function createDisputeApi(request: CreateDisputeRequest): Promise<DisputeDetailResponse> {
  const response = await apiClient.post<DisputeDetailResponse>('/disputes', request);
  return response.data;
}

export async function getMyDisputesApi(): Promise<DisputeDetailResponse[]> {
  const response = await apiClient.get<DisputeDetailResponse[]>('/disputes/my-disputes');
  return response.data;
}

export async function getDisputeForJobApi(jobId: number): Promise<DisputeDetailResponse> {
  const response = await apiClient.get<DisputeDetailResponse>(`/disputes/job/${jobId}`);
  return response.data;
}

export async function getDisputeByIdApi(disputeId: number): Promise<DisputeDetailResponse> {
  const response = await apiClient.get<DisputeDetailResponse>(`/disputes/${disputeId}`);
  return response.data;
}

export async function respondToDisputeApi(
  disputeId: number,
  request: DisputeResponseRequest
): Promise<DisputeDetailResponse> {
  const response = await apiClient.post<DisputeDetailResponse>(`/disputes/${disputeId}/respond`, request);
  return response.data;
}

// Admin Dispute API calls
export async function getAllDisputesAdminApi(status?: DisputeStatus): Promise<DisputeDetailResponse[]> {
  const response = await apiClient.get<DisputeDetailResponse[]>('/admin/disputes', {
    params: status ? { status } : undefined,
  });
  return response.data;
}

export async function getDisputeDetailsAdminApi(disputeId: number): Promise<DisputeDetailResponse> {
  const response = await apiClient.get<DisputeDetailResponse>(`/admin/disputes/${disputeId}`);
  return response.data;
}

export async function adminRequestResponseApi(
  disputeId: number,
  request: AdminRequestResponseRequest
): Promise<DisputeDetailResponse> {
  const response = await apiClient.post<DisputeDetailResponse>(`/admin/disputes/${disputeId}/request-response`, request);
  return response.data;
}

export async function adminReviewDisputeApi(disputeId: number): Promise<DisputeDetailResponse> {
  const response = await apiClient.post<DisputeDetailResponse>(`/admin/disputes/${disputeId}/review`);
  return response.data;
}

export async function adminResolveDisputeApi(
  disputeId: number,
  request: AdminResolutionRequest
): Promise<DisputeDetailResponse> {
  const response = await apiClient.post<DisputeDetailResponse>(`/admin/disputes/${disputeId}/resolve`, request);
  return response.data;
}

export async function adminDismissDisputeApi(
  disputeId: number,
  request: AdminDismissRequest
): Promise<DisputeDetailResponse> {
  const response = await apiClient.post<DisputeDetailResponse>(`/admin/disputes/${disputeId}/dismiss`, request);
  return response.data;
}
