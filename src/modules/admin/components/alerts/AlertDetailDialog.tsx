import {
  AlertTriangle,
  Clock,
  User,
  Flag,
  Eye,
  EyeOff,
  Trash2,
  ShieldCheck,
  ShieldBan,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import type {
  AlertPost,
  Profile,
  PostReport,
} from "@/modules/admin/hooks/useAlertData";

const REPORT_MOTIVO_LABELS: Record<string, string> = {
  alerta_falso: "Alerta falso",
  uso_criminoso: "Uso criminoso",
  spam: "Spam",
  conteudo_ofensivo: "Conteúdo ofensivo",
  acusacao_pessoa: "Acusação de pessoa",
};

interface AlertDetailDialogProps {
  post: AlertPost | null;
  onClose: () => void;
  getProfile: (userId: string) => Profile | undefined;
  getPostReportCount: (postId: string) => number;
  getPostConfirmations: (postId: string) => number;
  getPostDenials: (postId: string) => number;
  alertReports: PostReport[];
  isExpired: (post: AlertPost) => boolean;
  actionLoading: string | null;
  onToggleHide: (post: AlertPost) => void;
  onDeletePost: (postId: string) => void;
  onToggleBan: (profile: Profile) => void;
}

export function AlertDetailDialog({
  post,
  onClose,
  getProfile,
  getPostReportCount,
  getPostConfirmations,
  getPostDenials,
  alertReports,
  isExpired,
  actionLoading,
  onToggleHide,
  onDeletePost,
  onToggleBan,
}: AlertDetailDialogProps) {
  if (!post) return null;

  const author = getProfile(post.autor_id);
  const reportCount = getPostReportCount(post.id);
  const confirmCount = getPostConfirmations(post.id);
  const denyCount = getPostDenials(post.id);
  const postReports = alertReports.filter((r) => r.post_id === post.id);
  const expired = isExpired(post);

  return (
    <Dialog
      open={!!post}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Detalhes do Alerta
          </DialogTitle>
          <DialogDescription>
            Revise o conteúdo e tome ações de moderação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn(
                post.hidden
                  ? "bg-muted text-muted-foreground"
                  : expired
                    ? "bg-muted text-muted-foreground"
                    : "bg-destructive/10 text-destructive border-destructive/20",
              )}
            >
              {post.hidden ? "Oculto" : expired ? "Expirado" : "Ativo"}
            </Badge>
            <Badge variant="secondary">{post.category}</Badge>
            {reportCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <Flag className="h-3 w-3" /> {reportCount}{" "}
                {reportCount === 1 ? "denúncia" : "denúncias"}
              </Badge>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm">{post.texto}</p>
            {post.expires_at && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Expira: {new Date(post.expires_at).toLocaleString("pt-BR")}
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex-1 bg-success/10 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-success">{confirmCount}</p>
              <p className="text-xs text-muted-foreground">Confirmações</p>
            </div>
            <div className="flex-1 bg-destructive/10 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-destructive">{denyCount}</p>
              <p className="text-xs text-muted-foreground">Negações</p>
            </div>
            <div className="flex-1 bg-warning/10 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-warning">{reportCount}</p>
              <p className="text-xs text-muted-foreground">Denúncias</p>
            </div>
          </div>

          {author && (
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Autor do alerta
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {author.avatar_url ? (
                      <img
                        src={author.avatar_url}
                        className="h-full w-full object-cover"
                        alt=""
                      />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{author.name}</p>
                    {author.neighborhood && (
                      <p className="text-xs text-muted-foreground">
                        {author.neighborhood}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant={author.alert_banned ? "outline" : "destructive"}
                  size="sm"
                  className="gap-1.5"
                  disabled={actionLoading === author.id}
                  onClick={() => onToggleBan(author)}
                >
                  {actionLoading === author.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : author.alert_banned ? (
                    <>
                      <ShieldCheck className="h-3 w-3" /> Desbanir
                    </>
                  ) : (
                    <>
                      <ShieldBan className="h-3 w-3" /> Banir
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {postReports.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Motivos das denúncias
              </p>
              <div className="space-y-1">
                {postReports.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-2 text-xs bg-muted/30 rounded px-2 py-1.5"
                  >
                    <span>{REPORT_MOTIVO_LABELS[r.motivo] ?? r.motivo}</span>
                    {r.detalhes && (
                      <span className="text-muted-foreground italic ml-auto">
                        "{r.detalhes}"
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1 border-t">
            <Button
              variant="outline"
              className="gap-2"
              disabled={!!actionLoading}
              onClick={() => onToggleHide(post)}
            >
              {actionLoading === post.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : post.hidden ? (
                <>
                  <Eye className="h-4 w-4" /> Reexibir Alerta
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" /> Ocultar Alerta
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              disabled={!!actionLoading}
              onClick={() => onDeletePost(post.id)}
            >
              <Trash2 className="h-4 w-4" /> Excluir Permanentemente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
