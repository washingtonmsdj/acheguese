// @ts-nocheck
import React, { useState, useRef, useEffect } from "react";
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
import { Send, ArrowLeft, MoreVertical, Phone, MapPin } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { RIDE_STATUS } from "@/shared/types/constants";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChatWindowProps {
  conversationId: string;
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
  conversationId,
  otherUserName,
  otherUserAvatar,
  rideInfo,
  onBack,
  onCall,
  onViewLocation,
}: ChatWindowProps) {
  const { activeProfile } = useSessionContext();
  const { messages, loading, sending, sendMessage, markAsRead, markAllAsRead } =
    useMobilidadeChat();

  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Marcar todas como lidas ao abrir
  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  // Enviar mensagem
  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    try {
      await sendMessage(inputText);
      setInputText("");
      inputRef.current?.focus();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  // Enter para enviar
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#12181B]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#1E2529]">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUserAvatar} />
            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
              {(otherUserName ?? '?').charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div>
            <p className="text-sm font-semibold text-white">{otherUserName}</p>
            {rideInfo && (
              <p className="text-xs text-gray-400">
                {rideInfo.status === RIDE_STATUS.IN_PROGRESS
                  ? "🚗 Em viagem"
                  : "✅ Viagem aceita"}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onCall && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onCall}
              className="h-9 w-9 p-0 text-gray-400 hover:text-white"
            >
              <Phone className="h-4 w-4" />
            </Button>
          )}
          {onViewLocation && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onViewLocation}
              className="h-9 w-9 p-0 text-gray-400 hover:text-white"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-9 w-9 p-0 text-gray-400 hover:text-white"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Ride Info */}
      {rideInfo && (
        <div className="px-4 py-3 bg-teal-500/10 border-b border-teal-500/20">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <MapPin className="h-3 w-3 text-teal-400" />
            <span className="truncate">{rideInfo.origin}</span>
            <span className="text-gray-600">→</span>
            <span className="truncate">{rideInfo.destination}</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2",
                  i % 2 === 0 ? "justify-end" : "justify-start",
                )}
              >
                <Skeleton className="h-16 w-64 rounded-2xl bg-white/5" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Send className="h-8 w-8 text-gray-600" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">
              Nenhuma mensagem ainda
            </p>
            <p className="text-xs text-gray-500">
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
                    {!isOwn && showAvatar && (
                      <Avatar className="h-8 w-8 mt-auto">
                        <AvatarImage src={otherUserAvatar} />
                        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white text-xs">
                          {(otherUserName ?? '?').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {!isOwn && !showAvatar && <div className="w-8" />}

                    <div
                      className={cn(
                        "flex flex-col",
                        isOwn ? "items-end" : "items-start",
                      )}
                    >
                      <div
                        className={cn(
                          "px-4 py-2 rounded-2xl max-w-[280px] break-words",
                          isOwn
                            ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                            : "bg-white/10 text-gray-100",
                        )}
                      >
                        <p className="text-sm">{message.message}</p>
                      </div>
                      {showTime && (
                        <span className="text-[10px] text-gray-500 mt-1 px-1">
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                          {isOwn && message.read && " • Lida"}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/10 bg-[#1E2529]">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            disabled={sending}
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-2xl h-11"
          />
          <Button
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className="h-11 w-11 p-0 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
