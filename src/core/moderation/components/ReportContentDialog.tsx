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
import { ModerationService } from "@/core/moderation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const motivos = [
  { id: "difamacao", label: "Difamacao ou acusacao" },
  { id: "falso", label: "Informacao falsa" },
  { id: "spam", label: "Spam ou propaganda abusiva" },
  { id: "ofensivo", label: "Conteudo ofensivo" },
  { id: "outro", label: "Outro" },
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
  const { activeProfile } = useSessionContext();
  const [motivo, setMotivo] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const [enviando, setEnviando] = useState(false);

  const titleMap = {
    post: "Denunciar post",
    comment: "Denunciar comentario",
    profile: "Denunciar perfil",
  };
  const dialogTitle =
    targetType === "post"
      ? titleMap.post
      : targetType === "comment"
        ? titleMap.comment
        : titleMap.profile;

  const handleEnviar = async () => {
    if (!motivo || !targetId || !activeProfile) return;

    setEnviando(true);
    try {
      await ModerationService.reportContent({
        targetType,
        targetId,
        reporterId: activeProfile.id,
        reason: motivo,
        details: detalhes.trim(),
      });
      toast.success("Denuncia enviada. Obrigado por ajudar a comunidade.");
      onOpenChange(false);
      setMotivo("");
      setDetalhes("");
    } catch {
      toast.error("Erro ao enviar denuncia.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">{dialogTitle}</DialogTitle>
          <DialogDescription>Por que este conteudo e inadequado?</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {motivos.map((m) => (
            <button
              key={m.id}
              onClick={() => setMotivo(m.id)}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-all",
                motivo === m.id
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-border bg-secondary text-foreground hover:bg-secondary/80",
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
          className="min-h-[80px] resize-none text-sm"
        />

        <Button
          onClick={handleEnviar}
          disabled={!motivo || enviando}
          variant="destructive"
          className="w-full"
        >
          {enviando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Enviar denuncia
        </Button>
      </DialogContent>
    </Dialog>
  );
}
