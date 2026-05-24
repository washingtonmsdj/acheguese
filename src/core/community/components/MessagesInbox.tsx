/* eslint-disable */
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { MessageCircle, Search, Filter, Clock, Shield } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDirectMessages } from "../hooks/useDirectMessages";
import { DirectMessageModal } from "./DirectMessageModal";

interface Conversation {
  id: string;
  post_id: string;
  post_type: string;
  post_title: string;
  post_image_url?: string;
  creator_profile_id: string;
  participant_id: string;
  last_message_at: string;
  is_active: boolean;
  creator_profile?: {
    id: string;
    name: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
  participant_profile?: {
    id: string;
    name: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
  unread_count?: number;
}

type DirectMessagePostType =
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

function toDirectMessagePostType(postType?: string): DirectMessagePostType {
  const allowed: DirectMessagePostType[] = [
    "civic_report",
    "discussao",
    "alerta",
    "recomendacao",
    "enquete",
    "pergunta",
    "achados",
    "favor",
    "evento",
    "desapego",
  ];
  return postType && allowed.includes(postType as DirectMessagePostType)
    ? (postType as DirectMessagePostType)
    : "civic_report";
}

interface MessagesInboxProps {
  currentUserId: string;
}

export function MessagesInbox({ currentUserId }: MessagesInboxProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dm = useDirectMessages(currentUserId) as any;
  const conversations = (dm.conversations ?? []) as Conversation[];
  const messages = dm.messages;
  const isLoading = dm.isLoading as boolean;
  const error = dm.error as string | null;
  const fetchConversations = dm.fetchConversations as () => Promise<void>;
  const fetchMessages = dm.fetchMessages as (conversationId: string) => Promise<void>;
  const sendMessage = dm.sendMessage as (
    conversationId: string,
    messageText: string,
    messageType?: "text" | "location",
  ) => Promise<void>;
  const reportConversation = dm.reportConversation as (
    conversationId: string,
    profileId: string,
    reason: string,
    description?: string,
  ) => Promise<void>;

  useEffect(() => {
    fetchConversations();
  }, [currentUserId]);

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.creator_profile_id === currentUserId
      ? conversation.participant_profile
      : conversation.creator_profile;
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ptBR,
    });
  };

  const filteredConversations = conversations.filter((conversation) => {
    const otherParticipant = getOtherParticipant(conversation);
    const searchLower = searchTerm.toLowerCase();

    return (
      conversation.post_title.toLowerCase().includes(searchLower) ||
      otherParticipant?.name.toLowerCase().includes(searchLower)
    );
  });

  const categorizeConversations = () => {
    return {
      pedidos: filteredConversations.filter(
        (c) => c.post_type === "civic_report",
      ),
      achados: filteredConversations.filter((c) => c.post_type === "achado"),
      geral: filteredConversations.filter(
        (c) => !["civic_report", "achado"].includes(c.post_type),
      ),
    };
  };

  const { pedidos, achados, geral } = categorizeConversations();
  const handleConversationClick = async (conversation: Conversation) => {
    setSelectedConversation(conversation.id);
    await fetchMessages(conversation.id);
    setIsModalOpen(true);
  };

  const handleSendMessage = async (
    messageText: string,
    messageType?: "text" | "location",
  ) => {
    if (!selectedConversation) return;

    await sendMessage(selectedConversation, messageText, messageType);
  };

  const handleReportConversation = async () => {
    if (!selectedConversation) return;

    const conversation = conversations.find(
      (c) => c.id === selectedConversation,
    );
    if (!conversation) return;

    const otherParticipant = getOtherParticipant(conversation);
    if (!otherParticipant) return;

    await reportConversation(
      selectedConversation,
      otherParticipant.id,
      "inappropriate_content",
      "Conteúdo inapropriado reportado pelo usuário",
    );

    setIsModalOpen(false);
  };

  const ConversationList = ({
    conversations,
  }: {
    conversations: Conversation[];
  }) => (
    <div className="space-y-2">
      {conversations.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhuma conversa encontrada</p>
        </div>
      ) : (
        conversations.map((conversation) => {
          const otherParticipant = getOtherParticipant(conversation);

          return (
            <Card
              key={conversation.id}
              className="cursor-pointer hover:bg-gray-800/50 transition-colors bg-gray-900 border-gray-800"
              onClick={() => handleConversationClick(conversation)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12 border border-gray-700">
                      <AvatarImage src={otherParticipant?.avatar_url} />
                      <AvatarFallback className="bg-orange-500 text-white">
                        {getInitials(otherParticipant?.name)}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.unread_count &&
                      conversation.unread_count > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-500 text-white text-xs flex items-center justify-center">
                          {conversation.unread_count}
                        </Badge>
                      )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">
                        {otherParticipant?.name || "Usuário"}
                      </span>
                      {otherParticipant?.is_verified && (
                        <Shield className="w-4 h-4 text-blue-400" />
                      )}
                    </div>

                    <p className="text-sm text-gray-300 truncate mb-2">
                      {conversation.post_title}
                    </p>

                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className="text-xs bg-orange-500/20 text-orange-400 border-0"
                      >
                        {conversation.post_type === "civic_report"
                          ? "Zeladoria"
                          : conversation.post_type === "achado"
                            ? "Achado"
                            : conversation.post_type === "recomendacao"
                              ? "Recomendação"
                              : "Alerta"}
                      </Badge>

                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(conversation.last_message_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-orange-500" />
            Mensagens
          </CardTitle>

          {/* Barra de Pesquisa */}
          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-300"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p>Loading conversas...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">
              <p>Error load conversas: {error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchConversations}
                className="mt-3 border-red-400 text-red-400"
              >
                Tentar Novamente
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="todos" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800">
                <TabsTrigger
                  value="todos"
                  className="text-gray-300 date-[state=active]:text-white"
                >
                  Todos ({conversations.length})
                </TabsTrigger>
                <TabsTrigger
                  value="pedidos"
                  className="text-gray-300 date-[state=active]:text-white"
                >
                  Pedidos ({pedidos.length})
                </TabsTrigger>
                <TabsTrigger
                  value="achados"
                  className="text-gray-300 date-[state=active]:text-white"
                >
                  Achados ({achados.length})
                </TabsTrigger>
                <TabsTrigger
                  value="geral"
                  className="text-gray-300 date-[state=active]:text-white"
                >
                  Geral ({geral.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="todos" className="mt-6">
                <ConversationList conversations={filteredConversations} />
              </TabsContent>

              <TabsContent value="pedidos" className="mt-6">
                <ConversationList conversations={pedidos} />
              </TabsContent>

              <TabsContent value="achados" className="mt-6">
                <ConversationList conversations={achados} />
              </TabsContent>

              <TabsContent value="geral" className="mt-6">
                <ConversationList conversations={geral} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Modal de Mensagem Direta */}
      {selectedConversation && (
        <DirectMessageModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedConversation(null);
          }}
          postContext={{
            id:
              conversations.find((c) => c.id === selectedConversation)
                ?.post_id || "",
            title:
              conversations.find((c) => c.id === selectedConversation)
                ?.post_title || "",
            imageUrl: conversations.find((c) => c.id === selectedConversation)
              ?.post_image_url,
            type: toDirectMessagePostType(
              conversations.find((c) => c.id === selectedConversation)?.post_type,
            ),
          }}
          recipientProfile={(() => {
            const recipient =
              getOtherParticipant(
                conversations.find((c) => c.id === selectedConversation)!,
              ) || {
                id: "",
                name: "Usuario",
              };
            return {
              id: recipient.id,
              displayName: recipient.name ?? "Usuario",
              avatarUrl: recipient.avatar_url ?? null,
              verified: Boolean(recipient.is_verified),
            };
          })()}
          currentUserId={currentUserId}
          onSendMessage={handleSendMessage}
          onReportConversation={handleReportConversation}
        />
      )}
    </div>
  );
}
