# Claude AI Chat Studio 🚀

A production-grade, full-stack AI streaming chat interface powered by **Anthropic Claude** and the **Vercel AI SDK**, featuring low-latency token-by-token streaming, real-time reasoning insights, model selection, and zero-cost simulation fallback.

---

## ✨ Features

- **⚡ Real-time SSE Streaming**: Low-latency token-by-token streaming using Server-Sent Events with `@ai-sdk/react` and `@ai-sdk/anthropic`.
- **📡 Streaming Custom Data & Reconciliation**:
  - **Type-Safe Custom Messages (`MyUIMessage`)**: Extended `UIMessage` schemas specifying typed persistent and transient data parts.
  - **Ephemeral Transient Notifications**: Stream transient status chunks (`transient: true`) captured exclusively via `useChat`'s `onData` callback and presented as animated floating toast banners without polluting message history.
  - **RAG Source Citations**: Streamed source references (`type: 'source'`) rendered as interactive citations with direct URLs and document titles.
  - **Data Part Reconciliation**: Dynamic in-place part updates using matching IDs (`weather-live-1`), enabling progressive state transformations (e.g. `loading` → `success` telemetry) without duplicate cards.
- **🏷️ Message Metadata (`message.metadata`)**:
  - **Type-Safe Schema (`messageMetadataSchema`)**: Attach message-level attributes (`createdAt`, `model`, `totalTokens`, `latencyMs`) attached to `UIMessage<MessageMetadata>`.
  - **Streaming Lifecycle Callbacks**: Stream metadata on stream initialization (`part.type === 'start'`) and stream finalization (`part.type === 'finish'`) with automatic client-side merging.
  - **Telemetry Badges**: Live model attribution badges, timestamps, token usage metrics, and generation latency indicators rendered in the UI.
- **📦 Structured Object Generation (`useObject`)**:
  - Stream strongly typed JSON objects conforming to Zod schemas in real-time.
  - Partial object rendering with `parsePartialJson` handles partial data streams gracefully.
  - **Live JSON Inspector**: View the raw streaming JSON alongside rendered notification cards.
  - **Cancelation & States**: Support for `isLoading`, `stop()`, `error`, `onFinish`, and `onError`.
- **✍️ AI Completion Studio (`useCompletion`)**:
  - Purpose-built for single-turn text completions, code generation, drafting, and summarization.
  - Granular controlled APIs: `input`, `setInput`, `handleInputChange`, `handleSubmit`, `complete()`.
  - **Cancelation**: Immediate streaming abort using the `stop()` controller.
  - **Throttled Rendering**: Configurable update throttling (`throttle: 50ms`) for smooth 60fps performance.
- **🎨 Generative User Interfaces (Generative UI)**:
  - Dynamically connects tool execution results directly to custom React components in the chat feed.
  - **`<Weather />`**: Rich meteorological card with dynamic weather condition icons, temperatures, humidity, and wind stats.
  - **`<Stock />`**: Interactive financial asset card with live quotes, 24h percentage badges, day ranges, and SVG trend sparklines.
  - Generative UI loading skeletons with pulsing status indicators during generation.
- **🛠️ Chatbot Tool Usage (3 Patterns)**:
  1. **Server-Side Tool Execution**: `displayWeather` and `getStockPrice` executed on the server.
  2. **Interactive Client-Side Confirmation**: `askForConfirmation` presenting "Yes, Confirm" / "No, Deny" actions.
  3. **Client-Side Tool Auto-Execution**: Automatic `getLocation` execution handled via `onToolCall` in `useChat`.
  4. **Multi-Step Execution**: Automatically re-submits with `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls` and `stopWhen: isStepCount(5)`.
- **🧠 Collapsible Thinking Process**: Live inspection of Claude's internal reasoning process (`reasoning-delta` chunks) with a clean expandable/collapsible container.
- **🔄 Multi-Model Switching**: Seamlessly switch between Claude models:
  - `Claude 3.5 Sonnet` (Balanced intelligence & coding prowess)
  - `Claude 3.7 Sonnet` (Hybrid reasoning architecture)
  - `Claude 3.5 Haiku` (Lightning-fast responses)
- **🛡️ Built-in Zero-Cost Simulator**: Automatically falls back to a realistic streaming simulator if no `ANTHROPIC_API_KEY` is provided or if test credits expire.
- **📜 Smart Auto-Scroll**: Intelligent scroll tracking with scroll lock detection, unread new content badges, and a floating "Jump to bottom" button.
- **⏹️ Stream Interruption**: Cancel token generation mid-stream using the dedicated **Stop** button.
- **💾 Local Persistence**: Chat history persists across page reloads via `localStorage` with one-click clear functionality.
- **📋 One-Click Copy**: Copy message contents directly to the clipboard.
- **🎨 Glassmorphic Dark UI**: Premium design built with custom CSS tokens, modern typography (`Inter` & `JetBrains Mono`), and responsive layouts.
- **☁️ Dual Deployment**: Ready for local Vite development middleware, Express backend, or serverless deployment via Netlify Functions (`/api/chat`).

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/), [Lucide React](https://lucide.dev/), [React Markdown](https://github.com/remarkjs/react-markdown)
- **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai/docs) (`ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`)
- **Backend / Serverless**: Node.js, [Express](https://expressjs.com/), [Netlify Functions](https://docs.netlify.com/functions/overview/)

---

## 📁 Project Structure

```text
├── netlify/
│   └── functions/
│       └── chat.ts           # Serverless streaming endpoint for Netlify deployment
├── server/
│   ├── config/
│   │   └── ai.ts             # Backend AI configuration & API key validation
│   ├── chat-handler.ts       # Shared streaming handler (Claude API + Simulator)
│   ├── index.ts              # Standalone Express backend server
│   └── simulator.ts          # Zero-cost realistic streaming response simulator
├── src/
│   ├── components/
│   │   ├── ChatInput.tsx     # Auto-expanding textarea with Send & Stop controls
│   │   ├── EmptyState.tsx    # Welcome screen with starter suggestion cards
│   │   ├── Header.tsx        # Top navigation, model selector, & chat clearing
│   │   ├── MessageItem.tsx   # Markdown message bubble with reasoning collapse & copy
│   │   └── ThinkingIndicator.tsx # Animated pulsing dots while awaiting response
│   ├── config/
│   │   └── ai.ts             # Client-side model configurations & system prompts
│   ├── hooks/
│   │   └── useAutoScroll.ts  # Smart scroll hook with user-scroll detection
│   ├── App.tsx               # Root chat orchestrator with useChat integration
│   ├── index.css             # Design system with dark theme tokens & styles
│   └── main.tsx              # React DOM entry point
├── .env.example              # Environment variables template
├── netlify.toml              # Netlify build & functions configuration
├── package.json              # Dependencies and run scripts
├── tsconfig.json             # TypeScript project references
└── vite.config.ts            # Vite config with integrated /api/chat middleware
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js `v18+` or `v20+`
- npm, pnpm, or yarn

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and add your Anthropic API key:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
PORT=3001
```
*(Note: If you do not have an API key, the built-in simulator will automatically provide realistic streamed responses for testing!)*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. The custom Vite middleware handles `/api/chat` directly during development.

### 4. Run Standalone Express Server (Optional)
If you prefer running a dedicated backend server:
```bash
npm run server
```
The server will run on [http://localhost:3001](http://localhost:3001).

---

## 🚢 Production & Deployment

### Netlify Deployment
This repository is pre-configured with `netlify.toml` and Netlify Functions:
1. Connect your repository to Netlify.
2. Under **Site Configuration > Environment Variables**, add `ANTHROPIC_API_KEY`.
3. Deploy! Netlify will automatically build the client bundle and expose the serverless function at `/api/chat`.
