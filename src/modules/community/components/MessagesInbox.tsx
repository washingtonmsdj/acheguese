import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { MessageCircle, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDirectMessages } from "../hooks/useDirectMessages";
import type { ConversationPreview } from "@/core/messaging/types";

interface MessagesInboxProps {
  currentUserId: string;
}

function getInitials(name?: string) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function MessagesInbox({ currentUserId }: MessagesInboxProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { conversations, isLoading, error, fetchConversations } = useDirectMessages(currentUserId);

  useEffect(() => {
    fetchConversations();
  }, [currentUserId]);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return conversations.filter((c) => {
      const title = (c.classified_title || "").toLowerCase();
      const user = (c.other_user_name || "").toLowerCase();
      return title.includes(q) || user.includes(q);
    });
  }, [conversations, searchTerm]);

  const formatTime = (value: string) =>
    formatDistanceToNow(new Date(value), { addSuffix: true, locale: ptBR });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Card className="border-gray-800 bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
            <MessageCircle className="h-6 w-6 text-orange-500" />
            Mensagens
          </CardTitle>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-gray-700 bg-gray-800 pl-10 text-white placeholder:text-gray-400"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? <p className="py-6 text-center text-gray-400">Carregando conversas...</p> : null}
          {error ? (
            <div className="py-6 text-center text-red-400">
              <p>Erro ao carregar conversas: {error}</p>
              <Button variant="outline" size="sm" onClick={fetchConversations} className="mt-3 border-red-400 text-red-400">
                Tentar novamente
              </Button>
            </div>
          ) : null}
          {!isLoading && !error && filtered.length === 0 ? (
            <p className="py-8 text-center text-gray-400">Nenhuma conversa encontrada</p>
          ) : null}
          {!isLoading &&
            !error &&
            filtered.map((conversation: ConversationPreview) => (
              <Card key={conversation.id} className="border-gray-800 bg-gray-900">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 border border-gray-700">
                      <AvatarImage src={conversation.other_user_avatar || undefined} />
                      <AvatarFallback className="bg-orange-500 text-white">{getInitials(conversation.other_user_name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-white">{conversation.other_user_name || "Usuario"}</p>
                        <span className="text-xs text-gray-400">{formatTime(conversation.last_message_at)}</span>
                      </div>
                      <p className="truncate text-sm text-gray-300">{conversation.classified_title || "Conversa"}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary" className="border-0 bg-orange-500/20 text-xs text-orange-300">
                          Classificado
                        </Badge>
                        {conversation.unread_count > 0 ? (
                          <Badge className="h-5 min-w-5 rounded-full bg-red-500 px-1 text-[10px]">{conversation.unread_count}</Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
