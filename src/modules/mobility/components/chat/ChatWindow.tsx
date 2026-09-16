import React, { useEffect, useRef, useState } from "react";
import { useMobilidadeChat } from "@/modules/mobility/hooks/useMobilidadeChat";
import { useSessionContext } from "@/core/session";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { ArrowLeft, MapPin, MoreVertical, Phone, Send } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { RIDE_STATUS } from "@/shared/types/constants";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";

interface ChatWindowProps {
  rideId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  rideInfo?: {
    origin: string;
    destination: string;
    status: string;
  };
  onBack?: () => void;
  onCall?: () => void;
  onViewLocation?: () => void;
}

export function ChatWindow({
  rideId,
  otherUserName,
  otherUserAvatar,
  rideInfo,
  onBack,
  onCall,
  onViewLocation,
}: ChatWindowProps) {
  const { activeProfile } = useSessionContext();
  const { messages, loading, sending, sendMessage, markAllAsRead } =
    useMobilidadeChat(rideId);

  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    try {
      await sendMessage(inputText);
      setInputText("");
      inputRef.current?.focus();
    } catch {
      // O hook mantém a autoridade sobre o feedback de erro de envio.
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const avatarFallback = (sizeClass: string) => (
    <AvatarFallback
      className={cn(
        "bg-territory-brand font-semibold text-[hsl(var(--territory-on-image))]",
        sizeClass,
      )}
    >
      {(otherUserName ?? "?").charAt(0)}
    </AvatarFallback>
  );

  return (
    <div className="flex h-full flex-col bg-territory-canvas text-territory-ink">
      <div className="flex items-center justify-between border-b border-territory-border bg-territory-surface px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl p-2 text-territory-muted transition-colors hover:bg-territory-raised hover:text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-focus"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}

          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={otherUserAvatar} alt="" />
            {avatarFallback("text-sm")}
          </Avatar>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-territory-ink">
              {otherUserName}
            </p>
            {rideInfo ? (
              <p className="text-xs text-territory-muted">
                {rideInfo.status === RIDE_STATUS.IN_PROGRESS
                  ? "Em viagem"
                  : "Viagem aceita"}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onCall ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={onCall}
              className="h-9 w-9 p-0 text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
              aria-label="Ligar"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
          {onViewLocation ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={onViewLocation}
              className="h-9 w-9 p-0 text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
              aria-label="Ver localização"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            className="h-9 w-9 p-0 text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
            aria-label="Mais opções"
          >
            <MoreVertical className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {rideInfo ? (
        <div className="border-b border-territory-info/20 bg-territory-info/10 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2 text-xs text-territory-muted-strong">
            <MapPin className="h-3 w-3 shrink-0 text-territory-info" aria-hidden="true" />
            <span className="truncate">{rideInfo.origin}</span>
            <span className="shrink-0 text-territory-muted">para</span>
            <span className="truncate">{rideInfo.destination}</span>
          </div>
        </div>
      ) : null}

      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
        {loading ? (
          <div className="space-y-4" role="status" aria-label="Carregando mensagens">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-2",
                  index % 2 === 0 ? "justify-end" : "justify-start",
                )}
              >
                <Skeleton className="h-16 w-64 rounded-2xl bg-territory-raised" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-territory-raised">
              <Send className="h-8 w-8 text-territory-muted" aria-hidden="true" />
            </div>
            <p className="mb-1 text-sm font-semibold text-territory-ink">
              Nenhuma mensagem ainda
            </p>
            <p className="text-xs text-territory-muted">
              Envie a primeira mensagem para iniciar a conversa
            </p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {messages.map((message, index) => {
                const isOwn = message.sender_profile_id === activeProfile?.id;
                const showAvatar =
                  index === 0 ||
                  messages[index - 1].sender_profile_id !==
                    message.sender_profile_id;
                const showTime =
                  index === messages.length - 1 ||
                  messages[index + 1].sender_profile_id !==
                    message.sender_profile_id;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-2",
                      isOwn ? "justify-end" : "justify-start",
                    )}
                  >
                    {!isOwn && showAvatar ? (
                      <Avatar className="mt-auto h-8 w-8">
                        <AvatarImage src={otherUserAvatar} alt="" />
                        {avatarFallback("text-xs")}
                      </Avatar>
                    ) : null}
                    {!isOwn && !showAvatar ? <div className="w-8" /> : null}

                    <div
                      className={cn(
                        "flex flex-col",
                        isOwn ? "items-end" : "items-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[280px] break-words rounded-2xl px-4 py-2",
                          isOwn
                            ? "bg-territory-brand text-[hsl(var(--territory-on-image))]"
                            : "border border-territory-border bg-territory-surface text-territory-ink",
                        )}
                      >
                        <p className="text-sm">{message.message}</p>
                      </div>
                      {showTime ? (
                        <span className="mt-1 px-1 text-[10px] text-territory-muted">
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                          {isOwn && message.read_at ? " • Lida" : null}
                        </span>
                      ) : null}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </ScrollArea>

      <div className="border-t border-territory-border bg-territory-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            disabled={sending}
            className="h-11 flex-1 rounded-2xl border-territory-border bg-territory-canvas text-territory-ink placeholder:text-territory-muted focus-visible:ring-territory-focus"
          />
          <Button
            onClick={() => void handleSend()}
            disabled={!inputText.trim() || sending}
            className="h-11 w-11 rounded-2xl bg-territory-brand p-0 text-[hsl(var(--territory-on-image))] hover:bg-territory-brand-strong"
            aria-label="Enviar mensagem"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
