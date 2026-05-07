import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TRUST_ACTOR_ROLES,
  TRUST_CONTEXT_TYPES,
  TrustFeedbackForm,
  type TrustFeedbackReason,
  type TrustFeedbackTarget,
} from "@/core/trust";
import { useSessionContext } from "@/core/session";
import { ClassifiedTrustService } from "@/modules/classifieds/services";

interface ClassifiedTrustFeedbackPanelProps {
  classifiedId: string;
  sellerId: string;
  classifiedStatus?: string;
}

const CLASSIFIED_FEEDBACK_REASONS: TrustFeedbackReason[] = [
  { value: "smooth_negotiation", label: "Negociacao concluida sem problema", severity: "low" },
  { value: "late_cancellation", label: "Cancelamento tardio que gerou prejuizo", severity: "high" },
  { value: "no_show", label: "Nao compareceu para retirada/encontro", severity: "medium" },
  { value: "abusive_behavior", label: "Conduta abusiva ou insegura", severity: "critical" },
  { value: "payment_issue", label: "Problema de pagamento ou repasse", severity: "high" },
  { value: "mismatch_item_state", label: "Produto nao correspondia ao combinado", severity: "high" },
  { value: "other_negotiation_issue", label: "Outro problema na negociacao", severity: "medium" },
];

export function ClassifiedTrustFeedbackPanel({
  classifiedId,
  sellerId,
  classifiedStatus,
}: ClassifiedTrustFeedbackPanelProps) {
  const { activeProfile } = useSessionContext();

  const participantsQuery = useQuery({
    queryKey: ["classified-trust-participants", classifiedId],
    queryFn: () => ClassifiedTrustService.listConversationParticipants(classifiedId),
    enabled: Boolean(classifiedId),
    staleTime: 5 * 60 * 1000,
  });

  const isSeller = activeProfile?.id === sellerId;

  const targets = useMemo<TrustFeedbackTarget[]>(() => {
    if (!activeProfile?.id) return [];
    const participants = participantsQuery.data ?? [];

    if (isSeller) {
      const uniqueBuyers = new Map<string, string>();
      for (const row of participants) {
        if (!row.buyerId || row.buyerId === activeProfile.id) continue;
        if (!uniqueBuyers.has(row.buyerId)) {
          uniqueBuyers.set(row.buyerId, row.buyerName ?? `Comprador ${row.buyerId.slice(0, 8)}`);
        }
      }

      return Array.from(uniqueBuyers.entries()).map(([id, name]) => ({
        id,
        label: `Comprador: ${name}`,
        subjectRole: TRUST_ACTOR_ROLES.CUSTOMER,
        helper: "Feedback privado do vendedor sobre o comprador da negociacao.",
      }));
    }

    const hadConversationWithSeller = participants.some(
      (row) => row.sellerId === sellerId && row.buyerId === activeProfile.id,
    );

    if (!hadConversationWithSeller || !sellerId) return [];

    return [
      {
        id: sellerId,
        label: "Vendedor",
        subjectRole: TRUST_ACTOR_ROLES.MERCHANT,
        helper: "Feedback privado do comprador sobre conduta e cumprimento do combinado.",
      },
    ];
  }, [activeProfile?.id, isSeller, participantsQuery.data, sellerId]);

  const enabled = classifiedStatus === "sold";
  const actorRole = isSeller ? TRUST_ACTOR_ROLES.MERCHANT : TRUST_ACTOR_ROLES.CUSTOMER;

  return (
    <TrustFeedbackForm
      title="Confianca da negociacao"
      notice="Registro privado bilateral comprador-vendedor para suporte a moderacao e penalidades quando necessario."
      actorRole={actorRole}
      contextType={TRUST_CONTEXT_TYPES.CLASSIFIED}
      contextId={classifiedId}
      targets={targets}
      reasons={CLASSIFIED_FEEDBACK_REASONS}
      enabled={enabled}
      compact
      unavailableMessage="O feedback bilateral fica disponivel quando o anuncio for marcado como vendido."
      evidence={{
        classified_id: classifiedId,
        classified_status: classifiedStatus ?? null,
        seller_profile_id: sellerId,
        actor_profile_id: activeProfile?.id ?? null,
      }}
    />
  );
}

