import { useMemo } from "react";
import {
  TRUST_ACTOR_ROLES,
  TrustFeedbackForm,
  type TrustFeedbackReason,
  type TrustFeedbackTarget,
} from "@/core/trust";
import { MobilityTrustService } from "@/core/mobility/services/MobilityTrustService";
import type { MobilityRide } from "@/core/mobility/types/ride";

interface DriverTrustFeedbackPanelProps {
  ride: MobilityRide;
}

const DRIVER_FEEDBACK_REASONS: TrustFeedbackReason[] = [
  { value: "smooth_operation", label: "Fluxo correto / sem problema", severity: "low" },
  { value: "passenger_no_show", label: "Cliente/passageiro ausente", severity: "medium" },
  { value: "invalid_address", label: "Endereco incorreto ou incompleto", severity: "medium" },
  { value: "pickup_delay", label: "Loja atrasou retirada", severity: "medium" },
  { value: "package_issue", label: "Pacote incorreto, aberto ou incompleto", severity: "high" },
  { value: "abusive_behavior", label: "Conduta abusiva ou insegura", severity: "critical" },
  { value: "payment_or_handoff_issue", label: "Problema no pagamento ou repasse", severity: "high" },
  { value: "other_operational_issue", label: "Outro problema operacional", severity: "medium" },
];

function getFeedbackRoles(ride: MobilityRide): Set<string> {
  const value = ride.feedback_roles;
  if (!Array.isArray(value)) return new Set();
  return new Set(value.filter((role): role is string => typeof role === "string"));
}

export function DriverTrustFeedbackPanel({ ride }: DriverTrustFeedbackPanelProps) {
  const isDelivery = ride.ride_mode === "motoboy" || ride.type === "entrega";
  const feedbackRoles = getFeedbackRoles(ride);

  const targets = useMemo<TrustFeedbackTarget[]>(() => {
    const result: TrustFeedbackTarget[] = [];

    if (feedbackRoles.has("customer")) {
      result.push({
        id: "customer",
        label: isDelivery ? "Cliente da entrega" : "Passageiro",
        subjectRole: TRUST_ACTOR_ROLES.CUSTOMER,
        helper: "Feedback privado sobre confianca operacional do solicitante.",
      });
    }

    if (feedbackRoles.has("merchant")) {
      result.push({
        id: "merchant",
        label: "Loja/restaurante",
        subjectRole: TRUST_ACTOR_ROLES.MERCHANT,
        helper: "Feedback privado do motoboy sobre retirada, pacote e operacao da loja.",
      });
    }

    return result;
  }, [feedbackRoles, isDelivery]);

  if (targets.length === 0) return null;

  return (
    <TrustFeedbackForm
      title={isDelivery ? "Feedback da entrega" : "Feedback da corrida"}
      notice="Feedback privado operacional. Serve para padroes de confianca e revisao admin, sem exposicao publica."
      targets={targets}
      reasons={DRIVER_FEEDBACK_REASONS}
      enabled
      compact
      onSubmit={(input) => MobilityTrustService.submitFeedback(ride.id, input)}
    />
  );
}