import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const SERVER_AI_CONFIG = {
  defaultModel: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
  defaultTemperature: 0.7,
  defaultMaxTokens: 4096,
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  defaultSystemPrompt: `You are an expert, thoughtful, and articulate AI coding assistant powered by Anthropic Claude.
You excel at explaining complex technical concepts clearly, writing clean, production-ready code, and reasoning step-by-step.
Format all code snippets with their appropriate language tags and maintain a helpful, professional tone.`,
};

export function validateApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim().length > 0);
}
