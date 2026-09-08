import React, { useEffect, useState, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock3,
  AlertCircle,
  XCircle,
  FileText,
  Upload,
  Eye,
  Edit,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Info,
  Lock,
  Plus,
  ArrowRight,
  FileCheck,
  Check,
} from 'lucide-react';
import {
  getWorkerVerificationApi,
  createWorkerVerificationApi,
  submitVerificationDocumentApi,
  updateVerificationDocumentApi,
  resubmitWorkerVerificationApi,
  previewVerificationDocumentApi,
} from '@/services/api';
import type {
  WorkerVerificationResponse,
  VerificationDocumentResponse,
  VerificationDocumentType,
  VerificationStatus,
} from '@/types/worker-verification';
import { DOCUMENT_TYPE_LABELS } from '@/types/worker-verification';
import { useToast } from '@/hooks/use-toast';
import { DocumentViewerModal, storeDataUrl } from '@/components/document-viewer-modal';

export function WorkerVerificationSection() {
  const { toast } = useToast();
  const [verification, setVerification] = useState<WorkerVerificationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedType, setSelectedType] = useState<VerificationDocumentType>('GOVERNMENT_ID');
  const [fileReference, setFileReference] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [activeDataUrl, setActiveDataUrl] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<number | null>(null);
  const [isSubmittingDoc, setIsSubmittingDoc] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Map of file references / doc IDs to Data URLs for instant preview
  const [localBlobMap, setLocalBlobMap] = useState<Record<string, string>>({});

  // Resubmit State
  const [isResubmitting, setIsResubmitting] = useState<boolean>(false);
  const [showResubmitConfirm, setShowResubmitConfirm] = useState<boolean>(false);

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<VerificationDocumentResponse | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchVerification = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getWorkerVerificationApi();
      setVerification(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        try {
          const created = await createWorkerVerificationApi();
          setVerification(created);
        } catch (createErr: any) {
          setError(createErr.response?.data?.message || 'Failed to initialize worker verification.');
        }
      } else {
        setError(err.response?.data?.message || 'Failed to load verification status.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVerification();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'svg'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(ext)) {
      setFormError('Unsupported file format. Please upload a PDF, PNG, or JPG file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('File size exceeds maximum limit of 5MB.');
      return;
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const pathRef = `docs/${selectedType.toLowerCase()}_${sanitizedName}`;

    // Read actual uploaded file as Data URL and cache across window memory and localStorage
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        setActiveDataUrl(dataUrl);
        storeDataUrl(
          [
            pathRef,
            file.name,
            sanitizedName,
            selectedType,
            'last_uploaded',
            `type_${selectedType}`,
          ],
          dataUrl
        );
        setLocalBlobMap((prev) => ({
          ...prev,
          [pathRef]: dataUrl,
          [file.name]: dataUrl,
          [sanitizedName]: dataUrl,
        }));
      }
    };
    reader.readAsDataURL(file);

    setFileReference(pathRef);
    setSelectedFileName(file.name);
  };

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fileReference || !fileReference.trim()) {
      setFormError('Please select a valid document file to attach.');
      return;
    }

    setIsSubmittingDoc(true);
    try {
      if (editingDocId) {
        const res = await updateVerificationDocumentApi(editingDocId, {
          documentType: selectedType,
          fileReference: fileReference.trim(),
        });
        if (activeDataUrl) {
          storeDataUrl([res.id, res.fileReference, res.documentType], activeDataUrl);
        }
        toast({
          title: 'Document Updated',
          description: 'Verification document updated successfully.',
        });
      } else {
        const res = await submitVerificationDocumentApi({
          documentType: selectedType,
          fileReference: fileReference.trim(),
        });
        if (activeDataUrl) {
          storeDataUrl([res.id, res.fileReference, res.documentType], activeDataUrl);
        }
        toast({
          title: 'Document Attached',
          description: 'Verification document added successfully.',
        });
      }

      setFileReference('');
      setSelectedFileName('');
      setEditingDocId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await fetchVerification();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save verification document.';
      setFormError(msg);
      toast({
        title: 'Document Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  const handleEditClick = (doc: VerificationDocumentResponse) => {
    setEditingDocId(doc.id);
    setSelectedType(doc.documentType);
    setFileReference(doc.fileReference);
    setSelectedFileName(doc.fileReference.replace(/^.*[\\/]/, ''));
    setFormError(null);
  };

  const handleCancelEdit = () => {
    setEditingDocId(null);
    setFileReference('');
    setSelectedFileName('');
    setFormError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResubmit = async () => {
    setIsResubmitting(true);
    setShowResubmitConfirm(false);
    try {
      const updated = await resubmitWorkerVerificationApi();
      setVerification(updated);
      toast({
        title: 'Verification Submitted',
        description: 'Your verification request is now under review by platform administrators.',
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to resubmit verification request.';
      toast({
        title: 'Resubmission Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsResubmitting(false);
    }
  };

  const handlePreviewDocument = async (docId: number) => {
    setIsPreviewLoading(true);
    try {
      const data = await previewVerificationDocumentApi(docId);
      setPreviewDoc(data);
    } catch (err: any) {
      toast({
        title: 'Preview Error',
        description: err.response?.data?.message || 'Unable to preview document.',
        variant: 'destructive',
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-slate-600">Loading worker verification details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h3 className="text-base font-semibold text-red-900">Verification Load Failure</h3>
        <p className="text-xs text-red-700 max-w-md mx-auto">{error}</p>
        <button
          type="button"
          onClick={fetchVerification}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry Loading
        </button>
      </div>
    );
  }

  const status: VerificationStatus = verification?.status || 'NOT_SUBMITTED';
  const documents = verification?.documents || [];

  const hasDocuments = documents.length > 0;
  const canEditDocuments = status === 'NOT_SUBMITTED' || status === 'CHANGES_REQUIRED' || status === 'REJECTED';
  const canSubmit = canEditDocuments && hasDocuments;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. STATUS BANNER HEADER */}
      <StatusBanner verification={verification} onRefresh={fetchVerification} />

      {/* 2. DOCUMENT UPLOAD / EDIT FORM (Shown when editing is allowed) */}
      {canEditDocuments && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              {editingDocId ? 'Edit Attached Document' : 'Attach Verification Document'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Provide required identity or skill documents for compliance verification.
            </p>
          </div>

          {formError && (
            <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleDocumentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Document Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as VerificationDocumentType)}
                disabled={isSubmittingDoc}
                className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="GOVERNMENT_ID">Government Issued ID (Aadhaar/PAN/Passport)</option>
                <option value="PROFILE_PHOTO">Worker Profile Photo</option>
                <option value="SKILL_CERTIFICATE">Skill Certificate / Trade License</option>
                <option value="OTHER">Other Verification Document</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.svg"
                onChange={handleFileSelect}
                disabled={isSubmittingDoc}
                className="hidden"
                id="verification-file-input"
              />

              <div
                onClick={() => !isSubmittingDoc && fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/30 rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2"
              >
                {selectedFileName ? (
                  <div className="flex items-center gap-2 text-emerald-800 font-medium text-xs bg-emerald-100/70 border border-emerald-200 px-3 py-1.5 rounded-lg">
                    <FileCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="truncate max-w-xs">{selectedFileName}</span>
                    <span className="text-[10px] text-emerald-600 font-bold ml-1">Change File</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-700">Click to choose a file or drag & drop</p>
                    <p className="text-[11px] text-slate-500">Supported formats: PDF, PNG, JPG (Max 5MB)</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmittingDoc || !fileReference}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition shadow-xs"
              >
                {isSubmittingDoc ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingDocId ? (
                  <>
                    <Edit className="h-3.5 w-3.5" /> Save Changes
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" /> Add Document
                  </>
                )}
              </button>

              {editingDocId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSubmittingDoc}
                  className="px-3 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* 3. SUBMITTED DOCUMENTS LIST (Rendered ONLY when documents exist) */}
      {hasDocuments && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Submitted Documents</h3>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {documents.length} attached
            </span>
          </div>

          <div className="space-y-3">
            {documents.map((doc) => {
              const safeDisplayName = doc.fileReference ? doc.fileReference.replace(/^.*[\\/]/, '') : 'Document';
              return (
                <div
                  key={doc.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                      </span>
                      <DocumentStatusBadge status={doc.status} />
                    </div>
                    <p className="text-xs font-mono text-slate-600 truncate max-w-xs sm:max-w-md">
                      File: {safeDisplayName}
                    </p>
                    {doc.reviewNote && (
                      <div className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md mt-1">
                        Reviewer note: "{doc.reviewNote}"
                      </div>
                    )}
                    <p className="text-[11px] text-slate-400">
                      Uploaded: {new Date(doc.uploadedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePreviewDocument(doc.id)}
                      disabled={isPreviewLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition shadow-2xs"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" /> Preview
                    </button>

                    {canEditDocuments && (
                      <button
                        type="button"
                        onClick={() => handleEditClick(doc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition"
                      >
                        <Edit className="h-3.5 w-3.5" /> Replace
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* SUBMIT FOR REVIEW ACTION BAR */}
          {canSubmit && (
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-600">
                Ready to submit your attached verification documents for admin review?
              </p>
              <button
                type="button"
                onClick={() => setShowResubmitConfirm(true)}
                disabled={isResubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition shadow-sm"
              >
                {isResubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    Submit for Admin Review <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. GUIDELINES INFO CARD */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 space-y-2">
        <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
          <Info className="h-4 w-4 text-blue-600" /> Verification Guidelines
        </div>
        <ul className="text-xs text-blue-800 space-y-1.5 list-disc pl-4">
          <li>Upload legibly formatted ID documents for rapid approval.</li>
          <li>Admin reviews typically take 24–48 hours.</li>
          <li>Once verified, your profile displays an official verification badge to customers.</li>
        </ul>
      </div>

      {/* 5. RESUBMIT CONFIRMATION MODAL */}
      {showResubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-base font-bold text-slate-900">Confirm Verification Submission</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to submit your attached verification documents for admin review? Editing
              will be locked while under review.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResubmitConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResubmit}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition shadow-xs"
              >
                Confirm Submission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. REAL VISUAL DOCUMENT CONTENT PREVIEW MODAL */}
      {previewDoc && (
        <DocumentViewerModal
          doc={previewDoc}
          blobUrl={
            localBlobMap[previewDoc.fileReference] ||
            localBlobMap[previewDoc.fileReference.replace(/^.*[\\/]/, '')]
          }
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}

/* HELPER COMPONENTS */

function StatusBanner({
  verification,
  onRefresh,
}: {
  verification: WorkerVerificationResponse | null;
  onRefresh: () => void;
}) {
  const status: VerificationStatus = verification?.status || 'NOT_SUBMITTED';

  switch (status) {
    case 'VERIFIED':
      return (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5 sm:mt-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-emerald-950">Profile Verified</h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-200/80 px-2 py-0.5 rounded-md">
                  VERIFIED
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Congratulations! Your worker verification has been approved. You are eligible to accept
                matching gig requests.
              </p>
              {verification?.verifiedAt && (
                <p className="text-[11px] text-emerald-700 font-medium mt-1">
                  Verified date: {new Date(verification.verifiedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg shadow-2xs transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Status
          </button>
        </div>
      );

    case 'PENDING_REVIEW':
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5 sm:mt-0">
              <Clock3 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-amber-950">Verification Under Review</h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md">
                  PENDING
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Your submitted documents are currently being evaluated by our compliance review team.
              </p>
              {verification?.submittedAt && (
                <p className="text-[11px] text-amber-700 font-medium mt-1">
                  Submitted: {new Date(verification.submittedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-white border border-amber-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-amber-100 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Status
          </button>
        </div>
      );

    case 'CHANGES_REQUIRED':
      return (
        <div className="rounded-2xl border border-orange-200 bg-orange-50/80 p-5 flex flex-col items-start gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-orange-600 text-white shrink-0">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-orange-950">Document Changes Required</h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-800 bg-orange-200/80 px-2 py-0.5 rounded-md">
                  ACTION REQUIRED
                </span>
              </div>
              <p className="text-xs text-orange-900">
                An administrator requested changes before your verification can be approved.
              </p>
            </div>
          </div>
          {verification?.rejectionReason && (
            <div className="w-full bg-white/80 border border-orange-200 p-3 rounded-xl text-xs font-medium text-orange-950">
              <strong>Admin Feedback:</strong> "{verification.rejectionReason}"
            </div>
          )}
        </div>
      );

    case 'REJECTED':
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-5 flex flex-col items-start gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-red-600 text-white shrink-0">
              <XCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-red-950">Verification Rejected</h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-800 bg-red-200/80 px-2 py-0.5 rounded-md">
                  REJECTED
                </span>
              </div>
              <p className="text-xs text-red-900">
                Your verification request was rejected. You may correct your document details and resubmit for review.
              </p>
            </div>
          </div>
          {verification?.rejectionReason && (
            <div className="w-full bg-white/80 border border-red-200 p-3 rounded-xl text-xs font-medium text-red-950">
              <strong>Rejection Reason:</strong> "{verification.rejectionReason}"
            </div>
          )}
        </div>
      );

    case 'SUSPENDED':
      return (
        <div className="rounded-2xl border border-purple-200 bg-purple-50/80 p-5 flex flex-col items-start gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-purple-700 text-white shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-purple-950">Verification Suspended</h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-800 bg-purple-200/80 px-2 py-0.5 rounded-md">
                  SUSPENDED
                </span>
              </div>
              <p className="text-xs text-purple-900">
                Your verification status has been suspended by platform administration. Please contact support.
              </p>
            </div>
          </div>
          {verification?.rejectionReason && (
            <div className="w-full bg-white/80 border border-purple-200 p-3 rounded-xl text-xs font-medium text-purple-950">
              <strong>Reason:</strong> "{verification.rejectionReason}"
            </div>
          )}
        </div>
      );

    case 'NOT_SUBMITTED':
    default:
      return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-slate-700 text-white shrink-0">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Verification Required</h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 bg-slate-200 px-2 py-0.5 rounded-md">
                  NOT SUBMITTED
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Attach your verification documents below and submit your profile for admin review.
              </p>
            </div>
          </div>
        </div>
      );
  }
}

function DocumentStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
          <CheckCircle2 className="h-3 w-3" /> APPROVED
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-md">
          <XCircle className="h-3 w-3" /> REJECTED
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
          <Clock3 className="h-3 w-3" /> PENDING
        </span>
      );
  }
}
