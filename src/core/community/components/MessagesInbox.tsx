import React, { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Clock,
  Filter,
  MessageCircle,
  Search,
  Shield,
} from "lucide-react";

import { ptBR } from "@/shared/utils/dateLocale";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import type { Message as DirectThreadMessage, ConversationPreview } from "@/core/messaging/types";
import type { DirectMessageRecipientView } from "@/core/profiles/views/DirectMessageRecipientView";

import { useDirectMessages } from "../hooks/useDirectMessages";
import { DirectMessageModal } from "./DirectMessageModal";

type ConversationTab = "all" | "unread" | "blocked";

interface MessagesInboxProps {
  currentUserId: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), {
    addSuffix: true,
    locale: ptBR,
  });
}

function buildRecipientProfile(conversation: ConversationPreview): DirectMessageRecipientView {
  return {
    id: conversation.seller_id,
    displayName: conversation.other_user_name || "Usuario",
    avatarUrl: conversation.other_user_avatar || null,
    verified: false,
  };
}

function getConversationBadge(conversation: ConversationPreview): string {
  if (conversation.status === "blocked") return "Bloqueada";
  if (conversation.unread_count > 0) return "Nao lida";
  return "Classificado";
}

function filterConversations(
  conversations: ConversationPreview[],
  searchTerm: string,
): ConversationPreview[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (!normalizedSearch) return conversations;

  return conversations.filter((conversation) => {
    const title = conversation.classified_title?.toLowerCase() ?? "";
    const userName = conversation.other_user_name?.toLowerCase() ?? "";
    const lastMessage = conversation.last_message_text?.toLowerCase() ?? "";

    return (
      title.includes(normalizedSearch) ||
      userName.includes(normalizedSearch) ||
      lastMessage.includes(normalizedSearch)
    );
  });
}

function categorizeConversations(conversations: ConversationPreview[]) {
  return {
    all: conversations,
    unread: conversations.filter((conversation) => conversation.unread_count > 0),
    blocked: conversations.filter((conversation) => conversation.status === "blocked"),
  };
}

function ConversationList({
  conversations,
  onOpenConversation,
}: {
  conversations: ConversationPreview[];
  onOpenConversation: (conversation: ConversationPreview) => void;
}) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
        <MessageCircle className="mb-3 h-12 w-12 opacity-50" />
        <p className="text-sm">Nenhuma conversa encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const badgeLabel = getConversationBadge(conversation);

        return (
          <Card
            key={conversation.id}
            className="cursor-pointer border-gray-800 bg-gray-900 transition-colors hover:bg-gray-800/50"
            onClick={() => onOpenConversation(conversation)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12 border border-gray-700">
                    <AvatarImage src={conversation.other_user_avatar || undefined} />
                    <AvatarFallback className="bg-orange-500 text-white">
                      {getInitials(conversation.other_user_name || "Usuario")}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.unread_count > 0 ? (
                    <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 p-0 text-xs text-white">
                      {conversation.unread_count}
                    </Badge>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-white">
                      {conversation.other_user_name || "Usuario"}
                    </span>
                    {conversation.status !== "blocked" ? (
                      <Shield className="h-4 w-4 text-blue-400" />
                    ) : null}
                  </div>

                  <p className="mb-2 truncate text-sm text-gray-300">
                    {conversation.classified_title || "Conversa de classificado"}
                  </p>

                  <div className="flex items-center justify-between gap-3">
                    <Badge
                      variant="secondary"
                      className="border-0 bg-orange-500/20 text-xs text-orange-300"
                    >
                      {badgeLabel}
                    </Badge>

                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(conversation.last_message_at)}</span>
                    </div>
                  </div>

                  {conversation.last_message_text ? (
                    <p className="mt-2 truncate text-xs text-gray-400">
                      {conversation.last_message_text}
                    </p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function MessagesInbox({ currentUserId }: MessagesInboxProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<ConversationTab>("all");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    conversations,
    messages,
    isLoading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    reportConversation,
  } = useDirectMessages(currentUserId);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  const filteredConversations = useMemo(
    () => filterConversations(conversations, searchTerm),
    [conversations, searchTerm],
  );
  const conversationBuckets = useMemo(
    () => categorizeConversations(filteredConversations),
    [filteredConversations],
  );
  const selectedConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === selectedConversationId) ??
      null,
    [conversations, selectedConversationId],
  );
  const recipientProfile = selectedConversation
    ? buildRecipientProfile(selectedConversation)
    : null;

  const handleConversationClick = async (conversation: ConversationPreview) => {
    setSelectedConversationId(conversation.id);
    await fetchMessages(conversation.id);
    setIsModalOpen(true);
  };

  const handleSendMessage = async (
    messageText: string,
    messageType?: "text" | "location",
  ) => {
    if (!selectedConversationId) return;
    await sendMessage(selectedConversationId, messageText, messageType);
  };

  const handleReportConversation = async () => {
    if (!selectedConversationId || !recipientProfile) return;

    await reportConversation(
      selectedConversationId,
      recipientProfile.id,
      "inappropriate_content",
      "Conteudo inapropriado reportado pelo usuario.",
    );
    setIsModalOpen(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedConversationId(null);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <Card className="border-gray-800 bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
            <MessageCircle className="h-6 w-6 text-orange-500" />
            Mensagens
          </CardTitle>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="border-gray-700 bg-gray-800 pl-10 text-white placeholder-gray-400"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-300"
              type="button"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-gray-400">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              <p>Carregando conversas...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-400">
              <p>Erro ao carregar conversas: {error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchConversations()}
                className="mt-3 border-red-400 text-red-400"
                type="button"
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as ConversationTab)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                <TabsTrigger
                  value="all"
                  className="text-gray-300 data-[state=active]:text-white"
                >
                  Todas ({conversationBuckets.all.length})
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="text-gray-300 data-[state=active]:text-white"
                >
                  Nao lidas ({conversationBuckets.unread.length})
                </TabsTrigger>
                <TabsTrigger
                  value="blocked"
                  className="text-gray-300 data-[state=active]:text-white"
                >
                  Bloqueadas ({conversationBuckets.blocked.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <ConversationList
                  conversations={conversationBuckets.all}
                  onOpenConversation={handleConversationClick}
                />
              </TabsContent>

              <TabsContent value="unread" className="mt-6">
                <ConversationList
                  conversations={conversationBuckets.unread}
                  onOpenConversation={handleConversationClick}
                />
              </TabsContent>

              <TabsContent value="blocked" className="mt-6">
                <ConversationList
                  conversations={conversationBuckets.blocked}
                  onOpenConversation={handleConversationClick}
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {selectedConversation && recipientProfile ? (
        <DirectMessageModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          postContext={{
            id: selectedConversation.classified_id,
            title: selectedConversation.classified_title || "Conversa de classificado",
            imageUrl: selectedConversation.classified_photo || undefined,
            type: "desapego",
          }}
          recipientProfile={recipientProfile}
          currentUserId={currentUserId}
          initialMessages={messages}
          onSendMessage={handleSendMessage}
          onReportConversation={handleReportConversation}
        />
      ) : null}
    </div>
  );
}
