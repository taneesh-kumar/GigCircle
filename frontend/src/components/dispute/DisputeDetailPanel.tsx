import React, { useState } from 'react';
import type { DisputeDetailResponse } from '@/types/dispute';
import { useAuth } from '@/context/AuthContext';
import { respondToDisputeApi } from '@/services/api/dispute';
import { DisputeStatusBadge } from './DisputeStatusBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Clock, History, MessageSquare, RefreshCw, User, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';

interface DisputeDetailPanelProps {
  dispute: DisputeDetailResponse;
  onRefresh?: () => void;
}

export const DisputeDetailPanel: React.FC<DisputeDetailPanelProps> = ({ dispute, onRefresh }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [responseMsg, setResponseMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isClosed = dispute.status === 'RESOLVED' || dispute.status === 'DISMISSED';
  const isAdmin = user?.role === 'ADMIN';

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseMsg.trim() || submitting || isClosed) return;

    setSubmitting(true);
    setError(null);

    try {
      await respondToDisputeApi(dispute.id, { message: responseMsg.trim() });
      setResponseMsg('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.message || t('errors.serverError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 border rounded-lg p-6 bg-card text-card-foreground shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">{t('dispute.panelTitle', { id: dispute.id, defaultValue: `Dispute #${dispute.id}` })}</h2>
            <DisputeStatusBadge status={dispute.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">{t('dispute.associatedJob', { id: dispute.jobId, defaultValue: `Associated with Job #${dispute.jobId}` })}</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>{t('dispute.created', 'Created')}: {new Date(dispute.createdAt).toLocaleString()}</p>
          <p>{t('dispute.updated', 'Updated')}: {new Date(dispute.updatedAt).toLocaleString()}</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Primary Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-md">
        <div>
          <span className="text-xs font-semibold uppercase text-muted-foreground">{t('dispute.raisedBy', 'Raised By')}</span>
          <div className="flex items-center gap-2 mt-1">
            <User className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">{dispute.raisedBy.name} ({dispute.raisedBy.role})</span>
          </div>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase text-muted-foreground">{t('dispute.againstUser', 'Against User')}</span>
          <div className="flex items-center gap-2 mt-1">
            <User className="h-4 w-4 text-destructive" />
            <span className="font-medium text-sm">{dispute.againstUser.name} ({dispute.againstUser.role})</span>
          </div>
        </div>
        <div className="md:col-span-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">{t('modals.dispute.reasonLabel')}</span>
          <p className="font-medium text-sm mt-1">{t(`status.dispute.${dispute.reason}`, dispute.reason.replace(/_/g, ' '))}</p>
        </div>
        <div className="md:col-span-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">{t('modals.dispute.descriptionLabel')}</span>
          <p className="text-sm mt-1 whitespace-pre-wrap">{dispute.description}</p>
        </div>
      </div>

      {/* Resolution or Dismissal Note */}
      {(dispute.resolutionNotes || dispute.resolvedBy) && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
            <ShieldAlert className="h-5 w-5" />
            <span>{t('dispute.resolutionSummary', 'Resolution Summary')}</span>
          </div>
          {dispute.resolutionNotes && (
            <p className="text-sm text-emerald-900 dark:text-emerald-200 whitespace-pre-wrap">
              {dispute.resolutionNotes}
            </p>
          )}
          {dispute.resolvedBy && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              {t('dispute.resolvedByInfo', {
                name: dispute.resolvedBy.name,
                date: dispute.resolvedAt ? new Date(dispute.resolvedAt).toLocaleString() : 'N/A',
                defaultValue: `Resolved by ${dispute.resolvedBy.name} on ${dispute.resolvedAt ? new Date(dispute.resolvedAt).toLocaleString() : 'N/A'}`
              })}
            </p>
          )}
        </div>
      )}

      {/* Timeline / History */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 font-semibold text-md border-b pb-2">
          <History className="h-5 w-5 text-primary" />
          <span>{t('dispute.timelineTitle', 'Dispute History Timeline')}</span>
        </div>
        <div className="space-y-3 pl-2 border-l-2 border-muted ml-2">
          {dispute.history.map((h) => (
            <div key={h.id} className="relative pl-4 text-sm space-y-1">
              <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{h.actor.name} ({h.actor.role})</span>
                <span>•</span>
                <Clock className="h-3 w-3" />
                <span>{new Date(h.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                {h.oldStatus && <span className="text-xs text-muted-foreground">{t(`status.dispute.${h.oldStatus}`, h.oldStatus)} →</span>}
                <DisputeStatusBadge status={h.newStatus} />
              </div>
              {h.comment && <p className="text-muted-foreground italic text-xs mt-1">"{h.comment}"</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Participant Response Form (Hidden for admins or closed disputes) */}
      {!isAdmin && !isClosed && (
        <form onSubmit={handleRespond} className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span>{t('dispute.respondTitle', 'Respond to Dispute')}</span>
          </div>
          <Textarea
            placeholder={t('dispute.respondPlaceholder', 'Provide additional details or response...')}
            value={responseMsg}
            onChange={(e) => setResponseMsg(e.target.value)}
            maxLength={2000}
            rows={3}
            disabled={submitting}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={!responseMsg.trim() || submitting}>
              {submitting && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
              {t('dispute.submitResponse', 'Submit Response')}
            </Button>
          </div>
        </form>
      )}

      {isClosed && !isAdmin && (
        <div className="p-3 bg-muted rounded-md text-xs text-center text-muted-foreground">
          {t('dispute.closedNotice', 'This dispute is closed. Further participant responses are disabled.')}
        </div>
      )}
    </div>
  );
};
