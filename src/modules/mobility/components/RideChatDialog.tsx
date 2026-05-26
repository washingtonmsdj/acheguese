import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useRideChat } from "@/modules/mobility/hooks/useRideChat";
import { MessageCircle, Send, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { format } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";

interface RideChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideId: string;
  userId: string;
  otherUserName: string;
  isDriver: boolean;
}

export function RideChatDialog({
  open,
  onOpenChange,
  rideId,
  userId,
  otherUserName,
  isDriver,
}: RideChatDialogProps) {
  const [messageInput, setMessageInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { chat, messages, loading, sending, error, sendMessage, markAsRead } =
    useRideChat({
      rideId,
      userId,
      enabled: open,
    });

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Marcar como lida ao abrir
  useEffect(() => {
    if (open && chat) {
      markAsRead();
    }
  }, [open, chat, markAsRead]);

  const handleSend = async () => {
    if (!messageInput.trim() || sending) return;

    try {
      await sendMessage(messageInput);
      setMessageInput("");
    } catch (err) {
      // Erro já tratado no hook
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(date, "HH:mm", { locale: ptBR });
    }
    return format(date, "dd/MM HH:mm", { locale: ptBR });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/30">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-sm font-bold">
                {(otherUserName ?? '?').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-base">{otherUserName}</DialogTitle>
              <p className="text-xs text-muted-foreground">
                {isDriver ? "Passageiro" : "Motorista"}
              </p>
            </div>
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Converse com o motorista ou passageiro
        </DialogDescription>

        {/* Mensagens */}
        <ScrollArea ref={scrollRef} className="flex-1 px-6 py-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2",
                    i % 2 === 0 ? "justify-end" : "justify-start",
                  )}
                >
                  <Skeleton className="h-16 w-64 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-3" />
              <p className="text-sm font-semibold text-foreground mb-1">
                Erro ao carregar chat
              </p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">
                Nenhuma mensagem ainda
              </p>
              <p className="text-xs text-muted-foreground">
                Envie a primeira mensagem!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isOwnMessage = message.sender_profile_id === userId;
                const isSystemMessage = message.is_system_message;

                if (isSystemMessage) {
                  return (
                    <div key={message.id} className="flex justify-center">
                      <div className="px-3 py-1.5 rounded-full bg-secondary/50 border border-border">
                        <p className="text-xs text-muted-foreground text-center">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2 items-end",
                      isOwnMessage ? "justify-end" : "justify-start",
                    )}
                  >
                    {!isOwnMessage && (
                      <Avatar className="h-7 w-7 border border-border flex-shrink-0">
                        <AvatarFallback className="bg-secondary text-foreground text-xs">
                          {(otherUserName ?? '?').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2",
                        isOwnMessage
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-secondary text-foreground rounded-bl-sm",
                      )}
                    >
                      <p className="text-sm break-words">{message.message}</p>
                      <p
                        className={cn(
                          "text-[0.65rem] mt-1",
                          isOwnMessage
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground",
                        )}
                      >
                        {formatMessageTime(message.created_at)}
                        {isOwnMessage && message.read_at && (
                          <span className="ml-1">✓✓</span>
                        )}
                      </p>
                    </div>
                    {isOwnMessage && (
                      <Avatar className="h-7 w-7 border border-primary/30 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs">
                          Eu
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Input de mensagem */}
        <div className="px-6 py-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={sending || loading || !!error}
              className="flex-1 rounded-xl"
            />
            <Button
              onClick={handleSend}
              disabled={!messageInput.trim() || sending || loading || !!error}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-[0.65rem] text-muted-foreground mt-2 text-center">
            Pressione Enter para enviar
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
