export type VerificationStatus =
  | 'NOT_SUBMITTED'
  | 'PENDING_REVIEW'
  | 'CHANGES_REQUIRED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED';

export type VerificationDocumentType =
  | 'GOVERNMENT_ID'
  | 'PROFILE_PHOTO'
  | 'SKILL_CERTIFICATE'
  | 'OTHER';

export type VerificationDocumentStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export interface VerificationDocumentResponse {
  id: number;
  verificationId: number;
  documentType: VerificationDocumentType;
  fileReference: string;
  status: VerificationDocumentStatus;
  reviewNote?: string | null;
  uploadedAt: string;
}

export interface WorkerVerificationResponse {
  id: number;
  workerId: number;
  workerName: string;
  workerEmail: string;
  status: VerificationStatus;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedById?: number | null;
  reviewedByName?: string | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  documents: VerificationDocumentResponse[];
}

export interface SubmitVerificationDocumentInput {
  documentType: VerificationDocumentType;
  fileReference: string;
}

export interface UpdateVerificationDocumentInput {
  documentType?: VerificationDocumentType;
  fileReference?: string;
}

export const DOCUMENT_TYPE_LABELS: Record<VerificationDocumentType, string> = {
  GOVERNMENT_ID: 'Government Issued ID',
  PROFILE_PHOTO: 'Profile Photo',
  SKILL_CERTIFICATE: 'Skill Certificate',
  OTHER: 'Other Verification Document',
};

export const STATUS_LABELS: Record<VerificationStatus, string> = {
  NOT_SUBMITTED: 'Not Submitted',
  PENDING_REVIEW: 'Pending Review',
  CHANGES_REQUIRED: 'Changes Required',
  VERIFIED: 'Verified Worker',
  REJECTED: 'Verification Rejected',
  SUSPENDED: 'Account Suspended',
};
