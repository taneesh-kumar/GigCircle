import { type ReactNode } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import AccessBoundary from '@/pages/access-boundary';
import NotFound from '@/pages/not-found';
import RoleDashboard from '@/pages/role-dashboard';
import Welcome from '@/pages/welcome';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';

function CustomerDashboard() {
  return <RoleDashboard role="customer" />;
}

function WorkerDashboard() {
  return <RoleDashboard role="worker" />;
}

function AdminDashboard() {
  return <RoleDashboard role="admin" />;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/worker/dashboard" element={<WorkerDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/unauthorized" element={<AccessBoundary />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  return <ErrorBoundary resetKey={location.pathname}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Router />
      </BrowserRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
