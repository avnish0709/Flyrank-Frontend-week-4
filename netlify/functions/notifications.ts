import type { Config, Context } from '@netlify/functions';
import { createNotificationObjectStream } from '../../server/object-handler.js';

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const contextPrompt = typeof body === 'string' ? body : (body.context || body.prompt || JSON.stringify(body));

    const streamResult = await createNotificationObjectStream({
      context: contextPrompt,
      model: typeof body === 'object' ? body.model : undefined,
    });

    return streamResult.toTextStreamResponse();
  } catch (error: any) {
    console.error('Netlify notifications function error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while streaming notifications from Claude API.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const config: Config = {
  path: '/api/notifications',
};
