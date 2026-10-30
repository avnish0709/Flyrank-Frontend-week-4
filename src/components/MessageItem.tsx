import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Bot,
  User,
  Copy,
  Check,
  Brain,
  ChevronDown,
  ChevronRight,
  MapPin,
  CheckCircle2,
  XCircle,
  Wrench,
  ShieldCheck,
  TrendingUp,
  CloudSun,
  ExternalLink,
  Activity,
  Clock,
  Zap,
} from 'lucide-react';
import type { MyUIMessage } from '../types/ai';
import { Weather } from './generative/Weather';
import { Stock } from './generative/Stock';

interface MessageItemProps {
  message: MyUIMessage;
  addToolOutput?: (options: any) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, addToolOutput }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isReasoningOpen, setIsReasoningOpen] = useState(true);

  // Extract plain text for copying
  const allText = message.parts
    ? message.parts
        .map((p: any) => {
          if (p.type === 'text') return p.text;
          if (p.type === 'reasoning') return `[Thinking: ${p.text}]`;
          if (p.type === 'source') return `[Source: ${p.title || p.url || ''}]`;
          if (p.type === 'data-weather') return `[Weather Telemetry: ${p.data?.city} - ${p.data?.weather || p.data?.status || ''}]`;
          if (typeof p.type === 'string' && p.type.startsWith('tool-')) {
            return `[Tool: ${p.type.replace('tool-', '')} - Output: ${JSON.stringify(p.output || p.input || '')}]`;
          }
          return '';
        })
        .join('\n')
    : (message as any).content || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(allText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className={`avatar ${isUser ? 'user' : 'assistant'}`}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      <div className="message-content-wrap">
        {/* Message Header with Metadata: Model & Timestamp */}
        <div className="message-header-meta">
          <span className="message-sender-name">
            {isUser ? 'You' : (message.metadata?.model || 'Claude AI')}
          </span>
          {message.metadata?.createdAt && (
            <span className="message-timestamp">
              <Clock size={11} />
              {new Date(message.metadata.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>

        <div className="message-bubble">
          {message.parts && message.parts.length > 0 ? (
            message.parts.map((part: any, index: number) => {
              // 1. Reasoning Part (Thinking Process)
              if (part.type === 'reasoning') {
                return (
                  <div key={index} className="reasoning-box">
                    <div
                      className="reasoning-header"
                      onClick={() => setIsReasoningOpen(!isReasoningOpen)}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Brain size={14} />
                        Claude Thinking Process
                      </span>
                      {isReasoningOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                    {isReasoningOpen && (
                      <div className="reasoning-body">
                        {part.text}
                      </div>
                    )}
                  </div>
                );
              }

              // 2. Step Start Part (Multi-step boundary)
              if (part.type === 'step-start') {
                return index > 0 ? (
                  <div key={index} className="step-boundary">
                    <span className="step-badge">Step {index + 1}</span>
                  </div>
                ) : null;
              }

              // 3. Generative UI: Weather Component (tool-displayWeather & tool-getWeatherInformation)
              if (part.type === 'tool-displayWeather' || part.type === 'tool-getWeatherInformation') {
                const callId = part.toolCallId || index;
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return (
                      <div key={callId} className="gen-ui-loading-card">
                        <CloudSun size={20} className="spin-slow" color="#f59e0b" />
                        <span>Generating Weather UI for {part.input?.location || part.input?.city || 'location'}...</span>
                      </div>
                    );
                  case 'output-available':
                    return (
                      <div key={callId} className="gen-ui-wrapper">
                        <Weather {...part.output} />
                      </div>
                    );
                  case 'output-error':
                    return (
                      <div key={callId} className="tool-error">
                        Weather error: {part.errorText}
                      </div>
                    );
                  default:
                    return null;
                }
              }

              // 4. Generative UI: Stock Market Component (tool-getStockPrice)
              if (part.type === 'tool-getStockPrice') {
                const callId = part.toolCallId || index;
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return (
                      <div key={callId} className="gen-ui-loading-card">
                        <TrendingUp size={20} className="pulse-fast" color="#10b981" />
                        <span>Generating Stock Market UI for {part.input?.symbol || 'symbol'}...</span>
                      </div>
                    );
                  case 'output-available':
                    return (
                      <div key={callId} className="gen-ui-wrapper">
                        <Stock {...part.output} />
                      </div>
                    );
                  case 'output-error':
                    return (
                      <div key={callId} className="tool-error">
                        Stock error: {part.errorText}
                      </div>
                    );
                  default:
                    return null;
                }
              }

              // 5. Interactive User Confirmation Tool
              if (part.type === 'tool-askForConfirmation') {
                const callId = part.toolCallId;
                return (
                  <div key={callId || index} className="tool-card confirmation-card">
                    <div className="tool-card-header">
                      <div className="tool-badge confirmation">
                        <ShieldCheck size={14} />
                        <span>Confirmation Required</span>
                      </div>
                    </div>

                    <div className="tool-card-body">
                      {part.state === 'input-streaming' && (
                        <div className="tool-loading">Loading confirmation prompt...</div>
                      )}

                      {part.state === 'input-available' && (
                        <div className="confirmation-action-wrap">
                          <p className="confirmation-prompt-text">{part.input?.message}</p>
                          <div className="confirmation-btn-group">
                            <button
                              type="button"
                              className="confirm-btn yes"
                              onClick={() => {
                                if (addToolOutput) {
                                  addToolOutput({
                                    tool: 'askForConfirmation',
                                    toolCallId: callId,
                                    output: 'Yes, confirmed.',
                                  });
                                }
                              }}
                            >
                              <CheckCircle2 size={15} />
                              <span>Yes, Confirm</span>
                            </button>
                            <button
                              type="button"
                              className="confirm-btn no"
                              onClick={() => {
                                if (addToolOutput) {
                                  addToolOutput({
                                    tool: 'askForConfirmation',
                                    toolCallId: callId,
                                    output: 'No, denied.',
                                  });
                                }
                              }}
                            >
                              <XCircle size={15} />
                              <span>No, Deny</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {part.state === 'output-available' && (
                        <div className="tool-result-row">
                          <span className="result-label">User Response:</span>
                          <span
                            className={`result-tag ${
                              String(part.output).includes('Yes') ? 'approved' : 'denied'
                            }`}
                          >
                            {part.output}
                          </span>
                        </div>
                      )}

                      {part.state === 'output-error' && (
                        <div className="tool-error">Error: {part.errorText}</div>
                      )}

                      {part.state === 'output-denied' && (
                        <div className="tool-denied">Action cancelled by user.</div>
                      )}
                    </div>
                  </div>
                );
              }

              // 6. Get Location Tool (Client-Side Auto-Executed Tool)
              if (part.type === 'tool-getLocation') {
                const callId = part.toolCallId;

                return (
                  <div key={callId || index} className="tool-card location-card">
                    <div className="tool-card-header">
                      <div className="tool-badge location">
                        <MapPin size={14} />
                        <span>getLocation (Client Tool)</span>
                      </div>
                    </div>

                    <div className="tool-card-body">
                      {(part.state === 'input-streaming' || part.state === 'input-available') && (
                        <div className="tool-loading">Detecting client coordinates...</div>
                      )}

                      {part.state === 'output-available' && (
                        <div className="location-result">
                          <MapPin size={18} color="#38bdf8" />
                          <span>Detected Location: <strong>{String(part.output)}</strong></span>
                        </div>
                      )}

                      {part.state === 'output-error' && (
                        <div className="tool-error">Location error: {part.errorText}</div>
                      )}
                    </div>
                  </div>
                );
              }

              // 7. Generic or Dynamic Tool Fallback
              if (
                (typeof part.type === 'string' && part.type.startsWith('tool-')) ||
                part.type === 'dynamic-tool'
              ) {
                const toolName = part.toolName || part.type.replace('tool-', '');
                const callId = part.toolCallId;

                return (
                  <div key={callId || index} className="tool-card generic-card">
                    <div className="tool-card-header">
                      <div className="tool-badge generic">
                        <Wrench size={14} />
                        <span>{toolName}</span>
                      </div>
                    </div>
                    <div className="tool-card-body">
                      {part.state === 'output-available' ? (
                        <pre className="tool-json-pre">
                          {JSON.stringify(part.output, null, 2)}
                        </pre>
                      ) : (
                        <div className="tool-loading">Executing tool {toolName}...</div>
                      )}
                    </div>
                  </div>
                );
              }

              // 8. RAG Source Reference Part
              if (part.type === 'source') {
                const url = part.url || part.source?.url || part.value?.url || '#';
                const title = part.title || part.source?.title || part.value?.title || url;
                return (
                  <div key={index} className="source-citation-card">
                    <div className="source-citation-header">
                      <ExternalLink size={13} className="source-icon" />
                      <span className="source-label">RAG Source Reference</span>
                    </div>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="source-citation-link"
                    >
                      <span className="source-title">{title}</span>
                      <span className="source-url">{url}</span>
                    </a>
                  </div>
                );
              }

              // 9. Persistent Streamed Custom Data Part with Reconciliation (data-weather)
              if (part.type === 'data-weather') {
                const data = part.data || {};
                const isLoading = data.status === 'loading';
                return (
                  <div key={part.id || index} className={`reconciled-data-card ${isLoading ? 'loading' : 'success'}`}>
                    <div className="reconciled-data-header">
                      <div className="reconciled-badge">
                        <Activity size={13} className={isLoading ? 'spin-slow' : ''} />
                        <span>Streamed Custom Data Part: <strong>{part.id || 'weather'}</strong></span>
                      </div>
                      <span className={`status-pill ${isLoading ? 'pill-loading' : 'pill-success'}`}>
                        {isLoading ? 'Reconciling Live...' : 'Reconciled In-Place'}
                      </span>
                    </div>
                    <div className="reconciled-data-content">
                      {isLoading ? (
                        <div className="reconciled-loading-text">
                          <span className="pulsing-dot" />
                          Receiving live telemetry stream for <strong>{data.city || 'target'}</strong>...
                        </div>
                      ) : (
                        <div className="reconciled-success-view">
                          <div className="reconciled-metric">
                            <span className="metric-label">Location</span>
                            <span className="metric-val">{data.city}</span>
                          </div>
                          {data.weather && (
                            <div className="reconciled-metric">
                              <span className="metric-label">Condition</span>
                              <span className="metric-val">{data.weather}</span>
                            </div>
                          )}
                          {data.temp && (
                            <div className="reconciled-metric">
                              <span className="metric-label">Temperature</span>
                              <span className="metric-val highlight">{data.temp}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // 10. Generic Custom Data Part Fallback
              if (typeof part.type === 'string' && part.type.startsWith('data-')) {
                return (
                  <div key={part.id || index} className="reconciled-data-card generic">
                    <div className="reconciled-data-header">
                      <span className="reconciled-badge">{part.type}</span>
                    </div>
                    <pre className="tool-json-pre">{JSON.stringify(part.data || part, null, 2)}</pre>
                  </div>
                );
              }

              // 11. Regular Text Part
              if (part.type === 'text') {
                return isUser ? (
                  <div key={index} style={{ whiteSpace: 'pre-wrap' }}>
                    {part.text}
                  </div>
                ) : (
                  <div key={index} className="markdown-body">
                    <ReactMarkdown>{part.text}</ReactMarkdown>
                  </div>
                );
              }

              return null;
            })
          ) : (
            // Fallback for string content
            isUser ? (
              <div style={{ whiteSpace: 'pre-wrap' }}>{(message as any).content}</div>
            ) : (
              <div className="markdown-body">
                <ReactMarkdown>{(message as any).content || ''}</ReactMarkdown>
              </div>
            )
          )}
        </div>

        <div className="message-actions">
          {/* Display Message-Level Metadata: Tokens & Generation Latency */}
          {message.metadata?.totalTokens && (
            <span className="meta-pill tokens" title="Total tokens consumed">
              <Zap size={11} />
              {message.metadata.totalTokens} tokens
            </span>
          )}

          {message.metadata?.latencyMs && (
            <span className="meta-pill latency" title="Time to generation">
              <Clock size={11} />
              {message.metadata.latencyMs}ms
            </span>
          )}

          <button className="action-btn" onClick={handleCopy} title="Copy message">
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
      </div>
    </div>
  );
};
