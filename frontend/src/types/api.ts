/** TypeScript interfaces matching the Spring Boot DTOs. */

export interface HealthResponse {
  status: string;
  service: string;
  databaseConfigured: boolean;
}

export interface RoleRoute {
  role: string;
  route: string;
  description: string;
}

export interface PlatformInfoResponse {
  name: string;
  tagline: string;
  architecture: string[];
  roles: RoleRoute[];
  phase: string;
}
