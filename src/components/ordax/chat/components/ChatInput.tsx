import React from "react";
import { Send, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface ChatInputProps {
  // State
  input: string;
  isLoading: boolean;
  isStreaming: boolean;
  placeholder: string;
  disabled?: boolean;
  
  // Actions
  setInput: (input: string) => void;
  send: (text: string) => Promise<void>;
  stopStreaming: () => void;
  
  // Validation
  validateInput: () => boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  isLoading,
  isStreaming,
  placeholder,
  disabled = false,
  setInput,
  send,
  stopStreaming,
  validateInput,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        void send(input);
      }
    }
  };

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      void send(input);
    }
  };

  return (
    <div className="border-t border-border/50 p-4 bg-card/60">
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className="min-h-[80px] max-h-[120px] resize-none bg-background border-border/50 text-xs"
          onKeyDown={handleKeyDown}
        />
        {isStreaming ? (
          <Button
            size="icon"
            variant="destructive"
            className="h-auto shrink-0 self-end"
            onClick={stopStreaming}
          >
            <StopCircle className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            className="h-auto shrink-0 self-end neon-glow"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="text-[10px] text-muted-foreground mt-2">
        Pressione Ctrl+Enter para enviar
      </div>
    </div>
  );
};