import apiClient from './client';
import type { PlatformInfoResponse } from '@/types/api';

/** GET /api/platform/info */
export async function getPlatformInfo(): Promise<PlatformInfoResponse> {
  const { data } = await apiClient.get<PlatformInfoResponse>('/platform/info');
  return data;
}
