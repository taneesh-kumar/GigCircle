import React, { useState } from 'react';
import { createDisputeApi } from '@/services/api/dispute';
import type { DisputeReason, DisputeDetailResponse } from '@/types/dispute';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';

interface DisputeCreateFormProps {
  jobId: number;
  onSuccess: (dispute: DisputeDetailResponse) => void;
  onCancel?: () => void;
}

export const DisputeCreateForm: React.FC<DisputeCreateFormProps> = ({ jobId, onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isWorker = user?.role?.toLowerCase() === 'worker';

  const [reason, setReason] = useState<DisputeReason>(isWorker ? 'PAYMENT_ISSUE' : 'QUALITY_ISSUE');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError(t('validation.required'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await createDisputeApi({
        jobId,
        reason,
        description: description.trim(),
      });
      onSuccess(result);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(t('errors.disputeConflict', 'An active dispute already exists for this job.'));
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || t('errors.invalidRequest', 'Invalid dispute request.'));
      } else if (err.response?.status === 403) {
        setError(t('errors.unauthorized'));
      } else {
        setError(err.response?.data?.message || t('errors.serverError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border border-amber-200/80 rounded-2xl p-5 bg-amber-50/40 shadow-2xs">
      <div className="flex items-center gap-3 border-b border-amber-200/60 pb-3.5">
        <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-extrabold text-sm text-slate-900">
            {isWorker ? t('worker.assigned.reportIssueBtn') : t('customer.requests.dispute')}
          </h3>
          <p className="text-xs text-slate-500">
            {isWorker
              ? t('modals.dispute.subtitle')
              : t('modals.dispute.subtitle')}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-xl bg-rose-50 border-rose-200 text-rose-800">
          <AlertCircle className="h-4 w-4 text-rose-600" />
          <AlertTitle className="text-xs font-bold">{t('common.error')}</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
          {t('modals.dispute.reasonLabel')}
        </label>
        <Select value={reason} onValueChange={(val) => setReason(val as DisputeReason)}>
          <SelectTrigger className="rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-800">
            <SelectValue placeholder={t('modals.dispute.reasonLabel')} />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {isWorker ? (
              <>
                <SelectItem value="PAYMENT_ISSUE">{t('status.dispute.PAYMENT_ISSUE', 'Customer Refusing Payment or Delaying Payout')}</SelectItem>
                <SelectItem value="QUALITY_ISSUE">{t('status.dispute.QUALITY_ISSUE', 'Demanded Extra Work Beyond Agreed Scope')}</SelectItem>
                <SelectItem value="COMMUNICATION_ISSUE">{t('status.dispute.COMMUNICATION_ISSUE', 'Customer Unreachable / Incorrect Address & Directions')}</SelectItem>
                <SelectItem value="SAFETY_VIOLATION">{t('status.dispute.SAFETY_VIOLATION', 'Unsafe Work Environment or Customer Misbehavior')}</SelectItem>
                <SelectItem value="NON_DELIVERY">{t('status.dispute.NON_DELIVERY', 'Customer Not Present / Entry Denied Upon Arrival')}</SelectItem>
                <SelectItem value="OTHER">{t('status.dispute.OTHER', 'Other Worker Concern')}</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="QUALITY_ISSUE">{t('status.dispute.QUALITY_ISSUE', 'Poor Service Quality or Incomplete Work')}</SelectItem>
                <SelectItem value="NON_DELIVERY">{t('status.dispute.NON_DELIVERY', 'Worker Did Not Show Up / Non-Delivery')}</SelectItem>
                <SelectItem value="PAYMENT_ISSUE">{t('status.dispute.PAYMENT_ISSUE', 'Payment Dispute or Extra Unagreed Fees')}</SelectItem>
                <SelectItem value="COMMUNICATION_ISSUE">{t('status.dispute.COMMUNICATION_ISSUE', 'Worker Unresponsive or Unprofessional')}</SelectItem>
                <SelectItem value="SAFETY_VIOLATION">{t('status.dispute.SAFETY_VIOLATION', 'Safety, Property Damage or Misbehavior')}</SelectItem>
                <SelectItem value="OTHER">{t('status.dispute.OTHER', 'Other Customer Issue')}</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
          {t('modals.dispute.descriptionLabel')}
        </label>
        <Textarea
          placeholder={t('modals.dispute.descriptionPlaceholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={4}
          required
          className="rounded-xl border-slate-200 bg-white text-xs text-slate-900 focus:ring-amber-500"
        />
        <p className="text-[10px] text-slate-400 font-semibold text-right">{description.length}/2000</p>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {t('common.cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={!description.trim() || loading}
          className="rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 text-xs font-extrabold shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
        >
          {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
          {loading ? t('modals.dispute.submittingBtn') : t('modals.dispute.submitBtn')}
        </button>
      </div>
    </form>
  );
};
