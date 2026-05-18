import React from "react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { useComments, type Comment } from "@/modules/community/hooks/useComments";
import { CommentItem } from "./CommentItem";
import { CommentForm } from "./CommentForm";
import { Loader2 } from "lucide-react";
import type { Comment as TreeComment } from "@/shared/utils/commentTree";
/**
 * Thread de comentários
 *
 * Requirement 6: Sistema de Comentários
 *
 * Funcionalidades:
 * - Renderizar lista de comentários
 * - Selector de ordenação (Mais relevantes / Mais recentes)
 * - Formulário de novo comentário
 * - Contador de comentários
 */

interface CommentThreadProps {
  postId: string;
}

export function CommentThread({ postId }: CommentThreadProps) {
  const [sortBy, setSortBy] = useState<"relevantes" | "recentes">("relevantes");
  const { comments, loading: isLoading } = useComments(postId);
  const typedComments = comments;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com contador e ordenação */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          {comments.length === 0
            ? "Nenhum comentário"
            : comments.length === 1
              ? "1 comentário"
              : `${comments.length} comentários`}
        </h3>

        {comments.length > 0 && (
          <Select
            value={sortBy}
            onValueChange={(value: "relevantes" | "recentes") => setSortBy(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevantes">Mais relevantes</SelectItem>
              <SelectItem value="recentes">Mais recentes</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <Separator />

      {/* Formulário de novo comentário */}
      <CommentForm postId={postId} placeholder="Escreva um comentário..." />

      <Separator />

      {/* Lista de comentários */}
      {comments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          Seja o primeiro a comentar!
        </p>
      ) : (
        <div className="space-y-4">
          {typedComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment as unknown as TreeComment} />
          ))}
        </div>
      )}
    </div>
  );
}
