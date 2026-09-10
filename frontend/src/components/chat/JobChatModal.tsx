import React from 'react';
import { X, MessageSquare } from 'lucide-react';
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
  requestTitle,
}: JobChatModalProps) {
  if (!isOpen || !jobId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[580px] max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sleek Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-inner">
              {workerName ? workerName.substring(0, 2).toUpperCase() : <MessageSquare className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white tracking-tight">
                  Chat with {workerName || 'Worker'}
                </h3>
                <span className="text-[10px] font-extrabold bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full border border-slate-700/80">
                  Job #{jobId}
                </span>
              </div>
              {requestTitle && (
                <p className="text-xs text-slate-300 font-medium truncate max-w-xs sm:max-w-sm mt-0.5">
                  {requestTitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body (hideHeader={true} removes the inner "Job Chat #1" box) */}
        <div className="flex-1 bg-slate-50/50 overflow-hidden flex flex-col">
          <ChatPanel jobId={jobId} hideHeader={true} />
        </div>
      </div>
    </div>
  );
}
