import apiClient from './client';
import type {
  ChatConversationResponse,
  ChatMessageRequest,
  ChatMessageResponse,
} from '@/types/chat';

export async function getConversationForJobApi(jobId: number): Promise<ChatConversationResponse> {
  const response = await apiClient.get<ChatConversationResponse>(`/chat/job/${jobId}`);
  return response.data;
}

export async function getMessagesForJobApi(jobId: number): Promise<ChatMessageResponse[]> {
  const response = await apiClient.get<ChatMessageResponse[]>(`/chat/job/${jobId}/messages`);
  return response.data;
}

export async function sendMessageApi(
  jobId: number,
  request: ChatMessageRequest
): Promise<ChatMessageResponse> {
  const response = await apiClient.post<ChatMessageResponse>(`/chat/job/${jobId}/messages`, request);
  return response.data;
}

export async function markMessagesAsReadApi(jobId: number): Promise<void> {
  await apiClient.post(`/chat/job/${jobId}/read`);
}
