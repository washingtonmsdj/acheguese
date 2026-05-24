import { Flag, Eye, User } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";

const MOTIVO_LABELS: Record<string, string> = {
  spam: "Spam",
  ofensivo: "Ofensivo",
  fora_tema: "Fora do tema",
  falso: "Info falsa",
  difamacao: "Difamação",
  outro: "Outro",
};

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-warning/10 text-warning border-warning/20",
  analisando: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  resolvido: "bg-success/10 text-success border-success/20",
  rejeitado: "bg-muted text-muted-foreground border-border",
};

const CATEGORY_COLORS: Record<string, string> = {
  alerta: "bg-rose-500/10 text-rose-600",
  evento: "bg-violet-500/10 text-violet-600",
  promoção: "bg-emerald-500/10 text-emerald-600",
  dica: "bg-sky-500/10 text-sky-600",
  segurança: "bg-amber-500/10 text-amber-600",
  aviso: "bg-amber-500/10 text-amber-700",
  pergunta: "bg-violet-500/10 text-violet-600",
  compra_venda: "bg-emerald-500/10 text-emerald-700",
  achados_perdidos: "bg-cyan-500/10 text-cyan-700",
  animais: "bg-orange-500/10 text-orange-700",
  transito: "bg-slate-500/10 text-slate-700",
};

interface ReportCardProps {
  report: {
    status: string;
    motivo: string;
    created_at?: string | null;
    detalhes?: string | null;
  };
  content?: {
    category?: string;
    texto?: string;
    name?: string;
    suspended?: boolean;
  } | null;
  author?: { name?: string; warning_count?: number } | null;
  type: "post" | "comment" | "profile";
  onView: () => void;
}

export function ReportCard({
  report,
  content,
  author,
  type,
  onView,
}: ReportCardProps) {
  return (
    <div className="bg-card rounded-xl border p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
          <Flag className="h-4 w-4 text-destructive" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] capitalize",
                STATUS_COLORS[report.status] ?? "",
              )}
            >
              {report.status}
            </Badge>
            <span className="text-xs font-medium">
              {MOTIVO_LABELS[report.motivo] ?? report.motivo}
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto">
              {report.created_at
                ? new Date(report.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </span>
          </div>

          {report.detalhes && (
            <p className="text-xs text-muted-foreground mb-1.5 italic">
              "{report.detalhes}"
            </p>
          )}

          {/* Content preview */}
          {content && (
            <div className="bg-muted/50 rounded-lg p-2.5 mt-1.5">
              {type === "post" && (
                <>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] mb-1",
                      CATEGORY_COLORS[content.category] || "",
                    )}
                  >
                    {content.category}
                  </Badge>
                  <p className="text-sm line-clamp-2">{content.texto}</p>
                </>
              )}
              {type === "comment" && (
                <p className="text-sm line-clamp-2">{content.texto}</p>
              )}
              {type === "profile" && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{content.name}</span>
                  {content.suspended && (
                    <Badge variant="destructive" className="text-[10px]">
                      Suspenso
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {author && type !== "profile" && (
            <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
              <User className="h-3 w-3" />
              Autor: {author.name}
              {author.warning_count > 0 && (
                <span className="text-warning">
                  ({author.warning_count} adv.)
                </span>
              )}
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onView}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
