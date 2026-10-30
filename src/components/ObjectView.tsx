import React, { useState } from 'react';
import { useObject } from '@ai-sdk/react';
import {
  Bell,
  Square,
  Copy,
  Check,
  Send,
  Code,
  Flame,
  AlertTriangle,
  Info,
  GraduationCap,
  ShieldAlert,
  MessageCircle,
} from 'lucide-react';
import { notificationSchema } from '../schemas/notifications';

interface ObjectViewProps {
  selectedModel: string;
}

const PRESET_CONTEXTS = [
  {
    icon: <GraduationCap size={15} color="#f59e0b" />,
    label: 'University Finals Week',
    context: 'Urgent notifications for university students during final examinations week.',
  },
  {
    icon: <ShieldAlert size={15} color="#ef4444" />,
    label: 'DevOps Incident Alerts',
    context: 'Critical server infrastructure outage and automated remediation notifications.',
  },
  {
    icon: <MessageCircle size={15} color="#3b82f6" />,
    label: 'Social Mentions & Chats',
    context: 'Direct messages, team mentions, and design feedback updates.',
  },
];

export const ObjectView: React.FC<ObjectViewProps> = ({ selectedModel }) => {
  const [customContext, setCustomContext] = useState('');
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(true);

  // Initialize Vercel AI SDK useObject hook with Zod schema
  const { object, submit, isLoading, stop, error } = useObject({
    api: '/api/notifications',
    schema: notificationSchema,
    onFinish({ object: finalObj, error: validationErr }) {
      if (validationErr) {
        console.warn('Object schema validation error:', validationErr);
      } else {
        console.log('Structured object generated successfully:', finalObj);
      }
    },
    onError(err) {
      console.error('Fetch error during useObject:', err);
    },
  });

  const handleCopyJson = async () => {
    if (!object) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(object, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customContext.trim() || isLoading) return;
    submit(customContext);
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'high':
        return (
          <span className="notif-priority-badge high">
            <Flame size={12} />
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="notif-priority-badge medium">
            <AlertTriangle size={12} />
            Medium
          </span>
        );
      default:
        return (
          <span className="notif-priority-badge low">
            <Info size={12} />
            Info
          </span>
        );
    }
  };

  return (
    <div className="object-studio">
      <div className="completion-header">
        <div className="completion-badge-wrap">
          <span className="gen-ui-tag">Schema-Driven Output</span>
          <h2 className="completion-title">Structured Object Generation</h2>
          <p className="completion-subtitle">
            Powered by <code>useObject()</code> with Zod schema validation, partial object rendering, and live JSON streaming.
          </p>
        </div>

        <div className="completion-controls-bar">
          <button
            type="button"
            className={`mode-btn ${showJson ? 'active' : ''}`}
            onClick={() => setShowJson(!showJson)}
            title="Toggle Live JSON Inspector"
          >
            <Code size={14} />
            <span>JSON Inspector</span>
          </button>
        </div>
      </div>

      {/* Preset Contexts */}
      <div className="completion-presets-row">
        {PRESET_CONTEXTS.map((item, idx) => (
          <button
            key={idx}
            type="button"
            className="completion-preset-btn"
            disabled={isLoading}
            onClick={() => {
              setCustomContext(item.context);
              submit(item.context);
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Custom Context Form */}
      <form onSubmit={handleCustomSubmit} className="completion-form">
        <div className="completion-input-wrap">
          <textarea
            className="completion-textarea"
            value={customContext}
            onChange={(e) => setCustomContext(e.target.value)}
            placeholder="Describe what kind of notifications or data to generate... (e.g. 'Flight delays and gate changes at airport')"
            rows={2}
          />
          <div className="completion-form-footer">
            <span className="char-count">Active Model: {selectedModel}</span>
            <div className="completion-btn-group">
              {isLoading ? (
                <button
                  type="button"
                  className="stop-btn"
                  onClick={() => stop()}
                  title="Stop generating object"
                >
                  <Square size={13} fill="currentColor" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="submit"
                  className="send-btn completion-submit"
                  disabled={!customContext.trim()}
                  title="Generate Structured Notifications"
                >
                  <Send size={15} />
                  <span>Stream Object</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div className="tool-error">
          Error generating structured object. Please try again.
        </div>
      )}

      {/* Structured Output Grid */}
      <div className={`object-layout-grid ${showJson ? 'split' : 'full'}`}>
        {/* Rendered Notification Cards Feed */}
        <div className="notif-feed-container">
          <div className="notif-feed-header">
            <div className="completion-status-badge">
              <Bell size={16} color="#f59e0b" />
              <span>{object?.category || 'Notification Stream'}</span>
              {isLoading && (
                <span className="live-pill">
                  <span className="live-dot" />
                  Streaming Partial Object
                </span>
              )}
            </div>
          </div>

          {object?.notifications && object.notifications.length > 0 ? (
            <div className="notif-cards-list">
              {object.notifications.map((notif, index) => (
                <div key={index} className="notif-card-item">
                  <div className="notif-card-top">
                    <span className="notif-sender-name">
                      {notif?.name || 'Incoming notification...'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {getPriorityBadge(notif?.priority)}
                      <span className="notif-time-ago">{notif?.timeAgo || 'Now'}</span>
                    </div>
                  </div>
                  <p className="notif-message-body">
                    {notif?.message || (
                      <span className="streaming-placeholder">Streaming message text...</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="completion-empty-card">
              <Bell size={32} color="#64748b" />
              <p>Click any preset above or enter a prompt to stream structured notifications.</p>
            </div>
          )}
        </div>

        {/* Live JSON Inspector Pane */}
        {showJson && (
          <div className="json-inspector-container">
            <div className="json-inspector-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Code size={14} color="#94a3b8" />
                <span className="json-inspector-title">Live Partial JSON Stream</span>
              </div>
              {object && (
                <button
                  type="button"
                  className="action-btn"
                  onClick={handleCopyJson}
                  title="Copy JSON to clipboard"
                >
                  {copied ? (
                    <>
                      <Check size={12} color="#10b981" />
                      <span style={{ color: '#10b981' }}>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <pre className="json-pre-code">
              {object
                ? JSON.stringify(object, null, 2)
                : '// Partial JSON structure parsed by parsePartialJson() will stream here...'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
