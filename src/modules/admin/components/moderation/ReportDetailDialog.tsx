import { useState } from "react";
import {
  User,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { cn } from "@/shared/utils/cn";

const MOTIVO_LABELS: Record<string, string> = {
  spam: "🚫 Spam",
  ofensivo: "🤬 Ofensivo",
  fora_tema: "📌 Fora do tema",
  falso: "❌ Info falsa",
  difamacao: "⚖️ Difamação",
  outro: "📝 Outro",
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
};

interface ReportDetailDialogProps {
  report: any;
  content: any;
  author: any;
  type: "post" | "comment" | "profile";
  table: string;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onAction: (
    reportId: string,
    table: string,
    status: string,
    notes: string,
  ) => Promise<boolean>;
  onDelete: (
    type: "post" | "comment",
    id: string,
    report: any,
    notes: string,
  ) => Promise<boolean>;
  onWarn: (userId: string, userName: string) => void;
}

export function ReportDetailDialog({
  report,
  content,
  author,
  type,
  table,
  isOpen,
  isLoading,
  onClose,
  onAction,
  onDelete,
  onWarn,
}: ReportDetailDialogProps) {
  const [adminNotes, setAdminNotes] = useState(report?.admin_notes || "");

  const handleAction = async (status: string) => {
    const success = await onAction(report.id, table, status, adminNotes);
    if (success) {
      onClose();
      setAdminNotes("");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Excluir este ${type === "post" ? "post" : "comentário"}?`))
      return;

    const contentId = type === "post" ? report.post_id : report.comment_id;
    const success = await onDelete(
      type as "post" | "comment",
      contentId,
      report,
      adminNotes,
    );
    if (success) {
      onClose();
      setAdminNotes("");
    }
  };

  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            Detalhes da Denúncia
          </DialogTitle>
          <DialogDescription>
            {type === "post"
              ? "Denúncia de post"
              : type === "comment"
                ? "Denúncia de comentário"
                : "Denúncia de perfil"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("capitalize", STATUS_COLORS[report.status] ?? "")}
            >
              {report.status}
            </Badge>
            <span className="text-sm font-medium">
              {MOTIVO_LABELS[report.motivo] ?? report.motivo}
            </span>
          </div>

          {report.detalhes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Detalhes do denunciante
              </p>
              <p className="text-sm bg-muted/50 rounded-lg p-2.5 italic">
                "{report.detalhes}"
              </p>
            </div>
          )}

          {/* Content */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Conteúdo denunciado
            </p>
            <div className="bg-muted/50 rounded-lg p-3">
              {type === "post" && content && (
                <>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] mb-1.5",
                      CATEGORY_COLORS[content.category] || "",
                    )}
                  >
                    {content.category}
                  </Badge>
                  <p className="text-sm">{content.texto}</p>
                  {content.image_url && (
                    <img
                      src={content.image_url}
                      className="h-32 w-full object-cover rounded-lg mt-2"
                      alt=""
                    />
                  )}
                </>
              )}
              {type === "comment" && content && (
                <p className="text-sm">{content.texto}</p>
              )}
              {type === "profile" && content && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{content.name}</span>
                  {content.suspended && (
                    <Badge variant="destructive" className="text-[10px]">
                      Suspenso
                    </Badge>
                  )}
                </div>
              )}
              {!content && (
                <p className="text-sm text-muted-foreground">
                  Conteúdo não encontrado (pode ter sido excluído).
                </p>
              )}
            </div>
          </div>

          {author && (
            <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-2.5">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{author.name}</span>
                {author.warning_count > 0 && (
                  <Badge variant="outline" className="text-[10px] text-warning">
                    {author.warning_count} adv.
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={() => onWarn(author.id, author.name)}
              >
                <AlertTriangle className="h-3 w-3" /> Advertir
              </Button>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Notas do admin
            </p>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Adicionar notas sobre a decisão..."
              className="min-h-[60px] text-sm resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            {report.status === "pendente" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5"
                  disabled={isLoading}
                  onClick={() => handleAction("analisando")}
                >
                  <Eye className="h-3.5 w-3.5" /> Analisar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5 text-muted-foreground"
                  disabled={isLoading}
                  onClick={() => handleAction("rejeitado")}
                >
                  <XCircle className="h-3.5 w-3.5" /> Rejeitar
                </Button>
              </div>
            )}
            {(report.status === "pendente" ||
              report.status === "analisando") && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 gap-1.5"
                  disabled={isLoading}
                  onClick={() => handleAction("resolvido")}
                >
                  {isLoading && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  <CheckCircle className="h-3.5 w-3.5" /> Resolver
                </Button>
                {type !== "profile" && content && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1 gap-1.5"
                    disabled={isLoading}
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
