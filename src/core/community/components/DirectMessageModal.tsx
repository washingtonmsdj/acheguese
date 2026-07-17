import { useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Clock,
  Flag,
  MessageCircle,
  MoreVertical,
  Send,
  Shield,
  X,
} from "lucide-react";

import type { CommunityDirectMessage } from "@/core/messaging";
import { resolveMediaAssetSource } from "@/core/media";
import type { DirectMessageRecipientView } from "@/core/profiles/views/DirectMessageRecipientView";
import { useSessionContext } from "@/core/session";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { ptBR } from "@/shared/utils/dateLocale";
import { logger } from "@/shared/utils/logger";

type PostContextType =
  | "civic_report"
  | "discussao"
  | "alerta"
  | "recomendacao"
  | "enquete"
  | "pergunta"
  | "achados"
  | "favor"
  | "evento"
  | "desapego";

interface PostContext {
  id: string;
  title: string;
  imageUrl?: string;
  type: PostContextType;
}

interface DirectMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  postContext: PostContext;
  recipientProfile: DirectMessageRecipientView;
  currentProfileId: string;
  initialMessages?: CommunityDirectMessage[];
  onSendMessage?: (message: string) => Promise<boolean | void> | boolean | void;
  onReportConversation?: () => Promise<void> | void;
  onLoadOlderMessages?: () => Promise<void> | void;
  hasOlderMessages?: boolean;
  isLoadingOlderMessages?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatMessageTime(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), {
    addSuffix: true,
    locale: ptBR,
  });
}

function getPostBadgeLabel(type: PostContextType): string {
  switch (type) {
    case "civic_report":
      return "Zeladoria";
    case "desapego":
      return "Classificado";
    case "recomendacao":
      return "Recomendacao";
    case "alerta":
      return "Alerta";
    default:
      return "Comunidade";
  }
}

export function DirectMessageModal({
  isOpen,
  onClose,
  postContext,
  recipientProfile,
  currentProfileId: fallbackCurrentProfileId,
  initialMessages = [],
  onSendMessage,
  onReportConversation,
  onLoadOlderMessages,
  hasOlderMessages = false,
  isLoadingOlderMessages = false,
}: DirectMessageModalProps) {
  const { activeProfile } = useSessionContext();
  const currentProfileId = activeProfile?.id || fallbackCurrentProfileId || "";
  const postContextImage = resolveMediaAssetSource(
    postContext.imageUrl,
    "post_image",
  );
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages = useMemo(
    () =>
      [...initialMessages].sort((left, right) => {
        const timeDifference =
          new Date(left.created_at).getTime() -
          new Date(right.created_at).getTime();
        return timeDifference || left.id.localeCompare(right.id);
      }),
    [initialMessages],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSendMessage = async () => {
    const messageText = newMessage.trim();
    if (!messageText || isSending || !onSendMessage) return;

    setIsSending(true);
    try {
      const sent = await onSendMessage(messageText);
      if (sent !== false) setNewMessage("");
    } catch (error) {
      logger.error("Erro ao enviar mensagem:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="flex max-h-[90dvh] max-w-md flex-col border-gray-800 bg-gray-900 p-0">
        <DialogHeader className="shrink-0 border-b border-gray-800 bg-gray-900 p-4">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-lg font-semibold text-white">
              Mensagem direta
            </DialogTitle>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400"
                    type="button"
                    aria-label="Opcoes da conversa"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-gray-700 bg-gray-800"
                >
                  <DropdownMenuItem
                    onClick={() => void onReportConversation?.()}
                    className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Flag className="mr-2 h-4 w-4" />
                    Denunciar e bloquear
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-gray-400"
                type="button"
                aria-label="Fechar conversa"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogDescription className="sr-only">
            Envie uma mensagem privada ao autor desta publicacao da comunidade.
          </DialogDescription>

          <div className="mt-3 flex items-center gap-3 rounded-lg bg-gray-800/50 p-2">
            {postContextImage ? (
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-700">
                <img
                  src={postContextImage}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  width={40}
                  height={40}
                />
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">
                {postContext.title}
              </p>
              <Badge
                variant="secondary"
                className="mt-1 border-0 bg-teal-500/20 px-1.5 py-0 text-[10px] text-teal-200"
              >
                {getPostBadgeLabel(postContext.type)}
              </Badge>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <Avatar className="h-7 w-7 border border-gray-700">
              <AvatarImage src={recipientProfile.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-teal-600 text-xs text-white">
                {getInitials(recipientProfile.displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium text-white">
              {recipientProfile.displayName}
            </span>
            {recipientProfile.verified ? (
              <Shield className="h-3.5 w-3.5 shrink-0 text-teal-400" />
            ) : null}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          {hasOlderMessages ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isLoadingOlderMessages}
                onClick={() => void onLoadOlderMessages?.()}
                className="text-xs text-gray-400"
              >
                {isLoadingOlderMessages
                  ? "Carregando..."
                  : "Ver mensagens anteriores"}
              </Button>
            </div>
          ) : null}

          {messages.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <MessageCircle className="mx-auto mb-2 h-10 w-10 opacity-50" />
              <p className="text-xs">
                Inicie uma conversa sobre esta publicacao
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isMine = message.sender_profile_id === currentProfileId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                      isMine
                        ? "bg-teal-500 text-gray-950"
                        : "bg-gray-800 text-gray-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {message.is_removed
                        ? "Mensagem removida pela moderacao"
                        : message.body}
                    </p>
                    <div
                      className={`mt-1 flex items-center gap-1 text-[10px] ${
                        isMine ? "text-gray-800" : "text-gray-400"
                      }`}
                    >
                      <Clock className="h-2.5 w-2.5" />
                      <span>{formatMessageTime(message.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="shrink-0 border-t border-gray-800 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              placeholder="Digite sua mensagem..."
              className="h-10 min-w-0 flex-1 border-gray-700 bg-gray-800 text-white placeholder:text-gray-400"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSendMessage();
                }
              }}
              disabled={isSending}
              maxLength={4000}
              aria-label="Mensagem"
            />
            <Button
              onClick={() => void handleSendMessage()}
              disabled={!newMessage.trim() || isSending}
              className="h-10 w-10 shrink-0 bg-teal-500 p-0 text-gray-950 hover:bg-teal-400"
              type="button"
              aria-label="Enviar mensagem"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
