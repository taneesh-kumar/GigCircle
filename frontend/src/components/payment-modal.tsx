import { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { initiatePaymentApi, completePaymentApi } from '@/services/api/payment';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onPaymentSuccess?: () => void;
  jobId: number;
  jobDescription?: string;
  workerName?: string;
  amount?: number;
  categoryLabel?: string;
  customerName?: string;
}

type Stage = 'select' | 'success' | 'error';

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess = () => {},
  jobId,
  jobDescription,
  workerName,
  amount = 0,
  categoryLabel,
}: PaymentModalProps) {
  const [stage, setStage] = useState<Stage>('select');
  const [method, setMethod] = useState<'UPI' | 'CARD' | 'CASH'>('UPI');
  const [upiId, setUpiId] = useState('test-success@upi');
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [payment, setPayment] = useState<any>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const fee = amount * 0.10;
  const total = amount + fee;

  const resetAndClose = () => {
    setStage('select');
    setMethod('UPI');
    setUpiId('test-success@upi');
    setPaymentId(null);
    setPayment(null);
    setError('');
    onClose();
  };

  const handlePay = async () => {
    try {
      setError('');

      const initiated = await initiatePaymentApi({ jobId });
      setPaymentId(initiated.id);

      const completed = await completePaymentApi(
        initiated.id,
        method,
        method === 'UPI' ? upiId : undefined
      );

      setPayment(completed);
      setStage('success');
      onSuccess();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Demo payment failed. Please try again.'
      );
      setStage('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">

        {stage === 'select' && (
          <>
            <div className="bg-slate-900 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-emerald-400">
                      GigCircle Pay
                    </span>
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                      Simulation
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-300">
                    Demo payment gateway
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetAndClose}
                  className="rounded-full p-2 hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700">
              Demo Payment � No real money will be charged.
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-2xl border border-slate-200 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Service
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                    {categoryLabel}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-800">
                  {jobDescription}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Worker: <span className="font-semibold">{workerName}</span>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Service Amount</span>
                  <span>?{amount.toFixed(2)}</span>
                </div>

                <div className="mt-3 flex justify-between text-sm text-slate-500">
                  <span>Platform Fee (10%)</span>
                  <span>?{fee.toFixed(2)}</span>
                </div>

                <div className="my-4 border-t border-slate-200" />

                <div className="flex justify-between text-lg font-bold text-slate-800">
                  <span>Total Amount</span>
                  <span className="text-emerald-600">
                    ?{total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select Payment Method
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {(['UPI', 'CARD', 'CASH'] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setMethod(item)}
                      className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                        method === item
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item === 'CARD' ? 'Card' : item === 'CASH' ? 'Cash' : 'UPI'}
                    </button>
                  ))}
                </div>
              </div>

              {method === 'UPI' && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    UPI ID
                  </label>
                  <input
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                    placeholder="test-success@upi"
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Test trigger: use <b>test-failure@upi</b> to simulate a failed payment.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handlePay}
                className="w-full rounded-xl bg-emerald-600 px-5 py-4 text-base font-bold text-white shadow-lg transition hover:bg-emerald-700"
              >
                Pay ?{total.toFixed(2)} ?
              </button>
            </div>
          </>
        )}

        {stage === 'success' && (
          <div className="p-8 text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />

            <h2 className="mt-4 text-2xl font-bold text-slate-800">
              Payment Successful ?
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              This job has been paid for and is marked completed.
            </p>

            <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-bold text-slate-800">
                  {payment?.transactionId || `SIM-TXN-${paymentId}`}
                </span>
              </div>

              <div className="mt-4 flex justify-between text-sm">
                <span className="text-slate-500">Service Amount</span>
                <span>?{amount.toFixed(2)}</span>
              </div>

              <div className="mt-2 flex justify-between text-sm">
                <span className="text-slate-500">Platform Fee (10%)</span>
                <span>?{fee.toFixed(2)}</span>
              </div>

              <div className="mt-4 flex justify-between border-t pt-4 font-bold">
                <span>Total Amount Paid</span>
                <span className="text-emerald-600">
                  ?{total.toFixed(2)}
                </span>
              </div>

              <div className="mt-4 flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-bold text-emerald-600">Paid</span>
              </div>
            </div>

            <button
              type="button"
              onClick={resetAndClose}
              className="mt-6 w-full rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700"
            >
              Done / View Job
            </button>
          </div>
        )}

        {stage === 'error' && (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto h-16 w-16 text-red-500" />

            <h2 className="mt-4 text-2xl font-bold text-slate-800">
              Payment Failed
            </h2>

            <p className="mt-2 text-sm text-red-500">{error}</p>

            <button
              type="button"
              onClick={() => setStage('select')}
              className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 font-bold text-white"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
