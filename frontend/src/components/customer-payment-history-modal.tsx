import React, { useEffect, useState } from 'react';
import {
  Receipt,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Banknote,
  QrCode,
  CreditCard,
  Lock,
} from 'lucide-react';
import { getCustomerPaymentsApi, refundPaymentApi } from '@/services/api';
import type { PaymentResponse } from '@/types/payment';
import { CATEGORY_LABELS } from '@/types/service-request';
import { useToast } from '@/hooks/use-toast';

interface CustomerPaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerPaymentHistoryModal({ isOpen, onClose }: CustomerPaymentHistoryModalProps) {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<number | null>(null);

  const fetchPayments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCustomerPaymentsApi();
      setPayments(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load payment history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPayments();
    }
  }, [isOpen]);

  const handleRefund = async (paymentId: number) => {
    setRefundingId(paymentId);
    try {
      const updated = await refundPaymentApi(paymentId);
      toast({
        title: 'Simulated Refund Processed',
        description: `Simulated refund of ₹${updated.refundAmount} initiated.`,
      });
      fetchPayments();
    } catch (err: any) {
      toast({
        title: 'Refund Failed',
        description: err?.response?.data?.message || 'Failed to process refund.',
        variant: 'destructive',
      });
    } finally {
      setRefundingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 animate-rise-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <Receipt className="h-5 w-5 text-emerald-400" />
            <h2 className="font-display text-base font-black tracking-tight text-white">
              Payment History & Receipts
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Demo banner */}
        <div className="flex items-center gap-2 bg-amber-50 px-6 py-2 border-b border-amber-200/80 text-xs font-semibold text-amber-800">
          <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <span>Simulated Transactions — No real payments or financial accounts.</span>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading your transactions...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
              {error}
            </div>
          ) : payments.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Receipt className="h-10 w-10 text-slate-300 mx-auto" />
              <h4 className="font-display text-sm font-bold text-slate-800">No payment records found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Payments made for completed or assigned service jobs will appear here with transparent transaction receipts.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => {
                const categoryLabel = p.serviceCategory ? CATEGORY_LABELS[p.serviceCategory]?.label : 'Service';
                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-black text-slate-900">
                            {categoryLabel}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-slate-400">
                            • Job #{p.jobId}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-slate-500 mt-0.5 font-semibold">
                          Txn: {p.transactionReference}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-display text-base font-black text-slate-900">
                          ₹{p.amount.toFixed(2)}
                        </span>
                        <div>
                          {p.status === 'SUCCESS' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              Paid
                            </span>
                          ) : p.status === 'REFUNDED' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-extrabold text-purple-700 border border-purple-200">
                              <RotateCcw className="h-3 w-3" />
                              Refunded
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-extrabold text-red-700 border border-red-200">
                              <XCircle className="h-3 w-3" />
                              {p.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        {p.paymentMethod === 'UPI' ? (
                          <QrCode className="h-3.5 w-3.5 text-emerald-600" />
                        ) : p.paymentMethod === 'CARD' ? (
                          <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                        <span>{p.paymentMethodDetails || p.paymentMethod}</span>
                      </div>

                      {p.status === 'SUCCESS' && (
                        <button
                          type="button"
                          onClick={() => handleRefund(p.id)}
                          disabled={refundingId === p.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                          {refundingId === p.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3 w-3" />
                          )}
                          Simulate Refund
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
