import { ServiceCategory, ServiceRequestStatus } from './service-request';

export type JobStatus = 'OPEN' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED';
export type AssignmentStatus = 'UNASSIGNED' | 'ASSIGNED';

export interface JobResponse {
  id: number;
  serviceRequestId: number;
  workerId: number;
  workerName: string;
  customerId: number;
  customerName: string;
  category: ServiceCategory;
  description: string;
  location: string;
  budget: number;
  preferredTime: string;
  jobStatus: JobStatus;
  requestStatus: ServiceRequestStatus;
  createdAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
}
