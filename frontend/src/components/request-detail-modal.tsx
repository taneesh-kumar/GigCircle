import { useState } from 'react';
import { AlertTriangle, Calendar, Clock, DollarSign, MapPin, X, Loader2, Ban, CheckCircle2, ShieldAlert } from 'lucide-react';
import { cancelServiceRequestApi } from '@/services/api';
import { CATEGORY_LABELS, type ServiceRequest } from '@/types/service-request';
import { useToast } from '@/hooks/use-toast';

interface RequestDetailModalProps {
  request: ServiceRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: () => void;
}

export function RequestDetailModal({ request, isOpen, onClose, onStatusChange }: RequestDetailModalProps) {
  const { toast } = useToast();
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const categoryInfo = CATEGORY_LABELS[request.category] || { label: request.category, description: '' };
  const isOpenStatus = request.status === 'OPEN';

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
        className="relative w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl md:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-accent">
                Request #{request.id}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                  isOpenStatus
                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border border-slate-500/30 bg-slate-500/10 text-slate-500 dark:text-slate-400'
                }`}
              >
                {request.status}
              </span>
            </div>
            <h2 id="detail-modal-title" className="mt-1 font-display text-2xl font-semibold text-primary">
              {categoryInfo.label}
            </h2>
          </div>
          <button
            onClick={() => {
              setIsConfirmingCancel(false);
              onClose();
            }}
            className="focus-ring rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
            aria-label="Close details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {cancelError && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{cancelError}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="mt-6 space-y-6">
          {/* Description */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Description</span>
            <p className="mt-1.5 whitespace-pre-wrap rounded-2xl border border-border/80 bg-background p-4 text-sm leading-relaxed text-primary">
              {request.description}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border/60 bg-background/50 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-accent" /> Location
              </div>
              <p className="mt-1 text-sm font-medium text-primary">{request.location}</p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/50 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span className="font-mono text-xs font-bold text-accent">₹</span> Budget
              </div>
              <p className="mt-1 text-base font-bold font-mono text-primary">₹{request.budget.toLocaleString()}</p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/50 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-accent" /> Preferred Time
              </div>
              <p className="mt-1 text-xs font-medium text-primary">{formatDateTime(request.preferredTime)}</p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/50 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-accent" /> Requested On
              </div>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{formatDateTime(request.createdAt)}</p>
            </div>
          </div>

          {/* Confirmation Box when Cancelling */}
          {isConfirmingCancel && (
            <div className="animate-rise-in rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <h4 className="font-bold text-destructive">Cancel this request?</h4>
                  <p className="mt-1 text-destructive/80 leading-relaxed">
                    This request has not yet been assigned to a worker. Once cancelled, it will remain in your record as CANCELLED.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsConfirmingCancel(false)}
                  disabled={isCancelling}
                  className="focus-ring rounded-xl border border-border bg-background px-4 py-2 font-bold text-primary hover:bg-secondary transition-colors text-xs"
                >
                  Keep Request
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 font-bold text-destructive-foreground hover:bg-destructive/90 transition-colors text-xs"
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
        <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-4">
          <button
            type="button"
            onClick={() => {
              setIsConfirmingCancel(false);
              onClose();
            }}
            className="focus-ring rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-primary hover:bg-secondary transition-colors"
          >
            Close
          </button>

          {isOpenStatus && !isConfirmingCancel && (
            <button
              type="button"
              onClick={() => setIsConfirmingCancel(true)}
              className="focus-ring inline-flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
            >
              <Ban className="h-4 w-4" /> Cancel Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
