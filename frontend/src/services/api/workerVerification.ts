import apiClient from './client';
import type {
  WorkerVerificationResponse,
  VerificationDocumentResponse,
  SubmitVerificationDocumentInput,
  UpdateVerificationDocumentInput,
} from '@/types/worker-verification';

export async function getWorkerVerificationApi(): Promise<WorkerVerificationResponse> {
  const response = await apiClient.get<WorkerVerificationResponse>('/worker/verification');
  return response.data;
}

export async function createWorkerVerificationApi(): Promise<WorkerVerificationResponse> {
  const response = await apiClient.post<WorkerVerificationResponse>('/worker/verification');
  return response.data;
}

export async function submitVerificationDocumentApi(
  input: SubmitVerificationDocumentInput
): Promise<VerificationDocumentResponse> {
  const response = await apiClient.post<VerificationDocumentResponse>(
    '/worker/verification/documents',
    input
  );
  return response.data;
}

export async function updateVerificationDocumentApi(
  id: number,
  input: UpdateVerificationDocumentInput
): Promise<VerificationDocumentResponse> {
  const response = await apiClient.put<VerificationDocumentResponse>(
    `/worker/verification/documents/${id}`,
    input
  );
  return response.data;
}

export async function resubmitWorkerVerificationApi(): Promise<WorkerVerificationResponse> {
  const response = await apiClient.post<WorkerVerificationResponse>('/worker/verification/resubmit');
  return response.data;
}

export async function previewVerificationDocumentApi(
  id: number
): Promise<VerificationDocumentResponse> {
  const response = await apiClient.get<VerificationDocumentResponse>(
    `/worker/verification/documents/${id}/preview`
  );
  return response.data;
}
