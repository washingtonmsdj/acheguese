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
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { AlertTriangle, Shield, Info } from "lucide-react";
import { toast } from "sonner";
import { INLINE_STYLES } from "./styles/communityDesignSystem";
import { logger } from "@/shared/utils/logger";
interface DisputeMentionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId?: string;
  commentId?: string;
  mentionedProfileId: string;
  mentionedProfileName: string;
}

type DisputeType = "defamation" | "false_info" | "harassment" | "other";

const disputeTypes: {
  value: DisputeType;
  label: string;
  description: string;
}[] = [
  {
    value: "defamation",
    label: "Difamação",
    description: "Informações falsas que prejudicam minha reputação",
  },
  {
    value: "false_info",
    label: "Informação Falsa",
    description: "Dados incorretos sobre meu serviço ou business",
  },
  {
    value: "harassment",
    label: "Assédio",
    description: "Menção indevida ou perseguição",
  },
  {
    value: "other",
    label: "Outro",
    description: "Outro motivo não listado acima",
  },
];

export function DisputeMentionModal({
  open,
  onOpenChange,
  postId,
  commentId,
  mentionedProfileId,
  mentionedProfileName,
}: DisputeMentionModalProps) {
  const [disputeType, setDisputeType] = useState<DisputeType>("defamation");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim() || reason.length < 50) {
      toast.error("Por favor, descreva o motivo com pelo menos 50 caracteres");
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Implementar chamada ao backend
      logger.info("Contestação enviada:", {
        postId,
        commentId,
        mentionedProfileId,
        disputeType,
        reason,
      });

      toast.success(
        "Contestação enviada! O conteúdo foi ocultado e será analisado por nossa equipe.",
      );
      onOpenChange(false);
      setReason("");
      setDisputeType("defamation");
    } catch (error) {
      logger.error("Error send contestação:", error);
      toast.error("Error send contestação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="rounded-[20px] shadow-2xl max-w-2xl max-h-[90vh] flex flex-col border-0 p-0 gap-0 overflow-hidden"
        style={{ backgroundColor: "#1E2529" }}
        aria-describedby="dialog-description"
      >
        {/* Header */}
        <DialogHeader
          className="border-b pb-3 pt-4 px-5 flex-shrink-0"
          style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
        >
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-400" />
            <DialogTitle
              className="text-base font-bold"
              style={INLINE_STYLES.textPrimary}
            >
              Contestar Menção
            </DialogTitle>
            <span id="dialog-description" className="sr-only">
              Conteúdo do diálogo
            </span>
          </div>
          <p className="text-xs mt-1" style={INLINE_STYLES.textSecondary}>
            Você foi mencionado como <strong>{mentionedProfileName}</strong>
          </p>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Conteste uma menção ou marcação indevida
        </DialogDescription>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Aviso */}
          <div
            className="flex items-start gap-3 p-3 rounded-lg border"
            style={{
              backgroundColor: "rgba(251, 146, 60, 0.1)",
              borderColor: "rgba(251, 146, 60, 0.3)",
            }}
          >
            <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold mb-1 text-orange-400">
                Ação Importante
              </p>
              <p
                className="text-[11px] leading-relaxed"
                style={INLINE_STYLES.textSecondary}
              >
                Ao contestar esta menção, o conteúdo será{" "}
                <strong>imediatamente ocultado</strong> e enviado para análise
                administrativa. Use esta função apenas se houver motivo
                legítimo.
              </p>
            </div>
          </div>

          {/* Tipo de Contestação */}
          <div className="space-y-2">
            <Label
              className="text-xs font-bold"
              style={INLINE_STYLES.textPrimary}
            >
              Motivo da Contestação
            </Label>
            <RadioGroup
              value={disputeType}
              onValueChange={(v) => setDisputeType(v as DisputeType)}
            >
              <div className="space-y-2">
                {disputeTypes.map((type) => (
                  <div
                    key={type.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      disputeType === type.value
                        ? "border-teal-400 bg-teal-400/10"
                        : "border-white/10 bg-transparent hover:border-white/20"
                    }`}
                    onClick={() => setDisputeType(type.value)}
                  >
                    <RadioGroupItem
                      value={type.value}
                      id={type.value}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <Label
                        htmlFor={type.value}
                        className="text-sm font-bold cursor-pointer"
                        style={INLINE_STYLES.textPrimary}
                      >
                        {type.label}
                      </Label>
                      <p
                        className="text-[11px] mt-0.5"
                        style={INLINE_STYLES.textSecondary}
                      >
                        {type.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Descrição Detalhada */}
          <div className="space-y-2">
            <Label
              htmlFor="reason"
              className="text-xs font-bold"
              style={INLINE_STYLES.textPrimary}
            >
              Descreva o Problema (mínimo 50 caracteres)
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explique detalhadamente por que você está contestando esta menção. Quanto mais informações você fornecer, mais rápida será a análise."
              rows={5}
              className="resize-none rounded-lg border-0 text-sm"
              style={{ backgroundColor: "#12181B", color: "#FFFFFF" }}
            />
            <div className="flex justify-between text-[10px]">
              <span
                style={{ color: reason.length < 50 ? "#EF4444" : "#9CA3AF" }}
              >
                Mínimo: 50 caracteres
              </span>
              <span
                style={{ color: reason.length > 500 ? "#EF4444" : "#4FD1C5" }}
              >
                {reason.length}/500
              </span>
            </div>
          </div>

          {/* Informação sobre o Processo */}
          <div
            className="flex items-start gap-3 p-3 rounded-lg border"
            style={{
              backgroundColor: "rgba(79, 209, 197, 0.1)",
              borderColor: "rgba(79, 209, 197, 0.3)",
            }}
          >
            <Info className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold mb-1 text-teal-400">
                O que acontece depois?
              </p>
              <ul
                className="text-[11px] leading-relaxed space-y-1"
                style={INLINE_STYLES.textSecondary}
              >
                <li>• O conteúdo será ocultado imediatamente</li>
                <li>• Nossa equipe analisará em até 48 times</li>
                <li>• Você receiveá uma notificação com a decisão</li>
                <li>• Se aprovado, o conteúdo será removido permanentemente</li>
                <li>• Se rejeitado, o conteúdo voltará a ser visível</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="border-t p-4 flex justify-end gap-3 flex-shrink-0"
          style={{
            borderColor: "rgba(255, 255, 255, 0.1)",
            backgroundColor: "#12181B",
          }}
        >
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="rounded-lg px-4 h-9 border-2 text-xs"
            style={{
              borderColor: "rgba(255, 255, 255, 0.2)",
              color: "#9CA3AF",
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !reason.trim() ||
              reason.length < 50 ||
              reason.length > 500 ||
              submitting
            }
            className="rounded-lg px-6 h-9 font-bold text-xs"
            style={{
              background:
                reason.length >= 50 && reason.length <= 500
                  ? "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)"
                  : "#2D3748",
              color: "#FFFFFF",
            }}
          >
            {submitting ? "Enviando..." : "Enviar Contestação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
