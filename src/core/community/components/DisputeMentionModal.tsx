import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/shared/components/ui/radio-group";
import { AlertTriangle, Info, Shield } from "lucide-react";
import { toast } from "sonner";
import { INLINE_STYLES } from "./styles/communityDesignSystem";
import { logger } from "@/shared/utils/logger";
import { useSessionContext } from "@/core/session";
import {
  resolveTrustActorRoleFromProfileType,
  TrustEventService,
} from "@/core/trust";

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
    label: "Difamacao",
    description: "Informacoes falsas que prejudicam minha reputacao",
  },
  {
    value: "false_info",
    label: "Informacao falsa",
    description: "Dados incorretos sobre meu servico ou negocio",
  },
  {
    value: "harassment",
    label: "Assedio",
    description: "Mencao indevida ou perseguicao",
  },
  {
    value: "other",
    label: "Outro",
    description: "Outro motivo nao listado acima",
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
  const { activeProfile } = useSessionContext();
  const [disputeType, setDisputeType] = useState<DisputeType>("defamation");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const actorRole = resolveTrustActorRoleFromProfileType(
    activeProfile?.profileType,
  );

  const handleSubmit = async () => {
    if (!activeProfile?.id) {
      toast.error("Perfil ativo obrigatorio para contestar mencao.");
      return;
    }

    if (!reason.trim() || reason.length < 50) {
      toast.error("Por favor, descreva o motivo com pelo menos 50 caracteres");
      return;
    }

    setSubmitting(true);
    try {
      const result = await TrustEventService.createEvent({
        actor_profile_id: activeProfile.id,
        actor_role: actorRole,
        subject_profile_id: mentionedProfileId,
        subject_role: actorRole,
        context_type: "community",
        context_id: commentId || postId || mentionedProfileId,
        event_type: "incident",
        reason_code: `mention_dispute_${disputeType}`,
        severity: disputeType === "harassment" ? "high" : "medium",
        visibility: "admin_only",
        description: reason.trim(),
        evidence: {
          post_id: postId ?? null,
          comment_id: commentId ?? null,
          mentioned_profile_id: mentionedProfileId,
          mentioned_profile_name: mentionedProfileName,
          dispute_type: disputeType,
        },
        status: "under_review",
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        "Contestacao enviada. O conteudo foi sinalizado para analise administrativa.",
      );
      onOpenChange(false);
      setReason("");
      setDisputeType("defamation");
    } catch (error) {
      logger.error("Error sending mention dispute:", error);
      toast.error("Erro ao enviar contestacao. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden rounded-[20px] border-0 p-0 shadow-2xl"
        style={{ backgroundColor: "#1E2529" }}
        aria-describedby="dialog-description"
      >
        <DialogHeader
          className="flex-shrink-0 border-b px-5 pb-3 pt-4"
          style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
        >
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-400" />
            <DialogTitle
              className="text-base font-bold"
              style={INLINE_STYLES.textPrimary}
            >
              Contestar mencao
            </DialogTitle>
            <span id="dialog-description" className="sr-only">
              Conteudo do dialogo
            </span>
          </div>
          <p className="mt-1 text-xs" style={INLINE_STYLES.textSecondary}>
            Voce foi mencionado como <strong>{mentionedProfileName}</strong>
          </p>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Conteste uma mencao indevida
        </DialogDescription>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div
            className="flex items-start gap-3 rounded-lg border p-3"
            style={{
              backgroundColor: "rgba(251, 146, 60, 0.1)",
              borderColor: "rgba(251, 146, 60, 0.3)",
            }}
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-400" />
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-bold text-orange-400">
                Acao importante
              </p>
              <p
                className="text-[11px] leading-relaxed"
                style={INLINE_STYLES.textSecondary}
              >
                A contestacao aciona revisao administrativa com prioridade.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              className="text-xs font-bold"
              style={INLINE_STYLES.textPrimary}
            >
              Motivo da contestacao
            </Label>
            <RadioGroup
              value={disputeType}
              onValueChange={(value) => setDisputeType(value as DisputeType)}
            >
              <div className="space-y-2">
                {disputeTypes.map((type) => (
                  <div
                    key={type.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${
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
                    <div className="min-w-0 flex-1">
                      <Label
                        htmlFor={type.value}
                        className="cursor-pointer text-sm font-bold"
                        style={INLINE_STYLES.textPrimary}
                      >
                        {type.label}
                      </Label>
                      <p
                        className="mt-0.5 text-[11px]"
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

          <div className="space-y-2">
            <Label
              htmlFor="reason"
              className="text-xs font-bold"
              style={INLINE_STYLES.textPrimary}
            >
              Descreva o problema (minimo 50 caracteres)
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explique detalhadamente por que voce esta contestando esta mencao."
              rows={5}
              className="resize-none rounded-lg border-0 text-sm"
              style={{ backgroundColor: "#12181B", color: "#FFFFFF" }}
            />
            <div className="flex justify-between text-[10px]">
              <span
                style={{
                  color: reason.length < 50 ? "#EF4444" : "#9CA3AF",
                }}
              >
                Minimo: 50 caracteres
              </span>
              <span
                style={{
                  color: reason.length > 500 ? "#EF4444" : "#4FD1C5",
                }}
              >
                {reason.length}/500
              </span>
            </div>
          </div>

          <div
            className="flex items-start gap-3 rounded-lg border p-3"
            style={{
              backgroundColor: "rgba(79, 209, 197, 0.1)",
              borderColor: "rgba(79, 209, 197, 0.3)",
            }}
          >
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-400" />
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-bold text-teal-400">Fluxo</p>
              <ul
                className="space-y-1 text-[11px] leading-relaxed"
                style={INLINE_STYLES.textSecondary}
              >
                <li>- Contestacao registrada para moderacao</li>
                <li>- Revisao administrativa no painel central</li>
                <li>- Decisao e acao disciplinar, se aplicavel</li>
              </ul>
            </div>
          </div>
        </div>

        <div
          className="flex flex-shrink-0 justify-end gap-3 border-t p-4"
          style={{
            borderColor: "rgba(255, 255, 255, 0.1)",
            backgroundColor: "#12181B",
          }}
        >
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="h-9 rounded-lg border-2 px-4 text-xs"
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
            className="h-9 rounded-lg px-6 text-xs font-bold"
            style={{
              background:
                reason.length >= 50 && reason.length <= 500
                  ? "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)"
                  : "#2D3748",
              color: "#FFFFFF",
            }}
          >
            {submitting ? "Enviando..." : "Enviar contestacao"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
