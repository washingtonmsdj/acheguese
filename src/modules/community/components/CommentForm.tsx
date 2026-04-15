import React from "react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useCommentActions } from "@/modules/community/hooks/useCommentActions";
import { useUserType } from "@/modules/community/hooks/useUserType";
/**
 * Formulário de comentário
 *
 * Requirement 6: Sistema de Comentários
 * Requirement 2: Restrição de Postagem para Empresas
 * Requirement 29: Validações e Segurança
 *
 * Funcionalidades:
 * - Textarea para conteúdo
 * - Botão de send
 * - Suporte para comentário top-level ou reply
 * - Validação de businesss (não podem comentar)
 */

interface CommentFormProps {
  postId: string;
  parentCommentId?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function CommentForm({
  postId,
  parentCommentId = null,
  onSuccess,
  onCancel,
  placeholder = "Escreva seu comentário...",
  autoFocus = false,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const { submitting: isCreating, submitComment: createComment } =
    useCommentActions(postId);
  const { canComment, isBusiness, loading } = useUserType();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Requirement 29.1: Validar permissões de businesss
    if (!canComment) {
      return;
    }

    if (content.trim().length === 0) return;

    const result = await createComment(
      content.trim(),
      parentCommentId || undefined,
    );
    if (result) {
      setContent("");
      onSuccess?.();
    }
  };

  // Requirement 2: Empresas não podem comentar
  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">Loading...</div>
    );
  }

  if (!canComment && isBusiness) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Empresas não podem comentar na comunidade. Apenas pessoas físicas
          podem participar das discussões.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        autoFocus={autoFocus}
        className="resize-none"
        maxLength={1000}
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {content.length} / 1000
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isCreating}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={content.trim().length === 0 || isCreating}
          >
            {isCreating ? "Enviando..." : "Comentar"}
          </Button>
        </div>
      </div>
    </form>
  );
}
