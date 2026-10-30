import type { Config, Context } from '@netlify/functions';
import { createCompletionStream } from '../../server/completion-handler.js';

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { prompt, model, systemPrompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request: "prompt" string is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const streamResult = await createCompletionStream({
      prompt,
      model,
      systemPrompt,
    });

    return streamResult.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('Netlify completion function error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while streaming completion from Claude API.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const config: Config = {
  path: '/api/completion',
};
