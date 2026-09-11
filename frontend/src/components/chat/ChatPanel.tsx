import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMessagesForJobApi, markMessagesAsReadApi, sendMessageApi } from '@/services/api/chat';
import type { ChatMessageResponse } from '@/types/chat';
import { AlertCircle, MessageSquare, RefreshCw, Send } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';

interface ChatPanelProps {
  jobId: number;
  hideHeader?: boolean;
  refreshTrigger?: number;
  onLoadingChange?: (isLoading: boolean) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ jobId, hideHeader = false, refreshTrigger, onLoadingChange }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
      onLoadingChange?.(true);
    }
    try {
      const data = await getMessagesForJobApi(jobId);
      setMessages(data);
      setError(null);
      await markMessagesAsReadApi(jobId).catch(() => {});
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || t('chat.loadError');
      if (err.response?.status === 403) {
        setError(t('chat.accessDenied'));
      } else if (err.response?.status === 404) {
        setError(t('chat.jobNotFound'));
      } else {
        setError(msg);
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
        setTimeout(() => onLoadingChange?.(false), 400);
      }
    }
  };

  useEffect(() => {
    fetchMessages(false);

    const timer = setInterval(() => {
      fetchMessages(true);
    }, 5000);

    return () => {
      clearInterval(timer);
    };
  }, [jobId]);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchMessages(false);
    }
  }, [refreshTrigger]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    if (textToSend.length > 2000) {
      setError(t('chat.maxChars'));
      return;
    }

    setSending(true);
    setError(null);

    try {
      const newMsg = await sendMessageApi(jobId, { messageText: textToSend });
      setMessages((prev) => [...prev, newMsg]);
      setInputText('');
    } catch (err: any) {
      const msg = err.response?.data?.message || t('chat.sendError');
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {!hideHeader && (
        <div className="px-5 py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-2xs">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">{t('chat.title')}</h3>
              <span className="text-[10px] text-slate-400 font-bold block">{t('chat.jobLabel', { id: jobId })}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchMessages(false)}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title={t('chat.refresh')}
            aria-label={t('chat.refresh')}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 shrink-0">
          <Alert variant="destructive" className="rounded-xl border-rose-200 bg-rose-50 text-rose-800">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            <AlertTitle className="font-bold text-xs">{t('chat.status')}</AlertTitle>
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-16">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
            <span className="text-xs font-semibold">{t('chat.loading')}</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200/60 shadow-xs flex items-center justify-center text-slate-300">
              <MessageSquare className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">{t('chat.noMessages')}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('chat.noMessagesSubtitle')}</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender.email.toLowerCase() === user?.email.toLowerCase();
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold px-1">
                  <span>{isMe ? t('chat.you') : msg.sender.name}</span>
                  <span className="text-slate-300">•</span>
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div
                  className={`max-w-[80%] px-4 py-2.5 text-xs font-medium leading-relaxed break-words shadow-2xs ${
                    isMe
                      ? 'bg-slate-900 text-white rounded-2xl rounded-tr-xs'
                      : 'bg-white border border-slate-200/80 text-slate-800 rounded-2xl rounded-tl-xs'
                  }`}
                >
                  {msg.messageText}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2 shrink-0">
        <input
          type="text"
          placeholder={t('chat.placeholder')}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={2000}
          disabled={sending || !!error}
          aria-label={t('chat.placeholder')}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending || !!error}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span>{t('chat.send')}</span>
        </button>
      </form>
    </div>
  );
};
