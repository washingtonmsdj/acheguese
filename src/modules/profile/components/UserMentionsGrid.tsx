import React from "react";
import { useUserMentions } from "../hooks/useUserMentions";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { EmptyStateProfile } from "./EmptyStateProfile";
import { InfiniteScrollTrigger } from "@/shared/components/ui";
import { Heart, MessageSquare, Eye, AtSign, Award } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
interface UserMentionsGridProps {
  userId: string;
  onPostClick?: (postId: string) => void;
}

interface MentionItem {
  id: string;
  rank?: number;
  post: {
    id: string;
    type: string;
    content: string;
    created_at: string;
    likes_count: number;
    comments_count: number;
    author: {
      id: string;
      name: string;
      avatar_url: string;
    };
  };
}

const POST_TYPE_LABELS: Record<string, string> = {
  discussao: "Discussão",
  pergunta: "Pergunta",
  recomendacao: "Recomendação",
  alerta: "Alerta",
  enquete: "Enquete",
  achados_e_perdidos: "Achados e Perdidos",
};

const RANK_LABELS: Record<number, string> = {
  1: "1\u00ba lugar",
  2: "2\u00ba lugar",
  3: "3\u00ba lugar",
};

export function UserMentionsGrid({
  userId,
  onPostClick,
}: UserMentionsGridProps) {
  const {
    mentions,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
  } = useUserMentions({ userId });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error load menções</p>
      </div>
    );
  }

  if (mentions.length === 0) {
    return (
      <EmptyStateProfile
        icon={AtSign}
        title="Nenhuma menção ainda"
        description="Você ainda não foi mencionado em nenhum post. Quando alguém mencionar você, aparecerá aqui."
      />
    );
  }

  return (
    <div className="space-y-4">
      {(mentions as unknown as MentionItem[]).map((mention) => (
        <Card
          key={mention.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onPostClick?.(mention.post.id)}
        >
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={mention.post.author.avatar_url} />
                  <AvatarFallback>{mention.post.author.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{mention.post.author.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(mention.post.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Badge variant="outline">
                  {POST_TYPE_LABELS[mention.post.type] || mention.post.type}
                </Badge>
                {mention.rank && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Award className="w-3 h-3" />
                    {RANK_LABELS[mention.rank] || `${mention.rank}º`}
                  </Badge>
                )}
              </div>
            </div>

            {/* Content Preview */}
            <p className="text-sm mb-4 line-clamp-3">{mention.post.content}</p>

            {/* Metrics */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{mention.post.likes_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span>{mention.post.comments_count}</span>
              </div>
            </div>

            {/* Action */}
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 w-full"
              onClick={(e) => {
                e.stopPropagation();
                onPostClick?.(mention.post.id);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Post Completo
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* Infinite Scroll */}
      <InfiniteScrollTrigger
        onLoadMore={loadMore}
        hasMore={!!hasNextPage}
        isLoading={isFetchingNextPage}
      />
    </div>
  );
}
