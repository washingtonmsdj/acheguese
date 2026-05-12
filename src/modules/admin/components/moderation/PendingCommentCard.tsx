import React from "react";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  EyeOff,
  AlertTriangle,
  UserX,
  MessageSquare,
  Flag,
} from "lucide-react";
import { PendingComment } from "@/core/moderation/types";
import { PRIORITY_COLORS, REPORT_TYPE_LABELS } from "@/shared/types/moderation";
import { useModeration } from "@/core/moderation/hooks/useModeration";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
interface PendingCommentCardProps {
  comment: PendingComment;
}

export function PendingCommentCard({ comment }: PendingCommentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { executeAction, isExecuting } = useModeration();

  const priorityLabel = comment.priority >= 3 ? 'high' : comment.priority === 2 ? 'medium' : 'low';
  const priorityColor =
    priorityLabel === 'high'
      ? PRIORITY_COLORS.high
      : priorityLabel === 'medium'
        ? PRIORITY_COLORS.medium
        : PRIORITY_COLORS.low;

  const handleApprove = async () => {
    executeAction({
      targetId: comment.id,
      targetType: "comment",
      action: "approve",
      reason: "Comentário aprovado após análise",
    });
  };

  const handleRemove = async () => {
    executeAction({
      targetId: comment.id,
      targetType: "comment",
      action: "remove",
      reason: "Comentário removido por violar diretrizes",
    });
  };

  const handleHide = async () => {
    executeAction({
      targetId: comment.id,
      targetType: "comment",
      action: "hide",
      reason: "Comentário ocultado temporariamente",
    });
  };

  const handleBanAuthor = async () => {
    executeAction({
      targetId: comment.id,
      targetType: "comment",
      action: "ban_author",
      reason: "Usuário banido por comentário inadequado",
    });
  };

  const handleWarnAuthor = async () => {
    executeAction({
      targetId: comment.id,
      targetType: "comment",
      action: "warn_author",
      reason: "Advertência por comentário inadequado",
    });
  };

  const extendedComment = comment as unknown as {
    author?: { reputation?: number };
    post?: { content?: string };
  };
  const authorReputation = extendedComment.author?.reputation ?? 0;
  const originalPostContent = extendedComment.post?.content ?? comment.content;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <img
              src={comment.author_avatar || "/default-avatar.png"}
              alt={comment.author_name}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {comment.author_name}
                </span>
                <Badge variant="outline" className="text-xs">
                  Rep: {authorReputation}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>

          <Badge
            style={{
              backgroundColor: priorityColor.bg,
              borderColor: priorityColor.border,
              color: priorityColor.text,
            }}
            className="ml-2"
          >
            {comment.priority >= 3 && "Alta"}
            {comment.priority === 2 && "Média"}
            {comment.priority <= 1 && "Baixa"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Conteúdo do Comentário */}
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Comentário Denunciado
          </h4>
          <div className="p-3 bg-muted rounded-lg border-l-4 border-destructive">
            <p className="text-sm">{comment.content}</p>
          </div>
        </div>

        {/* Post Original */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Post Original</h4>
          <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            {originalPostContent.substring(0, 150)}
            {originalPostContent.length > 150 && "..."}
          </div>
        </div>

        {/* Denúncias */}
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm font-semibold mb-2 flex items-center gap-2 hover:text-primary transition-colors"
          >
            <Flag className="w-4 h-4" />
            {comment.reports.length}{" "}
            {comment.reports.length === 1 ? "Denúncia" : "Denúncias"}
            <span className="text-xs text-muted-foreground ml-1">
              (clique para {isExpanded ? "ocultar" : "ver"})
            </span>
          </button>

          {isExpanded && (
            <div className="space-y-2">
              {comment.reports.map((report) => (
                <div
                  key={report.id}
                  className="p-3 bg-muted/50 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {REPORT_TYPE_LABELS[report.type]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      por {report.reporter.name_completo}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{report.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button
            variant="default"
            size="sm"
            onClick={handleApprove}
            disabled={isExecuting}
            className="bg-success hover:bg-success/90"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Aprovar
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            disabled={isExecuting}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Remover
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleHide}
            disabled={isExecuting}
          >
            <EyeOff className="w-4 h-4 mr-2" />
            Ocultar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleWarnAuthor}
            disabled={isExecuting}
            className="border-warning text-warning hover:bg-warning/10"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Advertir
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleBanAuthor}
            disabled={isExecuting}
            className="border-destructive text-destructive hover:bg-destructive/10"
          >
            <UserX className="w-4 h-4 mr-2" />
            Banir Autor
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
