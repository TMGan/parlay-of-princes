'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Trash2, Smile } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Message } from '@/lib/types/chat';

interface LeagueChatProps {
  leagueId: string;
  currentUserId: string;
  isLeagueAdmin: boolean;
}

const EMOJI_OPTIONS = ['😀', '😂', '🔥', '👍', '👎', '💪', '🎯', '👑', '💰', '🚀'];
const REFRESH_INTERVAL = 30_000;
const MAX_MESSAGE_LENGTH = 500;

export function LeagueChat({ leagueId, currentUserId, isLeagueAdmin }: LeagueChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchMessages = useCallback(async () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`/api/leagues/${leagueId}/messages`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Failed to fetch messages');

      const data: Message[] = await response.json();
      setMessages(data);
      setError('');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Error fetching messages:', err);
      setError('Unable to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, REFRESH_INTERVAL);
    return () => {
      clearInterval(interval);
      abortControllerRef.current?.abort();
    };
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || isSending) return;

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      setError(`Message too long (max ${MAX_MESSAGE_LENGTH} characters)`);
      return;
    }

    setIsSending(true);
    setError('');

    try {
      const response = await fetch(`/api/leagues/${leagueId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setNewMessage('');
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('Delete this message?')) return;

    try {
      const response = await fetch(`/api/leagues/${leagueId}/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete message');

      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="card flex flex-col h-[600px]">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 shrink-0">
        <h2 className="text-xl font-bold">League Chat</h2>
        <p className="text-sm text-gray-400">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
        {isLoading ? (
          <div className="text-center text-gray-400 py-8">Loading messages...</div>
        ) : error && messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-accent mb-2">{error}</p>
            <button onClick={fetchMessages} className="text-sm text-primary hover:underline">
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No messages yet. Start the conversation! 🎉
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.user.id === currentUserId;
            const canDelete = isOwnMessage || isLeagueAdmin;

            return (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
              >
                <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                  {(message.user.username[0] ?? '?').toUpperCase()}
                </div>

                <div className={`flex-1 min-w-0 ${isOwnMessage ? 'text-right' : ''}`}>
                  <div
                    className={`flex items-baseline gap-2 mb-1 ${
                      isOwnMessage ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <span className="text-sm font-medium">{message.user.username}</span>
                    <span className="text-xs text-gray-500 shrink-0">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  <div
                    className={`inline-block px-4 py-2 rounded-lg max-w-[85%] ${
                      isOwnMessage ? 'bg-primary/20' : 'bg-background-light'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(message.id)}
                      className="text-xs text-gray-600 hover:text-red-500 transition-colors mt-1 inline-flex items-center gap-1"
                      aria-label="Delete message"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-800 px-6 py-4 shrink-0">
        <div className="flex items-end gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 hover:bg-background-light rounded transition-colors"
              aria-label="Insert emoji"
            >
              <Smile size={20} className="text-gray-400" />
            </button>

            {showEmojiPicker && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowEmojiPicker(false)}
                  aria-hidden="true"
                />
                <div className="absolute bottom-full left-0 mb-2 p-3 bg-background-light border border-gray-800 rounded-lg shadow-xl z-50 min-w-[240px]">
                  <div className="grid grid-cols-5 gap-2">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          if (newMessage.length + emoji.length <= MAX_MESSAGE_LENGTH) {
                            setNewMessage((prev) => prev + emoji);
                          }
                          setShowEmojiPicker(false);
                        }}
                        className="text-2xl hover:bg-background p-2 rounded transition-colors w-10 h-10 flex items-center justify-center"
                        aria-label={`Insert ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            maxLength={MAX_MESSAGE_LENGTH}
            rows={2}
            className="flex-1 px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none resize-none text-sm"
            aria-label="Message input"
          />

          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="btn-primary p-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            {isSending ? (
              <span className="block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <p className="text-xs text-gray-600">
            {newMessage.length}/{MAX_MESSAGE_LENGTH}
          </p>
          {error && (
            <p className="text-xs text-accent" role="alert">
              {error}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
