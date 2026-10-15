import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.jsx';
import { DemoBanner } from '../components/dashboard/DemoBanner.jsx';
import { postCopilotChat } from '../lib/copilotApi.js';

// ---------------------------------------------------------------------------
// Static suggested starter questions shown on empty state
// ---------------------------------------------------------------------------
const STARTER_QUESTIONS = [
  'How is revenue performing?',
  'Which customers are at risk of churning?',
  'What are our most important business problems?',
  'Which customer segments should we focus on?',
  'Who are our top customers?',
  'What actions should we take to improve retention?',
  'Which product categories are driving sales?',
  'What is the overall store health score?',
];

// ---------------------------------------------------------------------------
// Severity-style config for intent badges
// ---------------------------------------------------------------------------
const INTENT_CONFIG = {
  revenue: { label: 'Revenue', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  churn_risk: { label: 'Churn Risk', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  top_customers: { label: 'Top Customers', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  retention: { label: 'Retention', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  business_problems: { label: 'Business Issues', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  customer_segments: { label: 'Segments', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  catalog: { label: 'Catalog & AOV', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  insights: { label: 'Business Insights', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  unsupported: { label: 'Unsupported', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MetricPill({ metric }) {
  return (
    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col gap-0.5">
      <span className="text-[10px] text-slate-400 uppercase tracking-wide truncate">{metric.label}</span>
      <span className="text-sm font-bold font-mono text-slate-100">{metric.value}</span>
      {metric.context && (
        <span className="text-[10px] text-slate-500 truncate">{metric.context}</span>
      )}
    </div>
  );
}

function CitationChip({ citation }) {
  const inner = (
    <span className="flex items-center gap-1.5 text-[11px] text-indigo-300 bg-indigo-950/40 border border-indigo-800/40 px-2.5 py-1 rounded-full hover:bg-indigo-900/50 transition-colors">
      <span className="text-indigo-500 text-xs">⬡</span>
      {citation.label}
    </span>
  );
  return citation.href ? <Link to={citation.href}>{inner}</Link> : inner;
}

function CopilotAnswer({ msg }) {
  const intentInfo = INTENT_CONFIG[msg.intent] || INTENT_CONFIG.unsupported;

  return (
    <div className="flex flex-col gap-4" data-testid="copilot-answer">
      {/* Answer bubble */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
        {/* Intent badge + mode indicator */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${intentInfo.color}`}>
            {intentInfo.label}
          </span>
          <span className="text-[10px] text-slate-500 bg-slate-800/60 border border-slate-700/40 px-2 py-0.5 rounded font-mono">
            ⚙ Rule-Based Copilot
          </span>
        </div>

        {/* Answer headline */}
        <p className="text-sm font-semibold text-white leading-relaxed">
          {msg.answer}
        </p>

        {/* Narrative */}
        <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">
          {msg.narrative}
        </p>

        {/* Supporting Metrics */}
        {msg.metrics && msg.metrics.length > 0 && (
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mb-2">
              Supporting Metrics
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {msg.metrics.map((m, i) => (
                <MetricPill key={i} metric={m} />
              ))}
            </div>
          </div>
        )}

        {/* Citations */}
        {msg.citations && msg.citations.length > 0 && (
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mb-2">
              Data Sources Used
            </div>
            <div className="flex flex-wrap gap-2">
              {msg.citations.map((c, i) => (
                <CitationChip key={i} citation={c} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggested follow-ups */}
      {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {msg.suggestedFollowUps.slice(0, 4).map((q, i) => (
            <button
              key={i}
              className="text-xs text-slate-300 bg-slate-800/60 hover:bg-indigo-900/40 hover:text-indigo-300 border border-slate-700/60 hover:border-indigo-700/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              onClick={() => msg.onFollowUp && msg.onFollowUp(q)}
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UserBubble({ text }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] bg-indigo-600/20 border border-indigo-700/40 text-indigo-100 text-sm px-4 py-2.5 rounded-2xl rounded-br-sm">
        {text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 w-fit" data-testid="copilot-loading">
      <div className="flex gap-1 items-center">
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-slate-400">Analyzing your store data…</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Copilot Page
// ---------------------------------------------------------------------------
export function CopilotPage() {
  const [messages, setMessages] = useState([]); // { type: 'user'|'answer'|'error', ...data }
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed) {
      setInputError('Please enter a question.');
      return;
    }
    if (trimmed.length > 500) {
      setInputError('Question must be 500 characters or fewer.');
      return;
    }

    setInputError('');
    setInput('');
    setLoading(true);

    // Add user message immediately
    setMessages((prev) => [...prev, { type: 'user', text: trimmed }]);

    try {
      const result = await postCopilotChat(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          type: 'answer',
          ...result,
          onFollowUp: (q) => sendMessage(q),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          type: 'error',
          text: err.message || 'Failed to reach the Copilot. Check that the server is running.',
        },
      ]);
    } finally {
      setLoading(false);
      // Re-focus input for fast follow-ups
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setInput('');
    setInputError('');
    inputRef.current?.focus();
  };

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-5rem)] max-h-[900px]">
        <DemoBanner />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4 mt-2 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-indigo-400">✦</span> CommercePilot Copilot
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Rule-based business assistant — answers are grounded in verified demo data, not generated by an AI model.
            </p>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearConversation}
              className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Clear conversation
            </button>
          )}
        </div>

        {/* Message area */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-4 min-h-0" role="log" aria-live="polite" aria-label="Copilot conversation">

          {/* Empty state — starter questions */}
          {messages.length === 0 && !loading && (
            <div className="space-y-6" data-testid="copilot-empty-state">
              {/* Mode disclosure card */}
              <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5 flex gap-4 items-start">
                <span className="text-2xl mt-0.5">✦</span>
                <div>
                  <p className="text-sm font-semibold text-white">CommercePilot Copilot</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Ask me about revenue, customers, retention, product categories, or business risks. 
                    I answer using deterministic analysis of your store's order and customer data — 
                    no external AI model, no invented metrics.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                      ⚙ Rule-Based Copilot
                    </span>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">
                      Demo Data
                    </span>
                  </div>
                </div>
              </div>

              {/* Suggested questions grid */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Try asking…
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STARTER_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="text-left text-xs text-slate-300 bg-slate-900/60 hover:bg-indigo-950/40 hover:text-indigo-200 border border-slate-800 hover:border-indigo-800/60 px-4 py-3 rounded-xl transition-colors cursor-pointer leading-relaxed"
                    >
                      <span className="text-indigo-500 mr-2">›</span>{q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conversation messages */}
          {messages.map((msg, i) => {
            if (msg.type === 'user') {
              return <UserBubble key={i} text={msg.text} />;
            }
            if (msg.type === 'answer') {
              return <CopilotAnswer key={i} msg={msg} />;
            }
            if (msg.type === 'error') {
              return (
                <div key={i} className="rounded-xl bg-red-950/20 border border-red-900/40 p-4 text-sm text-red-300" data-testid="copilot-error">
                  <p className="font-semibold mb-1">Error</p>
                  <p className="text-xs text-red-400">{msg.text}</p>
                </div>
              );
            }
            return null;
          })}

          {/* Typing indicator */}
          {loading && <TypingIndicator />}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="pt-4 border-t border-slate-800 mt-2">
          {inputError && (
            <p className="text-xs text-red-400 mb-2" role="alert">{inputError}</p>
          )}
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="flex gap-2 items-end"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); setInputError(''); }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about revenue, customers, churn risk, or business insights…"
              rows={2}
              maxLength={500}
              disabled={loading}
              aria-label="Enter your question"
              className="flex-1 resize-none bg-slate-900 border border-slate-700/60 focus:border-indigo-600/80 focus:outline-none text-sm text-slate-200 placeholder-slate-500 rounded-xl px-4 py-3 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send question"
              className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-indigo-500/20 cursor-pointer"
            >
              {loading ? '…' : 'Ask'}
            </button>
          </form>
          <p className="text-[10px] text-slate-600 mt-1.5 text-right">
            {input.length}/500 · Press Enter to send
          </p>
        </div>
      </div>
    </AppShell>
  );
}
