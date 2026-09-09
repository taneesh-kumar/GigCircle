import React, { useEffect, useState } from 'react';
import { getFinancialTransactionDetailApi } from '@/services/api/admin';
import type { AdminFinancialTransactionDetail } from '@/types/admin';
import { format } from 'date-fns';

interface AdminFinancialDetailModalProps {
  transactionId: number | null;
  onClose: () => void;
}

export const AdminFinancialDetailModal: React.FC<AdminFinancialDetailModalProps> = ({
  transactionId,
  onClose,
}) => {
  const [detail, setDetail] = useState<AdminFinancialTransactionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId) return;
    setLoading(true);
    setError(null);
    getFinancialTransactionDetailApi(transactionId)
      .then((data) => {
        setDetail(data);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Failed to load transaction details.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [transactionId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!transactionId) return null;

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy • hh:mm a');
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">SUCCESS</span>;
      case 'PENDING':
      case 'PROCESSING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">{status}</span>;
      case 'FAILED':
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">{status}</span>;
      case 'REFUNDED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">REFUNDED</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-800 text-gray-400">{status || 'UNKNOWN'}</span>;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 text-gray-100 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950/60">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Financial Audit Inspection
              {detail && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                  Ref: {detail.transactionReference}
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Administrative transaction ledger review</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
              <p className="text-sm">Fetching transaction details...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && detail && (
            <>
              {/* Top Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-950/60 p-4 rounded-lg border border-gray-800">
                  <p className="text-xs text-gray-400">Payment Status</p>
                  <div className="mt-2">{getStatusBadge(detail.status)}</div>
                </div>

                <div className="bg-gray-950/60 p-4 rounded-lg border border-gray-800">
                  <p className="text-xs text-gray-400">Gross Transaction Amount</p>
                  <p className="text-lg font-bold text-emerald-400 mt-1">{formatCurrency(detail.amount)}</p>
                </div>

                <div className="bg-gray-950/60 p-4 rounded-lg border border-gray-800">
                  <p className="text-xs text-gray-400">Platform Fee (10%)</p>
                  <p className="text-lg font-bold text-indigo-400 mt-1">{formatCurrency(detail.platformFee)}</p>
                </div>

                <div className="bg-gray-950/60 p-4 rounded-lg border border-gray-800">
                  <p className="text-xs text-gray-400">Worker Net Earning</p>
                  <p className="text-lg font-bold text-cyan-400 mt-1">{formatCurrency(detail.workerEarning)}</p>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="bg-gray-950/60 p-5 rounded-lg border border-gray-800 space-y-3">
                <h3 className="text-sm font-semibold text-gray-200 border-b border-gray-800 pb-2">
                  Financial Breakdown & Timestamps
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block">Payment Method</span>
                    <span className="font-semibold text-white mt-0.5 block">{detail.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Currency</span>
                    <span className="font-semibold text-white mt-0.5 block">{detail.currency || 'INR'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Transaction Reference</span>
                    <span className="font-mono text-gray-300 mt-0.5 block">{detail.transactionReference}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Refund Amount</span>
                    <span className="font-semibold text-purple-400 mt-0.5 block">{detail.refundAmount ? formatCurrency(detail.refundAmount) : 'N/A'}</span>
                  </div>

                  <div>
                    <span className="text-gray-400 block">Created At</span>
                    <span className="text-gray-300 mt-0.5 block">{formatDate(detail.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Paid At</span>
                    <span className="text-gray-300 mt-0.5 block">{formatDate(detail.paidAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Refunded At</span>
                    <span className="text-gray-300 mt-0.5 block">{formatDate(detail.refundedAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Failure Reason</span>
                    <span className="text-rose-400 mt-0.5 block">{detail.failureReason || 'None'}</span>
                  </div>
                </div>
              </div>

              {/* Related Parties & Service */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer */}
                <div className="bg-gray-950/60 p-4 rounded-lg border border-gray-800 space-y-2 text-xs">
                  <h4 className="font-semibold text-emerald-400 border-b border-gray-800 pb-1.5 flex items-center justify-between">
                    <span>Customer Information</span>
                    {detail.customerId && <span className="text-gray-500 font-mono">ID: #{detail.customerId}</span>}
                  </h4>
                  <div>
                    <span className="text-gray-400">Name:</span>{' '}
                    <span className="font-medium text-white">{detail.customerName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Email:</span>{' '}
                    <span className="text-gray-300">{detail.customerEmail || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Phone:</span>{' '}
                    <span className="text-gray-300">{detail.customerPhone || 'N/A'}</span>
                  </div>
                </div>

                {/* Worker */}
                <div className="bg-gray-950/60 p-4 rounded-lg border border-gray-800 space-y-2 text-xs">
                  <h4 className="font-semibold text-cyan-400 border-b border-gray-800 pb-1.5 flex items-center justify-between">
                    <span>Worker Information</span>
                    {detail.workerId && <span className="text-gray-500 font-mono">ID: #{detail.workerId}</span>}
                  </h4>
                  <div>
                    <span className="text-gray-400">Name:</span>{' '}
                    <span className="font-medium text-white">{detail.workerName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Email:</span>{' '}
                    <span className="text-gray-300">{detail.workerEmail || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Phone:</span>{' '}
                    <span className="text-gray-300">{detail.workerPhone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Service & Job Context */}
              <div className="bg-gray-950/60 p-4 rounded-lg border border-gray-800 space-y-2 text-xs">
                <h4 className="font-semibold text-amber-400 border-b border-gray-800 pb-1.5 flex items-center justify-between">
                  <span>Job & Service Request Context</span>
                  {detail.jobId && <span className="text-gray-500 font-mono">Job #{detail.jobId}</span>}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-gray-400 block">Service Request ID</span>
                    <span className="text-gray-200 font-mono">{detail.serviceRequestId ? `#${detail.serviceRequestId}` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Job / Service Title</span>
                    <span className="text-gray-100 font-medium">{detail.jobTitle || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Job Lifecycle Status</span>
                    <span className="text-gray-200 font-semibold">{detail.jobStatus || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Invoice & Dispute Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Invoice */}
                <div className="bg-gray-950/60 p-4 rounded-lg border border-gray-800 space-y-2 text-xs">
                  <h4 className="font-semibold text-indigo-400 border-b border-gray-800 pb-1.5">Invoice Record</h4>
                  {detail.invoiceId ? (
                    <div className="space-y-1.5">
                      <div>
                        <span className="text-gray-400">Invoice Number:</span>{' '}
                        <span className="font-mono text-white">{detail.invoiceNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Issued Date:</span>{' '}
                        <span className="text-gray-300">{formatDate(detail.invoiceDate)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Invoice Status:</span>{' '}
                        <span className="text-emerald-400 font-semibold">{detail.invoiceStatus || 'ACTIVE'}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No invoice generated for this transaction.</p>
                  )}
                </div>

                {/* Dispute */}
                <div className="bg-gray-950/60 p-4 rounded-lg border border-gray-800 space-y-2 text-xs">
                  <h4 className="font-semibold text-rose-400 border-b border-gray-800 pb-1.5">Dispute Record</h4>
                  {detail.disputeId ? (
                    <div className="space-y-1.5">
                      <div>
                        <span className="text-gray-400">Dispute ID:</span>{' '}
                        <span className="font-mono text-white">#{detail.disputeId}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Reason:</span>{' '}
                        <span className="text-rose-300 font-medium">{detail.disputeReason}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Status:</span>{' '}
                        <span className="text-amber-400 font-semibold">{detail.disputeStatus}</span>
                      </div>
                      {detail.disputeResolution && (
                        <div>
                          <span className="text-gray-400">Resolution Notes:</span>{' '}
                          <span className="text-gray-300 block bg-gray-900 p-2 rounded mt-1 border border-gray-800">{detail.disputeResolution}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No dispute filed for this transaction.</p>
                  )}
                </div>
              </div>

              {/* Related Audit Activity Logs */}
              <div className="bg-gray-950/60 p-4 rounded-lg border border-gray-800 space-y-3">
                <h4 className="font-semibold text-gray-200 text-xs border-b border-gray-800 pb-1.5">
                  Related Administrative Audit Trail
                </h4>
                {detail.auditLogs && detail.auditLogs.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {detail.auditLogs.map((log) => (
                      <div key={log.id} className="p-2.5 rounded bg-gray-900 border border-gray-800 text-xs flex justify-between items-start">
                        <div>
                          <span className="font-mono text-indigo-400 font-semibold">{log.actionType}</span>
                          <p className="text-gray-300 mt-0.5">{log.description}</p>
                        </div>
                        <span className="text-[10px] text-gray-500 whitespace-nowrap">{formatDate(log.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">No administrative audit records associated with this transaction.</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-800 bg-gray-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
