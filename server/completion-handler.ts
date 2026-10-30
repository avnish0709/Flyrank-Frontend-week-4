import { anthropic } from '@ai-sdk/anthropic';
import {
  streamText,
  createUIMessageStreamResponse,
  pipeUIMessageStreamToResponse,
  toUIMessageStream,
  type UIMessageChunk,
} from 'ai';
import { SERVER_AI_CONFIG, validateApiKey } from './config/ai.js';

export interface CompletionStreamOptions {
  prompt: string;
  model?: string;
  systemPrompt?: string;
  forceSimulator?: boolean;
}

export async function createCompletionStream({
  prompt,
  model,
  systemPrompt,
  forceSimulator = false,
}: CompletionStreamOptions) {
  const selectedModelId = model || SERVER_AI_CONFIG.defaultModel;

  const useSimulator =
    forceSimulator ||
    process.env.USE_SIMULATOR === 'true' ||
    !validateApiKey() ||
    (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-usr'));

  if (!useSimulator && validateApiKey()) {
    try {
      const anthropicModel = anthropic(selectedModelId);
      const result = streamText({
        model: anthropicModel,
        system:
          systemPrompt ||
          'You are an expert, precise AI completion assistant powered by Claude. Generate direct, high-quality, production-ready completions without unnecessary conversational fluff.',
        prompt,
      });

      return {
        toUIMessageStreamResponse() {
          return createUIMessageStreamResponse({
            stream: toUIMessageStream({ stream: result.stream }),
          });
        },
        async pipeUIMessageStreamToResponse(res: any) {
          const stream = toUIMessageStream({ stream: result.stream });
          await pipeUIMessageStreamToResponse({ response: res, stream });
        },
      };
    } catch (err: any) {
      console.warn('Anthropic API completion call failed, falling back to simulator:', err.message);
    }
  }

  // 100% Free Realistic Simulated Completion Stream
  return {
    toUIMessageStreamResponse() {
      const stream = createSimulatedCompletionStream({ prompt, model: selectedModelId });
      return createUIMessageStreamResponse({ stream });
    },
    async pipeUIMessageStreamToResponse(res: any) {
      const stream = createSimulatedCompletionStream({ prompt, model: selectedModelId });
      await pipeUIMessageStreamToResponse({ response: res, stream });
    },
  };
}

export function createSimulatedCompletionStream({
  prompt,
  model = 'claude-3-5-sonnet',
}: {
  prompt: string;
  model?: string;
}): ReadableStream<UIMessageChunk> {
  const lower = prompt.toLowerCase();
  let completionText = '';

  if (lower.includes('debounce') || lower.includes('hook')) {
    completionText = `\`\`\`typescript
import { useState, useEffect } from 'react';

/**
 * useDebounce hook
 * Delays updating the debounced value until delay ms have passed since the last change.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
\`\`\``;
  } else if (lower.includes('summarize') || lower.includes('summary')) {
    completionText = `### Executive Summary
1. **Core Architecture**: The application employs a dual-tier streaming architecture combining Server-Sent Events (SSE) and Vercel AI SDK.
2. **Generative UI**: Tool execution returns structured schemas rendered into dynamic React components (\`<Weather />\`, \`<Stock />\`).
3. **Low Latency**: First-token latency is reduced to sub-300ms via token-by-token streaming, complete with live interruption and throttle controls.`;
  } else if (lower.includes('email') || lower.includes('draft')) {
    completionText = `Subject: Project Milestone Update — Week 4 Frontend Delivery

Hi Team,

I'm pleased to share that we have successfully integrated real-time AI completion and generative user interfaces into our frontend application. 

Key deliverables completed:
- Streaming text completion using the useCompletion hook with throttle controls and cancelation.
- Interactive multi-model selection (Claude 3.5 Sonnet, Claude 3.7 Sonnet, Claude 3.5 Haiku).
- Zero-cost simulation fallback for rapid local testing.

Please test the build and let me know your thoughts before our sprint review on Friday.

Best regards,
Engineering Team`;
  } else if (lower.includes('sql') || lower.includes('query')) {
    completionText = `\`\`\`sql
-- Retrieve active users with recent order totals and aggregation
SELECT 
    u.id AS user_id,
    u.name,
    u.email,
    COUNT(o.id) AS total_orders,
    COALESCE(SUM(o.amount), 0.00) AS total_spend,
    MAX(o.created_at) AS last_order_date
FROM users u
LEFT JOIN orders o ON o.user_id = u.id AND o.status = 'completed'
WHERE u.is_active = TRUE
GROUP BY u.id, u.name, u.email
HAVING COUNT(o.id) > 0
ORDER BY total_spend DESC
LIMIT 50;
\`\`\``;
  } else {
    completionText = `The request "${prompt}" has been processed by ${model} via the useCompletion hook.

### Key Insights:
- **Instant First Token**: Response begins streaming immediately upon form submission or programmatically via \`complete()\`.
- **Cancelable**: Users can abort generation anytime with \`stop()\`.
- **Throttled Rendering**: Render cycle updates can be throttled (e.g. 50ms) to ensure smooth 60fps performance without UI freezing.`;
  }

  return new ReadableStream<UIMessageChunk>({
    cancel() {},
    async start(controller) {
      let isClosed = false;
      const safeEnqueue = (chunk: UIMessageChunk): boolean => {
        if (isClosed) return false;
        try {
          controller.enqueue(chunk);
          return true;
        } catch {
          isClosed = true;
          return false;
        }
      };

      try {
        if (!safeEnqueue({ type: 'start' })) return;
        if (!safeEnqueue({ type: 'text-start', id: 'c-0' })) return;

        // Split by words/spaces to simulate natural token chunks
        const tokens = completionText.split(/(\s+)/);
        for (let i = 0; i < tokens.length; i++) {
          await new Promise((r) => setTimeout(r, 18));
          const ok = safeEnqueue({
            type: 'text-delta',
            id: 'c-0',
            delta: tokens[i],
          });
          if (!ok) return;
        }

        if (!safeEnqueue({ type: 'text-end', id: 'c-0' })) return;
        safeEnqueue({ type: 'finish' });
        if (!isClosed) controller.close();
      } catch {
        if (!isClosed) {
          try {
            controller.close();
          } catch {}
        }
      }
    },
  });
}
