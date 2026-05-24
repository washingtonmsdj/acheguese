import React from "react";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import {
  Send,
  MapPin,
  MoreVertical,
  Flag,
  X,
  Shield,
  Clock,
  MessageCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { logger } from "@/shared/utils/logger";
import { useSessionContext } from "@/core/session";
import { GeolocationService } from "@/core/maps/services/GeolocationService";
import type { DirectMessageRecipientView } from "@/core/profiles/views/DirectMessageRecipientView";

interface PostContext {
  id: string;
  title: string;
  imageUrl?: string;
  type:
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
}

interface DirectMessage {
  id: string;
  sender_profile_id: string;
  message_text: string;
  message_type: "text" | "location";
  location_date?: {
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
  onSendMessage?: (
    message: string,
    type?: "text" | "location",
  ) => Promise<void> | void;
  onReportConversation?: () => void;
}
export function DirectMessageModal({
  isOpen,
  onClose,
  postContext,
  recipientProfile,
  currentUserId: _currentUserId,
  onSendMessage,
  onReportConversation,
}: DirectMessageModalProps) {
  const { activeProfile } = useSessionContext();
  const currentProfileId = activeProfile?.id || _currentUserId || "";
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    try {
      // Adicionar mensagem localmente para feedback imediato
      const tempMessage: DirectMessage = {
        id: `temp-${Date.now()}`,
        sender_profile_id: currentProfileId,
        message_text: newMessage,
        message_type: "text",
        created_at: new Date().toISOString(),
        sender_profile: {
          id: currentProfileId,
          displayName: "Você",
          avatarUrl: null,
          verified: false,
        },
      };

      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage("");

      // Chamar callback para send mensagem real
      await onSendMessage?.(newMessage, "text");
    } catch (error) {
      logger.error("Error send mensagem:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareLocation = async () => {
    setIsLoading(true);
    try {
      const result = await GeolocationService.getCurrentLocation({ useCache: true });
      const locationData = {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        address: "Localização compartilhada",
      };

      const tempMessage: DirectMessage = {
        id: `temp-location-${Date.now()}`,
        sender_profile_id: currentProfileId,
        message_text: "Compartilhou localização",
        message_type: "location",
        location_date: locationData,
        created_at: new Date().toISOString(),
        sender_profile: { id: currentProfileId, displayName: "Você", avatarUrl: null, verified: false },
      };

      setMessages((prev) => [...prev, tempMessage]);
      await onSendMessage?.("Localização compartilhada", "location");
    } catch (error) {
      logger.error("Erro ao compartilhar localização:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatMessageTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ptBR,
    });
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md max-h-[90vh] p-0 bg-gray-900 border-gray-800 flex flex-col"
        aria-describedby="dialog-description"
      >
        {/* Header Fixo com Contexto do Post */}
        <DialogHeader className="flex-shrink-0 bg-gray-900 border-b border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-white">
              Mensagem Direta
            </DialogTitle>
            <span id="dialog-description" className="sr-only">
              Conteúdo do diálogo
            </span>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-gray-800 border-gray-700"
                >
                  <DropdownMenuItem
                    onClick={onReportConversation}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Denunciar Conversa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-gray-400"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Contexto do Post - Compacto */}
          <div className="flex items-center gap-3 mt-3 p-2 bg-gray-800/50 rounded-lg">
            {postContext.imageUrl && (
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                <img
                  src={postContext.imageUrl}
                  alt="Post"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {postContext.title}
              </p>
              <Badge
                variant="secondary"
                className="text-[6px] mt-0.5 bg-red-500/30 text-red-300 border-0 px-0.5 py-0"
              >
                Teste
              </Badge>
            </div>
          </div>

          {/* Info do Destinatário - Compacto */}
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="h-7 w-7 border border-gray-700">
              <AvatarImage src={recipientProfile.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-orange-500 text-white text-xs">
                {getInitials(recipientProfile.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">
                {recipientProfile.displayName}
              </span>
              {recipientProfile.verified && (
                <Shield className="w-3 h-3 text-blue-400" />
              )}
            </div>
          </div>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Envie uma mensagem direta para este usuário
        </DialogDescription>

        {/* Área de Mensagens - Flexível */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Inicie uma conversa sobre este post</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_profile_id === currentProfileId ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex items-start gap-2 max-w-[85%] ${
                    message.sender_profile_id === currentProfileId
                      ? "flex-row-reverse"
                      : "flex-row"
                  }`}
                >
                  <Avatar className="h-5 w-5 border border-gray-700 flex-shrink-0">
                    <AvatarImage src={message.sender_profile?.avatarUrl ?? undefined} />
                    <AvatarFallback className="bg-gray-600 text-white text-[10px]">
                      {getInitials(message.sender_profile?.displayName || "U")}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={`rounded-2xl px-3 py-2 ${
                      message.sender_profile_id === currentProfileId
                        ? "bg-orange-500 text-white"
                        : "bg-gray-800 text-gray-100"
                    }`}
                  >
                    {message.message_type === "location" ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span className="text-xs">
                          Localização compartilhada
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">
                        {message.message_text}
                      </p>
                    )}

                    <div
                      className={`flex items-center gap-1 mt-1 text-[10px] ${
                        message.sender_profile_id === currentProfileId
                          ? "text-orange-100"
                          : "text-gray-400"
                      }`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatMessageTime(message.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de Mensagem - Fixo */}
        <div className="flex-shrink-0 border-t border-gray-800 p-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShareLocation}
              disabled={isLoading}
              className="h-9 w-9 p-0 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 flex-shrink-0"
            >
              <MapPin className="w-4 h-4" />
            </Button>

            <div className="flex-1 flex items-center gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 h-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
              />

              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isLoading}
                className="h-9 w-9 p-0 bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
