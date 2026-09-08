import type { VerificationStatus, WorkerVerificationResponse } from '@/types/worker-verification';

// Mock verification fixture data for tests
export const mockVerifications: WorkerVerificationResponse[] = [
  {
    id: 1,
    workerId: 101,
    workerName: 'Alice Worker',
    workerEmail: 'alice@gigcircle.com',
    status: 'PENDING_REVIEW',
    submittedAt: '2026-09-07T10:00:00Z',
    createdAt: '2026-09-07T09:00:00Z',
    updatedAt: '2026-09-07T10:00:00Z',
    documents: [
      {
        id: 1,
        verificationId: 1,
        documentType: 'GOVERNMENT_ID',
        fileReference: 'uploads/id_card.pdf',
        status: 'PENDING',
        uploadedAt: '2026-09-07T09:30:00Z',
      },
    ],
  },
  {
    id: 2,
    workerId: 102,
    workerName: 'Bob Worker',
    workerEmail: 'bob@gigcircle.com',
    status: 'VERIFIED',
    submittedAt: '2026-09-06T10:00:00Z',
    reviewedAt: '2026-09-06T12:00:00Z',
    reviewedById: 1,
    reviewedByName: 'System Admin',
    verifiedAt: '2026-09-06T12:00:00Z',
    createdAt: '2026-09-06T09:00:00Z',
    updatedAt: '2026-09-06T12:00:00Z',
    documents: [],
  },
  {
    id: 3,
    workerId: 103,
    workerName: 'Charlie Worker',
    workerEmail: 'charlie@gigcircle.com',
    status: 'SUSPENDED',
    submittedAt: '2026-09-05T10:00:00Z',
    reviewedAt: '2026-09-05T14:00:00Z',
    rejectionReason: 'Policy violation',
    createdAt: '2026-09-05T09:00:00Z',
    updatedAt: '2026-09-05T14:00:00Z',
    documents: [],
  },
];

export function filterVerificationsByStatus(
  records: WorkerVerificationResponse[],
  status: VerificationStatus | 'ALL'
): WorkerVerificationResponse[] {
  if (status === 'ALL') return records;
  return records.filter((v) => v.status === status);
}

export function getAllowedAdminActions(status: VerificationStatus): string[] {
  switch (status) {
    case 'PENDING_REVIEW':
      return ['APPROVE', 'REQUEST_CHANGES', 'REJECT'];
    case 'VERIFIED':
      return ['SUSPEND'];
    case 'SUSPENDED':
      return ['APPROVE'];
    default:
      return [];
  }
}

export function isReasonRequiredForAction(action: string): boolean {
  return ['REQUEST_CHANGES', 'REJECT', 'SUSPEND'].includes(action);
}

export function isValidReasonInput(reason: string): boolean {
  return reason.trim().length > 0;
}
