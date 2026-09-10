import React, { useState } from 'react';
import { X, RefreshCw, MessageSquare } from 'lucide-react';
import { ChatPanel } from './ChatPanel';

interface JobChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: number | null;
  workerName?: string | null;
  requestTitle?: string;
}

export function JobChatModal({
  isOpen,
  onClose,
  jobId,
  workerName,
}: JobChatModalProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen || !jobId) return null;

  const displayName = workerName || 'Worker';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[580px] max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Unified Clean Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-inner">
              {initials || <MessageSquare className="h-5 w-5" />}
            </div>
            <h3 className="font-extrabold text-base text-white tracking-tight">
              {displayName}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-70"
              title="Refresh messages"
            >
              <RefreshCw className={`h-4.5 w-4.5 transition-transform ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 bg-slate-50/50 overflow-hidden flex flex-col">
          <ChatPanel
            jobId={jobId}
            hideHeader={true}
            refreshTrigger={refreshTrigger}
            onLoadingChange={(isLoading) => setIsRefreshing(isLoading)}
          />
        </div>
      </div>
    </div>
  );
}
