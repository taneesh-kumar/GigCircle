import apiClient from './client';
import type { HealthResponse } from '@/types/api';

/** GET /api/healthz */
export async function getHealthCheck(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>('/healthz');
  return data;
}
