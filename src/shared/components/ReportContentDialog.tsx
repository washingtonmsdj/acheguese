 
import React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/utils/cn";
import { useSessionContext } from "@/core/session";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
const motivos = [
  { id: "difamacao", label: "⚖️ Difamação ou acusação" },
  { id: "falso", label: "❌ Informação falsa" },
  { id: "spam", label: "🚫 Spam ou propaganda abusiva" },
  { id: "ofensivo", label: "🤬 Conteúdo ofensivo" },
  { id: "outro", label: "📝 Outro" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string | null;
  targetType: "post" | "comment" | "profile";
}

export function ReportContentDialog({
  open,
  onOpenChange,
  targetId,
  targetType,
}: Props) {
  const { user, activeProfile } = useSessionContext(); // ✅ SSOT Regra 1
  const [motivo, setMotivo] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const [enviando, setEnviando] = useState(false);

  const tableMap = {
    // ✅ SSOT - Tabelas de reports não existem
    post: "posts",
    comment: "comments",
    profile: "profiles",
  };

  const idFieldMap = {
    post: "post_id",
    comment: "comment_id",
    profile: "profile_id",
  };

  const titleMap = {
    post: "Denunciar post",
    comment: "Denunciar comentário",
    profile: "Denunciar profile",
  };

  const handleEnviar = async () => {
    if (!motivo || !targetId || !activeProfile) return;
    setEnviando(true);
    try {
      await ModerationService.reportContent({
        targetType,
        targetId,
        reporterId: activeProfile.id, // ✅ SSOT Regra 1 - reporter é contexto social/domínio
        reason: motivo,
        details: detalhes.trim(),
      });
      toast.success("Denúncia enviada. Obrigado por ajudar a comunidade!");
      onOpenChange(false);
      setMotivo("");
      setDetalhes("");
    } catch {
      toast.error("Error send denúncia");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">
            {titleMap[targetType]}
          </DialogTitle>
          <DialogDescription>
            Por que este conteúdo é inadequado?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {motivos.map((m) => (
            <button
              key={m.id}
              onClick={() => setMotivo(m.id)}
              className={cn(
                "text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-all",
                motivo === m.id
                  ? "bg-destructive/10 border-destructive/30 text-destructive"
                  : "bg-secondary border-border text-foreground hover:bg-secondary/80",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <Textarea
          value={detalhes}
          onChange={(e) => setDetalhes(e.target.value.slice(0, 300))}
          placeholder="Detalhes adicionais (opcional)"
          className="min-h-[80px] text-sm resize-none"
        />

        <Button
          onClick={handleEnviar}
          disabled={!motivo || enviando}
          variant="destructive"
          className="w-full"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Enviar denúncia
        </Button>
      </DialogContent>
    </Dialog>
  );
}
