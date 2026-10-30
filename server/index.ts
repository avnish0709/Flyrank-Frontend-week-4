import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createChatStream } from './chat-handler.js';
import { createCompletionStream } from './completion-handler.js';
import { createNotificationObjectStream } from './object-handler.js';
import { validateApiKey, SERVER_AI_CONFIG } from './config/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    apiKeyConfigured: validateApiKey(),
    defaultModel: SERVER_AI_CONFIG.defaultModel,
  });
});

// Main chat route for streaming Claude responses
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, model, systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request: "messages" array is required.' });
    }

    const streamResult = await createChatStream({
      messages,
      model,
      systemPrompt,
    });

    await streamResult.pipeUIMessageStreamToResponse(res);
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: error.message || 'An error occurred while streaming response from Claude API.',
      });
    }
  }
});

// Single-prompt text/code completion route for useCompletion
app.post('/api/completion', async (req: Request, res: Response) => {
  try {
    const { prompt, model, systemPrompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid request: "prompt" string is required.' });
    }

    const streamResult = await createCompletionStream({
      prompt,
      model,
      systemPrompt,
    });

    await streamResult.pipeUIMessageStreamToResponse(res);
  } catch (error: any) {
    console.error('Completion endpoint error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: error.message || 'An error occurred while streaming completion.',
      });
    }
  }
});

// Structured object generation route for useObject
app.post('/api/notifications', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const contextPrompt = typeof body === 'string' ? body : (body.context || body.prompt || JSON.stringify(body));

    const streamResult = await createNotificationObjectStream({
      context: contextPrompt,
      model: typeof body === 'object' ? body.model : undefined,
    });

    await streamResult.pipeTextStreamToResponse(res);
  } catch (error: any) {
    console.error('Notifications endpoint error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: error.message || 'An error occurred while streaming notifications object.',
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Claude AI Chat, Completion & Object Backend running at http://localhost:${PORT}`);
  console.log(`API Key status: ${validateApiKey() ? 'Configured' : 'Missing (Check .env)'}`);
});
