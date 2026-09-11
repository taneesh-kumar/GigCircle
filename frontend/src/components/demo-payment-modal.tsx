import { useState, useEffect, useCallback } from 'react';
import {
  X, CheckCircle2, XCircle, Clock, CreditCard, Loader2, RefreshCw,
  AlertCircle, IndianRupee, ShieldCheck, Smartphone, ChevronLeft,
  Lock, Beaker
} from 'lucide-react';
import { getPaymentForJobApi, initiatePaymentApi, simulatePaymentApi } from '@/services/api/payment';
import type { PaymentResponse } from '@/types/payment';
import { useToast } from '@/hooks/use-toast';

import { Wallet } from 'lucide-react';

type PaymentMethod = 'upi' | 'card' | 'wallet';
type ModalStep = 'method-select' | 'upi-form' | 'card-form' | 'wallet-form' | 'processing' | 'success' | 'failed' | 'error-loading';

interface DemoPaymentModalProps {
  jobId: number;
  amount: number;
  workerName?: string;
  serviceName?: string;
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete?: () => void;
}

export function DemoPaymentModal({
  jobId,
  amount,
  workerName,
  serviceName,
  isOpen,
  onClose,
  onPaymentComplete,
}: DemoPaymentModalProps) {
  const { toast } = useToast();

  const [step, setStep] = useState<ModalStep>('method-select');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // UPI form
  const [upiId, setUpiId] = useState('');

  // Card form
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  // Failure simulation
  const [simulatedFailureReason, setSimulatedFailureReason] = useState<string>('Insufficient Funds');

  // Dev controls
  const [showDevControls, setShowDevControls] = useState(false);

  // Load/initiate payment when modal opens
  const loadOrInitiatePayment = useCallback(async () => {
    setIsInitializing(true);
    setLoadError(null);
    try {
      let existing: PaymentResponse | null = null;
      try {
        existing = await getPaymentForJobApi(jobId);
      } catch {
        existing = null;
      }

      if (existing?.status === 'SUCCESS') {
        setPayment(existing);
        setStep('success');
      } else if (existing?.status === 'FAILED') {
        setPayment(existing);
        setStep('failed');
      } else {
        // PENDING or not yet created — initiate/reuse
        const p = await initiatePaymentApi(jobId);
        setPayment(p);
        if (p.status === 'SUCCESS') setStep('success');
        else if (p.status === 'FAILED') setStep('failed');
        else setStep('method-select');
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to initialize payment.';
      setLoadError(message);
      setStep('error-loading');
    } finally {
      setIsInitializing(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (isOpen) {
      setStep('method-select');
      setSelectedMethod('upi');
      setUpiId('');
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setCardholderName('');
      setShowDevControls(false);
      setPayment(null);
      setLoadError(null);
      loadOrInitiatePayment();
    }
  }, [isOpen, loadOrInitiatePayment]);

  if (!isOpen) return null;

  const displayAmount = payment?.amount ?? amount;

  // Format card number with spaces
  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  // Format expiry MM/YY
  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const canPayUpi = upiId.trim().length > 3 && upiId.includes('@');
  const canPayCard = cardNumber.replace(/\s/g, '').length === 16 && expiry.length === 5 && cvv.length >= 3 && cardholderName.trim().length > 2;

  const getMethodCode = (m: PaymentMethod): string => {
    if (m === 'upi') return 'UPI';
    if (m === 'card') return 'CARD';
    return 'COOPERATIVE_WALLET';
  };

  const doPayment = async (shouldSucceed: boolean, method: PaymentMethod = selectedMethod, failureReason?: string) => {
    setStep('processing');
    // Simulate network delay for realism
    await new Promise(r => setTimeout(r, 1500));
    try {
      const updated = await simulatePaymentApi(jobId, {
        shouldSucceed,
        paymentMethod: getMethodCode(method),
        failureReason: shouldSucceed ? undefined : (failureReason || simulatedFailureReason)
      });
      setPayment(updated);
      if (updated.status === 'SUCCESS') {
        setStep('success');
        toast({ title: 'Payment Successful', description: `Txn: ${updated.transactionReference}` });
        if (onPaymentComplete) onPaymentComplete();
      } else {
        setStep('failed');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Payment processing failed.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      setStep('method-select');
    }
  };

  const handleRetry = async () => {
    try {
      const retried = await initiatePaymentApi(jobId);
      setPayment(retried);
      setStep('method-select');
    } catch {
      setStep('method-select');
    }
  };

  const formatTxnDate = () => {
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-xs animate-rise-in">
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-payment-modal-title"
      >
        {/* Gateway header bar */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Lock className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p id="demo-payment-modal-title" className="text-xs font-bold text-white">GigCircle Pay</p>
              <p className="text-[10px] text-slate-400">Secure Demo Gateway</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Order summary strip */}
        {step !== 'error-loading' && (
          <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center justify-between">
            <div className="text-xs text-slate-500 space-y-0.5">
              {serviceName && <p className="font-bold text-slate-700 text-[11px]">{serviceName}</p>}
              {workerName && <p className="text-[10px] text-slate-400">Worker: {workerName}</p>}
              <p className="text-[10px] text-slate-400">Job #{jobId}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Amount</p>
              <div className="flex items-baseline gap-0.5 font-black text-slate-900 text-lg font-mono">
                <IndianRupee className="h-3.5 w-3.5 text-emerald-600 self-center" />
                <span>{displayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── INITIALIZING ─── */}
        {isInitializing && (
          <div className="flex flex-col items-center justify-center py-14 space-y-3 text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
            <p className="text-xs font-bold">Initializing payment...</p>
          </div>
        )}

        {/* ─── ERROR LOADING ─── */}
        {!isInitializing && step === 'error-loading' && (
          <div className="p-6 space-y-4">
            <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 text-xs text-red-700 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                Unable to Load Payment
              </div>
              <p>{loadError}</p>
            </div>
            <button
              type="button"
              onClick={loadOrInitiatePayment}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-900 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Try Again
            </button>
          </div>
        )}

        {/* ─── METHOD SELECTION ─── */}
        {!isInitializing && step === 'method-select' && (
          <div className="p-5 space-y-4">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Choose Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setSelectedMethod('upi'); setStep('upi-form'); }}
                className="flex flex-col items-center gap-1.5 rounded-2xl border-2 border-slate-100 bg-white p-3 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group"
              >
                <Smartphone className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-700">UPI</span>
                <span className="text-[8px] text-slate-400 leading-tight text-center">GPay, PhonePe</span>
              </button>
              <button
                type="button"
                onClick={() => { setSelectedMethod('card'); setStep('card-form'); }}
                className="flex flex-col items-center gap-1.5 rounded-2xl border-2 border-slate-100 bg-white p-3 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group"
              >
                <CreditCard className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-700">Card</span>
                <span className="text-[8px] text-slate-400 leading-tight text-center">Debit / Credit</span>
              </button>
              <button
                type="button"
                onClick={() => { setSelectedMethod('wallet'); setStep('wallet-form'); }}
                className="flex flex-col items-center gap-1.5 rounded-2xl border-2 border-slate-100 bg-white p-3 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group"
              >
                <Wallet className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-700">Coop Wallet</span>
                <span className="text-[8px] text-slate-400 leading-tight text-center">Instant Balance</span>
              </button>
            </div>

            {/* Dev / Demo Controls */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDevControls(v => !v)}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Beaker className="h-3 w-3" />
                {showDevControls ? 'Hide' : 'Show'} Demo Simulation Controls
              </button>
              {showDevControls && (
                <div className="mt-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50/40 p-3 space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-amber-700">⚙ Simulation Settings</p>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500">Failure Reason Preset:</label>
                    <select
                      value={simulatedFailureReason}
                      onChange={e => setSimulatedFailureReason(e.target.value)}
                      className="w-full rounded-lg border border-amber-200 bg-white text-[10px] p-1.5 font-medium text-slate-700"
                    >
                      <option value="Insufficient Funds">Insufficient Funds</option>
                      <option value="Bank Server Timeout">Bank Server Timeout</option>
                      <option value="Card Declined by Issuer">Card Declined by Issuer</option>
                      <option value="UPI PIN Validation Failed">UPI PIN Validation Failed</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => doPayment(true, selectedMethod)}
                      className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-emerald-700 transition-colors"
                    >
                      ✓ Force Success
                    </button>
                    <button
                      type="button"
                      onClick={() => doPayment(false, selectedMethod, simulatedFailureReason)}
                      className="flex-1 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-[10px] font-bold text-red-700 hover:bg-red-100 transition-colors"
                    >
                      ✕ Force Failure
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── UPI FORM ─── */}
        {!isInitializing && step === 'upi-form' && (
          <div className="p-5 space-y-4">
            <button
              type="button"
              onClick={() => setStep('method-select')}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex flex-col items-center gap-2">
              {/* Demo QR area */}
              <div className="w-28 h-28 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center">
                <div className="grid grid-cols-3 gap-1 p-2 opacity-30">
                  {Array.from({length:9}).map((_,i) => (
                    <div key={i} className={`h-6 w-6 rounded-sm ${[0,2,6,8,4].includes(i) ? 'bg-slate-800' : 'bg-slate-300'}`} />
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Scan with any UPI app</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                — OR Enter UPI ID —
              </label>
              <input
                type="text"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-mono text-slate-800 placeholder-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <p className="text-[10px] text-slate-400">Example: name@okhdfc, name@ybl</p>
            </div>

            <button
              type="button"
              disabled={!canPayUpi}
              onClick={() => doPayment(true, 'upi')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <IndianRupee className="h-4 w-4" />
              Pay ₹{displayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </button>
          </div>
        )}

        {/* ─── CARD FORM ─── */}
        {!isInitializing && step === 'card-form' && (
          <div className="p-5 space-y-3">
            <button
              type="button"
              onClick={() => setStep('method-select')}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="0000 0000 0000 0000"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-mono text-slate-800 placeholder-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">Expiry</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={e => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-mono text-slate-800 placeholder-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">CVV</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="• • •"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-mono text-slate-800 placeholder-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">Cardholder Name</label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={e => setCardholderName(e.target.value)}
                  placeholder="Name on card"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={!canPayCard}
              onClick={() => doPayment(true, 'card')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Lock className="h-4 w-4" />
              Pay ₹{displayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </button>
            <p className="text-center text-[9px] text-slate-400">Your card details are not stored. Demo only.</p>
          </div>
        )}

        {/* ─── WALLET FORM ─── */}
        {!isInitializing && step === 'wallet-form' && (
          <div className="p-5 space-y-4">
            <button
              type="button"
              onClick={() => setStep('method-select')}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800 text-xs">
                <Wallet className="h-4 w-4 text-emerald-600" />
                Cooperative Member Demo Wallet
              </div>
              <p className="text-[11px] text-emerald-700">
                Simulated pre-funded cooperative wallet for seamless 1-click checkout.
              </p>
              <div className="pt-2 border-t border-emerald-200/60 flex justify-between text-xs">
                <span className="text-emerald-700 font-medium">Available Demo Balance:</span>
                <span className="font-mono font-bold text-emerald-900">₹25,000.00</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => doPayment(true, 'wallet')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              Pay ₹{displayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} via Wallet
            </button>
          </div>
        )}

        {/* ─── PROCESSING ─── */}
        {step === 'processing' && (
          <div className="p-8 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="h-6 w-6 text-emerald-700" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-slate-900">Processing Payment</p>
              <div className="flex items-baseline gap-0.5 justify-center font-black text-emerald-700 text-xl font-mono">
                <IndianRupee className="h-4 w-4 self-center" />
                <span>{displayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <p className="font-medium">Connecting to Demo Payment Gateway...</p>
              <p className="text-slate-400">Please wait. Do not refresh or go back.</p>
            </div>
            <div className="flex gap-1 mt-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* ─── SUCCESS ─── */}
        {step === 'success' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-14 w-14 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <p className="font-black text-slate-900 text-lg">Payment Successful</p>
                <div className="flex items-baseline gap-0.5 justify-center font-black text-emerald-700 text-2xl font-mono mt-1">
                  <IndianRupee className="h-4 w-4 self-center" />
                  <span>{displayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Receipt */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method</span>
                <span className="font-bold text-slate-800 capitalize">
                  {selectedMethod === 'upi' ? 'UPI' : 'Debit / Credit Card'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-mono font-bold text-slate-800 text-[10px]">
                  {payment?.transactionReference || 'DEMO-TXN-' + Date.now()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time</span>
                <span className="font-bold text-slate-800">{formatTxnDate()}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500">Status</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" /> Successful
                </span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700 text-center font-medium">
              ✓ Job is now marked as <strong>Completed</strong>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {/* ─── FAILED ─── */}
        {step === 'failed' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-14 w-14 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center">
                <XCircle className="h-7 w-7 text-red-600" />
              </div>
              <div>
                <p className="font-black text-slate-900 text-lg">Payment Failed</p>
                <p className="text-xs text-slate-500 mt-1">We couldn't complete your payment.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 text-xs text-red-700 space-y-1">
              <p className="font-bold">Reason:</p>
              <p>{payment?.failureReason || 'Payment was declined. Please try again.'}</p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleRetry}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </button>
              <button
                type="button"
                onClick={() => { setStep('method-select'); setUpiId(''); setCardNumber(''); setExpiry(''); setCvv(''); setCardholderName(''); }}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Change Payment Method
              </button>
            </div>
          </div>
        )}

        {/* Secure badge footer */}
        {!isInitializing && step !== 'processing' && (
          <div className="px-5 pb-4 flex items-center justify-center gap-1.5 text-[9px] text-slate-400">
            <Lock className="h-2.5 w-2.5" />
            <span>256-bit SSL encrypted · Demo gateway · No real transactions</span>
          </div>
        )}
      </div>
    </div>
  );
}
