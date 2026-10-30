import React from 'react';
import { Bot } from 'lucide-react';

interface ThinkingIndicatorProps {
  label?: string;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  label = 'Claude is thinking...',
}) => {
  return (
    <div className="message-row assistant">
      <div className="avatar assistant">
        <Bot size={18} />
      </div>
      <div className="thinking-indicator">
        <span>{label}</span>
        <div className="thinking-dots">
          <span className="thinking-dot" />
          <span className="thinking-dot" />
          <span className="thinking-dot" />
        </div>
      </div>
    </div>
  );
};
