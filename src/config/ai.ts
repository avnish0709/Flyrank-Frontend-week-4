export interface ModelOption {
  id: string;
  name: string;
  description: string;
  badge?: string;
  maxTokens: number;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Most intelligent & balanced model for coding and reasoning',
    badge: 'Recommended',
    maxTokens: 8192,
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    description: 'Hybrid reasoning architecture with advanced thinking mode',
    badge: 'Reasoning',
    maxTokens: 8192,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    description: 'Lightning-fast responses for quick questions and editing',
    badge: 'Fast',
    maxTokens: 4096,
  },
];

export const AI_CONFIG = {
  defaultModel: 'claude-3-5-sonnet-20241022',
  defaultTemperature: 0.7,
  defaultMaxTokens: 4096,
  systemPrompt: `You are an expert, thoughtful, and articulate AI coding assistant powered by Anthropic Claude.
You excel at explaining complex technical concepts clearly, writing clean, production-ready code, and reasoning step-by-step.
Format all code snippets with their appropriate language tags and maintain a helpful, professional tone.`,
};
