import React from 'react';
import { Sparkles, CloudSun, TrendingUp, MapPin, Code2 } from 'lucide-react';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

const STARTER_PROMPTS = [
  {
    icon: <TrendingUp size={16} color="#10b981" />,
    title: 'Generative UI: Stocks',
    prompt: 'What is the current stock price and market trend for Apple (AAPL)?',
  },
  {
    icon: <CloudSun size={16} color="#f59e0b" />,
    title: 'Generative UI: Weather',
    prompt: 'What is the current weather in Paris?',
  },
  {
    icon: <MapPin size={16} color="#38bdf8" />,
    title: 'Interactive Client Tool',
    prompt: 'Where am I located? Please retrieve my location.',
  },
  {
    icon: <Code2 size={16} color="#a855f7" />,
    title: 'React TypeScript Hook',
    prompt: 'Write a production-ready custom React hook for debouncing search input with TypeScript and tests.',
  },
];

export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectPrompt }) => {
  return (
    <div className="empty-state">
      <div className="empty-icon-wrap">
        <Sparkles size={32} />
      </div>
      <h1 className="empty-title">Generative UI with Claude & AI SDK</h1>
      <p className="empty-desc">
        Experience AI beyond plain text: dynamically generated React widgets, real-time tool calling, live reasoning streams, and multi-turn conversation memory.
      </p>

      <div className="suggestions-grid">
        {STARTER_PROMPTS.map((item, idx) => (
          <div
            key={idx}
            className="suggestion-card"
            onClick={() => onSelectPrompt(item.prompt)}
          >
            <div className="suggestion-title">
              {item.icon}
              <span>{item.title}</span>
            </div>
            <div className="suggestion-prompt">{item.prompt}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
