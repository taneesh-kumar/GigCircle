import { Role } from './auth';
import { ServiceCategory, ServiceRequestStatus } from './service-request';
import { JobStatus } from './worker-job';

export interface PlatformOverviewSummary {
  totalUsers: number;
  totalCustomers: number;
  totalWorkers: number;
  totalServiceRequests: number;
  openRequests: number;
  assignedRequests: number;
  completedJobs: number;
  cancelledRequests: number;
  totalRatings: number;
  averageRating: number;
  totalGrossVolume: number;
  totalPlatformFees: number;
  totalWorkerEarnings: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface AdminWorker {
  workerId: number;
  profileId: number;
  name: string;
  email: string;
  phone: string;
  bio?: string;
  experienceYears: number;
  hourlyRate: number;
  skills: string[];
  serviceCategories: ServiceCategory[];
  available: boolean;
  serviceLocation?: string;
  serviceRadiusKm?: number;
  active: boolean;
  averageRating: number;
  totalRatings: number;
  createdAt: string;
}

export interface AdminServiceRequest {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  category: ServiceCategory;
  description: string;
  budget: number;
  preferredTime: string;
  location: string;
  status: ServiceRequestStatus;
  assignmentStatus: 'ASSIGNED' | 'UNASSIGNED';
  assignedWorkerId?: number;
  assignedWorkerName?: string;
  createdAt: string;
}

export interface AdminJob {
  id: number;
  serviceRequestId: number;
  customerId: number;
  customerName: string;
  workerId: number;
  workerName: string;
  status: JobStatus;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface AdminRating {
  id: number;
  jobId: number;
  customerId: number;
  customerName: string;
  workerId: number;
  workerName: string;
  score: number;
  review?: string;
  createdAt: string;
}

export interface AdminActivity {
  id: number;
  actorUserId: number;
  actorRole: Role;
  actionType: string;
  entityType: string;
  entityId?: number;
  description: string;
  createdAt: string;
}
