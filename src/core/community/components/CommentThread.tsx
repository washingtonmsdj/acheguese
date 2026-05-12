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
import { useComments } from "@/core/community/hooks/useComments";
import { CommentItem } from "./CommentItem";
import { CommentForm } from "./CommentForm";
import { Loader2 } from "lucide-react";
import type { Comment } from "@/shared/utils/commentTree";
/**
 * Thread de comentÃ¡rios
 *
 * Requirement 6: Sistema de ComentÃ¡rios
 *
 * Funcionalidades:
 * - Renderizar lista de comentÃ¡rios
 * - Selector de ordenaÃ§Ã£o (Mais relevantes / Mais recentes)
 * - FormulÃ¡rio de novo comentÃ¡rio
 * - Contador de comentÃ¡rios
 */

interface CommentThreadProps {
  postId: string;
}

export function CommentThread({ postId }: CommentThreadProps) {
  const [sortBy, setSortBy] = useState<"relevantes" | "recentes">("relevantes");
  const { comments, loading: isLoading } = useComments(postId);
  const typedComments = comments as Comment[];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com contador e ordenaÃ§Ã£o */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          {comments.length === 0
            ? "Nenhum comentÃ¡rio"
            : comments.length === 1
              ? "1 comentÃ¡rio"
              : `${comments.length} comentÃ¡rios`}
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

      {/* FormulÃ¡rio de novo comentÃ¡rio */}
      <CommentForm postId={postId} placeholder="Escreva um comentÃ¡rio..." />

      <Separator />

      {/* Lista de comentÃ¡rios */}
      {comments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          Seja o primeiro a comentar!
        </p>
      ) : (
        <div className="space-y-4">
          {typedComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}

