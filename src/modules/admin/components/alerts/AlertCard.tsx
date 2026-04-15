import { Eye, Clock, User, CheckCircle, XCircle, Flag } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import type { AlertPost, Profile } from "@/modules/admin/hooks/useAlertData";

interface AlertCardProps {
  post: AlertPost;
  author: Profile | undefined;
  reportCount: number;
  confirmCount: number;
  denyCount: number;
  expired: boolean;
  onViewDetails: () => void;
}

export function AlertCard({
  post,
  author,
  reportCount,
  confirmCount,
  denyCount,
  expired,
  onViewDetails,
}: AlertCardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border p-4 hover:shadow-sm transition-shadow",
        post.hidden && "opacity-60 border-dashed",
        reportCount >= 3 &&
          !post.hidden &&
          "border-destructive/50 bg-destructive/5",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-lg",
            post.hidden
              ? "bg-muted"
              : expired
                ? "bg-muted"
                : "bg-destructive/10",
          )}
        >
          {post.hidden ? "🚫" : expired ? "⏱️" : "🚨"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                post.hidden
                  ? "bg-muted text-muted-foreground"
                  : expired
                    ? "bg-muted text-muted-foreground"
                    : "bg-destructive/10 text-destructive border-destructive/20",
              )}
            >
              {post.hidden ? "Oculto" : expired ? "Expirado" : "Ativo"}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {post.category}
            </Badge>
            {reportCount > 0 && (
              <Badge variant="destructive" className="text-[10px] gap-0.5">
                <Flag className="h-2.5 w-2.5" />
                {reportCount} {reportCount === 1 ? "denúncia" : "denúncias"}
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {post.created_at
                ? new Date(post.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </span>
          </div>
          <p className="text-sm line-clamp-2 mb-1.5">{post.texto}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {author && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {author.name || "Usuário"}
                {author.alert_banned && (
                  <span className="text-destructive">🚫</span>
                )}
              </span>
            )}
            <span className="flex items-center gap-0.5 text-success">
              <CheckCircle className="h-3 w-3" /> {confirmCount}
            </span>
            <span className="flex items-center gap-0.5 text-destructive">
              <XCircle className="h-3 w-3" /> {denyCount}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onViewDetails}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
