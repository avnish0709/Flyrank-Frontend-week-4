import type { UIMessage, UIMessageChunk } from 'ai';

interface SimulatorOptions {
  messages: UIMessage[];
  model?: string;
  abortSignal?: AbortSignal;
}

export function createSimulatedStream({
  messages,
  model = 'claude-3-5-sonnet',
}: SimulatorOptions): ReadableStream<UIMessageChunk> {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const userText = lastUserMessage?.parts?.find((p) => p.type === 'text')?.text || '';
  const lowerPrompt = userText.toLowerCase();

  // Check if there is an existing tool result in the conversation flow
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
  const confirmationPart = lastAssistantMsg?.parts?.find(
    (p: any) => p.type === 'tool-askForConfirmation'
  ) as any;
  const locationPart = lastAssistantMsg?.parts?.find(
    (p: any) => p.type === 'tool-getLocation'
  ) as any;

  // Determine what type of simulated response to provide
  let flowType: 'weather' | 'stock' | 'askConfirmation' | 'executeLocation' | 'locationComplete' | 'debounce' | 'streaming' | 'default' = 'default';

  if (locationPart && locationPart.state === 'output-available') {
    flowType = 'locationComplete';
  } else if (confirmationPart && confirmationPart.state === 'output-available') {
    flowType = confirmationPart.output?.includes('Yes') ? 'executeLocation' : 'default';
  } else if (lowerPrompt.includes('weather') || lowerPrompt.includes('forecast') || lowerPrompt.includes('temperature')) {
    flowType = 'weather';
  } else if (lowerPrompt.includes('stock') || lowerPrompt.includes('price') || lowerPrompt.includes('aapl') || lowerPrompt.includes('nvda') || lowerPrompt.includes('tsla')) {
    flowType = 'stock';
  } else if (lowerPrompt.includes('location') || lowerPrompt.includes('where am i')) {
    flowType = 'askConfirmation';
  } else if (lowerPrompt.includes('debounce') || lowerPrompt.includes('hook') || lowerPrompt.includes('react')) {
    flowType = 'debounce';
  } else if (lowerPrompt.includes('stream') || lowerPrompt.includes('sse') || lowerPrompt.includes('ui') || lowerPrompt.includes('generative')) {
    flowType = 'streaming';
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

      const emitFinish = (tokens = 145) => {
        safeEnqueue({
          type: 'finish',
          finishReason: 'stop',
          messageMetadata: {
            totalTokens: tokens,
            latencyMs: Math.floor(180 + Math.random() * 120),
          },
        } as any);
        if (!isClosed) controller.close();
      };

      try {
        if (
          !safeEnqueue({
            type: 'start',
            messageMetadata: {
              createdAt: Date.now(),
              model,
            },
          } as any)
        )
          return;

        // 1. Send transient notification (ephemeral data stream)
        safeEnqueue({
          type: 'data-notification',
          data: { message: `Analyzing query with ${model}...`, level: 'info' },
          transient: true,
        } as any);

        // 2. Stream RAG Source Reference
        safeEnqueue({
          type: 'source',
          value: {
            type: 'source',
            sourceType: 'url',
            id: `source-doc-${Date.now()}`,
            url: 'https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data',
            title: 'AI SDK Docs: Streaming Custom Data & Reconciliation',
          },
        } as any);

        // 1. Weather Generative UI Flow (Calls displayWeather)
        if (flowType === 'weather') {
          let city = 'Paris';
          const match = userText.match(/in\s+([A-Za-z\s]+)/i) || userText.match(/for\s+([A-Za-z\s]+)/i);
          if (match && match[1]) {
            city = match[1].replace(/[?!.]/g, '').trim();
          }

          // 3. Send initial persistent data part with loading state
          safeEnqueue({
            type: 'data-weather',
            id: 'weather-reconcile-sim',
            data: { city, status: 'loading' },
          } as any);

          // Reasoning step
          if (!safeEnqueue({ type: 'reasoning-start', id: 'reasoning-0' })) return;
          const reasoning = `The user is requesting the weather for "${city}". Generating a dynamic Generative UI Weather card by invoking "displayWeather".`;
          for (const word of reasoning.split(' ')) {
            await new Promise((r) => setTimeout(r, 12));
            if (!safeEnqueue({ type: 'reasoning-delta', id: 'reasoning-0', delta: ' ' + word })) return;
          }
          if (!safeEnqueue({ type: 'reasoning-end', id: 'reasoning-0' })) return;
          await new Promise((r) => setTimeout(r, 80));

          // Tool call: input available
          const toolCallId = `call_weather_${Date.now()}`;
          if (
            !safeEnqueue({
              type: 'tool-input-available',
              toolCallId,
              toolName: 'displayWeather',
              input: { location: city },
            })
          )
            return;
          await new Promise((r) => setTimeout(r, 350));

          // Tool output available (Generative UI will render <Weather />)
          const outputData = {
            location: city,
            temperature: 21,
            weather: 'Sunny & Clear',
            humidity: '48%',
            windSpeed: '14 km/h',
            high: '24°C',
            low: '16°C',
          };
          if (
            !safeEnqueue({
              type: 'tool-output-available',
              toolCallId,
              output: outputData,
            })
          )
            return;
          await new Promise((r) => setTimeout(r, 200));

          // Model provides accompanying conversational markdown
          if (!safeEnqueue({ type: 'text-start', id: 'text-0' })) return;
          const text = `Here is the real-time weather widget for **${city}**. Conditions are mild and sunny today.`;
          for (const token of text.split(/(\s+)/)) {
            await new Promise((r) => setTimeout(r, 18));
            if (!safeEnqueue({ type: 'text-delta', id: 'text-0', delta: token })) return;
          }
          if (!safeEnqueue({ type: 'text-end', id: 'text-0' })) return;

          // 4. Data Part Reconciliation: Update the same persistent part with 'weather-reconcile-sim' ID
          safeEnqueue({
            type: 'data-weather',
            id: 'weather-reconcile-sim',
            data: {
              city,
              weather: 'Sunny & Clear',
              temp: '21°C',
              status: 'success',
            },
          } as any);

          // 5. Completion transient notification
          safeEnqueue({
            type: 'data-notification',
            data: { message: `Telemetry for ${city} reconciled & stream finalized.`, level: 'info' },
            transient: true,
          } as any);

          emitFinish(168);
          return;
        }

        // 2. Stock Generative UI Flow (Calls getStockPrice)
        if (flowType === 'stock') {
          let symbol = 'NVDA';
          const upper = userText.toUpperCase();
          if (upper.includes('AAPL')) symbol = 'AAPL';
          else if (upper.includes('TSLA')) symbol = 'TSLA';
          else if (upper.includes('MSFT')) symbol = 'MSFT';
          else if (upper.includes('GOOGL')) symbol = 'GOOGL';
          else if (upper.includes('AMZN')) symbol = 'AMZN';

          // Reasoning step
          if (!safeEnqueue({ type: 'reasoning-start', id: 'reasoning-0' })) return;
          const reasoning = `The user wants financial market data for ${symbol}. Calling "getStockPrice" tool to render a Generative UI Stock component.`;
          for (const word of reasoning.split(' ')) {
            await new Promise((r) => setTimeout(r, 12));
            if (!safeEnqueue({ type: 'reasoning-delta', id: 'reasoning-0', delta: ' ' + word })) return;
          }
          if (!safeEnqueue({ type: 'reasoning-end', id: 'reasoning-0' })) return;
          await new Promise((r) => setTimeout(r, 80));

          const toolCallId = `call_stock_${Date.now()}`;
          if (
            !safeEnqueue({
              type: 'tool-input-available',
              toolCallId,
              toolName: 'getStockPrice',
              input: { symbol },
            })
          )
            return;
          await new Promise((r) => setTimeout(r, 400));

          const stockOutputs: Record<string, any> = {
            AAPL: { symbol: 'AAPL', price: 234.80, change: 3.40, changePercent: 1.47, companyName: 'Apple Inc.', high: 236.20, low: 231.50, volume: '48.1M' },
            NVDA: { symbol: 'NVDA', price: 142.25, change: 5.15, changePercent: 3.76, companyName: 'NVIDIA Corporation', high: 144.10, low: 139.30, volume: '62.7M' },
            TSLA: { symbol: 'TSLA', price: 219.10, change: -3.20, changePercent: -1.44, companyName: 'Tesla, Inc.', high: 224.00, low: 217.40, volume: '51.3M' },
          };

          const quote = stockOutputs[symbol] || {
            symbol,
            price: 185.50,
            change: 2.30,
            changePercent: 1.25,
            companyName: `${symbol} Corp`,
            high: 188.00,
            low: 183.10,
            volume: '34.5M',
          };

          if (
            !safeEnqueue({
              type: 'tool-output-available',
              toolCallId,
              output: quote,
            })
          )
            return;
          await new Promise((r) => setTimeout(r, 200));

          if (!safeEnqueue({ type: 'text-start', id: 'text-0' })) return;
          const text = `Here is the live market card for **${quote.companyName} (${symbol})**. The stock is trading at **$${quote.price.toFixed(2)}** (${quote.change >= 0 ? '+' : ''}${quote.changePercent}%).`;
          for (const token of text.split(/(\s+)/)) {
            await new Promise((r) => setTimeout(r, 18));
            if (!safeEnqueue({ type: 'text-delta', id: 'text-0', delta: token })) return;
          }
          if (!safeEnqueue({ type: 'text-end', id: 'text-0' })) return;

          emitFinish(192);
          return;
        }

        // 3. Ask Confirmation Flow
        if (flowType === 'askConfirmation') {
          if (!safeEnqueue({ type: 'reasoning-start', id: 'reasoning-0' })) return;
          const reasoning = `The user is requesting their location. Before invoking "getLocation", asking for confirmation.`;
          for (const word of reasoning.split(' ')) {
            await new Promise((r) => setTimeout(r, 12));
            if (!safeEnqueue({ type: 'reasoning-delta', id: 'reasoning-0', delta: ' ' + word })) return;
          }
          if (!safeEnqueue({ type: 'reasoning-end', id: 'reasoning-0' })) return;
          await new Promise((r) => setTimeout(r, 80));

          const toolCallId = `call_confirm_${Date.now()}`;
          if (
            !safeEnqueue({
              type: 'tool-input-available',
              toolCallId,
              toolName: 'askForConfirmation',
              input: {
                message: 'Do you permit Claude to retrieve your current location?',
              },
            })
          )
            return;

          emitFinish(65);
          return;
        }

        // 4. User confirmed -> Execute getLocation
        if (flowType === 'executeLocation') {
          if (!safeEnqueue({ type: 'reasoning-start', id: 'reasoning-0' })) return;
          const reasoning = `Confirmation received. Triggering client-side "getLocation" tool.`;
          for (const word of reasoning.split(' ')) {
            await new Promise((r) => setTimeout(r, 12));
            if (!safeEnqueue({ type: 'reasoning-delta', id: 'reasoning-0', delta: ' ' + word })) return;
          }
          if (!safeEnqueue({ type: 'reasoning-end', id: 'reasoning-0' })) return;
          await new Promise((r) => setTimeout(r, 80));

          const toolCallId = `call_location_${Date.now()}`;
          if (
            !safeEnqueue({
              type: 'tool-input-available',
              toolCallId,
              toolName: 'getLocation',
              input: {},
            })
          )
            return;

          emitFinish(50);
          return;
        }

        // 5. Location output available
        if (flowType === 'locationComplete') {
          if (!safeEnqueue({ type: 'text-start', id: 'text-0' })) return;
          const loc = locationPart.output || 'San Francisco, CA';
          const text = `Thank you for confirming! Your current location is **${loc}**.`;
          for (const token of text.split(/(\s+)/)) {
            await new Promise((r) => setTimeout(r, 18));
            if (!safeEnqueue({ type: 'text-delta', id: 'text-0', delta: token })) return;
          }
          if (!safeEnqueue({ type: 'text-end', id: 'text-0' })) return;

          emitFinish(85);
          return;
        }

        // 6. React Hook Debounce Example
        if (flowType === 'debounce') {
          if (!safeEnqueue({ type: 'reasoning-start', id: 'reasoning-0' })) return;
          const reasoning = `User requested a TypeScript debounce hook. Providing implementation and usage examples.`;
          for (const word of reasoning.split(' ')) {
            await new Promise((r) => setTimeout(r, 12));
            if (!safeEnqueue({ type: 'reasoning-delta', id: 'reasoning-0', delta: ' ' + word })) return;
          }
          if (!safeEnqueue({ type: 'reasoning-end', id: 'reasoning-0' })) return;
          await new Promise((r) => setTimeout(r, 80));

          if (!safeEnqueue({ type: 'text-start', id: 'text-0' })) return;
          const response = `Here is a custom **useDebounce** hook in TypeScript:\n\n\`\`\`typescript\nimport { useState, useEffect } from 'react';\n\nexport function useDebounce<T>(value: T, delay = 300): T {\n  const [debounced, setDebounced] = useState<T>(value);\n\n  useEffect(() => {\n    const timer = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(timer);\n  }, [value, delay]);\n\n  return debounced;\n}\n\`\`\``;
          for (const token of response.split(/(\s+)/)) {
            await new Promise((r) => setTimeout(r, 15));
            if (!safeEnqueue({ type: 'text-delta', id: 'text-0', delta: token })) return;
          }
          if (!safeEnqueue({ type: 'text-end', id: 'text-0' })) return;

          emitFinish(175);
          return;
        }

        // 7. Generative UI Overview
        if (!safeEnqueue({ type: 'reasoning-start', id: 'reasoning-0' })) return;
        const reasoning = `Processing user query: "${userText}". Formulating response showcasing Generative User Interfaces with AI SDK.`;
        for (const word of reasoning.split(' ')) {
          await new Promise((r) => setTimeout(r, 12));
          if (!safeEnqueue({ type: 'reasoning-delta', id: 'reasoning-0', delta: ' ' + word })) return;
        }
        if (!safeEnqueue({ type: 'reasoning-end', id: 'reasoning-0' })) return;
        await new Promise((r) => setTimeout(r, 80));

        if (!safeEnqueue({ type: 'text-start', id: 'text-0' })) return;
        const response = `Welcome to **Generative User Interfaces** powered by **${model}**!\n\nGenerative UI allows the model to go beyond plain text and render dynamic, interactive React components:\n\n- 🌤️ **Generative Weather Card**: Ask *"What's the weather in Paris?"* to render \`<Weather />\`.\n- 📈 **Generative Stock Card**: Ask *"Show NVIDIA (NVDA) or Apple (AAPL) stock price"* to render \`<Stock />\`.\n- 📍 **Generative Confirmation & Location**: Ask *"Where am I located?"* to render interactive confirmation and location widgets!`;
        for (const token of response.split(/(\s+)/)) {
          await new Promise((r) => setTimeout(r, 18));
          if (!safeEnqueue({ type: 'text-delta', id: 'text-0', delta: token })) return;
        }
        if (!safeEnqueue({ type: 'text-end', id: 'text-0' })) return;

        // Completion transient notification
        safeEnqueue({
          type: 'data-notification',
          data: { message: 'Streaming response completed successfully.', level: 'info' },
          transient: true,
        } as any);

        emitFinish(155);
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
