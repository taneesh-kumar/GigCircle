import { useState } from 'react';
import {
  X,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  IndianRupee,
  Star,
  Clock3,
  ExternalLink,
} from 'lucide-react';
import { initiatePaymentApi, getPaymentStatusApi } from '@/services/api';
import type { Payment } from '@/types/payment';
import { useToast } from '@/hooks/use-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jobId: number;
  jobDescription: string;
  workerName: string;
  amount: number;
  categoryLabel: string;
  customerName: string;
}

type Stage = 'select' | 'redirecting' | 'success' | 'error';

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  jobId,
  jobDescription,
  workerName,
  amount,
  categoryLabel,
}: PaymentModalProps) {
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>('select');
  const [pendingPayment, setPendingPayment] = useState<Payment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePayWithPhonePe = async () => {
    setErrorMessage(null);
    setStage('redirecting');
    setIsProcessing(true);

    try {
      // Step 1: Create payment + get PhonePe checkout URL
      const initiated = await initiatePaymentApi({ jobId });

      if (!initiated.redirectUrl) {
        throw new Error('PhonePe did not return a checkout URL');
      }

      setPendingPayment(initiated);

      // Step 2: Redirect customer to PhonePe hosted checkout
      // Store payment id so callback page knows which payment to poll
      localStorage.setItem('pendingPaymentId', String(initiated.id));
      window.location.href = initiated.redirectUrl;
    } catch (err: any) {
      setIsProcessing(false);
      setStage('error');
      const msg = err?.response?.data?.message || 'Payment processing failed. Please try again.';
      setErrorMessage(msg);
      toast({
        title: 'Payment Failed',
        description: msg,
        variant: 'destructive',
      });
    }
  };

  // Polling fallback: if user lands back on callback page within the modal context
  // (e.g., callback page re-opens the dashboard), this can verify status.
  const checkStatus = async (paymentId: number) => {
    try {
      const payment = await getPaymentStatusApi(paymentId);
      return payment;
    } catch (err) {
      return null;
    }
  };

  const handleRetry = () => {
    setStage('select');
    setErrorMessage(null);
    setPendingPayment(null);
  };

  const handleClose = () => {
    setStage('select');
    setErrorMessage(null);
    setPendingPayment(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs animate-rise-in">
      <div
        className="relative w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Secure Payment via PhonePe
              </span>
            </div>
            <h2 id="payment-modal-title" className="font-display text-xl font-black text-slate-900">
              {stage === 'redirecting' ? 'Redirecting to PhonePe' : 'Complete Payment'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close payment"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Job Info */}
        {(stage === 'select' || stage === 'redirecting') && (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Job</span>
                <span className="rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  {categoryLabel}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900 leading-snug">{jobDescription}</p>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Worker: <strong className="text-slate-700">{workerName}</strong></span>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <IndianRupee className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 block">Amount Payable</span>
                  <span className="text-2xl font-black text-emerald-800 font-mono">₹{amount.toLocaleString()}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Fee breakdown</span>
                <span className="text-[11px] text-slate-500">Worker: <strong className="text-emerald-700">₹{(amount * 0.9).toFixed(0)}</strong></span>
                <br />
                <span className="text-[11px] text-slate-500">Platform: <strong className="text-slate-600">₹{(amount * 0.1).toFixed(0)}</strong></span>
              </div>
            </div>

            {/* Pay with PhonePe button */}
            {stage === 'select' && (
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                  Payment Gateway
                </span>
                <button
                  type="button"
                  onClick={handlePayWithPhonePe}
                  disabled={isProcessing}
                  className="w-full rounded-2xl border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 text-left hover:border-purple-500 hover:shadow-md transition-all group flex items-center gap-4 disabled:opacity-50"
                >
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
                    <span className="text-base font-black">Pe</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900">Pay with PhonePe</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      UPI • Cards • Net Banking • Wallets
                    </div>
                  </div>
                  <ExternalLink className="h-5 w-5 text-purple-500 group-hover:text-purple-700 transition-colors shrink-0" />
                </button>
                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  You will be redirected to PhonePe's secure payment page to complete this transaction.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Redirecting Stage */}
        {stage === 'redirecting' && (
          <div className="mt-8 flex flex-col items-center justify-center space-y-4 py-8">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-purple-100 flex items-center justify-center">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center">
                  <span className="text-sm font-black">Pe</span>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center animate-pulse">
                <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-slate-900">Redirecting to PhonePe...</p>
              <p className="text-xs text-slate-500">
                Opening secure checkout page
              </p>
            </div>
            <div className="w-full max-w-xs rounded-full h-1 bg-slate-100 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full animate-pulse" style={{ width: '70%' }} />
            </div>
          </div>
        )}

        {/* Error Stage */}
        {stage === 'error' && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <ShieldAlert className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-base font-black text-slate-900">Payment Failed</p>
                <p className="text-xs text-slate-500">{errorMessage}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Amount</span>
                <span className="font-mono font-bold text-slate-700">₹{amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Worker</span>
                <span className="font-semibold text-slate-700">{workerName}</span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRetry}
                className="flex-1 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <Clock3 className="h-3.5 w-3.5" /> Try Again
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
          {stage === 'select' && (
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel Payment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
