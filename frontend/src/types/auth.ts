export type Role = 'CUSTOMER' | 'WORKER' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'CUSTOMER' | 'WORKER';
}
