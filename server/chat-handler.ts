import { anthropic } from '@ai-sdk/anthropic';
import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  pipeUIMessageStreamToResponse,
  toUIMessageStream,
  isStepCount,
  tool,
  type UIMessage,
} from 'ai';
import { z } from 'zod';
import { SERVER_AI_CONFIG, validateApiKey } from './config/ai.js';
import { createSimulatedStream } from './simulator.js';

// Define tools supporting standard tool calling and Generative User Interfaces:
export const CHAT_TOOLS = {
  displayWeather: tool({
    description: 'Display the weather for a location in a dynamic Generative UI card.',
    inputSchema: z.object({
      location: z.string().describe('The location to get the weather for, e.g. Paris, Tokyo, San Francisco'),
    }),
    execute: async function ({ location }: { location: string }) {
      const weatherOptions = ['Sunny', 'Partly Cloudy', 'Rain Showers', 'Warm & Sunny', 'Breezy & Cool'];
      const sum = location.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const chosen = weatherOptions[Math.abs(sum) % weatherOptions.length];
      const baseTemp = 18 + (Math.abs(sum) % 14);

      return {
        weather: chosen,
        temperature: baseTemp,
        location,
        humidity: `${45 + (Math.abs(sum) % 35)}%`,
        windSpeed: `${8 + (Math.abs(sum) % 18)} km/h`,
        high: `${baseTemp + 4}°C`,
        low: `${baseTemp - 3}°C`,
      };
    },
  }),

  getWeatherInformation: tool({
    description: 'Show real-time weather conditions for a given city in a generative UI widget.',
    inputSchema: z.object({
      city: z.string().describe('The city name, e.g. London, New York, Tokyo'),
    }),
    execute: async ({ city }: { city: string }) => {
      const weatherOptions = ['Sunny', 'Partly Cloudy', 'Light Rain', 'Clear Skies', 'Chilly & Crisp'];
      const sum = city.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const chosen = weatherOptions[Math.abs(sum) % weatherOptions.length];
      const baseTemp = 17 + (Math.abs(sum) % 15);

      return {
        weather: chosen,
        temperature: baseTemp,
        location: city,
        city,
        humidity: `${42 + (Math.abs(sum) % 40)}%`,
        windSpeed: `${10 + (Math.abs(sum) % 15)} km/h`,
        high: `${baseTemp + 3}°C`,
        low: `${baseTemp - 2}°C`,
      };
    },
  }),

  getStockPrice: tool({
    description: 'Get real-time market price and financial statistics for a stock ticker symbol.',
    inputSchema: z.object({
      symbol: z.string().describe('The stock ticker symbol (e.g., AAPL, NVDA, TSLA, MSFT, GOOGL)'),
    }),
    execute: async function ({ symbol }: { symbol: string }) {
      const cleanSym = symbol.toUpperCase().trim();
      const mockQuotes: Record<string, { price: number; change: number; changePercent: number; companyName: string }> = {
        AAPL: { price: 234.80, change: 3.40, changePercent: 1.47, companyName: 'Apple Inc.' },
        NVDA: { price: 142.25, change: 5.15, changePercent: 3.76, companyName: 'NVIDIA Corporation' },
        TSLA: { price: 219.10, change: -3.20, changePercent: -1.44, companyName: 'Tesla, Inc.' },
        MSFT: { price: 429.50, change: 2.30, changePercent: 0.54, companyName: 'Microsoft Corporation' },
        GOOGL: { price: 169.80, change: 1.95, changePercent: 1.16, companyName: 'Alphabet Inc.' },
        AMZN: { price: 187.60, change: -1.10, changePercent: -0.58, companyName: 'Amazon.com Inc.' },
      };

      const quote = mockQuotes[cleanSym] || {
        price: 155.00 + (cleanSym.charCodeAt(0) % 90),
        change: 2.15,
        changePercent: 1.35,
        companyName: `${cleanSym} Corp`,
      };

      return {
        symbol: cleanSym,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        companyName: quote.companyName,
        high: quote.price + 2.8,
        low: quote.price - 1.9,
        volume: '38.4M',
        currency: 'USD',
      };
    },
  }),

  askForConfirmation: tool({
    description: 'Ask the user for confirmation before performing an action or finalizing a decision.',
    inputSchema: z.object({
      message: z.string().describe('The message to ask for confirmation.'),
    }),
  }),

  getLocation: tool({
    description: 'Get the current user location. Always ask for confirmation before using this tool unless the user has already confirmed.',
    inputSchema: z.object({}),
  }),
};

export interface ChatStreamOptions {
  messages: UIMessage[];
  model?: string;
  systemPrompt?: string;
  forceSimulator?: boolean;
}

export async function createChatStream({
  messages,
  model,
  systemPrompt,
  forceSimulator = false,
}: ChatStreamOptions) {
  const selectedModelId = model || SERVER_AI_CONFIG.defaultModel;

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const userText = lastUserMsg?.parts?.find((p) => p.type === 'text')?.text || '';

  // Check if simulator mode is explicitly requested or if no valid API key is present
  const useSimulator =
    forceSimulator ||
    process.env.USE_SIMULATOR === 'true' ||
    !validateApiKey() ||
    (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-usr'));

  if (!useSimulator && validateApiKey()) {
    try {
      const stream = createUIMessageStream({
        execute: async ({ writer }) => {
          // 1. Send initial start chunk with message-level metadata (createdAt, model)
          writer.write({
            type: 'start',
            messageMetadata: {
              createdAt: Date.now(),
              model: selectedModelId,
            },
          } as any);

          // 2. Stream transient notification (ephemeral, not added to message history)
          writer.write({
            type: 'data-notification',
            data: { message: `Processing query with ${selectedModelId}...`, level: 'info' },
            transient: true,
          } as any);

          // 3. Stream RAG Source Reference
          writer.write({
            type: 'source',
            value: {
              type: 'source',
              sourceType: 'url',
              id: 'source-anthropic-1',
              url: 'https://docs.anthropic.com',
              title: 'Anthropic Claude Documentation',
            },
          } as any);

          // 4. Stream persistent data part with initial loading state
          const isWeather = userText.toLowerCase().includes('weather');
          if (isWeather) {
            writer.write({
              type: 'data-weather',
              id: 'weather-live-1',
              data: { city: 'Tokyo', status: 'loading' },
            } as any);
          }

          const anthropicModel = anthropic(selectedModelId);
          const modelMessages = await convertToModelMessages(messages);

          const result = streamText({
            model: anthropicModel,
            system: systemPrompt || SERVER_AI_CONFIG.defaultSystemPrompt,
            messages: modelMessages,
            tools: CHAT_TOOLS,
            stopWhen: isStepCount(5),
            onEnd() {
              // 5. Data Part Reconciliation: Update the same part using matching ID
              if (isWeather) {
                writer.write({
                  type: 'data-weather',
                  id: 'weather-live-1',
                  data: {
                    city: 'Tokyo',
                    weather: 'Sunny and Clear',
                    temp: '22°C',
                    status: 'success',
                  },
                } as any);
              }

              // 6. Send completion notification (transient)
              writer.write({
                type: 'data-notification',
                data: { message: 'Streaming response completed successfully', level: 'info' },
                transient: true,
              } as any);
            },
          });

          writer.merge(
            toUIMessageStream({
              stream: result.stream,
              sendStart: false,
              messageMetadata: ({ part }: any) => {
                if (part.type === 'finish') {
                  return {
                    totalTokens: part.totalUsage?.totalTokens,
                  };
                }
              },
            })
          );
        },
      });

      return {
        toUIMessageStreamResponse() {
          return createUIMessageStreamResponse({ stream });
        },
        async pipeUIMessageStreamToResponse(res: any) {
          await pipeUIMessageStreamToResponse({ response: res, stream });
        },
      };
    } catch (err: any) {
      console.warn('Anthropic API call failed, falling back to simulator:', err.message);
    }
  }

  // 100% Free Realistic Streaming Simulator with Custom Data Streaming Support
  return {
    toUIMessageStreamResponse() {
      const stream = createSimulatedStream({ messages, model: selectedModelId });
      return createUIMessageStreamResponse({ stream });
    },
    async pipeUIMessageStreamToResponse(res: any) {
      const stream = createSimulatedStream({ messages, model: selectedModelId });
      await pipeUIMessageStreamToResponse({ response: res, stream });
    },
  };
}
