import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldAlert, Loader2, ArrowLeft } from 'lucide-react';
import { getPaymentStatusApi } from '@/services/api';
import type { Payment } from '@/types/payment';

const MAX_POLL_ATTEMPTS = 15;
const POLL_INTERVAL_MS = 2000;

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = searchParams.get('paymentId');

  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending' | 'error'>('loading');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!paymentId) {
      setStatus('error');
      setErrorMessage('No payment ID found in redirect URL.');
      return;
    }

    const poll = async () => {
      try {
        const result = await getPaymentStatusApi(Number(paymentId));
        setPayment(result);

        if (result.paymentStatus === 'SUCCESS') {
          setStatus('success');
        } else if (result.paymentStatus === 'FAILED') {
          setStatus('failed');
        } else {
          // Still pending — keep polling
          setPollCount((count) => {
            const next = count + 1;
            if (next >= MAX_POLL_ATTEMPTS) {
              setStatus('pending');
            }
            return next;
          });
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err?.response?.data?.message || 'Unable to verify payment status.');
      }
    };

    poll();

    const interval = setInterval(() => {
      if (status === 'loading') {
        poll();
      } else {
        clearInterval(interval);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId, status]);

  const handleGoToDashboard = () => {
    // Clear the pending payment id from storage
    localStorage.removeItem('pendingPaymentId');
    navigate('/customer/dashboard');
  };

  const handleRetry = () => {
    localStorage.removeItem('pendingPaymentId');
    navigate('/customer/dashboard');
  };

  if (!paymentId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-lg space-y-4">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-black text-slate-900">Invalid Redirect</h1>
          <p className="text-sm text-slate-500">No payment ID was found in the redirect URL. Please try again from your dashboard.</p>
          <button onClick={handleRetry} className="w-full rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xl space-y-6 animate-rise-in">
        {status === 'loading' && (
          <>
            <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Verifying Payment...</h1>
              <p className="text-sm text-slate-500 mt-2">
                Checking payment status with PhonePe. Please wait.
              </p>
              {pollCount > 0 && (
                <p className="text-xs text-slate-400 mt-1">Attempt {pollCount}/{MAX_POLL_ATTEMPTS}</p>
              )}
            </div>
          </>
        )}

        {status === 'success' && payment && (
          <>
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Payment Successful!</h1>
              <p className="text-sm text-slate-500 mt-2">
                Your payment of <strong className="text-emerald-700">₹{payment.amount.toLocaleString()}</strong> has been confirmed.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-mono font-bold text-emerald-700">{payment.transactionId}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-mono font-bold text-emerald-800">₹{payment.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Payment Method</span>
                <span className="font-bold text-slate-700">{payment.paymentInstrument || 'PhonePe'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Worker Earnings</span>
                <span className="font-mono font-bold text-emerald-700">₹{payment.workerEarning.toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={handleGoToDashboard}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Payment Failed</h1>
              <p className="text-sm text-slate-500 mt-2">
                Your payment could not be completed. Please try again.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left text-xs text-slate-500">
              Transaction ID: <span className="font-mono font-bold">{payment?.transactionId}</span>
            </div>
            <button
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700"
            >
              Try Again
            </button>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Payment Pending</h1>
              <p className="text-sm text-slate-500 mt-2">
                We couldn't confirm your payment status. Please check back from your dashboard.
              </p>
            </div>
            <button
              onClick={handleGoToDashboard}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Go to Dashboard
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Something Went Wrong</h1>
              <p className="text-sm text-slate-500 mt-2">{errorMessage || 'Unable to verify payment status.'}</p>
            </div>
            <button
              onClick={handleGoToDashboard}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
