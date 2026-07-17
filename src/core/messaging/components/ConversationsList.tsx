import React from "react";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Button } from "@/shared/components/ui/button";
import { ConversationCard } from "./ConversationCard";
import type { ClassifiedConversationPreview } from "@/core/messaging/types";

interface ConversationsListProps {
  conversations: ClassifiedConversationPreview[];
  loading: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

export function ConversationsList({
  conversations,
  loading,
  hasMore,
  loadingMore,
  onLoadMore,
}: ConversationsListProps) {
  if (loading) {
    return (
      <div className="px-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center px-4"
      >
        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <MessageCircle className="h-9 w-9 text-primary" />
        </div>
        <p className="text-lg font-bold font-display">Nenhuma conversa</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-[260px]">
          Suas negociações dos classificados aparecerão aqui
        </p>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="divide-y">
        {conversations.map((conversation, index) => (
          <ConversationCard
            key={conversation.id}
            conversation={conversation}
            index={index}
          />
        ))}
      </div>
      {hasMore ? (
        <div className="flex justify-center p-4">
          <Button
            type="button"
            variant="outline"
            disabled={loadingMore}
            onClick={onLoadMore}
          >
            {loadingMore ? "Carregando..." : "Carregar mais conversas"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
