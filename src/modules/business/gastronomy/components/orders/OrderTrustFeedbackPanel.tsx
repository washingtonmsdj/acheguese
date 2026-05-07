import {
  TRUST_ACTOR_ROLES,
  TRUST_CONTEXT_TYPES,
  TrustFeedbackForm,
  type TrustFeedbackReason,
  type TrustFeedbackTarget,
} from "@/core/trust";
import type { OrderStatus, OrderWithItems } from "@/modules/business/gastronomy/services/OrderService";

interface OrderTrustFeedbackPanelProps {
  order: OrderWithItems;
}

const FINAL_STATUSES: OrderStatus[] = ["delivered", "completed", "cancelled"];

const ORDER_FEEDBACK_REASONS: TrustFeedbackReason[] = [
  { value: "smooth_operation", label: "Fluxo correto / sem problema", severity: "low" },
  { value: "customer_late_cancel", label: "Cliente cancelou tarde", severity: "high" },
  { value: "customer_no_show", label: "Cliente ausente / nao respondeu", severity: "medium" },
  { value: "invalid_address", label: "Endereco incorreto ou incompleto", severity: "medium" },
  { value: "abusive_behavior", label: "Conduta abusiva ou insegura", severity: "critical" },
  { value: "courier_delay", label: "Motoboy atrasou retirada/entrega", severity: "medium" },
  { value: "courier_package_issue", label: "Problema com pacote/entrega", severity: "high" },
  { value: "other_operational_issue", label: "Outro problema operacional", severity: "medium" },
];

export function OrderTrustFeedbackPanel({ order }: OrderTrustFeedbackPanelProps) {
  const targets: TrustFeedbackTarget[] = [];

  if (order.customer_id) {
    targets.push({
      id: order.customer_id,
      label: `Cliente: ${order.customer_name || order.customer_id.slice(0, 8)}`,
      subjectRole: TRUST_ACTOR_ROLES.CUSTOMER,
      helper: "Feedback privado da loja sobre confianca operacional do cliente.",
    });
  }

  if (order.courier_profile_id) {
    targets.push({
      id: order.courier_profile_id,
      label: `Motoboy: ${order.courier_profile_id.slice(0, 8)}`,
      subjectRole: TRUST_ACTOR_ROLES.COURIER,
      helper: "Feedback privado da loja sobre execucao da entrega.",
    });
  }

  return (
    <TrustFeedbackForm
      actorRole={TRUST_ACTOR_ROLES.MERCHANT}
      contextType={TRUST_CONTEXT_TYPES.ORDER}
      contextId={order.id}
      targets={targets}
      reasons={ORDER_FEEDBACK_REASONS}
      enabled={FINAL_STATUSES.includes(order.status)}
      unavailableMessage="O feedback fica disponivel quando o pedido for entregue, concluido ou cancelado."
      evidence={{
        order_status: order.status,
        order_total: order.total,
        business_profile_id: order.business_id,
        customer_profile_id: order.customer_id,
        courier_profile_id: order.courier_profile_id,
      }}
    />
  );
}
