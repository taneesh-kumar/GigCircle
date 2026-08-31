import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
  ArrowRight,
  X,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Receipt,
  FileCheck,
} from 'lucide-react';
import {
  getPaymentSummaryApi,
  processPaymentApi,
} from '@/services/api';
import type {
  PaymentMethod,
  PaymentSummary,
  PaymentResponse,
} from '@/types/payment';
import { CATEGORY_LABELS } from '@/types/service-request';
import { useToast } from '@/hooks/use-toast';

interface PaymentModalProps {
  jobId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: (payment: PaymentResponse) => void;
}

type SimulationStep = 'IDLE' | 'VALIDATING' | 'PROCESSING' | 'CONFIRMING' | 'SUCCESS' | 'FAILED';

export function PaymentModal({ jobId, isOpen, onClose, onPaymentSuccess }: PaymentModalProps) {
  const { toast } = useToast();

  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [upiId, setUpiId] = useState('test-success@upi');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/30');
  const [cardCvv, setCardCvv] = useState('123');

  const [simulationStep, setSimulationStep] = useState<SimulationStep>('IDLE');
  const [completedPayment, setCompletedPayment] = useState<PaymentResponse | null>(null);
  const [failureReason, setFailureReason] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && jobId) {
      setSimulationStep('IDLE');
      setCompletedPayment(null);
      setFailureReason(null);
      setIsLoadingSummary(true);
      setSummaryError(null);

      getPaymentSummaryApi(jobId)
        .then((res) => {
          setSummary(res);
          if (res.alreadyPaid) {
            setSimulationStep('SUCCESS');
          }
        })
        .catch((err) => {
          setSummaryError(err?.response?.data?.message || 'Failed to load payment details.');
        })
        .finally(() => {
          setIsLoadingSummary(false);
        });
    }
  }, [isOpen, jobId]);

  if (!isOpen) return null;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId || !summary) return;

    setFailureReason(null);
    setSimulationStep('VALIDATING');

    setTimeout(async () => {
      setSimulationStep('PROCESSING');

      setTimeout(async () => {
        setSimulationStep('CONFIRMING');

        try {
          const res = await processPaymentApi({
            jobId,
            paymentMethod,
            upiId: paymentMethod === 'UPI' ? upiId : undefined,
            cardNumber: paymentMethod === 'CARD' ? cardNumber : undefined,
            cardExpiry: paymentMethod === 'CARD' ? cardExpiry : undefined,
            cardCvv: paymentMethod === 'CARD' ? cardCvv : undefined,
          });

          // Security: wipe input fields
          setCardNumber('4242 4242 4242 4242');
          setCardCvv('123');

          if (res.status === 'SUCCESS') {
            setCompletedPayment(res);
            setSimulationStep('SUCCESS');
            toast({
              title: 'Payment Successful',
              description: `Simulated transaction ${res.transactionReference} completed.`,
            });
            if (onPaymentSuccess) {
              onPaymentSuccess(res);
            }
          } else {
            setFailureReason(res.failureReason || 'Simulated payment declined.');
            setSimulationStep('FAILED');
          }
        } catch (err: any) {
          const msg = err?.response?.data?.message || 'Payment simulation failed.';
          setFailureReason(msg);
          setSimulationStep('FAILED');
        }
      }, 700);
    }, 600);
  };

  const handleResetForRetry = () => {
    setSimulationStep('IDLE');
    setFailureReason(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 animate-rise-in max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-xs">
              G
            </div>
            <div>
              <h2 className="font-display text-base font-black tracking-tight text-white flex items-center gap-1.5">
                GigCircle Pay
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  Simulation
                </span>
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Demo Warning Banner */}
        <div className="flex items-center gap-2 bg-amber-50 px-6 py-2.5 border-b border-amber-200/80 text-xs font-semibold text-amber-800">
          <Lock className="h-4 w-4 text-amber-600 shrink-0" />
          <span>Demo Payment — No real money will be charged.</span>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoadingSummary ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-slate-500">Calculating authoritative job pricing...</p>
            </div>
          ) : summaryError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>Error loading payment details</span>
              </div>
              <p>{summaryError}</p>
            </div>
          ) : summary && summary.jobStatus !== 'PAYMENT_REQUIRED' && !summary.alreadyPaid ? (
            <div className="space-y-6 animate-rise-in">
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-700 shadow-inner">
                  <AlertCircle className="h-9 w-9" />
                </div>
                <h3 className="font-display text-xl font-black text-slate-900">
                  Payment Not Available Yet
                </h3>
                <p className="text-xs text-slate-600 font-semibold">
                  Payment opens after the worker requests job completion.
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 space-y-1.5">
                <p className="font-bold">Current job status: {summary.jobStatus}</p>
                <p>The job must be PAYMENT_REQUIRED before checkout can begin.</p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-slate-900 py-3.5 text-xs font-black text-white shadow-md hover:bg-slate-800 transition-colors"
              >
                Back to Job
              </button>
            </div>
          ) : simulationStep === 'VALIDATING' || simulationStep === 'PROCESSING' || simulationStep === 'CONFIRMING' ? (
            <div className="py-12 text-center space-y-6">
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-lg font-black text-slate-900">
                  Processing Payment...
                </h3>
                <div className="mx-auto max-w-xs space-y-2 text-left text-xs font-bold">
                  <div className={`flex items-center gap-2 ${simulationStep === 'VALIDATING' || simulationStep === 'PROCESSING' || simulationStep === 'CONFIRMING' ? 'text-emerald-700' : 'text-slate-400'}`}>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Validating payment credentials</span>
                  </div>
                  <div className={`flex items-center gap-2 ${simulationStep === 'PROCESSING' || simulationStep === 'CONFIRMING' ? 'text-emerald-700' : 'text-slate-400'}`}>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Simulating authorization gateway</span>
                  </div>
                  <div className={`flex items-center gap-2 ${simulationStep === 'CONFIRMING' ? 'text-emerald-700' : 'text-slate-400'}`}>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Confirming cooperative transaction</span>
                  </div>
                </div>
              </div>
            </div>
          ) : simulationStep === 'SUCCESS' ? (
            <div className="space-y-6 animate-rise-in">
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 shadow-inner">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <h3 className="font-display text-xl font-black text-slate-900">
                  Payment Successful ✓
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  This job has been paid for and is marked completed.
                </p>
              </div>

              {/* Receipt Box */}
              <div className="rounded-3xl border border-slate-200/90 bg-slate-50/80 p-5 space-y-4 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction ID</span>
                  <span className="font-mono text-xs font-black text-slate-900">
                    {completedPayment?.transactionReference || summary?.existingTransactionReference || 'SIM-TXN-SUCCESS'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-semibold text-slate-600">
                    <span>Service Amount</span>
                    <span>₹{summary?.serviceAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-600">
                    <span>Platform Fee ({summary?.feePercentage}%)</span>
                    <span>₹{summary?.platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 border-t border-slate-200 pt-2 text-sm">
                    <span>Total Amount Paid</span>
                    <span className="text-emerald-700">₹{summary?.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
                  <span className="font-bold text-slate-500">Status</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Paid
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-emerald-600 py-3.5 text-xs font-black text-white shadow-md hover:bg-emerald-700 transition-colors"
              >
                Done / View Job
              </button>
            </div>
          ) : simulationStep === 'FAILED' ? (
            <div className="space-y-6 animate-rise-in">
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100 text-red-700 shadow-inner">
                  <XCircle className="h-9 w-9" />
                </div>
                <h3 className="font-display text-xl font-black text-slate-900">
                  Payment Failed
                </h3>
                <p className="text-xs text-red-600 font-semibold">
                  {failureReason || 'Simulated payment could not be completed.'}
                </p>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 text-xs text-slate-600 space-y-1.5">
                <p className="font-bold text-slate-900">Job remains in payment-pending state.</p>
                <p className="text-[11px] text-slate-500">
                  Tip for testing: Use <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-slate-800">test-success@upi</code> or <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-slate-800">4242 4242 4242 4242</code> for a successful test transaction.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetForRetry}
                className="w-full rounded-2xl bg-slate-900 py-3.5 text-xs font-black text-white shadow-md hover:bg-slate-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <form onSubmit={handlePay} className="space-y-6">
              {/* Order Breakdown */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/90 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Service
                    </span>
                    <h4 className="font-display text-sm font-black text-slate-900">
                      {summary?.serviceCategory ? CATEGORY_LABELS[summary.serviceCategory]?.label : 'Service'}
                    </h4>
                    {summary?.workerName && (
                      <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                        Worker: {summary.workerName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs border-t border-slate-200 pt-3">
                  <div className="flex justify-between text-slate-600 font-semibold">
                    <span>Service Amount</span>
                    <span>₹{summary?.serviceAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-semibold">
                    <span>Platform Fee ({summary?.feePercentage}%)</span>
                    <span>₹{summary?.platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-black border-t border-slate-200 pt-2 text-sm">
                    <span>Total Amount</span>
                    <span className="text-emerald-700">₹{summary?.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3.5 text-xs font-bold transition-all ${
                      paymentMethod === 'UPI'
                        ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <QrCode className="h-5 w-5 text-emerald-600" />
                    <span>UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3.5 text-xs font-bold transition-all ${
                      paymentMethod === 'CARD'
                        ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                    <span>Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3.5 text-xs font-bold transition-all ${
                      paymentMethod === 'CASH'
                        ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Banknote className="h-5 w-5 text-emerald-600" />
                    <span>Cash</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Payment Method Input */}
              {paymentMethod === 'UPI' && (
                <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 animate-rise-in">
                  <label className="text-xs font-bold text-slate-700 block">UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    required
                    placeholder="username@upi"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-mono font-semibold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-slate-500">
                    💡 Test trigger: Use <code className="font-bold text-slate-700">test-failure@upi</code> to simulate a failed payment.
                  </p>
                </div>
              )}

              {paymentMethod === 'CARD' && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 animate-rise-in">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Card Number (Simulated)</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      required
                      placeholder="4242 4242 4242 4242"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-mono font-semibold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Expiry</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        required
                        placeholder="MM/YY"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-mono font-semibold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        required
                        maxLength={4}
                        placeholder="***"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-mono font-semibold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    💡 Test trigger: Number ending in <code className="font-bold text-slate-700">0002</code> triggers simulated failure.
                  </p>
                </div>
              )}

              {paymentMethod === 'CASH' && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2 animate-rise-in text-xs text-slate-600">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Banknote className="h-4 w-4 text-emerald-600" />
                    <span>Cash on Completion</span>
                  </div>
                  <p>
                    Pay ₹{summary?.totalAmount.toFixed(2)} directly in cash upon satisfactory completion of service.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-black text-white shadow-md hover:bg-emerald-700 transition-all"
              >
                Pay ₹{summary?.totalAmount.toFixed(2)}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
