import React, { useState } from "react";
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
import { useAuth } from "@/core/auth/hooks/useAuth";
import { profileService } from "@/core/profiles";
import { toast } from "sonner";
import { ModerationService } from "@/core/moderation";
import { Loader2 } from "lucide-react";

const motivos = [
  { id: "spam", label: "🚫 Spam" },
  { id: "ofensivo", label: "🤬 Conteúdo ofensivo" },
  { id: "fora_tema", label: "📌 Fora do tema do neighborhood" },
  { id: "falso", label: "❌ Informação falsa" },
];

interface Props {
  postId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportPostDialog({ postId, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [motivo, setMotivo] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleEnviar = async () => {
    if (!motivo || !postId || !user) return;
    setEnviando(true);
    try {
      // ✅ SSOT - Usar ModerationService
      const activeProfile = await profileService.getRequiredActiveProfile();
      await ModerationService.reportContent({
        targetType: "post",
        targetId: postId,
        reporterId: activeProfile.id,
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
          <DialogTitle className="font-display">Denunciar post</DialogTitle>
          <DialogDescription>Por que este post é inadequado?</DialogDescription>
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
