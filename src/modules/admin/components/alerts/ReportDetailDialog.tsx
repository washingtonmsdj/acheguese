import { CheckCircle, XCircle, ShieldBan, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import type {
  PostReport,
  AlertPost,
  Profile,
} from "@/modules/admin/hooks/useAlertData";

const REPORT_MOTIVO_LABELS: Record<string, string> = {
  alerta_falso: "❌ Alerta Falso",
  uso_criminoso: "🚨 Uso Criminoso",
  spam: "🚫 Spam",
  conteudo_ofensivo: "🤬 Conteúdo Ofensivo",
  acusacao_pessoa: "⚠️ Acusação de Pessoa",
};

interface ReportDetailDialogProps {
  report: PostReport | null;
  onClose: () => void;
  alertPosts: AlertPost[];
  getProfile: (userId: string) => Profile | undefined;
  adminNotes: string;
  onAdminNotesChange: (notes: string) => void;
  actionLoading: string | null;
  onResolve: (reportId: string, status: "resolvido" | "rejeitado") => void;
  onToggleBan: (profile: Profile) => void;
}

export function ReportDetailDialog({
  report,
  onClose,
  alertPosts,
  getProfile,
  adminNotes,
  onAdminNotesChange,
  actionLoading,
  onResolve,
  onToggleBan,
}: ReportDetailDialogProps) {
  if (!report) return null;

  const post = alertPosts.find((p) => p.id === report.post_id);
  const author = post ? getProfile(post.autor_id) : null;

  return (
    <Dialog
      open={!!report}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Analisar Denúncia</DialogTitle>
          <DialogDescription>
            Revise a denúncia e tome uma decisão
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              {REPORT_MOTIVO_LABELS[report.motivo] ?? report.motivo}
            </Badge>
          </div>

          {report.detalhes && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Detalhes</p>
              <p className="text-sm bg-muted/50 rounded-lg p-2.5 italic">
                "{report.detalhes}"
              </p>
            </div>
          )}

          {post && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Alerta denunciado
              </p>
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                🚨 {post.texto}
              </div>
            </div>
          )}

          {author && (
            <div className="flex items-center justify-between bg-muted/30 rounded-lg p-2.5">
              <div>
                <p className="text-sm font-medium">{author.name}</p>
                {author.alert_banned && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] h-4 mt-0.5"
                  >
                    Já banido de alertas
                  </Badge>
                )}
              </div>
              {!author.alert_banned && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  disabled={!!actionLoading}
                  onClick={() => onToggleBan(author)}
                >
                  <ShieldBan className="h-3.5 w-3.5" /> Banir
                </Button>
              )}
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Notas do admin
            </p>
            <Textarea
              value={adminNotes}
              onChange={(e) => onAdminNotesChange(e.target.value)}
              placeholder="Adicionar notas sobre a decisão..."
              className="min-h-[60px] text-sm resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-1.5"
              disabled={!!actionLoading}
              onClick={() => onResolve(report.id, "rejeitado")}
            >
              <XCircle className="h-3.5 w-3.5" /> Rejeitar
            </Button>
            <Button
              className="flex-1 gap-1.5"
              disabled={!!actionLoading}
              onClick={() => onResolve(report.id, "resolvido")}
            >
              {actionLoading === report.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" />
              )}
              Resolver
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
