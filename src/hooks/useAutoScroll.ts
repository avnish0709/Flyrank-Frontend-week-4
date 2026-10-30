import { useRef, useState, useEffect, useCallback } from 'react';

export function useAutoScroll<T extends HTMLElement>(dependency: any) {
  const containerRef = useRef<T>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewContent, setHasNewContent] = useState(false);
  const userScrolledUpRef = useRef(false);

  // Check scroll position to determine if user scrolled away from the bottom
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const threshold = 70; // px from bottom considered "at bottom"
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom <= threshold;

    setIsAtBottom(atBottom);
    userScrolledUpRef.current = !atBottom;

    if (atBottom) {
      setHasNewContent(false);
    }
  }, []);

  // Smoothly scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
    userScrolledUpRef.current = false;
    setIsAtBottom(true);
    setHasNewContent(false);
  }, []);

  // When dependency (messages or streaming token chunk) changes
  useEffect(() => {
    if (!userScrolledUpRef.current) {
      scrollToBottom('smooth');
    } else {
      setHasNewContent(true);
    }
  }, [dependency, scrollToBottom]);

  return {
    containerRef,
    bottomRef,
    isAtBottom,
    hasNewContent,
    scrollToBottom,
    handleScroll,
  };
}
