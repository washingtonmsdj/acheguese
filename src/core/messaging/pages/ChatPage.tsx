import React from "react";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useSessionContext } from "@/core/session";
import {
  ArrowLeft,
  Send,
  Flag,
  ShieldAlert,
  MoreVertical,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { useToast } from "@/shared/hooks/use-toast";
import { ALERT_STATUS } from "@/shared/types/constants";
import { classifiedMessagingService } from "@/core/messaging";
import type {
  ClassifiedConversationWithDetails,
  ClassifiedMessage,
} from "@/core/messaging/types";

/**
 * ✅ SSOT COMPLIANT - ChatPage migrado
 * Usa ClassifiedMessagingService como fonte unica do agregado de Classificados.
 */

export default function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { activeProfile } = useSessionContext();
  const { toast } = useToast();
  const [conversation, setConversation] =
    useState<ClassifiedConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<ClassifiedMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load conversation and messages
  useEffect(() => {
    if (!user || !activeProfile?.id || !conversationId) return;

    async function load() {
      // SSOT: conversa de Classificados via ClassifiedMessagingService.
      const conv = await classifiedMessagingService.getConversationWithDetails(
        conversationId!,
        activeProfile.id,
      );

      if (!conv) {
        navigate("/mensagens");
        return;
      }

      setConversation(conv);

      // SSOT: mensagens de Classificados via ClassifiedMessagingService.
      const msgs = await classifiedMessagingService.listMessages(
        conversationId!,
      );
      setMessages(msgs);
      setLoading(false);

      // SSOT: leitura de Classificados via ClassifiedMessagingService.
      if (msgs.length > 0) {
        await classifiedMessagingService.markMessagesAsRead(conversationId!);
      }
    }

    load();
  }, [activeProfile?.id, user, conversationId, navigate]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = classifiedMessagingService.subscribeToConversationMessages(
      conversationId,
      (newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        // Auto-mark as read if from other user
        if (activeProfile && newMsg.sender_profile_id !== activeProfile.id) {
          classifiedMessagingService.markMessagesAsRead(conversationId);
        }
      },
    );

    return () => {
      classifiedMessagingService.unsubscribeChannel(channel);
    };
  }, [activeProfile, conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeProfile || !conversation || sending)
      return;
    if (conversation.status !== ALERT_STATUS.ACTIVE) {
      toast({
        title: "Conversa bloqueada",
        description: "Não é possível enviar mensagens nesta conversa.",
        variant: "destructive",
      });
      return;
    }

    const text = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      // SSOT: envio de Classificados via ClassifiedMessagingService.
      await classifiedMessagingService.sendMessage({
        conversation_id: conversation.id,
        text,
      });
    } catch (error) {
      setNewMessage(text);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    }

    setSending(false);
    inputRef.current?.focus();
  };

  const handleReport = async () => {
    if (!reportMessageId || !activeProfile) return;

    try {
      // SSOT: incidente delegado pelo adapter de Classificados.
      await classifiedMessagingService.reportMessage(
        reportMessageId,
        "inappropriate_content",
        "Conteúdo inadequado",
      );
      toast({
        title: "Denúncia enviada",
        description: "Nossa equipe vai analisar a mensagem.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a denúncia.",
        variant: "destructive",
      });
    }

    setReportDialogOpen(false);
    setReportMessageId(null);
  };

  const handleBlock = async () => {
    if (!conversation || !activeProfile) return;

    try {
      // SSOT: bloqueio de conversa de Classificados no backend.
      await classifiedMessagingService.blockConversation(
        conversation.id,
        "user_blocked",
      );

      setConversation((prev) => (prev ? { ...prev, status: "blocked" } : null));
      toast({
        title: "Usuário bloqueado",
        description: "Você não receberá mais mensagens desta conversa.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível bloquear o usuário.",
        variant: "destructive",
      });
    }

    setBlockDialogOpen(false);
  };

  if (authLoading || loading)
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                "h-10 rounded-2xl",
                i % 2 === 0 ? "w-2/3" : "w-1/2 ml-auto",
              )}
            />
          ))}
        </div>
      </div>
    );

  if (!user || !activeProfile) {
    navigate("/login");
    return null;
  }

  if (!conversation) return null;

  const isBlocked = conversation.status === "blocked";
  const handleOpenClassified = () => {
    if (conversation.classified_public_url) {
      navigate(conversation.classified_public_url);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b bg-card shrink-0">
        <button
          onClick={() => navigate("/mensagens")}
          className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Classified mini card */}
        <div
          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
          onClick={handleOpenClassified}
        >
          <div className="h-10 w-10 rounded-lg bg-secondary overflow-hidden shrink-0">
            {conversation.classified_photo ? (
              <img
                src={conversation.classified_photo}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-lg">
                📦
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {conversation.other_user_name}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {conversation.classified_title} · R${" "}
              {conversation.classified_price?.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={!conversation.classified_public_url}
              onClick={handleOpenClassified}
            >
              Ver anúncio
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setBlockDialogOpen(true)}
              className="text-destructive"
            >
              <ShieldAlert className="h-4 w-4 mr-2" />
              Bloquear usuário
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Safety banner */}
      <div className="px-4 py-2 bg-warning/5 border-b border-warning/20">
        <p className="text-[10px] text-center text-muted-foreground">
          🔒 Negocie pelo chat. Não compartilhe dados pessoais. Encontre-se em
          locais públicos.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Send className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-semibold">Início da conversa</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
              Envie uma mensagem sobre "{conversation.classified_title}"
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isMine = msg.sender_profile_id === activeProfile.id;
            const showTime =
              i === 0 ||
              new Date(msg.created_at).getTime() -
                new Date(messages[i - 1].created_at).getTime() >
                300000;

            return (
              <div key={msg.id}>
                {showTime && (
                  <p className="text-[10px] text-muted-foreground text-center my-2">
                    {formatMessageTime(msg.created_at)}
                  </p>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex mb-0.5",
                    isMine ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "group relative max-w-[80%] px-3.5 py-2 rounded-2xl text-sm",
                      isMine
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-foreground rounded-bl-md",
                    )}
                  >
                    <p className="leading-relaxed break-words">{msg.text}</p>
                    <div
                      className={cn(
                        "flex items-center gap-1 mt-0.5",
                        isMine ? "justify-end" : "justify-start",
                      )}
                    >
                      <span
                        className={cn(
                          "text-[9px]",
                          isMine
                            ? "text-primary-foreground/60"
                            : "text-muted-foreground",
                        )}
                      >
                        {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isMine && msg.read_at && (
                        <span className="text-[9px] text-primary-foreground/60">
                          ✓✓
                        </span>
                      )}
                    </div>

                    {/* Report button (only for other user's messages) */}
                    {!isMine && (
                      <button
                        onClick={() => {
                          setReportMessageId(msg.id);
                          setReportDialogOpen(true);
                        }}
                        className="absolute -right-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 h-5 w-5 rounded-full bg-muted flex items-center justify-center transition-opacity"
                      >
                        <Flag className="h-3 w-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {isBlocked ? (
        <div className="px-4 py-4 border-t bg-destructive/5 text-center">
          <p className="text-sm text-destructive font-medium">
            🚫 Conversa bloqueada
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Não é possível enviar mensagens
          </p>
        </div>
      ) : (
        <div className="px-3 py-2.5 border-t bg-card shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 rounded-full h-10 text-sm border-2 focus:border-primary/40"
              disabled={sending}
              autoComplete="off"
            />
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 rounded-full shrink-0"
                disabled={!newMessage.trim() || sending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </motion.div>
          </form>
        </div>
      )}

      {/* Report dialog */}
      <AlertDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Denunciar mensagem</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja denunciar esta mensagem? Nossa equipe irá
              analisar o conteúdo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReport}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Denunciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block dialog */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquear usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Ao bloquear, nenhum dos dois poderá send mensagens nesta conversa.
              O administrador poderá revisar o caso se necessário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Bloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0)
    return `Hoje, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays === 1)
    return `Ontem, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
