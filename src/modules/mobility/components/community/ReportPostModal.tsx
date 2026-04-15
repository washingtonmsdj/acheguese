import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { Flag, AlertTriangle } from "lucide-react";
import { cn } from "@/shared/utils/cn";

const FLAG_REASONS = [
  {
    value: "spam",
    label: "Spam ou Propaganda",
    icon: "🚫",
    description: "Conteúdo promocional não solicitado",
  },
  {
    value: "inappropriate",
    label: "Conteúdo Inapropriado",
    icon: "⚠️",
    description: "Linguagem ofensiva ou inadequada",
  },
  {
    value: "fake",
    label: "Informação Falsa",
    icon: "❌",
    description: "Informações enganosas ou falsas",
  },
  {
    value: "offensive",
    label: "Ofensivo",
    icon: "😡",
    description: "Conteúdo ofensivo ou discriminatório",
  },
  {
    value: "other",
    label: "Outro Motivo",
    icon: "📝",
    description: "Outro problema não listado",
  },
];

interface ReportPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReport: (reason: string, description?: string) => void;
  postContent: string;
}

export function ReportPostModal({
  open,
  onOpenChange,
  onReport,
  postContent,
}: ReportPostModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!selectedReason) {
      return;
    }
    onReport(selectedReason, description || undefined);
    setSelectedReason("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1E2529] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <Flag className="h-5 w-5" />
            Reportar Postagem
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Ajude a manter a comunidade segura reportando conteúdo inadequado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Post preview */}
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Postagem:</p>
            <p className="text-sm text-gray-200 line-clamp-2">{postContent}</p>
          </div>

          {/* Reason selection */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-300">
              Motivo da denúncia *
            </Label>
            <div className="space-y-2">
              {FLAG_REASONS.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => setSelectedReason(reason.value)}
                  className={cn(
                    "w-full p-3 rounded-xl border-2 transition-all text-left",
                    selectedReason === reason.value
                      ? "border-red-400 bg-red-400/10"
                      : "border-white/10 hover:border-white/20 bg-white/5",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{reason.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          selectedReason === reason.value
                            ? "text-red-400"
                            : "text-white",
                        )}
                      >
                        {reason.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {reason.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Optional description */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-300">
              Detalhes adicionais (opcional)
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o problema com mais detalhes..."
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-600 text-right">
              {description.length}/500
            </p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-400">
              Denúncias falsas podem resultar em penalidades. Use este recurso
              com responsabilidade.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10 text-gray-400 hover:bg-white/5"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason}
            className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Flag className="h-4 w-4 mr-2" />
            Enviar Denúncia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
