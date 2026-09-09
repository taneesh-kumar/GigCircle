import React, { useState } from 'react';
import type { DisputeDetailResponse } from '@/types/dispute';
import {
  adminDismissDisputeApi,
  adminRequestResponseApi,
  adminResolveDisputeApi,
  adminReviewDisputeApi,
} from '@/services/api/dispute';
import { DisputeDetailPanel } from './DisputeDetailPanel';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, FileText, HelpCircle, RefreshCw, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AdminDisputeControlsProps {
  dispute: DisputeDetailResponse;
  onUpdated: () => void;
}

export const AdminDisputeControls: React.FC<AdminDisputeControlsProps> = ({ dispute, onUpdated }) => {
  const [activeAction, setActiveAction] = useState<'REQUEST' | 'RESOLVE' | 'DISMISS' | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isClosed = dispute.status === 'RESOLVED' || dispute.status === 'DISMISSED';

  const handleReview = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await adminReviewDisputeApi(dispute.id);
      onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to move dispute under review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionNote.trim() || submitting || isClosed || !activeAction) return;

    setSubmitting(true);
    setError(null);

    try {
      if (activeAction === 'REQUEST') {
        await adminRequestResponseApi(dispute.id, { message: actionNote.trim() });
      } else if (activeAction === 'RESOLVE') {
        await adminResolveDisputeApi(dispute.id, { resolutionNote: actionNote.trim() });
      } else if (activeAction === 'DISMISS') {
        await adminDismissDisputeApi(dispute.id, { dismissalNote: actionNote.trim() });
      }
      setActiveAction(null);
      setActionNote('');
      onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to perform ${activeAction.toLowerCase()} action`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dispute details */}
      <DisputeDetailPanel dispute={dispute} onRefresh={onUpdated} />

      {/* Admin Action Box */}
      <div className="border rounded-lg p-4 bg-card space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <span>Administrative Controls</span>
        </h3>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Action Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isClosed ? (
          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            This dispute is closed ({dispute.status}). Administrative actions are disabled.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleReview}
                disabled={submitting || dispute.status === 'UNDER_REVIEW'}
              >
                {submitting && <RefreshCw className="h-4 w-4 animate-spin mr-1" />}
                Move to Under Review
              </Button>

              <Button
                variant="secondary"
                onClick={() => {
                  setActiveAction('REQUEST');
                  setActionNote('');
                }}
                disabled={submitting}
              >
                <HelpCircle className="h-4 w-4 mr-1" />
                Request Information
              </Button>

              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  setActiveAction('RESOLVE');
                  setActionNote('');
                }}
                disabled={submitting}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Resolve Dispute
              </Button>

              <Button
                variant="destructive"
                onClick={() => {
                  setActiveAction('DISMISS');
                  setActionNote('');
                }}
                disabled={submitting}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Dismiss Dispute
              </Button>
            </div>

            {activeAction && (
              <form onSubmit={handleExecuteAction} className="border p-4 rounded-md bg-muted/20 space-y-3">
                <h4 className="font-medium text-sm">
                  {activeAction === 'REQUEST' && 'Request Response Message'}
                  {activeAction === 'RESOLVE' && 'Resolution Note (Required)'}
                  {activeAction === 'DISMISS' && 'Dismissal Note (Required)'}
                </h4>
                <Textarea
                  placeholder="Enter detailed note/reason..."
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  required
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setActiveAction(null)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!actionNote.trim() || submitting}>
                    {submitting && <RefreshCw className="h-4 w-4 animate-spin mr-1" />}
                    Confirm {activeAction}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
