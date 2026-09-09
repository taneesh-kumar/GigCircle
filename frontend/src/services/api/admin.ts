import api from './client';
import type {
  AdminActivity,
  AdminJob,
  AdminRating,
  AdminServiceRequest,
  AdminUser,
  AdminUserDetail,
  AdminWorker,
  OperationalAlertResponse,
  PageResponse,
  PlatformOverviewSummary,
  ServiceDemandResponse,
} from '@/types/admin';

export const getAdminOverviewApi = async (): Promise<PlatformOverviewSummary> => {
  const response = await api.get<PlatformOverviewSummary>('/admin/overview');
  return response.data;
};

export const getAdminUsersApi = async (params?: {
  role?: string;
  status?: string;
  active?: boolean;
  search?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<AdminUser>> => {
  const response = await api.get<PageResponse<AdminUser>>('/admin/users', { params });
  return response.data;
};

export const getAdminUserDetailApi = async (userId: number): Promise<AdminUserDetail> => {
  const response = await api.get<AdminUserDetail>(`/admin/users/${userId}`);
  return response.data;
};

export const getAdminWorkersApi = async (): Promise<AdminWorker[]> => {
  const response = await api.get<AdminWorker[]>('/admin/workers');
  return response.data;
};

export const activateWorkerApi = async (workerId: number): Promise<AdminWorker> => {
  const response = await api.post<AdminWorker>(`/admin/workers/${workerId}/activate`);
  return response.data;
};

export const deactivateWorkerApi = async (workerId: number): Promise<AdminWorker> => {
  const response = await api.post<AdminWorker>(`/admin/workers/${workerId}/deactivate`);
  return response.data;
};

export const activateUserApi = async (userId: number): Promise<AdminUser> => {
  const response = await api.post<AdminUser>(`/admin/users/${userId}/activate`);
  return response.data;
};

export const deactivateUserApi = async (userId: number, reason: string): Promise<AdminUser> => {
  const response = await api.post<AdminUser>(`/admin/users/${userId}/deactivate`, { reason });
  return response.data;
};

export const suspendUserApi = async (userId: number, reason: string): Promise<AdminUser> => {
  const response = await api.post<AdminUser>(`/admin/users/${userId}/suspend`, { reason });
  return response.data;
};

export const reactivateUserApi = async (userId: number): Promise<AdminUser> => {
  const response = await api.post<AdminUser>(`/admin/users/${userId}/reactivate`);
  return response.data;
};

export const getAdminServiceRequestsApi = async (): Promise<AdminServiceRequest[]> => {
  const response = await api.get<AdminServiceRequest[]>('/admin/service-requests');
  return response.data;
};

export const getAdminJobsApi = async (status?: string): Promise<AdminJob[]> => {
  const response = await api.get<AdminJob[]>('/admin/jobs', { params: status ? { status } : undefined });
  return response.data;
};

export const getServiceDemandApi = async (): Promise<ServiceDemandResponse[]> => {
  const response = await api.get<ServiceDemandResponse[]>('/admin/analytics/service-demand');
  return response.data;
};

export const getOperationalAlertsApi = async (): Promise<OperationalAlertResponse[]> => {
  const response = await api.get<OperationalAlertResponse[]>('/admin/alerts');
  return response.data;
};

export const getAdminRatingsApi = async (): Promise<AdminRating[]> => {
  const response = await api.get<AdminRating[]>('/admin/ratings');
  return response.data;
};

export const getAdminActivityApi = async (): Promise<AdminActivity[]> => {
  const response = await api.get<AdminActivity[]>('/admin/activity');
  return response.data;
};

