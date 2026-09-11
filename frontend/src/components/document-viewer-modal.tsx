import React, { useState } from 'react';
import { Lock, ShieldCheck, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import type { VerificationDocumentResponse } from '@/types/worker-verification';
import { DOCUMENT_TYPE_LABELS } from '@/types/worker-verification';
import { useTranslation } from 'react-i18next';

declare global {
  interface Window {
    __GIGCIRCLE_DOC_CACHE__?: Record<string, string>;
  }
}

export function storeDataUrl(keys: (string | number)[], dataUrl: string) {
  if (typeof window === 'undefined') return;
  window.__GIGCIRCLE_DOC_CACHE__ = window.__GIGCIRCLE_DOC_CACHE__ || {};
  keys.forEach((key) => {
    if (!key) return;
    const strKey = String(key);
    window.__GIGCIRCLE_DOC_CACHE__![strKey] = dataUrl;
    try {
      localStorage.setItem(`doc_preview_${strKey}`, dataUrl);
    } catch (e) {
      // LocalStorage quota fallback
    }
  });
}

export interface DocumentViewerModalProps {
  doc: VerificationDocumentResponse;
  blobUrl?: string;
  onClose: () => void;
}

export function DocumentViewerModal({ doc, blobUrl, onClose }: DocumentViewerModalProps) {
  const { t } = useTranslation();
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const safeDisplayName = doc.fileReference ? doc.fileReference.replace(/^.*[\\/]/, '') : 'document.png';
  const isPdf = safeDisplayName.toLowerCase().endsWith('.pdf');

  // Multi-tier lookup for stored Data URL or image reference
  const cachedDataUrl =
    blobUrl ||
    (typeof window !== 'undefined' &&
      (window.__GIGCIRCLE_DOC_CACHE__?.[doc.id] ||
        window.__GIGCIRCLE_DOC_CACHE__?.[doc.fileReference] ||
        window.__GIGCIRCLE_DOC_CACHE__?.[safeDisplayName] ||
        window.__GIGCIRCLE_DOC_CACHE__?.[doc.documentType] ||
        window.__GIGCIRCLE_DOC_CACHE__?.[`type_${doc.documentType}`] ||
        window.__GIGCIRCLE_DOC_CACHE__?.['last_uploaded'] ||
        localStorage.getItem(`doc_preview_${doc.id}`) ||
        localStorage.getItem(`doc_preview_${doc.fileReference}`) ||
        localStorage.getItem(`doc_preview_${safeDisplayName}`) ||
        localStorage.getItem(`doc_preview_${doc.documentType}`) ||
        localStorage.getItem(`doc_preview_last_uploaded`))) ||
    (doc.fileReference?.startsWith('http') || doc.fileReference?.startsWith('data:')
      ? doc.fileReference
      : null);

  const localizedDocType = t(`admin.verification.docType.${doc.documentType}`, {
    defaultValue: DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-3xl bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-800 animate-in zoom-in-95 duration-200">
        {/* MODAL HEADER WITH CONTROLS */}
        <div className="flex items-center justify-between bg-slate-900 text-white px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {localizedDocType}
                </h3>
                <DocumentStatusBadge status={doc.status} />
              </div>
              <p className="text-xs text-slate-400 font-mono truncate max-w-xs sm:max-w-md">
                {safeDisplayName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800 rounded-xl p-1 text-slate-300 border border-slate-700">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                className="px-2.5 py-1 text-xs font-bold hover:text-white transition"
                title={t('documentViewer.zoomOut')}
                aria-label={t('documentViewer.zoomOut')}
              >
                -
              </button>
              <span className="text-xs font-mono font-bold px-2 text-emerald-400">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                className="px-2.5 py-1 text-xs font-bold hover:text-white transition"
                title={t('documentViewer.zoomIn')}
                aria-label={t('documentViewer.zoomIn')}
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              title={t('documentViewer.closePreview')}
              aria-label={t('documentViewer.closePreview')}
            >
              ✕
            </button>
          </div>
        </div>

        {/* MODAL BODY: VISUAL DOCUMENT CONTENT CANVAS */}
        <div className="flex-1 overflow-auto bg-slate-950 p-4 sm:p-8 flex items-center justify-center min-h-[380px]">
          {cachedDataUrl ? (
            isPdf ? (
              <iframe
                src={cachedDataUrl}
                className="w-full h-[520px] rounded-2xl border border-slate-800 shadow-2xl bg-white"
                title={safeDisplayName}
              />
            ) : (
              <div className="overflow-auto max-h-[520px] w-full flex items-center justify-center p-2">
                <img
                  src={cachedDataUrl}
                  alt={safeDisplayName}
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                  className="max-h-[480px] max-w-full object-contain rounded-2xl border border-slate-800 shadow-2xl transition-transform duration-200 bg-slate-900"
                />
              </div>
            )
          ) : (
            /* HIGH-FIDELITY GOVERNMENT ID & DOCUMENT CARD CANVAS */
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
              <div className="overflow-auto max-h-[440px] flex items-center justify-center bg-slate-950 rounded-xl p-4 border border-slate-800">
                <div style={{ transform: `scale(${zoomLevel / 100})` }} className="transition-transform duration-200 w-full max-w-lg">
                  <div className="rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-left space-y-5 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-sm">
                          ID
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                            {t('documentViewer.identityRecord')}
                          </span>
                          <h4 className="text-sm font-bold text-white">{localizedDocType}</h4>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-slate-400 font-bold">#DOC-{doc.id}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 items-center bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                      <div className="col-span-1 aspect-square rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center p-2 text-center">
                        <ShieldCheck className="h-10 w-10 text-emerald-400 mb-1" />
                        <span className="text-[9px] font-bold text-slate-300 uppercase">
                          {t('documentViewer.verifiedCopy')}
                        </span>
                      </div>
                      <div className="col-span-2 space-y-2 font-mono text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase">
                            {t('documentViewer.fileName')}
                          </span>
                          <span className="text-emerald-300 font-bold truncate block">{safeDisplayName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase">
                            {t('documentViewer.uploadStatus')}
                          </span>
                          <DocumentStatusBadge status={doc.status} />
                        </div>
                      </div>
                    </div>

                    {doc.reviewNote && (
                      <div className="bg-amber-950/60 border border-amber-800/80 p-2.5 rounded-lg text-xs font-medium text-amber-200">
                        <strong>{t('documentViewer.adminFeedback')}</strong> "{doc.reviewNote}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-900 px-6 py-4 border-t border-slate-800 flex items-center justify-between shrink-0 text-white">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>{t('documentViewer.fileRef')} <code className="text-slate-200 font-mono">{safeDisplayName}</code></span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-900 bg-white rounded-xl hover:bg-slate-100 transition shadow-sm cursor-pointer"
          >
            {t('documentViewer.closePreview')}
          </button>
        </div>
      </div>
    </div>
  );
}

function DocumentStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  switch (status) {
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-md">
          <CheckCircle2 className="h-3 w-3 text-emerald-400" /> {t('status.verification.VERIFIED')}
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/80 border border-red-800 px-2 py-0.5 rounded-md">
          <XCircle className="h-3 w-3 text-red-400" /> {t('status.verification.REJECTED')}
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-md">
          <Clock3 className="h-3 w-3 text-amber-400" /> {t('status.payment.PENDING')}
        </span>
      );
  }
}

