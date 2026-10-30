import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { createChatStream } from './server/chat-handler.ts';
import { createCompletionStream } from './server/completion-handler.ts';
import { createNotificationObjectStream } from './server/object-handler.ts';
import { validateApiKey } from './server/config/ai.ts';

dotenv.config();

// Custom Vite plugin to handle /api/chat, /api/completion, and /api/notifications
function aiChatApiPlugin() {
  return {
    name: 'ai-chat-api-plugin',
    configureServer(server: any) {
      // 1. Streaming Chat Endpoint (/api/chat)
      server.middlewares.use('/api/chat', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        }

        let bodyBuffer = '';
        req.on('data', (chunk: any) => {
          bodyBuffer += chunk;
        });

        req.on('end', async () => {
          try {
            const body = JSON.parse(bodyBuffer || '{}');
            const { messages, model, systemPrompt } = body;

            if (!messages || !Array.isArray(messages)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Invalid request: "messages" array is required.' }));
            }

            const streamResult = await createChatStream({
              messages,
              model,
              systemPrompt,
            });

            await streamResult.pipeUIMessageStreamToResponse(res);
          } catch (err: any) {
            console.error('API middleware error (/api/chat):', err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error: err.message || 'Error occurred while streaming Claude response.',
                })
              );
            }
          }
        });
      });

      // 2. Text/Code Completion Endpoint (/api/completion)
      server.middlewares.use('/api/completion', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        }

        let bodyBuffer = '';
        req.on('data', (chunk: any) => {
          bodyBuffer += chunk;
        });

        req.on('end', async () => {
          try {
            const body = JSON.parse(bodyBuffer || '{}');
            const { prompt, model, systemPrompt } = body;

            if (!prompt || typeof prompt !== 'string') {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Invalid request: "prompt" string is required.' }));
            }

            const streamResult = await createCompletionStream({
              prompt,
              model,
              systemPrompt,
            });

            await streamResult.pipeUIMessageStreamToResponse(res);
          } catch (err: any) {
            console.error('API middleware error (/api/completion):', err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error: err.message || 'Error occurred while streaming completion.',
                })
              );
            }
          }
        });
      });

      // 3. Structured Object Generation Endpoint (/api/notifications)
      server.middlewares.use('/api/notifications', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        }

        let bodyBuffer = '';
        req.on('data', (chunk: any) => {
          bodyBuffer += chunk;
        });

        req.on('end', async () => {
          try {
            const body = JSON.parse(bodyBuffer || '{}');
            // useObject sends input either directly as string or in body object
            const contextPrompt = typeof body === 'string' ? body : (body.context || body.prompt || JSON.stringify(body));

            const streamResult = await createNotificationObjectStream({
              context: contextPrompt,
              model: typeof body === 'object' ? body.model : undefined,
            });

            await streamResult.pipeTextStreamToResponse(res);
          } catch (err: any) {
            console.error('API middleware error (/api/notifications):', err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error: err.message || 'Error occurred while streaming notifications object.',
                })
              );
            }
          }
        });
      });

      // 4. Health check
      server.middlewares.use('/api/health', (_req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            status: 'ok',
            apiKeyConfigured: validateApiKey(),
          })
        );
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), aiChatApiPlugin()],
  server: {
    port: 5173,
  },
});
