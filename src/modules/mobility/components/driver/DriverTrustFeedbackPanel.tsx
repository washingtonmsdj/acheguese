import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TRUST_ACTOR_ROLES,
  TRUST_CONTEXT_TYPES,
  TrustFeedbackForm,
  type TrustActorRole,
  type TrustFeedbackReason,
  type TrustFeedbackTarget,
} from "@/core/trust";
import { OrderDeliverySSOTService } from "@/modules/mobility/delivery/services/OrderDeliverySSOTService";
import type { MobilityRide } from "./DriverRidesTab";

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

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function DriverTrustFeedbackPanel({ ride }: DriverTrustFeedbackPanelProps) {
  const isDelivery = ride.ride_mode === "motoboy" || ride.type === "entrega";
  const sourceType = getString(ride.source_type);
  const sourceId = getString(ride.source_id);
  const passengerProfileId = getString(ride.passenger_profile_id);

  const orderQuery = useQuery({
    queryKey: ["trust-feedback", "ride-order", sourceId],
    queryFn: async () => {
      if (!sourceId) return null;
      const result = await OrderDeliverySSOTService.getOrderById(sourceId);
      return result.success ? result.data ?? null : null;
    },
    enabled: isDelivery && sourceType === "gastronomy" && Boolean(sourceId),
    staleTime: 5 * 60 * 1000,
  });

  const actorRole: TrustActorRole = isDelivery
    ? TRUST_ACTOR_ROLES.COURIER
    : TRUST_ACTOR_ROLES.DRIVER;

  const targets = useMemo<TrustFeedbackTarget[]>(() => {
    const feedbackTargets: TrustFeedbackTarget[] = [];

    if (passengerProfileId) {
      feedbackTargets.push({
        id: passengerProfileId,
        label: isDelivery ? "Cliente da entrega" : "Passageiro",
        subjectRole: TRUST_ACTOR_ROLES.CUSTOMER,
        helper: "Feedback privado sobre confianca operacional do solicitante.",
      });
    }

    if (isDelivery && orderQuery.data?.merchant_profile_id) {
      feedbackTargets.push({
        id: orderQuery.data.merchant_profile_id,
        label: "Loja/restaurante",
        subjectRole: TRUST_ACTOR_ROLES.MERCHANT,
        helper: "Feedback privado do motoboy sobre retirada, pacote e operacao da loja.",
      });
    }

    return feedbackTargets;
  }, [isDelivery, orderQuery.data?.merchant_profile_id, passengerProfileId]);

  return (
    <TrustFeedbackForm
      title={isDelivery ? "Feedback da entrega" : "Feedback da corrida"}
      notice="Feedback privado operacional. Serve para padroes de confianca e revisao admin, sem exposicao publica."
      actorRole={actorRole}
      contextType={TRUST_CONTEXT_TYPES.RIDE}
      contextId={ride.id}
      targets={targets}
      reasons={DRIVER_FEEDBACK_REASONS}
      enabled
      compact
      evidence={{
        ride_mode: ride.ride_mode,
        ride_status: ride.status,
        source_type: sourceType,
        source_id: sourceId,
        passenger_profile_id: passengerProfileId,
        driver_profile_id: getString(ride.driver_profile_id),
        merchant_profile_id: orderQuery.data?.merchant_profile_id ?? null,
      }}
    />
  );
}
