import { useState, useEffect } from 'react';
import { FileText, X, CheckCircle2, Clock3, IndianRupee, User, Calendar, ShieldCheck, AlertCircle, Loader2, Printer, Download } from 'lucide-react';
import { Invoice } from '@/types/invoice';
import { getInvoiceForJobApi, generateInvoiceApi } from '@/services/api/invoice';
import { useToast } from '@/hooks/use-toast';

interface InvoiceModalProps {
  jobId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceModal({ jobId, isOpen, onClose }: InvoiceModalProps) {
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrCreateInvoice = async () => {
    if (!jobId) return;
    setIsLoading(true);
    setError(null);

    try {
      // First try fetching existing invoice
      const data = await getInvoiceForJobApi(jobId);
      setInvoice(data);
    } catch (err: any) {
      // If 404, automatically trigger generate
      if (err?.response?.status === 404) {
        try {
          setIsGenerating(true);
          const generated = await generateInvoiceApi(jobId);
          setInvoice(generated);
        } catch (genErr: any) {
          const msg = genErr?.response?.data?.message || 'Failed to generate invoice for this job.';
          setError(msg);
        } finally {
          setIsGenerating(false);
        }
      } else {
        const msg = err?.response?.data?.message || 'Failed to retrieve invoice.';
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && jobId) {
      fetchOrCreateInvoice();
    } else {
      setInvoice(null);
      setError(null);
    }
  }, [isOpen, jobId]);

  if (!isOpen || !jobId) return null;

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs animate-rise-in">
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl md:p-8 my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Official Transaction Record
              </span>
            </div>
            <h2 id="invoice-modal-title" className="font-display text-2xl font-black text-slate-900">
              Tax Invoice
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close invoice"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        {isLoading || isGenerating ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
            <p className="text-xs font-bold text-slate-600">Retrieving official invoice details...</p>
          </div>
        ) : error ? (
          <div className="py-8 space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 font-medium">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
              <span>{error}</span>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={fetchOrCreateInvoice}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
              >
                Retry Invoice Generation
              </button>
            </div>
          </div>
        ) : invoice ? (
          <div className="mt-6 space-y-6">
            {/* Invoice Top Details */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">Invoice Number</span>
                <span className="font-mono text-sm font-black text-slate-900">{invoice.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">Issue Date</span>
                <span className="text-xs font-bold text-slate-700">{formatDate(invoice.issuedAt)}</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">Payment Status</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                    invoice.paymentStatus === 'SUCCESS' || invoice.paymentStatus === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {invoice.paymentStatus === 'SUCCESS' || invoice.paymentStatus === 'COMPLETED' ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                  ) : (
                    <Clock3 className="h-3 w-3 text-amber-700" />
                  )}
                  {invoice.paymentStatus === 'SUCCESS' || invoice.paymentStatus === 'COMPLETED' ? 'PAID' : invoice.paymentStatus}
                </span>
              </div>
            </div>

            {/* Customer & Worker Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-100 p-4 space-y-1 bg-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Billed To (Customer)</span>
                <p className="text-sm font-extrabold text-slate-900">{invoice.customerName}</p>
                {invoice.customerEmail && <p className="text-xs text-slate-500">{invoice.customerEmail}</p>}
                {invoice.customerPhone && <p className="text-xs text-slate-500">{invoice.customerPhone}</p>}
              </div>

              <div className="rounded-2xl border border-slate-100 p-4 space-y-1 bg-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Service Provider (Worker)</span>
                <p className="text-sm font-extrabold text-slate-900">{invoice.workerName}</p>
                {invoice.workerEmail && <p className="text-xs text-slate-500">{invoice.workerEmail}</p>}
                {invoice.workerPhone && <p className="text-xs text-slate-500">{invoice.workerPhone}</p>}
              </div>
            </div>

            {/* Service & Itemized Charges Breakdown */}
            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Itemized Charges</h4>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start text-xs pb-3 border-b border-slate-100">
                  <div>
                    <span className="font-extrabold text-slate-900 block">{invoice.serviceName}</span>
                    {invoice.serviceDescription && (
                      <span className="text-slate-500 line-clamp-2 mt-0.5">{invoice.serviceDescription}</span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-slate-900">₹{invoice.serviceCharge.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Platform Service Fee (10%)</span>
                  <span className="font-mono font-medium">₹{invoice.platformFee.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Taxes (GST 0%)</span>
                  <span className="font-mono font-medium">₹{invoice.taxAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Discount</span>
                  <span className="font-mono font-medium">₹{invoice.discountAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-200 text-sm font-extrabold text-slate-900">
                  <span>Total Amount</span>
                  <span className="font-mono text-base font-black text-emerald-700">₹{invoice.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Reference Details */}
            {invoice.paymentReference && (
              <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="font-bold text-slate-700">Transaction Reference</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{invoice.paymentReference}</span>
              </div>
            )}

            <div className="text-center pt-2">
              <span className="text-[10px] text-slate-400 italic">
                This is a computer-generated tax invoice and requires no physical signature.
              </span>
            </div>
          </div>
        ) : null}

        {/* Modal Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4">
          {invoice && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5 text-emerald-600" />
              Print / Save Invoice
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
