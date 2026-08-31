import type { JobStatus } from './worker-job';

export type ServiceCategory =
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'CLEANING'
  | 'CARPENTRY'
  | 'APPLIANCE_REPAIR'
  | 'PAINTING'
  | 'GARDENING'
  | 'OTHER';

export type ServiceRequestStatus = 'OPEN' | 'CANCELLED';
export type AssignmentStatus = 'UNASSIGNED' | 'ASSIGNED';

export interface ServiceRequest {
  id: number;
  category: ServiceCategory;
  description: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  city?: string | null;
  budget: number;
  preferredTime: string;
  status: ServiceRequestStatus;
  createdAt: string;
  updatedAt: string;
  customerId: number;
  customerName: string;
  assignmentStatus?: AssignmentStatus;
  jobId?: number;
  workerId?: number;
  workerName?: string;
  jobStatus?: JobStatus;
  startedAt?: string;
  completedAt?: string;
  workerAverageRating?: number;
  workerTotalRatings?: number;
  isRated?: boolean;
}

export interface CreateServiceRequestInput {
  category: ServiceCategory;
  description: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
  city?: string;
  budget: number;
  preferredTime: string;
}

export const CATEGORY_LABELS: Record<ServiceCategory, { label: string; description: string }> = {
  PLUMBING: { label: 'Plumbing', description: 'Pipes, leaks, drains, and fixtures' },
  ELECTRICAL: { label: 'Electrical', description: 'Wiring, switches, lights, and panels' },
  CLEANING: { label: 'Cleaning', description: 'Deep home, kitchen, and bathroom cleaning' },
  CARPENTRY: { label: 'Carpentry', description: 'Furniture repair, wood works, and fittings' },
  APPLIANCE_REPAIR: { label: 'Appliance Repair', description: 'AC, fridge, washing machine, microwave' },
  PAINTING: { label: 'Painting', description: 'Interior/exterior walls and touch-ups' },
  GARDENING: { label: 'Gardening', description: 'Lawn care, pruning, and plant maintenance' },
  OTHER: { label: 'Other', description: 'General household tasks and custom requests' },
};

export interface NearbyWorker {
  workerId: number;
  name: string;
  distanceKm: number;
  rating: number;
  totalRatings: number;
  available: boolean;
  experienceYears?: number;
  hourlyRate?: number;
  serviceCategories?: ServiceCategory[];
  skills?: string[];
  matchedSearchRadiusKm?: number;
}

export interface NearbyWorkerSearchResult {
  workers: NearbyWorker[];
  effectiveRadiusKm: number;
  tierMessage: string;
}

export interface RecommendedWorker extends NearbyWorker {
  matchReasons?: string[];
  suitabilityBadge?: string;
  suitabilityScore?: number;
}

export interface WorkerRecommendationResult {
  topRecommendation?: RecommendedWorker | null;
  otherWorkers: RecommendedWorker[];
  effectiveSearchRadiusKm: number;
  tierMessage: string;
}

