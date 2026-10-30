import { anthropic } from '@ai-sdk/anthropic';
import {
  streamText,
  Output,
  createTextStreamResponse,
  pipeTextStreamToResponse,
  toTextStream,
} from 'ai';
import { notificationSchema } from '../src/schemas/notifications.js';
import { SERVER_AI_CONFIG, validateApiKey } from './config/ai.js';

export interface ObjectStreamOptions {
  context: string;
  model?: string;
  forceSimulator?: boolean;
}

export async function createNotificationObjectStream({
  context,
  model,
  forceSimulator = false,
}: ObjectStreamOptions) {
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
        output: Output.object({ schema: notificationSchema }),
        prompt: `Generate 3 to 4 realistic notifications for an app based on this context: ${context}. Include name, message, relative timeAgo, and priority.`,
      });

      const textStream = toTextStream({ stream: result.stream });

      return {
        toTextStreamResponse() {
          return createTextStreamResponse({ stream: textStream });
        },
        async pipeTextStreamToResponse(res: any) {
          await pipeTextStreamToResponse({ response: res, stream: textStream });
        },
      };
    } catch (err: any) {
      console.warn('Anthropic API object stream failed, falling back to simulator:', err.message);
    }
  }

  // 100% Free Realistic Simulated Object Stream
  return {
    toTextStreamResponse() {
      const stream = createSimulatedNotificationStream({ context });
      return createTextStreamResponse({ stream });
    },
    async pipeTextStreamToResponse(res: any) {
      const stream = createSimulatedNotificationStream({ context });
      await pipeTextStreamToResponse({ response: res, stream });
    },
  };
}

export function createSimulatedNotificationStream({
  context,
}: {
  context: string;
}): ReadableStream<string> {
  const lower = context.toLowerCase();

  let targetObject: any;

  if (lower.includes('finals') || lower.includes('exam') || lower.includes('university') || lower.includes('student')) {
    targetObject = {
      category: 'University Finals Week',
      notifications: [
        {
          name: 'Professor Vance (CS 301)',
          message: 'The Algorithms final examination has moved to Hall B. Bring an approved scientific calculator.',
          timeAgo: '2m ago',
          priority: 'high',
        },
        {
          name: 'Campus Library Sentinel',
          message: 'Study room 4B reservation starts in 15 minutes. Check in via student ID badge.',
          timeAgo: '12m ago',
          priority: 'medium',
        },
        {
          name: 'Study Group - Machine Learning',
          message: 'Maya uploaded practice problem set 4 solutions to the shared workspace.',
          timeAgo: '35m ago',
          priority: 'low',
        },
        {
          name: 'Academic Registrar',
          message: 'Grade submission portal will open immediately following the conclusion of finals period.',
          timeAgo: '1h ago',
          priority: 'low',
        },
      ],
    };
  } else if (lower.includes('outage') || lower.includes('deploy') || lower.includes('incident') || lower.includes('devops')) {
    targetObject = {
      category: 'Production DevOps Incident',
      notifications: [
        {
          name: 'PagerDuty Sentinel',
          message: 'CRITICAL: Elevated HTTP 504 gateway timeout rates detected on ingress-east-cluster.',
          timeAgo: 'Just now',
          priority: 'high',
        },
        {
          name: 'Kubernetes AutoScaler',
          message: 'Node pool us-east-1a reached maximum pod threshold (120/120 pods allocated).',
          timeAgo: '4m ago',
          priority: 'high',
        },
        {
          name: 'GitHub Deployment Bot',
          message: 'Automated rollback for release v2.4.1 completed successfully in 42 seconds.',
          timeAgo: '11m ago',
          priority: 'medium',
        },
        {
          name: 'Security Vulnerability Monitor',
          message: 'Dependency audit completed across 48 microservices with 0 critical CVE vulnerabilities found.',
          timeAgo: '25m ago',
          priority: 'low',
        },
      ],
    };
  } else if (lower.includes('social') || lower.includes('chat') || lower.includes('message')) {
    targetObject = {
      category: 'Direct Messages & Mentions',
      notifications: [
        {
          name: 'Elena Rostova',
          message: 'Loved the new streaming UI demo! Could you share the repository link?',
          timeAgo: 'Just now',
          priority: 'medium',
        },
        {
          name: 'Marcus Brody',
          message: 'Are we still on for the pair programming session at 3 PM today?',
          timeAgo: '8m ago',
          priority: 'medium',
        },
        {
          name: 'Design Team Hub',
          message: 'Zack tagged you in a Figma comment on Dark Mode Glassmorphism Tokens.',
          timeAgo: '22m ago',
          priority: 'low',
        },
      ],
    };
  } else {
    targetObject = {
      category: 'Smart System Notifications',
      notifications: [
        {
          name: 'Antigravity IDE Sentinel',
          message: 'Structured JSON stream connected via useObject with partial schema parsing enabled.',
          timeAgo: 'Just now',
          priority: 'high',
        },
        {
          name: 'Token Stream Monitor',
          message: 'Active stream transferred 384 tokens with sub-25ms chunk intervals.',
          timeAgo: '3m ago',
          priority: 'medium',
        },
        {
          name: 'Cloud Backup Service',
          message: 'Daily snapshot completed successfully with zero schema conflicts.',
          timeAgo: '18m ago',
          priority: 'low',
        },
      ],
    };
  }

  const jsonString = JSON.stringify(targetObject, null, 2);

  return new ReadableStream<string>({
    cancel() {},
    async start(controller) {
      let isClosed = false;

      // Break JSON into small character chunks to simulate realistic JSON streaming
      const chunkSize = 6;
      for (let i = 0; i < jsonString.length; i += chunkSize) {
        if (isClosed) return;
        const chunk = jsonString.slice(i, i + chunkSize);
        controller.enqueue(chunk);
        await new Promise((r) => setTimeout(r, 20));
      }

      if (!isClosed) {
        controller.close();
      }
    },
  });
}
