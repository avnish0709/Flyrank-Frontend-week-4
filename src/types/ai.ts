import type { UIMessage } from 'ai';
import { z } from 'zod';

// Define metadata schema for message-level information (timestamps, model, tokens, latency)
export const messageMetadataSchema = z.object({
  createdAt: z.number().optional(),
  model: z.string().optional(),
  totalTokens: z.number().optional(),
  latencyMs: z.number().optional(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

// Custom UIMessage type defining schemas for message metadata and streamed custom data parts
export type MyUIMessage = UIMessage<
  MessageMetadata, // message-level metadata type
  {
    weather: {
      city: string;
      weather?: string;
      status: 'loading' | 'success';
      temp?: string;
    };
    notification: {
      message: string;
      level: 'info' | 'warning' | 'error';
    };
  }
>;
