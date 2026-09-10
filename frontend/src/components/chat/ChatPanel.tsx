import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMessagesForJobApi, markMessagesAsReadApi, sendMessageApi } from '@/services/api/chat';
import type { ChatMessageResponse } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, MessageSquare, RefreshCw, Send, User } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ChatPanelProps {
  jobId: number;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ jobId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const data = await getMessagesForJobApi(jobId);
      setMessages(data);
      setError(null);
      // Automatically mark unread messages as read
      await markMessagesAsReadApi(jobId).catch(() => {});
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to load chat messages';
      if (err.response?.status === 403) {
        setError('Access denied: You are not authorized to view this job chat.');
      } else if (err.response?.status === 404) {
        setError('Job not found.');
      } else {
        setError(msg);
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(false);

    // Setup polling every 6 seconds while panel is mounted
    const timer = setInterval(() => {
      fetchMessages(true);
    }, 6000);

    return () => {
      clearInterval(timer);
    };
  }, [jobId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    if (textToSend.length > 2000) {
      setError('Message text cannot exceed 2000 characters');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const newMsg = await sendMessageApi(jobId, { messageText: textToSend });
      setMessages((prev) => [...prev, newMsg]);
      setInputText('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send message';
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-lg bg-card text-card-foreground shadow-sm">
      <div className="p-4 border-b flex items-center justify-between bg-muted/40">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Job Chat #{jobId}</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={() => fetchMessages(false)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && (
        <div className="p-3">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Chat Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" /> Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <MessageSquare className="h-10 w-10 opacity-40" />
            <p>No messages yet. Send a message to start communicating!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender.email.toLowerCase() === user?.email.toLowerCase();
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center gap-1 text-xs text-muted-foreground px-1">
                  <User className="h-3 w-3" />
                  <span>{msg.sender.name} ({msg.sender.role})</span>
                  <span>•</span>
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm break-words ${
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted rounded-bl-none text-foreground'
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

      <form onSubmit={handleSend} className="p-3 border-t flex gap-2 bg-muted/20">
        <Input
          placeholder="Type your message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={2000}
          disabled={sending || !!error}
          className="flex-1"
        />
        <Button type="submit" disabled={!inputText.trim() || sending || !!error}>
          {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
};
