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
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  city?: string | null;
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
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
  city?: string;
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
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
  city?: string;
}
