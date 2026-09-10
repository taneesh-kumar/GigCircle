import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock3,
  AlertTriangle,
  Ban,
  FileText,
  Eye,
  User,
  Mail,
  Calendar,
  ChevronRight,
  ArrowLeft,
  MessageSquare,
  ShieldAlert,
  Loader2,
  Check,
  History,
  Lock,
} from 'lucide-react';
import {
  getAdminVerificationsApi,
  getAdminVerificationByIdApi,
  approveAdminVerificationApi,
  requestChangesAdminVerificationApi,
  rejectAdminVerificationApi,
  suspendAdminVerificationApi,
  previewAdminDocumentApi,
  getAdminActivityApi,
} from '@/services/api';
import type {
  WorkerVerificationResponse,
  VerificationDocumentResponse,
  VerificationStatus,
} from '@/types/worker-verification';
import { DOCUMENT_TYPE_LABELS, STATUS_LABELS } from '@/types/worker-verification';
import type { AdminActivity } from '@/types/admin';
import { useToast } from '@/hooks/use-toast';
import { DocumentViewerModal } from '@/components/document-viewer-modal';

type ActionType = 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT' | 'SUSPEND' | null;

const STATUS_FILTERS: { key: VerificationStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All Records' },
  { key: 'PENDING_REVIEW', label: 'Pending Review' },
  { key: 'CHANGES_REQUIRED', label: 'Changes Required' },
  { key: 'VERIFIED', label: 'Verified' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'SUSPENDED', label: 'Suspended' },
  { key: 'NOT_SUBMITTED', label: 'Not Submitted' },
];

export function AdminVerificationSection() {
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<WorkerVerificationResponse[]>([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<VerificationStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected verification state
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<WorkerVerificationResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Document preview state
  const [previewDocument, setPreviewDocument] = useState<VerificationDocumentResponse | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Action dialog state
  const [pendingAction, setPendingAction] = useState<ActionType>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Audit activity logs
  const [activities, setActivities] = useState<AdminActivity[]>([]);

  const fetchVerifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminVerificationsApi(
        selectedStatusFilter === 'ALL' ? undefined : selectedStatusFilter
      );
      const list = Array.isArray(res) ? res : res.content;
      setVerifications(list);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Failed to load verification records';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatusFilter]);

  const fetchAuditActivities = useCallback(async () => {
    try {
      const logs = await getAdminActivityApi();
      setActivities(logs?.content || []);
    } catch {
      // Non-blocking audit load
    }
  }, []);

  useEffect(() => {
    fetchVerifications();
    fetchAuditActivities();
  }, [fetchVerifications, fetchAuditActivities]);

  const handleSelectVerification = async (id: number) => {
    setSelectedId(id);
    setIsLoadingDetail(true);
    try {
      const data = await getAdminVerificationByIdApi(id);
      setSelectedVerification(data);
    } catch (err: any) {
      toast({
        title: 'Error loading record',
        description: err?.response?.data?.message || 'Could not fetch record details',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleDocumentPreview = async (documentId: number) => {
    if (!selectedVerification) return;
    setIsPreviewLoading(true);
    setPreviewError(null);
    try {
      const doc = await previewAdminDocumentApi(selectedVerification.id, documentId);
      setPreviewDocument(doc);
    } catch (err: any) {
      setPreviewError(
        err?.response?.data?.message || 'Access denied or failed to load document preview'
      );
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleOpenAction = (action: ActionType) => {
    setPendingAction(action);
    setActionReason('');
    setActionError(null);
  };

  const handleCloseAction = () => {
    setPendingAction(null);
    setActionReason('');
    setActionError(null);
  };

  const handleExecuteAction = async () => {
    if (!selectedVerification || !pendingAction) return;

    // Validate reason requirement for specific actions
    if (['REQUEST_CHANGES', 'REJECT', 'SUSPEND'].includes(pendingAction)) {
      if (!actionReason.trim()) {
        setActionError('A valid reason is required for this action.');
        return;
      }
    }

    setIsSubmittingAction(true);
    setActionError(null);

    try {
      let updated: WorkerVerificationResponse;
      const targetId = selectedVerification.id;

      switch (pendingAction) {
        case 'APPROVE':
          updated = await approveAdminVerificationApi(targetId);
          toast({
            title: 'Verification Approved',
            description: `Worker ${updated.workerName || updated.workerEmail} is now verified.`,
          });
          break;
        case 'REQUEST_CHANGES':
          updated = await requestChangesAdminVerificationApi(targetId, actionReason.trim());
          toast({
            title: 'Changes Requested',
            description: 'The worker has been notified to re-submit corrected documents.',
          });
          break;
        case 'REJECT':
          updated = await rejectAdminVerificationApi(targetId, actionReason.trim());
          toast({
            title: 'Verification Rejected',
            description: 'The verification request has been rejected.',
            variant: 'destructive',
          });
          break;
        case 'SUSPEND':
          updated = await suspendAdminVerificationApi(targetId, actionReason.trim());
          toast({
            title: 'Worker Suspended',
            description: 'The worker verification status has been suspended.',
            variant: 'destructive',
          });
          break;
        default:
          return;
      }

      setSelectedVerification(updated);
      handleCloseAction();
      await fetchVerifications();
      await fetchAuditActivities();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to execute review action';
      setActionError(msg);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return 'N/A';
    try {
      return new Date(ts).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return ts;
    }
  };

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Verified
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
            <Clock3 className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
            Pending Review
          </span>
        );
      case 'CHANGES_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800 border border-sky-200">
            <AlertCircle className="h-3.5 w-3.5 text-sky-600" />
            Changes Required
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800 border border-rose-200">
            <XCircle className="h-3.5 w-3.5 text-rose-600" />
            Rejected
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800 border border-purple-200">
            <Ban className="h-3.5 w-3.5 text-purple-600" />
            Suspended
          </span>
        );
      case 'NOT_SUBMITTED':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
            <Clock3 className="h-3.5 w-3.5 text-slate-400" />
            Not Submitted
          </span>
        );
    }
  };

  const filteredVerifications = verifications.filter((v) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (v.workerName && v.workerName.toLowerCase().includes(query)) ||
      (v.workerEmail && v.workerEmail.toLowerCase().includes(query)) ||
      String(v.workerId).includes(query) ||
      String(v.id).includes(query)
    );
  });

  const matchingActivities = selectedVerification
    ? activities.filter(
        (a) =>
          a.entityType === 'WORKER_VERIFICATION' &&
          String(a.entityId) === String(selectedVerification.id)
      )
    : [];

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                ADMINISTRATION & GOVERNANCE
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Worker Verification Audit Dashboard
            </h2>
            <p className="text-xs text-slate-300">
              Audit worker credentials, preview submitted documents, and perform compliance reviews.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchVerifications}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all disabled:opacity-50 self-start md:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh List
          </button>
        </div>
      </div>

      {/* FILTER AND SEARCH CONTROLS */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {STATUS_FILTERS.map((tab) => {
            const count =
              tab.key === 'ALL'
                ? verifications.length
                : verifications.filter((v) => v.status === tab.key).length;
            const isActive = selectedStatusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedStatusFilter(tab.key)}
                data-testid={`filter-${tab.key.toLowerCase()}`}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive ? 'bg-emerald-500 text-slate-950 font-extrabold' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search worker, email or ID..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span className="font-semibold">{error}</span>
          </div>
          <button
            onClick={fetchVerifications}
            className="rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* MAIN CONTENT SPLIT LAYOUT */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* VERIFICATION LIST (Left/Main Column) */}
        <div
          className={`${
            selectedVerification ? 'lg:col-span-6 xl:col-span-5' : 'lg:col-span-12'
          } space-y-4 transition-all duration-300`}
        >
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                Verification Records ({filteredVerifications.length})
              </h3>
              {selectedVerification && (
                <button
                  onClick={() => {
                    setSelectedId(null);
                    setSelectedVerification(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Full View
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-20 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/50"
                  />
                ))}
              </div>
            ) : filteredVerifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">No verification records found</p>
                  <p className="text-[11px] text-slate-500">
                    {selectedStatusFilter !== 'ALL'
                      ? `No records match status: ${selectedStatusFilter}`
                      : 'No verification submissions available yet.'}
                  </p>
                </div>
                {selectedStatusFilter !== 'ALL' && (
                  <button
                    onClick={() => setSelectedStatusFilter('ALL')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredVerifications.map((v) => {
                  const isSelected = selectedId === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => handleSelectVerification(v.id)}
                      data-testid={`verification-row-${v.id}`}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/20'
                          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm truncate">
                              {v.workerName || `Worker #${v.workerId}`}
                            </span>
                            {getStatusBadge(v.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1 text-slate-600 font-medium">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              {v.workerEmail || `Worker ID: ${v.workerId}`}
                            </span>
                            <span className="flex items-center gap-1 text-slate-500">
                              <FileText className="h-3.5 w-3.5 text-slate-400" />
                              {v.documents?.length || 0} Docs Submitted
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 text-xs">
                          <div className="text-right space-y-0.5">
                            <span className="text-[10px] text-slate-400 block font-medium">
                              Submitted: {formatTimestamp(v.submittedAt)}
                            </span>
                            {v.reviewedAt && (
                              <span className="text-[10px] text-emerald-700 block font-semibold">
                                Reviewed: {formatTimestamp(v.reviewedAt)}
                              </span>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* VERIFICATION DETAIL & ACTION PANEL (Right Column) */}
        {selectedVerification && (
          <div className="lg:col-span-6 xl:col-span-7 space-y-6">
            {isLoadingDetail ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
                <p className="text-xs text-slate-500 font-semibold">Loading verification details...</p>
              </div>
            ) : (
              <>
                {/* WORKER & STATUS OVERVIEW CARD */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-emerald-600" />
                        <h3 className="text-lg font-extrabold text-slate-900">
                          {selectedVerification.workerName || 'Worker Record'}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {selectedVerification.workerEmail || 'N/A'} (Worker ID: #{selectedVerification.workerId})
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                        CURRENT STATUS
                      </span>
                      {getStatusBadge(selectedVerification.status)}
                    </div>
                  </div>

                  {/* TIMELINE METADATA GRID */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Submitted At
                      </span>
                      <span className="font-semibold text-slate-800 block mt-0.5">
                        {formatTimestamp(selectedVerification.submittedAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Last Reviewed
                      </span>
                      <span className="font-semibold text-slate-800 block mt-0.5">
                        {formatTimestamp(selectedVerification.reviewedAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Reviewer Admin
                      </span>
                      <span className="font-semibold text-slate-800 block mt-0.5">
                        {selectedVerification.reviewedByName ||
                          (selectedVerification.reviewedById ? `Admin #${selectedVerification.reviewedById}` : 'Pending')}
                      </span>
                    </div>
                  </div>

                  {/* PREVIOUS REJECTION / CHANGE NOTE IF PRESENT */}
                  {selectedVerification.rejectionReason && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                        <MessageSquare className="h-4 w-4 text-amber-600" />
                        Review Note / Reason:
                      </div>
                      <p className="text-slate-800 font-medium leading-relaxed pl-5">
                        "{selectedVerification.rejectionReason}"
                      </p>
                    </div>
                  )}

                  {/* SUBMITTED DOCUMENTS SECTION */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-emerald-600" />
                      Submitted Verification Documents ({selectedVerification.documents?.length || 0})
                    </h4>

                    {selectedVerification.documents?.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">No documents attached to this record.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedVerification.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/50 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">
                                  {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.2 text-[10px] font-extrabold uppercase ${
                                    doc.status === 'APPROVED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : doc.status === 'REJECTED'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {doc.status}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                Reference: {doc.fileReference}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDocumentPreview(doc.id)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors shadow-2xs shrink-0"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-500" /> Secure Preview
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ADMIN REVIEW ACTIONS TOOLBAR */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Compliance Review Actions
                    </h4>

                    {/* ACTION BUTTONS BASED ON VALID STATUS TRANSITIONS */}
                    <div className="flex flex-wrap gap-2.5">
                      {/* PENDING_REVIEW: Approve, Request Changes, Reject */}
                      {selectedVerification.status === 'PENDING_REVIEW' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenAction('APPROVE')}
                            className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 px-4 text-xs font-bold text-white shadow-sm transition-all"
                          >
                            <CheckCircle2 className="h-4 w-4" /> Approve Verification
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAction('REQUEST_CHANGES')}
                            className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 py-2.5 px-4 text-xs font-bold text-white shadow-sm transition-all"
                          >
                            <AlertCircle className="h-4 w-4" /> Request Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAction('REJECT')}
                            className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 py-2.5 px-4 text-xs font-bold text-white shadow-sm transition-all"
                          >
                            <XCircle className="h-4 w-4" /> Reject Verification
                          </button>
                        </>
                      )}

                      {/* VERIFIED: Suspend */}
                      {selectedVerification.status === 'VERIFIED' && (
                        <button
                          type="button"
                          onClick={() => handleOpenAction('SUSPEND')}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 py-2.5 px-4 text-xs font-bold text-white shadow-sm transition-all"
                        >
                          <Ban className="h-4 w-4" /> Suspend Verified Profile
                        </button>
                      )}

                      {/* SUSPENDED: Re-Approve */}
                      {selectedVerification.status === 'SUSPENDED' && (
                        <button
                          type="button"
                          onClick={() => handleOpenAction('APPROVE')}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 px-4 text-xs font-bold text-white shadow-sm transition-all"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Re-Approve & Reinstate Worker
                        </button>
                      )}

                      {/* OTHER STATUSES (CHANGES_REQUIRED, REJECTED, NOT_SUBMITTED) */}
                      {['CHANGES_REQUIRED', 'REJECTED', 'NOT_SUBMITTED'].includes(
                        selectedVerification.status
                      ) && (
                        <div className="w-full rounded-2xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500 text-center font-medium flex items-center justify-center gap-2">
                          <Lock className="h-4 w-4 text-slate-400" />
                          No admin review actions available for status:{' '}
                          <strong className="text-slate-700 font-bold">{selectedVerification.status}</strong>. Worker must resubmit first.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* REVIEW HISTORY & ACTIVITY AUDIT TRAIL */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <History className="h-4 w-4 text-slate-600" /> Audit & Review History Stream
                    </h4>
                  </div>

                  {matchingActivities.length === 0 && !selectedVerification.reviewedAt ? (
                    <p className="text-xs text-slate-400 text-center py-4 italic">
                      No review audit events recorded yet for this record.
                    </p>
                  ) : (
                    <div className="space-y-3 text-xs">
                      {/* Summary review info from DTO */}
                      {selectedVerification.reviewedAt && (
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 space-y-1">
                          <div className="flex items-center justify-between text-slate-800 font-bold">
                            <span>Status Reviewed: {selectedVerification.status}</span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {formatTimestamp(selectedVerification.reviewedAt)}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px]">
                            Reviewed by:{' '}
                            <strong className="text-slate-800">
                              {selectedVerification.reviewedByName || `Admin #${selectedVerification.reviewedById}`}
                            </strong>
                          </p>
                          {selectedVerification.rejectionReason && (
                            <p className="text-amber-800 text-[11px] font-medium italic mt-1">
                              Reason/Note: "{selectedVerification.rejectionReason}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* Activity logs */}
                      {matchingActivities.map((act) => (
                        <div
                          key={act.id}
                          className="rounded-2xl border border-slate-100 bg-white p-3 space-y-1 text-slate-700 shadow-2xs"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>Action: {act.actionType}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {formatTimestamp(act.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">{act.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* UNIFIED REAL DOCUMENT PREVIEW MODAL */}
      {previewDocument && (
        <DocumentViewerModal
          doc={previewDocument}
          onClose={() => {
            setPreviewDocument(null);
            setPreviewError(null);
          }}
        />
      )}

      {/* CONFIRMATION & REASON ACTION MODAL */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                {pendingAction === 'APPROVE' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                {pendingAction === 'REQUEST_CHANGES' && <AlertCircle className="h-5 w-5 text-sky-600" />}
                {pendingAction === 'REJECT' && <XCircle className="h-5 w-5 text-rose-600" />}
                {pendingAction === 'SUSPEND' && <Ban className="h-5 w-5 text-purple-600" />}
                Confirm Review Action
              </h3>
              <button
                onClick={handleCloseAction}
                disabled={isSubmittingAction}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-700 font-medium leading-relaxed">
                You are about to execute action:{' '}
                <strong className="text-slate-900 font-extrabold uppercase">{pendingAction}</strong> for worker{' '}
                <strong className="text-emerald-800">{selectedVerification?.workerName || selectedVerification?.workerEmail}</strong>.
              </p>

              {/* MANDATORY REASON FIELD FOR REQUEST_CHANGES, REJECT, SUSPEND */}
              {['REQUEST_CHANGES', 'REJECT', 'SUSPEND'].includes(pendingAction) && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Reason / Review Note <span className="text-rose-600">* (Required)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder={
                      pendingAction === 'REQUEST_CHANGES'
                        ? 'Specify what the worker needs to fix or re-upload...'
                        : pendingAction === 'REJECT'
                        ? 'Provide clear justification for rejecting verification...'
                        : 'Provide compliance justification for suspending account...'
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  />
                </div>
              )}

              {actionError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-800 text-xs font-semibold">
                  {actionError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseAction}
                disabled={isSubmittingAction}
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={
                  isSubmittingAction ||
                  (['REQUEST_CHANGES', 'REJECT', 'SUSPEND'].includes(pendingAction) &&
                    !actionReason.trim())
                }
                data-testid="confirm-action-btn"
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 ${
                  pendingAction === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : pendingAction === 'REQUEST_CHANGES'
                    ? 'bg-sky-600 hover:bg-sky-700'
                    : pendingAction === 'REJECT'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {isSubmittingAction ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...
                  </>
                ) : (
                  'Confirm & Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
