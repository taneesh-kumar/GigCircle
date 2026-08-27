import type { ServiceCategory } from './service-request';

export interface WorkerProfile {
  id: number;
  workerId: number;
  workerName: string;
  workerEmail: string;
  workerPhone: string;
  bio: string | null;
  experienceYears: number;
  hourlyRate: number;
  skills: string[];
  serviceCategories: ServiceCategory[];
  available: boolean;
  serviceLocation: string | null;
  serviceRadiusKm: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkerProfileInput {
  bio?: string;
  experienceYears: number;
  hourlyRate: number;
  skills: string[];
  serviceCategories: ServiceCategory[];
  isAvailable?: boolean;
  serviceLocation?: string;
  serviceRadiusKm?: number;
}

export interface UpdateWorkerProfileInput {
  bio?: string;
  experienceYears: number;
  hourlyRate: number;
  skills: string[];
  serviceCategories: ServiceCategory[];
  isAvailable?: boolean;
  serviceLocation?: string;
  serviceRadiusKm?: number;
}
