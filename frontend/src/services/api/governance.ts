import apiClient from './client';
import type { PageResponse } from '@/types/admin';
import type {
  CastVoteRequest,
  CreateProposalRequest,
  OpenProposalRequest,
  ProposalCategory,
  ProposalResponse,
  ProposalResultResponse,
  ProposalStatus,
} from '@/types/governance';

export async function createProposalApi(request: CreateProposalRequest): Promise<ProposalResponse> {
  const response = await apiClient.post<ProposalResponse>('/governance/proposals', request);
  return response.data;
}

export async function getProposalsApi(params?: {
  status?: ProposalStatus;
  category?: ProposalCategory;
  page?: number;
  size?: number;
}): Promise<PageResponse<ProposalResponse>> {
  const response = await apiClient.get<PageResponse<ProposalResponse>>('/governance/proposals', {
    params,
  });
  return response.data;
}

export async function getProposalByIdApi(id: number): Promise<ProposalResponse> {
  const response = await apiClient.get<ProposalResponse>(`/governance/proposals/${id}`);
  return response.data;
}

export async function openProposalApi(id: number, request?: OpenProposalRequest): Promise<ProposalResponse> {
  const response = await apiClient.post<ProposalResponse>(`/governance/proposals/${id}/open`, request || {});
  return response.data;
}

export async function castVoteApi(id: number, request: CastVoteRequest): Promise<ProposalResponse> {
  const response = await apiClient.post<ProposalResponse>(`/governance/proposals/${id}/vote`, request);
  return response.data;
}

export async function closeProposalApi(id: number): Promise<ProposalResultResponse> {
  const response = await apiClient.post<ProposalResultResponse>(`/governance/proposals/${id}/close`);
  return response.data;
}

export async function getProposalResultsApi(id: number): Promise<ProposalResultResponse> {
  const response = await apiClient.get<ProposalResultResponse>(`/governance/proposals/${id}/results`);
  return response.data;
}
