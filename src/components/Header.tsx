import React from 'react';
import { Sparkles, Trash2, Cpu, MessageSquare, Zap, Boxes } from 'lucide-react';
import { AVAILABLE_MODELS } from '../config/ai';

export type AppMode = 'chat' | 'completion' | 'object';

interface HeaderProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  onClearChat: () => void;
  hasMessages: boolean;
  status: string;
  activeMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedModel,
  onModelChange,
  onClearChat,
  hasMessages,
  status,
  activeMode,
  onModeChange,
}) => {
  const isStreaming = status === 'streaming' || status === 'submitted';

  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo">
          <Sparkles size={20} />
        </div>
        <div className="brand-title-wrap">
          <div className="brand-title">
            Claude AI Studio
            <span className="brand-badge">AI SDK</span>
            {isStreaming && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  color: '#f59e0b',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#f59e0b',
                    boxShadow: '0 0 6px #f59e0b',
                  }}
                />
                Live
              </span>
            )}
          </div>
          <span className="brand-subtitle">Powered by Anthropic Claude & Vercel AI SDK</span>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="mode-toggle-group">
        <button
          type="button"
          className={`mode-btn ${activeMode === 'chat' ? 'active' : ''}`}
          onClick={() => onModeChange('chat')}
          title="Multi-turn chat with Generative UI & Tools (useChat)"
        >
          <MessageSquare size={14} />
          <span>Chat & Gen UI</span>
        </button>
        <button
          type="button"
          className={`mode-btn ${activeMode === 'completion' ? 'active' : ''}`}
          onClick={() => onModeChange('completion')}
          title="Single-turn text completion with throttling & cancelation (useCompletion)"
        >
          <Zap size={14} />
          <span>Completion</span>
        </button>
        <button
          type="button"
          className={`mode-btn ${activeMode === 'object' ? 'active' : ''}`}
          onClick={() => onModeChange('object')}
          title="Schema-validated structured JSON streaming (useObject)"
        >
          <Boxes size={14} />
          <span>Object Gen</span>
        </button>
      </div>

      <div className="header-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Cpu size={15} color="#94a3b8" />
          <select
            className="model-select"
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={isStreaming}
            title="Select Claude Model"
          >
            {AVAILABLE_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} {model.badge ? `(${model.badge})` : ''}
              </option>
            ))}
          </select>
        </div>

        {activeMode === 'chat' && hasMessages && (
          <button
            className="icon-btn"
            onClick={onClearChat}
            disabled={isStreaming}
            title="Clear conversation"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </header>
  );
};
