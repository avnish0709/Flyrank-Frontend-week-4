import React, { useState } from 'react';
import { useCompletion } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  Square,
  Copy,
  Check,
  Send,
  RefreshCw,
  Code2,
  FileText,
  Mail,
  Database,
  Sliders,
} from 'lucide-react';

interface CompletionViewProps {
  selectedModel: string;
}

const PRESET_TEMPLATES = [
  {
    icon: <Code2 size={15} color="#10b981" />,
    label: 'Custom React Hook',
    prompt: 'Write a production-ready custom React useDebounce hook in TypeScript with full JSDoc comments and typing.',
  },
  {
    icon: <FileText size={15} color="#3b82f6" />,
    label: 'Summarize Architecture',
    prompt: 'Summarize the core benefits of Server-Sent Events (SSE) streaming and Vercel AI SDK in 3 concise bullet points.',
  },
  {
    icon: <Mail size={15} color="#a855f7" />,
    label: 'Draft Milestone Email',
    prompt: 'Draft a professional engineering milestone email announcing the completion of the AI streaming chat studio.',
  },
  {
    icon: <Database size={15} color="#f59e0b" />,
    label: 'SQL Analytics Query',
    prompt: 'Write a high-performance PostgreSQL query to fetch active users with aggregated order totals and lifetime spend.',
  },
];

export const CompletionView: React.FC<CompletionViewProps> = ({ selectedModel }) => {
  const [copied, setCopied] = useState(false);
  const [throttleMs, setThrottleMs] = useState(50);

  // Initialize Vercel AI SDK useCompletion hook
  const {
    completion,
    input,
    handleInputChange,
    handleSubmit,
    setInput,
    isLoading,
    stop,
    error,
    setCompletion,
  } = useCompletion({
    api: '/api/completion',
    throttle: throttleMs,
    body: {
      model: selectedModel,
    },
    onFinish: (_prompt, finalCompletion) => {
      console.log('Finished streaming completion. Characters:', finalCompletion.length);
    },
    onError: (err) => {
      console.error('Completion error:', err);
    },
  });

  const handleCopy = async () => {
    if (!completion) return;
    try {
      await navigator.clipboard.writeText(completion);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy completion:', err);
    }
  };

  const handleClear = () => {
    if (isLoading) stop();
    setCompletion('');
    setInput('');
  };

  return (
    <div className="completion-studio">
      <div className="completion-header">
        <div className="completion-badge-wrap">
          <span className="gen-ui-tag">Single-Turn Generation</span>
          <h2 className="completion-title">AI Completion Studio</h2>
          <p className="completion-subtitle">
            Powered by <code>useCompletion()</code> with real-time token streaming, cancelation, and 50ms UI update throttling.
          </p>
        </div>

        <div className="completion-controls-bar">
          <div className="throttle-pill" title="Throttled UI updates for 60fps performance">
            <Sliders size={13} color="#94a3b8" />
            <span>Throttle:</span>
            <select
              value={throttleMs}
              onChange={(e) => setThrottleMs(Number(e.target.value))}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                outline: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <option value={0} style={{ background: '#1e2438' }}>0ms</option>
              <option value={50} style={{ background: '#1e2438' }}>50ms</option>
              <option value={100} style={{ background: '#1e2438' }}>100ms</option>
              <option value={200} style={{ background: '#1e2438' }}>200ms</option>
            </select>
          </div>

          {(completion || input) && (
            <button
              type="button"
              className="icon-btn"
              onClick={handleClear}
              title="Clear completion"
            >
              <RefreshCw size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Preset Prompt Suggestions */}
      <div className="completion-presets-row">
        {PRESET_TEMPLATES.map((item, idx) => (
          <button
            key={idx}
            type="button"
            className="completion-preset-btn"
            disabled={isLoading}
            onClick={() => setInput(item.prompt)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Prompt Form Input */}
      <form onSubmit={handleSubmit} className="completion-form">
        <div className="completion-input-wrap">
          <textarea
            className="completion-textarea"
            name="prompt"
            value={input}
            onChange={handleInputChange}
            placeholder="Enter a prompt to generate text, code, or summary with useCompletion... (e.g. 'Write a useDebounce hook')"
            rows={3}
          />
          <div className="completion-form-footer">
            <span className="char-count">{input.length} characters</span>
            <div className="completion-btn-group">
              {isLoading ? (
                <button
                  type="button"
                  className="stop-btn"
                  onClick={stop}
                  title="Stop generation"
                >
                  <Square size={13} fill="currentColor" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="submit"
                  className="send-btn completion-submit"
                  disabled={!input.trim()}
                  title="Generate Completion"
                >
                  <Send size={15} />
                  <span>Generate</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Error Banner */}
      {error && (
        <div className="tool-error" style={{ margin: '14px 0' }}>
          Error: {error.message || 'Failed to stream completion'}
        </div>
      )}

      {/* Real-time Streaming Output Display */}
      {completion ? (
        <div className="completion-output-card">
          <div className="completion-output-header">
            <div className="completion-status-badge">
              <Sparkles size={14} color="#f59e0b" />
              <span>Completion Output</span>
              {isLoading && (
                <span className="live-pill">
                  <span className="live-dot" />
                  Streaming
                </span>
              )}
            </div>

            <button
              type="button"
              className="action-btn"
              onClick={handleCopy}
              title="Copy completion to clipboard"
            >
              {copied ? (
                <>
                  <Check size={12} color="#10b981" />
                  <span style={{ color: '#10b981' }}>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="completion-body markdown-body">
            <ReactMarkdown>{completion}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <div className="completion-empty-card">
          <Sparkles size={28} color="#64748b" />
          <p>Your streaming completion will appear here in real-time as tokens are generated.</p>
        </div>
      )}
    </div>
  );
};
