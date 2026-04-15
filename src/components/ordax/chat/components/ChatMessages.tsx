import React from "react";
import { Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ChatMsg } from "@/lib/ordax/types";
import { CompilerPhaseRenderer, type CompilerResponse } from "@/components/ordax/CompilerPhaseRenderer";

export interface ChatMessagesProps {
  // State
  messages: ChatMsg[];
  compilerResponses: CompilerResponse[];
  isStreaming: boolean;
  streamingContent: string;
  isLoading: boolean;
  loadingBubbleText: string;
  isEditMode: boolean;
  examplePrompts: string[];
  
  // Refs
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  
  // Actions
  setInput: (input: string) => void;
  handleApprove?: (response: CompilerResponse) => void;
  approving?: boolean;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  compilerResponses,
  isStreaming,
  streamingContent,
  isLoading,
  loadingBubbleText,
  isEditMode,
  examplePrompts,
  scrollAreaRef,
  setInput,
  handleApprove,
  approving,
}) => {
  const renderWelcomeMessage = () => (
    <div className="space-y-4">
      <div className="glass-panel p-4 rounded-lg border border-border/50">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm mb-1">
              {isEditMode ? "Modo Projeto" : "Olá! Sou o Ordax AI"}
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              {isEditMode
                ? "Você já tem um jogo. Peça mudanças e melhorias — eu edito o projeto atual."
                : "Descreva o jogo que você quer criar e eu vou gerar automaticamente."}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground">
          {isEditMode ? "Sugestões rápidas:" : "Exemplos:"}
        </div>

        {(isEditMode
          ? [
              "Melhore o visual do player (mais detalhado, com feedback de dano e propulsão)",
              "Adicione uma tela de pause e uma tela de New Game (overlay)",
              "Deixe o game loop mais claro: objetivos, score e progressão de dificuldade",
              "Ajuste câmera e UI para ficar mais 'AAA' (HUD, feedback, partículas)",
            ]
          : examplePrompts
        ).map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => setInput(prompt)}
            className="w-full text-left p-3 rounded-lg glass-panel border border-border/50 hover:border-primary/30 transition-colors text-xs"
          >
            • {prompt}
          </button>
        ))}
      </div>
    </div>
  );

  const renderMessage = (m: ChatMsg, idx: number) => (
    <div
      key={`msg-${idx}`}
      className={cn(
        "flex gap-3 animate-fade-in",
        m.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      {m.role === "assistant" && (
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
      )}
      <div className={cn(
        "max-w-[80%] rounded-lg px-4 py-3 text-xs border",
        m.role === "user" 
          ? "bg-primary/20 border-primary/30 text-foreground"
          : "glass-panel border-border/50 text-foreground"
      )}>
        <div className="whitespace-pre-wrap leading-relaxed">
          {m.content}
        </div>
      </div>
      {m.role === "user" && (
        <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
          <span className="text-xs">👤</span>
        </div>
      )}
    </div>
  );

  const renderLoadingIndicator = () => (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
      </div>
      <div className="max-w-[80%] rounded-lg px-4 py-3 text-xs glass-panel border border-border/50 text-foreground">
        <div className="leading-relaxed">
          {loadingBubbleText}
          <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-2 align-middle" />
        </div>
      </div>
    </div>
  );

  const renderStreamingMessage = () => (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
      </div>
      <div className="max-w-[80%] rounded-lg px-4 py-3 text-xs glass-panel border border-border/50 text-foreground">
        <div className="whitespace-pre-wrap leading-relaxed">
          {streamingContent}
          <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1"></span>
        </div>
      </div>
    </div>
  );

  return (
    <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
      {messages.length === 0 && renderWelcomeMessage()}

      <div className="space-y-3">
        {/* Respostas estruturadas do compilador */}
        {compilerResponses.map((response, idx) => (
          <div key={`compiler-${idx}`} className="animate-fade-in">
            <CompilerPhaseRenderer
              response={response}
              onApprove={response.kind === "CONFIRMATION_REQUIRED" && handleApprove 
                ? () => handleApprove(response) 
                : undefined
              }
              approving={approving}
            />
          </div>
        ))}

        {/* Mensagens do chat (usuário e assistente) */}
        {messages.map(renderMessage)}

        {/* Loading indicator */}
        {(isLoading || isStreaming) && !streamingContent && compilerResponses.length === 0 && renderLoadingIndicator()}

        {/* Streaming message */}
        {isStreaming && streamingContent && renderStreamingMessage()}
      </div>
    </ScrollArea>
  );
};