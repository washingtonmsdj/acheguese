import { Flag, User, Eye } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
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

interface ReportsListProps {
  reports: PostReport[];
  alertPosts: AlertPost[];
  getProfile: (userId: string) => Profile | undefined;
  onSelectReport: (report: PostReport) => void;
}

export function ReportsList({
  reports,
  alertPosts,
  getProfile,
  onSelectReport,
}: ReportsListProps) {
  if (reports.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Nenhuma denúncia de alerta.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {reports.map((r) => {
        const post = alertPosts.find((p) => p.id === r.post_id);
        const author = post ? getProfile(post.autor_id) : null;
        return (
          <div
            key={r.id}
            className={cn(
              "bg-card rounded-xl border p-4",
              r.status === "pendente" && "border-warning/50 bg-warning/10",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <Flag className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] capitalize", {
                      "bg-warning/10 text-warning border-warning/50":
                        r.status === "pendente",
                      "bg-success/10 text-success border-success/50":
                        r.status === "resolvido",
                      "bg-muted text-muted-foreground":
                        r.status === "rejeitado",
                    })}
                  >
                    {r.status}
                  </Badge>
                  <span className="text-xs font-medium">
                    {REPORT_MOTIVO_LABELS[r.motivo] ?? r.motivo}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {new Date(r.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {r.detalhes && (
                  <p className="text-xs text-muted-foreground italic mb-1.5">
                    "{r.detalhes}"
                  </p>
                )}
                {post && (
                  <div className="bg-muted/50 rounded-lg p-2 text-sm line-clamp-1">
                    🚨 {post.texto}
                  </div>
                )}
                {author && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Autor: {author.name}
                    </span>
                    {author.alert_banned && (
                      <Badge
                        variant="destructive"
                        className="text-[10px] h-4 px-1.5"
                      >
                        Banido
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              {r.status === "pendente" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => onSelectReport(r)}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
