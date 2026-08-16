import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User as UserIcon,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { AIChatMessage } from '@tracker/shared';

interface AIAssistantDrawerProps {
  token: string;
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  token,
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your Tracker LifeOS Assistant. I can help you organize tasks, check habits, schedule priorities, or synthesize your daily review. How can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    'Show my tasks for today',
    'Add task: Prepare quarterly review with high priority',
    'What are my habit streaks?',
    'Generate my daily review',
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (promptText?: string) => {
    const messageToSend = promptText || input;
    if (!messageToSend.trim() || loading) return;

    const userMessage: AIChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: messageToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${baseUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMessage: AIChatMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionExecuted: data.actionExecuted,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        if (data.suggestedPrompts && data.suggestedPrompts.length > 0) {
          setSuggestedPrompts(data.suggestedPrompts);
        }

        if (data.actionExecuted && onRefreshData) {
          onRefreshData();
        }
      } else {
        throw new Error('AI assistant response error');
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an issue processing that request. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0D1322] border-l border-slate-800 shadow-2xl flex flex-col justify-between animate-fadeIn">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white leading-none">LifeOS AI Assistant</h3>
            <span className="text-[10px] text-amber-400 font-semibold">Controlled Action Engine</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div key={m.id} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                  <Bot size={14} />
                </div>
              )}

              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isUser
                    ? 'bg-amber-500 text-slate-950 font-semibold rounded-tr-sm shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm shadow-md'
                }`}
              >
                <div className="whitespace-pre-line">{m.content}</div>

                {/* Structured Action Executed Pill */}
                {m.actionExecuted && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                    <CheckCircle2 size={12} />
                    <span>Action executed: {m.actionExecuted.action}</span>
                  </div>
                )}

                <span
                  className={`text-[9px] block mt-1.5 text-right ${
                    isUser ? 'text-slate-900/60 font-medium' : 'text-slate-500'
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <UserIcon size={14} />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-2.5 items-center text-slate-400 text-xs pl-2">
            <Loader2 size={14} className="animate-spin text-amber-400" />
            <span>Thinking & formulating answer...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts & Input Box */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-3">
        {/* Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {suggestedPrompts.slice(0, 3).map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-[10px] px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 whitespace-nowrap transition"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI or type 'Add task: ...'"
            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40 transition"
          >
            <Send size={13} />
          </button>
        </form>
      </div>
    </div>
  );
};
