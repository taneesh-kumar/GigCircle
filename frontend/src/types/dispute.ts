import { UserResponse } from './chat';

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'ACTION_REQUIRED' | 'RESOLVED' | 'DISMISSED';

export type DisputeReason =
  | 'QUALITY_ISSUE'
  | 'NON_DELIVERY'
  | 'PAYMENT_ISSUE'
  | 'COMMUNICATION_ISSUE'
  | 'SAFETY_VIOLATION'
  | 'OTHER';

export interface CreateDisputeRequest {
  jobId: number;
  reason: DisputeReason;
  description: string;
}

export interface DisputeResponseRequest {
  message: string;
}

export interface AdminResolutionRequest {
  resolutionNote: string;
}

export interface AdminDismissRequest {
  dismissalNote: string;
}

export interface AdminRequestResponseRequest {
  message: string;
}

export interface DisputeHistoryResponse {
  id: number;
  disputeId: number;
  actor: UserResponse;
  oldStatus?: DisputeStatus;
  newStatus: DisputeStatus;
  comment?: string;
  createdAt: string;
}

export interface DisputeEvidenceResponse {
  id: number;
  disputeId: number;
  uploadedBy: UserResponse;
  fileReference: string;
  originalFileName?: string;
  contentType?: string;
  fileSize?: number;
  createdAt: string;
}

export interface DisputeDetailResponse {
  id: number;
  jobId: number;
  raisedBy: UserResponse;
  againstUser: UserResponse;
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  resolutionNotes?: string;
  resolvedBy?: UserResponse;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  history: DisputeHistoryResponse[];
  evidence: DisputeEvidenceResponse[];
}
