import { useRef, useCallback, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface UseScrollManagementReturn {
  // Refs
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  shouldStickToBottomRef: React.MutableRefObject<boolean>;
  
  // Actions
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  setupScrollListener: () => () => void;
}

export const useScrollManagement = (): UseScrollManagementReturn => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef<boolean>(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    // Find the scrollable content element
    const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior,
    });
  }, []);

  const setupScrollListener = useCallback(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return () => {};

    const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return () => {};

    const handleScroll = () => {
      if (!viewport) return;
      
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // If user is within 100px of bottom, keep sticking
      shouldStickToBottomRef.current = distanceFromBottom < 100;
    };

    viewport.addEventListener('scroll', handleScroll);
    
    return () => {
      viewport.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return {
    scrollAreaRef,
    shouldStickToBottomRef,
    scrollToBottom,
    setupScrollListener,
  };
};