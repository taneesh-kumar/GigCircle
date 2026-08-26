import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types/auth';
import { BrandMark } from './platform-shell';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="paper-grain flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <BrandMark />
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          <p className="text-xs font-medium text-muted-foreground">Verifying authenticated session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
