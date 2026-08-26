import { AlertTriangle, Check, RefreshCw, Server } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { getHealthCheck, getPlatformInfo } from '@/services/api';

export function FoundationStatus({ compact = false }: { compact?: boolean }) {
  const healthQuery = useApi(getHealthCheck);

  if (healthQuery.isLoading) {
    return (
      <div className={compact ? 'flex items-center gap-2 text-xs text-muted-foreground' : 'rounded-2xl border border-border bg-card p-4'}>
        <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/35" />
        <span>{compact ? 'Checking foundation' : 'Checking platform foundation…'}</span>
      </div>
    );
  }

  if (healthQuery.isError) {
    return (
      <div className={compact ? 'flex items-center gap-2 text-xs text-destructive' : 'rounded-2xl border border-destructive/30 bg-destructive/5 p-4'}>
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="flex-1">{compact ? 'Foundation unavailable' : 'The platform foundation could not be reached.'}</span>
        {!compact && (
          <button
            type="button"
            data-testid="button-retry-health"
            onClick={() => void healthQuery.refetch()}
            className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        )}
      </div>
    );
  }

  const health = healthQuery.data;
  return (
    <div className={compact ? 'flex items-center gap-2 text-xs text-sidebar-foreground/65' : 'rounded-2xl border border-border bg-card p-4'}>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-primary">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
      <div className={compact ? '' : 'flex-1'}>
        <p className="text-sm font-semibold">{compact ? 'Foundation online' : 'Foundation is online'}</p>
        {!compact && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {health?.service ?? 'cooperative-gig-platform'} · database {health?.databaseConfigured ? 'configured' : 'pending'}
          </p>
        )}
      </div>
      {!compact && <Server className="h-4 w-4 text-muted-foreground" />}
    </div>
  );
}

export function PlatformInfoState() {
  const platformQuery = useApi(getPlatformInfo);

  if (platformQuery.isLoading) {
    return (
      <div className="space-y-3" aria-label="Loading platform information" data-testid="status-platform-loading">
        <div className="h-3 w-32 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-64 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  if (platformQuery.isError) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive" data-testid="status-platform-error">
        <AlertTriangle className="h-4 w-4" /> Platform information is unavailable.
        <button type="button" data-testid="button-retry-platform" onClick={() => void platformQuery.refetch()} className="focus-ring font-semibold underline underline-offset-4">Try again</button>
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground" data-testid="text-platform-success">
      {platformQuery.data?.phase ?? 'Phase 1'} foundation · {platformQuery.data?.architecture?.length ?? 0} architectural layers ready
    </p>
  );
}