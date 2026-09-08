import apiClient from './client';
import type {
  WorkerVerificationResponse,
  VerificationDocumentResponse,
  VerificationStatus,
} from '@/types/worker-verification';

export async function getAdminVerificationsApi(
  status?: VerificationStatus | string
): Promise<WorkerVerificationResponse[]> {
  const response = await apiClient.get<WorkerVerificationResponse[]>('/admin/verifications', {
    params: status && status !== 'ALL' ? { status } : undefined,
  });
  return response.data;
}

export async function getAdminVerificationByIdApi(
  id: number
): Promise<WorkerVerificationResponse> {
  const response = await apiClient.get<WorkerVerificationResponse>(`/admin/verifications/${id}`);
  return response.data;
}

export async function approveAdminVerificationApi(
  id: number
): Promise<WorkerVerificationResponse> {
  const response = await apiClient.post<WorkerVerificationResponse>(
    `/admin/verifications/${id}/approve`
  );
  return response.data;
}

export async function requestChangesAdminVerificationApi(
  id: number,
  reason: string
): Promise<WorkerVerificationResponse> {
  const response = await apiClient.post<WorkerVerificationResponse>(
    `/admin/verifications/${id}/request-changes`,
    { reason }
  );
  return response.data;
}

export async function rejectAdminVerificationApi(
  id: number,
  reason: string
): Promise<WorkerVerificationResponse> {
  const response = await apiClient.post<WorkerVerificationResponse>(
    `/admin/verifications/${id}/reject`,
    { reason }
  );
  return response.data;
}

export async function suspendAdminVerificationApi(
  id: number,
  reason: string
): Promise<WorkerVerificationResponse> {
  const response = await apiClient.post<WorkerVerificationResponse>(
    `/admin/verifications/${id}/suspend`,
    { reason }
  );
  return response.data;
}

export async function previewAdminDocumentApi(
  verificationId: number,
  documentId: number
): Promise<VerificationDocumentResponse> {
  const response = await apiClient.get<VerificationDocumentResponse>(
    `/admin/verifications/${verificationId}/documents/${documentId}/preview`
  );
  return response.data;
}
