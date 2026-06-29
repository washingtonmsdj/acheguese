import React, { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Clock,
  Flag,
  MapPin,
  MessageCircle,
  MoreVertical,
  Send,
  Shield,
  X,
} from "lucide-react";

import { ptBR } from "@/shared/utils/dateLocale";
import { logger } from "@/shared/utils/logger";
import { useSessionContext } from "@/core/session";
import { GeolocationService } from "@/core/maps/services/GeolocationService";
import type { Message as DirectThreadMessage } from "@/core/messaging/types";
import type { DirectMessageRecipientView } from "@/core/profiles/views/DirectMessageRecipientView";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
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

interface DirectMessage {
  id: string;
  sender_profile_id: string;
  message_text: string;
  message_type: "text" | "location";
  location_data?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  created_at: string;
  sender_profile?: DirectMessageRecipientView;
}

interface DirectMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  postContext: PostContext;
  recipientProfile: DirectMessageRecipientView;
  currentUserId: string;
  initialMessages?: DirectThreadMessage[];
  onSendMessage?: (
    message: string,
    type?: "text" | "location",
  ) => Promise<void> | void;
  onReportConversation?: () => void;
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
  currentUserId: fallbackCurrentUserId,
  initialMessages = [],
  onSendMessage,
  onReportConversation,
}: DirectMessageModalProps) {
  const { activeProfile } = useSessionContext();
  const currentProfileId = activeProfile?.id || fallbackCurrentUserId || "";
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mappedMessages: DirectMessage[] = initialMessages.map((message) => {
      const isMine = message.sender_profile_id === currentProfileId;
      return {
        id: message.id,
        sender_profile_id: message.sender_profile_id,
        message_text: message.text,
        message_type: "text",
        created_at: message.created_at,
        sender_profile: isMine
          ? {
              id: currentProfileId,
              displayName:
                activeProfile?.displayName ?? activeProfile?.name ?? "Voce",
              avatarUrl: activeProfile?.avatarUrl ?? null,
              verified: false,
            }
          : recipientProfile,
      };
    });
    setMessages(mappedMessages);
  }, [
    activeProfile?.avatarUrl,
    activeProfile?.displayName,
    activeProfile?.name,
    currentProfileId,
    initialMessages,
    recipientProfile,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    const messageText = newMessage.trim();
    setIsLoading(true);
    try {
      const tempMessage: DirectMessage = {
        id: `temp-${Date.now()}`,
        sender_profile_id: currentProfileId,
        message_text: messageText,
        message_type: "text",
        created_at: new Date().toISOString(),
        sender_profile: {
          id: currentProfileId,
          displayName:
            activeProfile?.displayName ?? activeProfile?.name ?? "Voce",
          avatarUrl: activeProfile?.avatarUrl ?? null,
          verified: false,
        },
      };

      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage("");
      await onSendMessage?.(messageText, "text");
    } catch (error) {
      logger.error("Erro ao enviar mensagem:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareLocation = async () => {
    setIsLoading(true);
    try {
      const result = await GeolocationService.getCurrentLocation({
        useCache: true,
      });
      const locationData = {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        address: "Localizacao compartilhada",
      };

      const tempMessage: DirectMessage = {
        id: `temp-location-${Date.now()}`,
        sender_profile_id: currentProfileId,
        message_text: "Compartilhou localizacao",
        message_type: "location",
        location_data: locationData,
        created_at: new Date().toISOString(),
        sender_profile: {
          id: currentProfileId,
          displayName:
            activeProfile?.displayName ?? activeProfile?.name ?? "Voce",
          avatarUrl: activeProfile?.avatarUrl ?? null,
          verified: false,
        },
      };

      setMessages((prev) => [...prev, tempMessage]);
      await onSendMessage?.("Localizacao compartilhada", "location");
    } catch (error) {
      logger.error("Erro ao compartilhar localizacao:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex max-h-[90vh] max-w-md flex-col border-gray-800 bg-gray-900 p-0"
        aria-describedby="dialog-description"
      >
        <DialogHeader className="shrink-0 border-b border-gray-800 bg-gray-900 p-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-white">
              Mensagem direta
            </DialogTitle>
            <span id="dialog-description" className="sr-only">
              Conteudo do dialogo
            </span>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400"
                    type="button"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-gray-700 bg-gray-800"
                >
                  <DropdownMenuItem
                    onClick={onReportConversation}
                    className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Flag className="mr-2 h-4 w-4" />
                    Denunciar conversa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-gray-400"
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-lg bg-gray-800/50 p-2">
            {postContext.imageUrl ? (
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-700">
                <img
                  src={postContext.imageUrl}
                  alt="Contexto da conversa"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">
                {postContext.title}
              </p>
              <Badge
                variant="secondary"
                className="mt-1 border-0 bg-red-500/30 px-1.5 py-0 text-[10px] text-red-300"
              >
                {getPostBadgeLabel(postContext.type)}
              </Badge>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <Avatar className="h-7 w-7 border border-gray-700">
              <AvatarImage src={recipientProfile.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-orange-500 text-xs text-white">
                {getInitials(recipientProfile.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">
                {recipientProfile.displayName}
              </span>
              {recipientProfile.verified ? (
                <Shield className="h-3 w-3 text-blue-400" />
              ) : null}
            </div>
          </div>
        </DialogHeader>

        <DialogDescription className="sr-only">
          Envie uma mensagem direta para este usuario
        </DialogDescription>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          {messages.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <MessageCircle className="mx-auto mb-2 h-10 w-10 opacity-50" />
              <p className="text-xs">Inicie uma conversa sobre este anuncio</p>
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
                    className={`flex max-w-[85%] items-start gap-2 ${
                      isMine ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <Avatar className="h-5 w-5 shrink-0 border border-gray-700">
                      <AvatarImage
                        src={message.sender_profile?.avatarUrl ?? undefined}
                      />
                      <AvatarFallback className="bg-gray-600 text-[10px] text-white">
                        {getInitials(message.sender_profile?.displayName || "U")}
                      </AvatarFallback>
                    </Avatar>

                    <div
                      className={`rounded-2xl px-3 py-2 ${
                        isMine
                          ? "bg-orange-500 text-white"
                          : "bg-gray-800 text-gray-100"
                      }`}
                    >
                      {message.message_type === "location" ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs">
                            {message.location_data?.address ||
                              "Localizacao compartilhada"}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">
                          {message.message_text}
                        </p>
                      )}

                      <div
                        className={`mt-1 flex items-center gap-1 text-[10px] ${
                          isMine ? "text-orange-100" : "text-gray-400"
                        }`}
                      >
                        <Clock className="h-2.5 w-2.5" />
                        <span>{formatMessageTime(message.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="shrink-0 border-t border-gray-800 p-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShareLocation}
              disabled={isLoading}
              className="h-9 w-9 shrink-0 p-0 text-gray-400 hover:bg-blue-500/10 hover:text-blue-400"
              type="button"
            >
              <MapPin className="h-4 w-4" />
            </Button>

            <div className="flex flex-1 items-center gap-2">
              <Input
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                placeholder="Digite sua mensagem..."
                className="h-9 border-gray-700 bg-gray-800 text-white placeholder-gray-400"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSendMessage();
                  }
                }}
                disabled={isLoading}
              />

              <Button
                onClick={() => void handleSendMessage()}
                disabled={!newMessage.trim() || isLoading}
                className="h-9 w-9 shrink-0 bg-orange-500 p-0 text-white hover:bg-orange-600"
                type="button"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
