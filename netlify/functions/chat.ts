import type { Config, Context } from '@netlify/functions';
import { createChatStream } from '../../server/chat-handler.js';
import { validateApiKey } from '../../server/config/ai.js';

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { messages, model, systemPrompt } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: "messages" array is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const streamResult = await createChatStream({
      messages,
      model,
      systemPrompt,
    });

    return streamResult.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('Netlify function error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while streaming response from Claude API.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const config: Config = {
  path: '/api/chat',
};
