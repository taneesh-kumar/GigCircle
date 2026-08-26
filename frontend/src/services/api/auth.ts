import apiClient from './client';
import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from '@/types/auth';

/** POST /api/auth/register */
export async function registerApi(credentials: RegisterCredentials): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', credentials);
  return data;
}

/** POST /api/auth/login */
export async function loginApi(credentials: LoginCredentials): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
  return data;
}

/** GET /api/auth/me */
export async function getCurrentUserApi(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me');
  return data;
}

/** GET /api/{role}/ping (RBAC Ping) */
export async function pingRoleApi(role: string): Promise<{ status: string; role: string; message: string }> {
  const { data } = await apiClient.get<{ status: string; role: string; message: string }>(`/${role.toLowerCase()}/ping`);
  return data;
}
