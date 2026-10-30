import React, { useRef, useEffect } from 'react';
import { ArrowUp, Square } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSubmit,
  onStop,
  isStreaming,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim() && !disabled) {
        onSubmit();
      }
    }
  };

  return (
    <div className="input-composer-container">
      <div className="input-composer-wrapper">
        <textarea
          ref={textareaRef}
          className="composer-textarea"
          placeholder={isStreaming ? 'Claude is generating a response...' : 'Ask Claude anything... (Shift+Enter for newline)'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
        />

        <div className="composer-toolbar">
          <span className="composer-hint">Press Enter to send, Shift + Enter for new line</span>

          <div className="composer-actions">
            {isStreaming ? (
              <button
                type="button"
                className="stop-btn"
                onClick={onStop}
                title="Stop streaming response"
              >
                <Square size={14} fill="currentColor" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                className="send-btn"
                onClick={onSubmit}
                disabled={!input.trim() || disabled}
                title="Send message"
              >
                <ArrowUp size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
