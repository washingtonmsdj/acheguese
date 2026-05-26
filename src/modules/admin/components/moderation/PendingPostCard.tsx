import React from "react";
import { useState } from "react";
import { PendingPost } from "@/core/moderation/types";
import {
  REPORT_TYPE_LABELS,
  getPriorityLevel,
} from "@/shared/types/moderation";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  EyeOff,
  Ban,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Flag,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import { useModeration } from "@/core/moderation/hooks/useModeration";
interface PendingPostCardProps {
  post: PendingPost;
}

export function PendingPostCard({ post }: PendingPostCardProps) {
  const [showReports, setShowReports] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [reason, setReason] = useState("");
  const { executeAction, isExecuting } = useModeration();

  const priorityLevel = getPriorityLevel(post.priority);
  const priorityColors = {
    high: "bg-destructive/10 text-destructive border-destructive/30",
    medium: "bg-warning/10 text-warning border-warning/30",
    low: "bg-accent/10 text-accent border-accent/30",
  };

  const handleAction = (
    action:
      | "approve"
      | "remove"
      | "hide"
      | "ban_author"
      | "warn_author"
      | "reject",
  ) => {
    if (
      (action === "remove" ||
        action === "ban_author" ||
        action === "warn_author") &&
      !reason.trim()
    ) {
      alert("Por favor, forneça um motivo para esta ação.");
      return;
    }

    executeAction({
      targetType: "post",
      targetId: post.id,
      action,
      reason: reason || "Ação de moderação",
    });

    setShowActions(false);
    setReason("");
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          {/* Autor */}
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.author_avatar} />
              <AvatarFallback>
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{post.author_name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Reputação: {post.author_reputation}</span>
                {post.author_previous_reports > 0 && (
                  <span className="text-destructive">
                    • {post.author_previous_reports} denúncias anteriores
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex gap-2">
            <Badge variant="outline">{post.type}</Badge>
            <Badge
              className={
                priorityLevel === "high"
                  ? priorityColors.high
                  : priorityLevel === "medium"
                    ? priorityColors.medium
                    : priorityColors.low
              }
            >
              Prioridade:{" "}
              {priorityLevel === "high"
                ? "Alta"
                : priorityLevel === "medium"
                  ? "Média"
                  : "Baixa"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Conteúdo do Post */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm whitespace-pre-wrap">{post.content}</p>
          {post.images && post.images.length > 0 && (
            <div className="mt-3 flex gap-2">
              {post.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Imagem ${idx + 1}`}
                  className="w-20 h-20 object-cover rounded"
                />
              ))}
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDistanceToNow(new Date(post.created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </div>
          <div className="flex items-center gap-1">
            <Flag className="w-3 h-3" />
            {post.reports_count}{" "}
            {post.reports_count === 1 ? "denúncia" : "denúncias"}
          </div>
        </div>

        {/* Denúncias */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReports(!showReports)}
            className="w-full justify-between"
          >
            <span>Ver Denúncias ({post.reports_count})</span>
            {showReports ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>

          {showReports && (
            <div className="mt-3 space-y-2">
              {post.reports.map((rawReport) => { const report = rawReport as unknown as { id: string; type: string; reason?: string; description?: string; reporter_avatar?: string; reporter_name?: string }; return (
                <div
                  key={report.id}
                  className="p-3 bg-muted rounded-lg text-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={report.reporter_avatar} />
                        <AvatarFallback>
                          {(report.reporter_name ?? '?')[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {report.reporter_name ?? 'Anônimo'}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {REPORT_TYPE_LABELS[report.type as keyof typeof REPORT_TYPE_LABELS] ?? report.type}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{String(report.reason ?? "") }</p>
                  {report.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {String(report.description ?? "") }
                    </p>
                  )}
                </div>
              ); })}
            </div>
          )}
        </div>

        {/* Ações */}
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowActions(!showActions)}
            className="w-full"
          >
            {showActions ? "Ocultar Ações" : "Ações de Moderação"}
          </Button>

          {showActions && (
            <div className="mt-4 space-y-3">
              {/* Motivo */}
              <Textarea
                placeholder="Motivo da ação (obrigatório para remove, banir ou advertir)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
              />

              {/* Botões de Ação */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction("approve")}
                  disabled={isExecuting}
                  className="text-success hover:bg-success/10"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction("reject")}
                  disabled={isExecuting}
                  className="text-accent hover:bg-accent/10"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction("hide")}
                  disabled={isExecuting}
                  className="text-warning hover:bg-warning/10"
                >
                  <EyeOff className="w-4 h-4 mr-2" />
                  Ocultar
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction("warn_author")}
                  disabled={isExecuting}
                  className="text-warning hover:bg-warning/10"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Advertir
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction("remove")}
                  disabled={isExecuting}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Remover
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction("ban_author")}
                  disabled={isExecuting}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Banir Autor
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


