import { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Clock, MapPin, X, Loader2, Ban, CheckCircle2, ShieldAlert, IndianRupee, Clock3, Activity, User } from 'lucide-react';
import { cancelServiceRequestApi } from '@/services/api';
import { CATEGORY_LABELS, type ServiceRequest } from '@/types/service-request';
import { useToast } from '@/hooks/use-toast';

interface RequestDetailModalProps {
  request: ServiceRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: () => void;
  showCancelButton?: boolean;
}

export function RequestDetailModal({ request, isOpen, onClose, onStatusChange, showCancelButton = false }: RequestDetailModalProps) {
  const { toast } = useToast();
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsConfirmingCancel(false);
      setIsCancelling(false);
      setCancelError(null);
    }
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const categoryInfo = CATEGORY_LABELS[request.category] || { label: request.category, description: '' };
  const jobStatusStr = request.jobStatus || (request.workerId ? 'ACCEPTED' : request.status);
  const isCancellable = showCancelButton && request.status === 'OPEN' && !request.jobStatus && !request.workerId;

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const handleCancel = async () => {
    setCancelError(null);
    setIsCancelling(true);

    try {
      await cancelServiceRequestApi(request.id);
      toast({
        title: 'Request Cancelled',
        description: 'Your service request has been successfully cancelled.',
      });
      setIsConfirmingCancel(false);
      onStatusChange();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to cancel request.';
      setCancelError(msg);
      toast({
        title: 'Cancellation Failed',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs animate-rise-in">
      <div
        className="relative w-full max-w-xl rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl md:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Request #{request.id}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                  jobStatusStr === 'COMPLETED'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : jobStatusStr === 'IN_PROGRESS'
                    ? 'bg-blue-50 border border-blue-200 text-blue-700'
                    : jobStatusStr === 'ACCEPTED'
                    ? 'bg-amber-50 border border-amber-200 text-amber-700'
                    : jobStatusStr === 'CANCELLED'
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-slate-50 border border-slate-200 text-slate-700'
                }`}
              >
                {jobStatusStr === 'COMPLETED' ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                ) : jobStatusStr === 'IN_PROGRESS' ? (
                  <Activity className="h-3 w-3 text-blue-600 animate-pulse" />
                ) : (
                  <Clock3 className="h-3 w-3 text-amber-600" />
                )}
                {jobStatusStr}
              </span>
            </div>
            <h2 id="detail-modal-title" className="font-display text-2xl font-black text-slate-900">
              {categoryInfo.label}
            </h2>
          </div>
          <button
            onClick={() => {
              setIsConfirmingCancel(false);
              onClose();
            }}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {cancelError && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/60 p-4 text-xs text-red-600">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{cancelError}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="mt-6 space-y-6">
          {/* Description */}
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Description</span>
            <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-xs sm:text-sm leading-relaxed text-slate-800 font-medium">
              {request.description}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-emerald-200/80 hover:shadow-xs transition-all flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Location</span>
                <p className="mt-0.5 text-sm font-extrabold text-slate-950">{request.location}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-emerald-200/80 hover:shadow-xs transition-all flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
                <IndianRupee className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Budget</span>
                <p className="mt-0.5 text-base font-black text-emerald-700 font-mono">₹{request.budget.toLocaleString()}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-emerald-200/80 hover:shadow-xs transition-all flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Preferred Time</span>
                <p className="mt-0.5 text-xs font-extrabold text-slate-950">{formatDateTime(request.preferredTime)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-emerald-200/80 hover:shadow-xs transition-all flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 border border-slate-200/60 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Requested On</span>
                <p className="mt-0.5 text-xs font-extrabold text-slate-950">{formatDateTime(request.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Assigned Worker Info Section */}
          {request.workerName && (
            <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100/80 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                  {request.workerName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Assigned Worker</span>
                  <span className="text-sm font-bold text-slate-900">{request.workerName}</span>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-[10px] font-extrabold uppercase text-emerald-800 border border-emerald-200">
                Matched & Verified
              </span>
            </div>
          )}

          {/* Confirmation Box when Cancelling */}
          {isConfirmingCancel && (
            <div className="animate-rise-in rounded-2xl border border-red-200 bg-red-50/60 p-4 text-xs">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-red-800">Cancel this request?</h4>
                  <p className="mt-1 text-red-700/80 leading-relaxed">
                    This request has not yet been assigned to a worker. Once cancelled, it will remain in your record as CANCELLED.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsConfirmingCancel(false)}
                  disabled={isCancelling}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-50 transition-colors text-xs"
                >
                  Keep Request
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700 transition-colors text-xs shadow-sm"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cancelling...
                    </>
                  ) : (
                    'Confirm Cancellation'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => {
              setIsConfirmingCancel(false);
              onClose();
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            Close
          </button>

          {isCancellable && !isConfirmingCancel && (
            <button
              type="button"
              onClick={() => setIsConfirmingCancel(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-xs"
            >
              <Ban className="h-4 w-4" /> Cancel Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
