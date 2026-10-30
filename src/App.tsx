import { useState, useCallback, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { ChevronDown, AlertCircle, X } from 'lucide-react';
import { AI_CONFIG } from './config/ai';
import type { MyUIMessage } from './types/ai';
import { Header, type AppMode } from './components/Header';
import { EmptyState } from './components/EmptyState';
import { MessageItem } from './components/MessageItem';
import { ThinkingIndicator } from './components/ThinkingIndicator';
import { ChatInput } from './components/ChatInput';
import { CompletionView } from './components/CompletionView';
import { ObjectView } from './components/ObjectView';
import { useAutoScroll } from './hooks/useAutoScroll';

export default function App() {
  const [activeMode, setActiveMode] = useState<AppMode>('chat');
  const [selectedModel, setSelectedModel] = useState<string>(AI_CONFIG.defaultModel);
  const [input, setInput] = useState<string>('');
  const [dismissError, setDismissError] = useState<boolean>(false);
  const [transientToast, setTransientToast] = useState<{
    message: string;
    level: 'info' | 'warning' | 'error';
  } | null>(null);

  // Initialize Vercel AI SDK useChat hook with tool usage & custom data stream support
  const {
    messages,
    sendMessage,
    stop,
    status,
    error,
    setMessages,
    addToolOutput,
  } = useChat<MyUIMessage>({
    // Automatically submit when all tool results are ready
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,

    // Process real-time custom data parts and transient notifications from stream
    onData(dataPart: any) {
      if (dataPart.type === 'data-notification' && dataPart.data?.message) {
        setTransientToast(dataPart.data);
        setTimeout(() => {
          setTransientToast((prev) => (prev?.message === dataPart.data?.message ? null : prev));
        }, 4000);
      }
    },

    // Run client-side tools that are automatically executed
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) {
        return;
      }

      if (toolCall.toolName === 'getLocation') {
        const sampleCities = [
          'Tokyo, Japan',
          'San Francisco, CA',
          'London, UK',
          'New York, NY',
          'Bengaluru, India',
        ];
        const randomCity = sampleCities[Math.floor(Math.random() * sampleCities.length)];

        // Supply output without await to prevent potential deadlocks per SDK docs
        addToolOutput({
          tool: 'getLocation',
          toolCallId: toolCall.toolCallId,
          output: randomCity,
        });
      }
    },
  });

  const isStreaming = status === 'streaming' || status === 'submitted';

  // Restore messages from localStorage on initial load
  useEffect(() => {
    const saved = localStorage.getItem('claude_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (err) {
        console.error('Failed to parse saved chat history:', err);
      }
    }
  }, [setMessages]);

  // Persist messages to localStorage when updated
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem('claude_chat_history', JSON.stringify(messages));
      } catch (err) {
        console.error('Failed to persist messages to localStorage:', err);
      }
    } else {
      localStorage.removeItem('claude_chat_history');
    }
  }, [messages]);

  // Smart auto-scroll handling
  const {
    containerRef,
    bottomRef,
    isAtBottom,
    hasNewContent,
    scrollToBottom,
    handleScroll,
  } = useAutoScroll<HTMLDivElement>(messages);

  // Handle message submission
  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    setInput('');
    setDismissError(false);

    try {
      await sendMessage(
        {
          text: trimmed,
          metadata: {
            createdAt: Date.now(),
          },
        } as any,
        {
          body: {
            model: selectedModel,
          },
        }
      );
    } catch (err) {
      console.error('Error sending message:', err);
    }
  }, [input, isStreaming, selectedModel, sendMessage]);

  // Handle selecting a starter prompt from the empty state
  const handleSelectPrompt = useCallback(
    async (promptText: string) => {
      if (isStreaming) return;
      setInput('');
      setDismissError(false);

      try {
        await sendMessage(
          {
            text: promptText,
            metadata: {
              createdAt: Date.now(),
            },
          } as any,
          {
            body: {
              model: selectedModel,
            },
          }
        );
      } catch (err) {
        console.error('Error sending starter prompt:', err);
      }
    },
    [isStreaming, selectedModel, sendMessage]
  );

  const handleClearChat = useCallback(() => {
    if (isStreaming) return;
    setMessages([]);
    localStorage.removeItem('claude_chat_history');
  }, [isStreaming, setMessages]);

  return (
    <div className="app-container">
      {/* Top Navigation Bar with 3 Mode Switchers */}
      <Header
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onClearChat={handleClearChat}
        hasMessages={messages.length > 0}
        status={status}
        activeMode={activeMode}
        onModeChange={setActiveMode}
      />

      {/* Optional Error Alert */}
      {error && !dismissError && (
        <div className="error-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={18} />
            <span>
              {error.message || 'Failed to stream response from Claude API. Falling back gracefully.'}
            </span>
          </div>
          <button
            className="action-btn"
            onClick={() => setDismissError(true)}
            style={{ color: 'inherit' }}
            title="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Floating Transient Data Stream Toast */}
      {transientToast && (
        <div className={`transient-toast ${transientToast.level}`}>
          <div className="toast-badge">
            <span className="live-pulse" />
            <span>TRANSIENT STREAM</span>
          </div>
          <span className="toast-message">{transientToast.message}</span>
          <button
            className="toast-close-btn"
            onClick={() => setTransientToast(null)}
            title="Dismiss notification"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Render Active Studio Mode */}
      {activeMode === 'chat' && (
        <>
          {/* Chat Messages Feed */}
          <main className="chat-main" ref={containerRef} onScroll={handleScroll}>
            {messages.length === 0 ? (
              <EmptyState onSelectPrompt={handleSelectPrompt} />
            ) : (
              <div className="messages-container">
                {messages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    addToolOutput={addToolOutput}
                  />
                ))}

                {/* Live Thinking Indicator when awaiting the first response chunk */}
                {status === 'submitted' && <ThinkingIndicator />}

                <div ref={bottomRef} style={{ height: 1 }} />
              </div>
            )}

            {/* Floating Scroll to Bottom Button */}
            {!isAtBottom && messages.length > 0 && (
              <button
                className="scroll-bottom-btn"
                onClick={() => scrollToBottom('smooth')}
                title="Scroll to latest messages"
              >
                <ChevronDown size={20} />
                {hasNewContent && <span className="unread-badge" />}
              </button>
            )}
          </main>

          {/* Bottom Input Composer */}
          <ChatInput
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            onStop={stop}
            isStreaming={isStreaming}
          />
        </>
      )}

      {activeMode === 'completion' && (
        <main className="chat-main">
          <CompletionView selectedModel={selectedModel} />
        </main>
      )}

      {activeMode === 'object' && (
        <main className="chat-main">
          <ObjectView selectedModel={selectedModel} />
        </main>
      )}
    </div>
  );
}
