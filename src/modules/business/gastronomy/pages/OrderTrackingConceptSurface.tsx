import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { format, parseISO } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import {
  ArrowLeft,
  Bike,
  Check,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  CreditCard,
  FileCheck2,
  Info,
  List,
  MoreHorizontal,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  UserRound,
  Loader2,
  Utensils,
} from "lucide-react";

import { useAppUrls } from "@/core/routing/hooks";
import { buildTelUrl } from "@/shared/utils/contactLinks";
import { cn } from "@/shared/utils/cn";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { RideTrackingMap } from "@/core/mobility/components";
import { useOrderTracking } from "../hooks/useOrderTracking";
import type { OrderTrackingRide, UseOrderTrackingResult } from "../hooks/useOrderTracking";
import type { OrderWithItems } from "../services/OrderService";
import { OrderPublicReviewPanel } from "../components/orders/OrderPublicReviewPanel";
import foodImage from "@/assets/gastronomy/cat-restaurantes.jpg";
import { formatBrl } from "../utils/currency";
import type { DriverLocationData } from "@/core/mobility/hooks/useDriverLocation";

type TrackingState = "preparing" | "in_delivery" | "stale" | "completed" | "cancelled";

const TRACKING_DELIVERY_STATUSES = new Set([
  "pickup_confirmed",
  "in_delivery",
]);

const TRACKING_COMPLETED_STATUSES = new Set(["delivered", "completed"]);

const TRACKING_STATUS_LABELS: Record<string, string> = {
  requested: "Buscando entregador",
  searching_driver: "Buscando entregador",
  driver_assigned: "Responsável pela entrega definido",
  driver_accepted: "Responsável confirmou a entrega",
  driver_arriving: "A caminho",
  pickup_confirmed: "Pedido coletado",
  in_delivery: "A caminho",
  delivered: "Entrega concluída",
  completed: "Entrega concluída",
  cancelled: "Entrega cancelada",
  failed: "Falha na entrega",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending_payment: "Aguardando confirmação",
  pending_confirmation: "Aguardando confirmação",
  paid: "Confirmado",
  confirmed_by_store: "Confirmado pela loja",
  not_applicable: "Pago diretamente à loja",
  refunded: "Reembolsado",
  partially_refunded: "Reembolso parcial",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: "PIX na entrega/retirada",
  card_on_delivery: "Cartão na entrega/retirada",
  debit_card: "Cartão de débito",
  credit_card: "Cartão de crédito",
  cash: "Dinheiro na entrega/retirada",
  online: "Pagamento online",
  payment_link: "Link de pagamento",
};

function formatDateTime(value: string | null | undefined): string | null {
  if (!value) return null;
  return format(parseISO(value), "dd/MM 'às' HH:mm", { locale: ptBR });
}

function formatTime(value: string | null | undefined): string | null {
  if (!value) return null;
  return format(parseISO(value), "HH:mm", { locale: ptBR });
}

function formatCompletedDateTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = parseISO(value);
  const today = format(new Date(), "yyyy-MM-dd");
  const dateLabel = format(date, "yyyy-MM-dd") === today
    ? "Hoje"
    : format(date, "dd/MM", { locale: ptBR });
  return `${dateLabel} às ${format(date, "HH:mm", { locale: ptBR })}`;
}

function resolveTrackingState(
  order: OrderWithItems,
  rideStatus: string | null | undefined,
  isTrackingActive: boolean,
): TrackingState {
  if (
    order.status === "cancelled" ||
    rideStatus === "cancelled" ||
    rideStatus === "failed"
  ) {
    return "cancelled";
  }

  if (
    order.status === "delivered" ||
    order.status === "completed" ||
    TRACKING_COMPLETED_STATUSES.has(rideStatus ?? "") ||
    order.proof_of_delivery
  ) {
    return "completed";
  }

  const deliveryStarted =
    order.status === "out_for_delivery" ||
    TRACKING_DELIVERY_STATUSES.has(rideStatus ?? "");

  if (!deliveryStarted) return "preparing";
  return isTrackingActive ? "in_delivery" : "stale";
}

function resolveKitchenLabel(order: OrderWithItems): string {
  switch (order.status) {
    case "pending":
      return "Aguardando confirmação da loja";
    case "confirmed":
      return "Pedido confirmado pela loja";
    case "preparing":
      return "Preparando seu pedido";
    case "ready":
      return "Pedido pronto para sair";
    case "out_for_delivery":
      return "Pedido coletado";
    case "delivered":
    case "completed":
      return "Pedido preparado e enviado";
    case "cancelled":
      return "Pedido cancelado";
    default:
      return "Atualização da cozinha";
  }
}

function resolveHeroCopy(
  state: TrackingState,
  isDelivery: boolean,
): { title: string; description: string } {
  if (state === "in_delivery") {
    return {
      title: "Está chegando",
      description: "A entrega está a caminho.",
    };
  }

  if (state === "stale") {
    return {
      title: "Localização sem atualização",
      description: "Última posição identificada. A previsão volta quando o sinal retornar.",
    };
  }

  if (state === "completed") {
    return {
      title: isDelivery ? "Pedido entregue" : "Pedido concluído",
      description: "Confira o comprovante e conte como foi sua experiência.",
    };
  }

  if (state === "cancelled") {
    return {
      title: "Pedido cancelado",
      description: "Acompanhe os detalhes abaixo ou fale com a loja se precisar de ajuda.",
    };
  }

  return {
    title: "Seu pedido está em preparo",
    description: "A loja já confirmou o pedido.",
  };
}

function PreparationPotIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role="img"
      aria-label="Pedido sendo preparado"
    >
      <path d="M18 14c0-2.2 2-2.6 2-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M28 14c0-2.2 2-2.6 2-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M13 19h22" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M16 19v-2h16v2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 23h26" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M14 23l2.1 12.4A4 4 0 0 0 20 38.7h8a4 4 0 0 0 3.9-3.3L34 23" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 27H9a3 3 0 0 1-3-3v-1M34 27h5a3 3 0 0 0 3-3v-1" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function StatusIcon({ state }: { state: TrackingState }) {
  if (state === "completed") {
    return <Check className="h-6 w-6 text-white" strokeWidth={3} aria-hidden="true" />;
  }
  if (state === "cancelled") {
    return <CircleAlert className="h-6 w-6 text-destructive" aria-hidden="true" />;
  }
  if (state === "in_delivery" || state === "stale") {
    return <Bike className="h-6 w-6 text-territory-brand" aria-hidden="true" />;
  }
  return <PreparationPotIcon className="h-9 w-9 text-territory-brand" />;
}

function PreparationStagesCard({
  order,
  isDelivery,
  deliveryStageLabel,
}: {
  order: OrderWithItems;
  isDelivery: boolean;
  deliveryStageLabel: string;
}) {
  return (
    <section className="rounded-xl border border-territory-border bg-territory-surface px-3">
      <div className="flex min-h-12 items-center gap-3 sm:min-h-14">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-territory-warning/15">
          <ChefHat className="h-5 w-5 text-territory-warning" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-sm font-bold text-territory-ink">Na cozinha</strong>
          <span className="mt-0.5 block text-xs text-territory-muted">{resolveKitchenLabel(order)}</span>
        </span>
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-territory-warning" aria-label="Em preparo" />
        <ChevronRight className="h-4 w-4 shrink-0 text-territory-muted" aria-hidden="true" />
      </div>
      {isDelivery ? (
        <>
          <Separator />
          <div className="flex min-h-12 items-center gap-3 sm:min-h-14">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-territory-raised">
              <Bike className="h-5 w-5 text-territory-ink" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm font-bold text-territory-ink">Na entrega</strong>
              <span className="mt-0.5 block text-xs text-territory-muted">
                {deliveryStageLabel}
              </span>
            </span>
            <MoreHorizontal className="h-5 w-5 shrink-0 text-territory-muted" aria-label="Aguardando" />
            <ChevronRight className="h-4 w-4 shrink-0 text-territory-muted" aria-hidden="true" />
          </div>
        </>
      ) : null}
    </section>
  );
}

function DeliveryStagesCard({
  kitchenLabel,
  deliveryLabel,
}: {
  kitchenLabel: string;
  deliveryLabel: string;
}) {
  return (
    <section className="grid grid-cols-2 gap-1.5 rounded-xl border border-territory-border bg-territory-surface p-1.5 sm:gap-3 sm:p-3">
      <div className="flex min-w-0 items-center gap-1.5 rounded-lg bg-territory-raised p-1.5 sm:gap-3 sm:p-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-territory-success/10 sm:h-8 sm:w-8">
          <Check className="h-4 w-4 text-territory-success" aria-hidden="true" />
        </span>
        <span className="min-w-0 text-[0.625rem] leading-3 sm:text-sm sm:leading-4">
          <strong className="block truncate">Cozinha</strong>
          <span className="block whitespace-nowrap text-[0.625rem] leading-3 text-territory-muted sm:text-xs sm:leading-4">
            {kitchenLabel}
          </span>
        </span>
      </div>
      <div className="flex min-w-0 items-center gap-1.5 rounded-lg bg-territory-raised p-1.5 sm:gap-3 sm:p-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-territory-success/10 sm:h-8 sm:w-8">
          <Check className="h-4 w-4 text-territory-success" aria-hidden="true" />
        </span>
        <span className="min-w-0 text-[0.625rem] leading-3 sm:text-sm sm:leading-4">
          <strong className="block truncate">Entrega</strong>
          <span className="block whitespace-nowrap text-[0.625rem] leading-3 text-territory-muted sm:text-xs sm:leading-4">
            {deliveryLabel}
          </span>
        </span>
      </div>
    </section>
  );
}

function PreparationAddressCard({ order }: { order: OrderWithItems }) {
  if (order.order_type !== "delivery") return null;

  const normalizedAddress = order.delivery_address?.toLocaleLowerCase() ?? "";
  const normalizedComplement = order.delivery_complement?.toLocaleLowerCase() ?? "";
  const addressLines = [
    order.delivery_address,
    normalizedComplement && !normalizedAddress.includes(normalizedComplement)
      ? order.delivery_complement
      : null,
    [order.delivery_neighborhood, order.delivery_city]
      .filter(Boolean)
      .join(" · "),
    order.delivery_state,
  ].filter(Boolean);

  return (
    <section className="rounded-xl border border-territory-border bg-territory-surface px-4 py-3">
      <div className="flex items-start gap-3">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-territory-ink">Entrega</p>
          {addressLines.length ? (
            <p className="mt-1 break-words text-sm leading-5 text-territory-muted">
              {addressLines.join(", ")}
            </p>
          ) : (
            <p className="mt-1 text-sm text-territory-muted">
              Endereço completo não disponível no pedido.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function resolvePreparationPaymentStatus(
  order: OrderWithItems,
  metadataKey: string,
): string {
  const metadataValue = order.source_metadata?.[metadataKey];
  if (typeof metadataValue === "string" && metadataValue.trim()) return metadataValue;
  return order.payment_status;
}

function PaymentStateIndicator({ status, labelOverride }: { status: string; labelOverride?: string }) {
  const isPending = status === "pending_payment" || status === "pending_confirmation";
  const label = labelOverride ?? PAYMENT_STATUS_LABELS[status] ?? status;
  return (
    <span className={cn(
      "inline-flex min-w-0 items-center gap-1 whitespace-nowrap text-right text-[0.625rem] font-semibold",
      isPending ? "text-territory-warning" : "text-territory-success",
    )}>
      {isPending ? (
        <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
      <span>{label}</span>
    </span>
  );
}

function PreparationPaymentCard({ order }: { order: OrderWithItems }) {
  const productStatus = resolvePreparationPaymentStatus(order, "payment_product_status");
  const deliveryStatus = resolvePreparationPaymentStatus(order, "payment_delivery_status");

  return (
    <section className="rounded-xl border border-territory-border bg-territory-surface">
      <div className="flex min-h-10 items-center gap-2 px-3 text-sm font-bold text-territory-ink sm:min-h-12 sm:px-4">
        <CreditCard className="h-4 w-4 text-territory-brand" aria-hidden="true" />
        Pagamento
      </div>
      <div className="space-y-2 border-t border-territory-border px-3 py-2 sm:space-y-3 sm:px-4 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-territory-muted">
            <span className="whitespace-nowrap">Produtos · <span className="font-semibold text-territory-ink">{formatBrl(order.subtotal)}</span></span>
          </span>
          <PaymentStateIndicator status={productStatus} />
        </div>
        {order.order_type === "delivery" && order.delivery_fee > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-territory-muted">
              <span className="whitespace-nowrap">Entrega · <span className="font-semibold text-territory-ink">{formatBrl(order.delivery_fee)}</span></span>
            </span>
            <PaymentStateIndicator status={deliveryStatus} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function DeliveryAddressCard({
  order,
  defaultOpen,
}: {
  order: OrderWithItems;
  defaultOpen: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  if (order.order_type !== "delivery") return null;

  const normalizedAddress = order.delivery_address?.toLocaleLowerCase() ?? "";
  const normalizedComplement = order.delivery_complement?.toLocaleLowerCase() ?? "";
  const addressLines = [
    order.delivery_address,
    normalizedComplement && !normalizedAddress.includes(normalizedComplement)
      ? order.delivery_complement
      : null,
    [order.delivery_neighborhood, order.delivery_city]
      .filter(Boolean)
      .join(" · "),
    order.delivery_state,
  ].filter(Boolean);

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className="group rounded-xl border border-territory-border bg-territory-surface"
    >
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-bold text-territory-ink sm:min-h-12 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-territory-brand" aria-hidden="true" />
          Entrega e endereço
        </span>
        <ChevronDown className="h-4 w-4 text-territory-muted transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-territory-border px-4 pb-4 pt-3">
        {addressLines.length ? (
          <p className="break-words text-sm text-territory-muted">
            {addressLines.join(", ")}
          </p>
        ) : (
          <p className="text-sm text-territory-muted">
            Endereço completo não disponível no pedido.
          </p>
        )}
      </div>
    </details>
  );
}

function TrackingInfoCard({ state }: { state: TrackingState }) {
  const message =
    state === "preparing"
      ? "Você verá o trajeto quando a entrega começar."
      : "O acompanhamento do pedido continua disponível.";

  return (
    <Card className="border-territory-info/20 bg-territory-info/10">
      <CardContent className="flex items-start gap-2 p-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-territory-info" aria-hidden="true" />
        <p className="text-[0.625rem] leading-4 text-territory-muted">{message}</p>
      </CardContent>
    </Card>
  );
}

function PaymentSummary({
  order,
  defaultOpen,
  completed = false,
  desktopFlat = false,
}: {
  order: OrderWithItems;
  defaultOpen: boolean;
  completed?: boolean;
  desktopFlat?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const paymentStatus =
    PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status;
  const paymentMethod =
    PAYMENT_METHOD_LABELS[order.payment_method ?? ""] ??
    order.payment_method ??
    "Pagamento";

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className={cn(
        "group rounded-xl border border-territory-border bg-territory-surface",
        desktopFlat && "md:rounded-none md:border-0 md:bg-transparent",
      )}
    >
      <summary className={cn(
        "flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-bold text-territory-ink sm:min-h-12 [&::-webkit-details-marker]:hidden",
        desktopFlat && "md:min-h-9 md:px-0",
      )}>
        <span className="flex min-w-0 items-center gap-2">
          <CreditCard className="h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />
          <span className="truncate">
            {defaultOpen ? "Pagamento" : `Itens e pagamento · ${formatBrl(order.total)}`}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-territory-muted transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className={cn(
        "space-y-2 border-t border-territory-border px-3 pb-3 pt-3 text-sm sm:space-y-3 sm:px-4 sm:pb-4",
        desktopFlat && "md:px-0",
      )}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-territory-muted">Produtos</span>
          <span className="flex items-center gap-2">
            <span className="font-semibold">{formatBrl(order.subtotal)}</span>
            {completed ? <PaymentStateIndicator status={resolvePreparationPaymentStatus(order, "payment_product_status")} /> : null}
          </span>
        </div>
        {order.order_type === "delivery" && order.delivery_fee > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-territory-muted">{completed ? "Entrega" : "Taxa de entrega"}</span>
            <span className="flex items-center gap-2">
              <span className="font-semibold">{formatBrl(order.delivery_fee)}</span>
              {completed ? (
                <PaymentStateIndicator
                  status={resolvePreparationPaymentStatus(order, "payment_delivery_status")}
                  labelOverride="Confirmada"
                />
              ) : null}
            </span>
          </div>
        ) : null}
        {order.discount > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-territory-muted">Desconto</span>
            <span className="font-semibold text-territory-success">
              -{formatBrl(order.discount)}
            </span>
          </div>
        ) : null}
        <Separator />
        <div className={cn(
          "flex items-center justify-between gap-3 text-base font-bold",
          completed && "rounded-lg bg-territory-warning/10 px-3 py-2",
        )}>
          <span>Total</span>
          <span>{formatBrl(order.total)}</span>
        </div>
        {!completed ? (
          <p className="text-xs text-territory-muted">
            <span className="font-semibold text-territory-ink">{paymentMethod}</span>
            <span className="mx-1" aria-hidden="true">·</span>
            {paymentStatus}
          </p>
        ) : null}
      </div>
    </details>
  );
}

function ItemsSummary({ order }: { order: OrderWithItems }) {
  return (
    <details className="group rounded-xl border border-territory-border bg-territory-surface">
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-bold text-territory-ink sm:min-h-12 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <Package className="h-4 w-4 text-territory-brand" aria-hidden="true" />
          Itens e observações
        </span>
        <ChevronDown className="h-4 w-4 text-territory-muted transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="space-y-3 border-t border-territory-border px-4 py-3">
        {order.items?.length ? (
          order.items.map((item, index) => (
            <div key={item.id ?? `${item.name}-${index}`} className="flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold text-territory-ink">
                  {item.quantity} × {item.name}
                </p>
                {item.notes ? (
                  <p className="mt-0.5 break-words text-xs text-territory-muted">{item.notes}</p>
                ) : null}
              </div>
              <span className="shrink-0 font-semibold">{formatBrl(item.total)}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-territory-muted">Itens do pedido não disponíveis.</p>
        )}
        {order.notes ? (
          <div className="border-t border-territory-border pt-3 text-sm">
            <p className="font-semibold text-territory-ink">Observações</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-territory-muted">{order.notes}</p>
          </div>
        ) : null}
      </div>
    </details>
  );
}

function HistorySummary({
  order,
  showEmpty = false,
  title = "Histórico do pedido",
}: {
  order: OrderWithItems;
  showEmpty?: boolean;
  title?: string;
}) {
  if (!order.status_history.length && !showEmpty) return null;

  return (
    <details className="group rounded-xl border border-territory-border bg-territory-surface">
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-bold text-territory-ink sm:min-h-12 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-territory-brand" aria-hidden="true" />
          {title}
        </span>
        <ChevronDown className="h-4 w-4 text-territory-muted transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="space-y-3 border-t border-territory-border px-4 py-3">
        {order.status_history.length ? order.status_history.map((event) => {
          const toStatus = event.to_status
            ? TRACKING_STATUS_LABELS[event.to_status] ?? event.to_status
            : "Atualização recebida";
          const date = formatDateTime(event.created_at);
          return (
            <div key={event.id} className="flex items-start gap-3 text-sm">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-territory-brand" />
              <div className="min-w-0">
                <p className="font-semibold text-territory-ink">{toStatus}</p>
                {date ? <p className="text-xs text-territory-muted">{date}</p> : null}
                {event.notes ? <p className="mt-0.5 break-words text-xs text-territory-muted">{event.notes}</p> : null}
              </div>
            </div>
          );
        }) : (
          <p className="text-sm text-territory-muted">O histórico aparecerá conforme o pedido avançar.</p>
        )}
      </div>
    </details>
  );
}

function CompletionRecipientCard({ order }: { order: OrderWithItems }) {
  return (
    <section className="rounded-xl border border-territory-border bg-territory-surface px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex items-center gap-3">
        <UserRound className="h-5 w-5 shrink-0 text-territory-ink" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-xs text-territory-muted">Recebido por</p>
          <p className="truncate text-sm font-semibold text-territory-ink">{order.customer_name}</p>
        </div>
      </div>
    </section>
  );
}

function CompletionProof({ order }: { order: OrderWithItems }) {
  const proof = order.proof_of_delivery;
  if (!proof) {
    return (
      <section className="rounded-xl border border-territory-border bg-territory-surface px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-3">
          <FileCheck2 className="h-5 w-5 shrink-0 text-territory-success" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-territory-ink">Comprovante de entrega</p>
            <p className="text-xs text-territory-muted">Indisponível no momento</p>
          </div>
        </div>
      </section>
    );
  }

  const signedAt = formatDateTime(proof.signed_at);

  return (
    <details className="group rounded-xl border border-territory-border bg-territory-surface md:rounded-lg">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm font-bold text-territory-ink sm:px-4 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-2">
          <FileCheck2 className="h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block truncate">Comprovante de entrega</span>
            <span className="hidden text-[0.6875rem] font-normal text-territory-muted md:block">
              A confirmação de entrega está disponível.
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-territory-brand md:rounded-md md:border md:border-territory-brand md:px-3 md:py-1.5 md:text-[0.6875rem]">
          Ver comprovante
          <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden="true" />
        </span>
      </summary>
      <div className="space-y-3 border-t border-territory-border px-3 pb-3 pt-3 text-sm sm:px-4">
        {proof.code ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-territory-muted">Código</span>
            <span className="font-semibold">{proof.code}</span>
          </div>
        ) : null}
        {signedAt ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-territory-muted">Confirmado em</span>
            <span className="font-semibold">{signedAt}</span>
          </div>
        ) : null}
        {proof.observation ? (
          <p className="break-words text-territory-muted">{proof.observation}</p>
        ) : null}
        {proof.photo_url ? (
          <img
            src={proof.photo_url}
            alt="Comprovante de entrega"
            className="max-h-64 w-full rounded-lg border object-cover"
          />
        ) : null}
      </div>
    </details>
  );
}

function DesktopTrackingHeader({
  customerName,
  onBack,
}: {
  customerName: string;
  onBack: () => void;
}) {
  return (
    <header className="hidden border-b border-territory-brand/30 bg-territory-brand md:block">
      <div className="flex h-12 w-full items-center gap-6 px-6 text-white lg:px-8">
        <span className="font-heading text-xl font-black tracking-[-0.06em]">
          achegue-se<span className="text-territory-warning">.</span>
        </span>
        <span className="h-6 w-px bg-white/20" aria-hidden="true" />
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-white/90 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <List className="h-4 w-4" aria-hidden="true" />
          Meus pedidos
        </button>
        <div className="ml-auto flex items-center gap-2 text-xs font-semibold">
          <UserRound className="h-4 w-4" aria-hidden="true" />
          <span>{customerName}</span>
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}

function DesktopStatusHero({
  state,
  hero,
  deliveryEstimate,
  heroDescription,
  staleNote,
  completedAtLabel,
}: {
  state: TrackingState;
  hero: { title: string; description: string };
  deliveryEstimate: string | null;
  heroDescription: string | null;
  staleNote: string | null;
  completedAtLabel: string | null;
}) {
  const title =
    state === "preparing"
      ? "Seu pedido está em preparo"
      : state === "in_delivery" || state === "stale"
        ? "Seu pedido está a caminho"
        : hero.title;
  const description =
    state === "preparing"
      ? "A loja já está preparando o seu pedido."
      : state === "in_delivery" || state === "stale"
        ? "O entregador já está a caminho da sua entrega."
        : heroDescription;

  return (
    <section
      className="p-0"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-heading text-2xl font-bold leading-tight tracking-[-0.04em] text-territory-ink">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-territory-muted">{description}</p> : null}
          {completedAtLabel ? <p className="mt-0.5 text-xs font-semibold text-territory-muted">{completedAtLabel}</p> : null}
        </div>
        {deliveryEstimate ? (
          <div className="flex shrink-0 items-center gap-2 rounded-lg bg-territory-warning/15 px-3 py-2 text-xs">
            <Clock3 className="h-5 w-5 text-territory-warning" aria-hidden="true" />
            <div>
              <p className="font-bold text-territory-ink">{deliveryEstimate}</p>
              <p className="text-[0.6875rem] text-territory-muted">Estimativa, pode variar.</p>
            </div>
          </div>
        ) : null}
      </div>
      {state === "stale" ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-territory-warning/25 px-3 py-2 text-xs text-territory-ink">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-territory-warning" aria-hidden="true" />
          <span>
            <strong className="block">Localização sem atualização</strong>
            <span className="text-territory-muted">
              {heroDescription ?? staleNote ?? "A previsão será atualizada quando o sinal voltar."}
              {staleNote && heroDescription ? ` ${staleNote}` : ""}
            </span>
          </span>
        </div>
      ) : null}
    </section>
  );
}

function DesktopCompletionSuccessBanner() {
  return (
    <section className="flex items-center gap-3 rounded-lg bg-territory-success/15 px-3 py-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-territory-success text-white">
        <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-territory-ink">Entrega realizada com sucesso!</p>
        <p className="text-xs text-territory-muted">Obrigado por pedir com a gente.</p>
      </div>
    </section>
  );
}

function DesktopPreparationStagesCard({
  order,
  deliveryStageLabel,
}: {
  order: OrderWithItems;
  deliveryStageLabel: string;
}) {
  return (
    <section className="grid grid-cols-2 gap-3">
      <div className="rounded-lg border border-territory-border bg-territory-surface p-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-territory-warning/15">
            <ChefHat className="h-5 w-5 text-territory-warning" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-territory-ink">Na cozinha</p>
            <p className="mt-0.5 text-xs font-semibold text-territory-ink">{resolveKitchenLabel(order)}</p>
            <p className="mt-1 text-[0.6875rem] leading-4 text-territory-muted">A equipe da loja está preparando os itens do seu pedido.</p>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-territory-border bg-territory-surface p-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-territory-raised">
            <Bike className="h-5 w-5 text-territory-ink" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-territory-ink">Na entrega</p>
            <p className="mt-0.5 text-xs font-semibold text-territory-ink">{deliveryStageLabel}</p>
            <p className="mt-1 text-[0.6875rem] leading-4 text-territory-muted">Em breve um entregador será atribuído para realizar a entrega.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DesktopProgressTimeline({ order, state }: { order: OrderWithItems; state: TrackingState }) {
  const milestones = [
    { label: "Pedido confirmado", time: order.confirmed_at },
    { label: "Em preparo", time: order.preparing_at },
    { label: "Saiu para entrega", time: order.out_for_delivery_at },
    { label: "Entregue", time: order.delivered_at ?? order.completed_at },
  ];
  const activeIndex = state === "preparing" ? 1 : state === "completed" ? 3 : 2;

  return (
    <section className="h-full rounded-lg border border-territory-border bg-territory-surface p-3">
      <h3 className="flex items-center gap-2 text-sm font-bold text-territory-ink">
        <Clock3 className="h-4 w-4 text-territory-brand" aria-hidden="true" />
        Acompanhe o andamento
      </h3>
      <ol className="mt-3 space-y-2">
        {milestones.map((milestone, index) => {
          const complete = index < activeIndex;
          const current = index === activeIndex;
          return (
            <li key={milestone.label} className="relative flex items-start gap-3 text-xs">
              {index < milestones.length - 1 ? (
                <span className="absolute left-[0.4375rem] top-4 h-5 w-px bg-territory-border" aria-hidden="true" />
              ) : null}
              <span
                className={cn(
                  "z-10 flex h-3.5 w-3.5 shrink-0 rounded-full border-2",
                  complete
                    ? "border-territory-brand bg-territory-brand"
                    : current
                      ? "border-territory-warning bg-territory-warning"
                      : "border-territory-border bg-territory-surface",
                )}
                aria-hidden="true"
              />
              <span className={cn("min-w-0 flex-1", current ? "font-bold text-territory-ink" : "text-territory-muted")}>
                {milestone.label}
              </span>
              <span className="shrink-0 text-territory-muted">{formatTime(milestone.time) ?? "Aguardando"}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function DesktopMapPlaceholder() {
  return (
    <section className="flex h-full min-h-[11rem] items-center justify-center rounded-lg bg-territory-raised p-6 text-center">
      <div className="max-w-[15rem]">
        <MapPin className="mx-auto h-9 w-9 text-territory-muted" aria-hidden="true" />
        <p className="mt-2 text-sm font-bold text-territory-ink">O mapa aparece quando o rastreamento estiver disponível.</p>
        <p className="mt-1 text-xs text-territory-muted">Assim você poderá acompanhar a entrega em tempo real.</p>
      </div>
    </section>
  );
}

function DesktopDriverCard({
  driverName,
  driverPhone,
  driverAvatarUrl,
  onMessage,
}: {
  driverName: string | null;
  driverPhone: string | null;
  driverAvatarUrl: string | null;
  onMessage: () => void;
}) {
  return (
    <section className="flex items-center justify-between gap-4 rounded-lg bg-territory-surface">
      <div className="flex min-w-0 items-center gap-3">
        {driverAvatarUrl ? (
          <img src={driverAvatarUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-territory-raised">
            <UserRound className="h-6 w-6 text-territory-brand" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-territory-ink">{driverName ?? "Responsável pela entrega"}</p>
          <p className="text-xs text-territory-muted">Entregador parceiro</p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-9 border-territory-brand bg-territory-surface px-3 text-xs font-bold text-territory-brand hover:bg-territory-raised hover:text-territory-brand"
          onClick={onMessage}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Mensagem
        </Button>
        {driverPhone ? (
          <Button asChild className="min-h-9 bg-territory-brand px-3 text-xs font-bold text-white hover:bg-territory-brand/90">
            <a href={buildTelUrl(driverPhone) ?? undefined}>
              <Phone className="h-4 w-4" aria-hidden="true" />
              Ligar
            </a>
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function getDesktopAddressLines(order: OrderWithItems) {
  const address = order.delivery_address?.toLocaleLowerCase() ?? "";
  const complement = order.delivery_complement?.toLocaleLowerCase() ?? "";
  return [
    order.delivery_address,
    complement && !address.includes(complement) ? order.delivery_complement : null,
    [order.delivery_neighborhood, order.delivery_city].filter(Boolean).join(" · "),
    order.delivery_state,
  ].filter(Boolean);
}

function DesktopAddressPanel({ order, state }: { order: OrderWithItems; state: TrackingState }) {
  if (order.order_type !== "delivery") return null;
  const addressLines = getDesktopAddressLines(order);

  return (
    <section className="border-b border-territory-border pb-3">
      <h3 className="text-sm font-bold text-territory-ink">Sua entrega</h3>
      <div className="mt-2 flex items-start gap-2">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />
        <div className="min-w-0 text-xs text-territory-muted">
          <p>{addressLines.length ? addressLines.join(", ") : "Endereço não informado"}</p>
          {state === "completed" ? <p className="mt-0.5 font-semibold text-territory-ink">Recebido: {order.customer_name}</p> : null}
        </div>
      </div>
    </section>
  );
}

function DesktopItemsPanel({ order, expanded }: { order: OrderWithItems; expanded: boolean }) {
  return (
    <section className="border-b border-territory-border py-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-territory-ink">{expanded ? "Itens do pedido" : "Itens e observações"}</h3>
        {!expanded ? <ChevronDown className="h-4 w-4 text-territory-ink" aria-hidden="true" /> : null}
      </div>
      {expanded ? (
        <div className="mt-2 space-y-2 text-xs">
          {order.items?.map((item, index) => (
            <div key={item.id ?? `${item.name}-${index}`} className="flex items-start justify-between gap-3">
              <span className="min-w-0 text-territory-muted">
                {item.name}
                {item.item_description ? <span className="block">{item.item_description}</span> : null}
              </span>
              <span className="shrink-0 font-semibold text-territory-ink">{formatBrl(item.total)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function DesktopHistoryPanel({ order, state }: { order: OrderWithItems; state: TrackingState }) {
  if (state === "preparing") return null;
  const history = [
    { label: "Pedido confirmado", time: order.confirmed_at },
    { label: "Em preparo", time: order.preparing_at },
    { label: "Saiu para entrega", time: order.out_for_delivery_at },
    { label: "Entregue", time: order.delivered_at ?? order.completed_at },
  ].filter((item) => item.time && (state === "completed" || item.label !== "Entregue"));
  const visibleHistory = state === "completed" ? [...history].reverse() : history.slice(-1);

  return (
    <section className="border-b border-territory-border py-3">
      <h3 className="text-sm font-bold text-territory-ink">{state === "completed" ? "Histórico do pedido" : "Histórico"}</h3>
      <ol className="mt-2 space-y-1">
        {visibleHistory.map((item, index) => (
          <li key={item.label} className="relative flex items-center gap-2 pl-5 text-xs">
            {index < visibleHistory.length - 1 ? (
              <span className="absolute bottom-[-0.25rem] left-[0.4375rem] top-4 w-px bg-territory-border" aria-hidden="true" />
            ) : null}
            <span
              className={cn(
                "absolute left-0 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full border-2 bg-territory-surface",
                index === 0 && state === "completed"
                  ? "h-4 w-4 border-territory-brand bg-territory-brand"
                  : "h-2.5 w-2.5 border-territory-brand",
              )}
              aria-hidden="true"
            >
              {index === 0 && state === "completed" ? <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} /> : null}
            </span>
            <span className="min-w-0 flex-1 text-territory-muted">{item.label}</span>
            <span className="shrink-0 text-territory-muted">{formatTime(item.time) ?? "—"}</span>
          </li>
        ))}
      </ol>
      {state !== "completed" ? (
        <button type="button" className="mt-2 text-xs font-semibold text-territory-brand underline-offset-2 hover:underline">
          Ver histórico completo
          <ChevronDown className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </section>
  );
}

function DesktopTrackingLayout({
  order,
  state,
  hero,
  deliveryEstimate,
  heroDescription,
  staleNote,
  completedAtLabel,
  trackingLabel,
  hasDriver,
  rideRequest,
  driverLocationOverride,
  hasRouteCoordinates,
  driverName,
  driverPhone,
  driverAvatarUrl,
  onMessage,
  onPrimaryAction,
  onHelp,
  sourceMetadata,
}: {
  order: OrderWithItems;
  state: TrackingState;
  hero: { title: string; description: string };
  deliveryEstimate: string | null;
  heroDescription: string | null;
  staleNote: string | null;
  completedAtLabel: string | null;
  trackingLabel: string;
  hasDriver: boolean;
  rideRequest: OrderTrackingRide | null;
  driverLocationOverride?: DriverLocationData;
  hasRouteCoordinates: boolean;
  driverName: string | null;
  driverPhone: string | null;
  driverAvatarUrl: string | null;
  onMessage: () => void;
  onPrimaryAction: () => void;
  onHelp: () => void;
  sourceMetadata: Record<string, unknown>;
}) {
  const deliveryMap =
    (state === "in_delivery" || state === "stale") && hasDriver && rideRequest && hasRouteCoordinates ? (
      <RideTrackingMap
        driverProfileId={rideRequest.driver_profile_id!}
        rideId={rideRequest.id}
        destinationLat={rideRequest.destination_lat}
        destinationLon={rideRequest.destination_lng}
        originLat={rideRequest.origin_lat}
        originLon={rideRequest.origin_lng}
        showETA={false}
        compact
        mode={state === "stale" ? "snapshot" : "live"}
        locationOverride={driverLocationOverride}
        compactStatusLabel={
          typeof sourceMetadata.map_update_label === "string" ? sourceMetadata.map_update_label : undefined
        }
        showSnapshotOverlay={false}
        compactFill
        trackingEnabled={!driverLocationOverride}
        className="rounded-lg"
      />
    ) : null;
  const sidebarActionLabel = state === "completed" ? "Ver cardápio da loja" : "Falar com a loja";

  return (
    <div className="grid min-h-[calc(100dvh-8.5rem)] min-w-0 grid-cols-[minmax(0,1.65fr)_minmax(19rem,0.85fr)] overflow-hidden rounded-xl border border-territory-border bg-territory-surface shadow-sm">
      <div className="flex min-h-0 min-w-0 flex-col gap-3 p-4">
        <DesktopStatusHero
          state={state}
          hero={hero}
          deliveryEstimate={deliveryEstimate}
          heroDescription={heroDescription}
          staleNote={staleNote}
          completedAtLabel={completedAtLabel}
        />

        {state === "preparing" ? (
          <>
            <DesktopPreparationStagesCard order={order} deliveryStageLabel={trackingLabel} />
            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-3">
              <DesktopProgressTimeline order={order} state={state} />
              <DesktopMapPlaceholder />
            </div>
          </>
        ) : null}

        {state === "in_delivery" || state === "stale" ? (
          <>
            <DeliveryStagesCard kitchenLabel={resolveKitchenLabel(order)} deliveryLabel={trackingLabel} />
            {deliveryMap}
            {hasDriver ? (
              <DesktopDriverCard
                driverName={driverName}
                driverPhone={driverPhone}
                driverAvatarUrl={driverAvatarUrl}
                onMessage={onMessage}
              />
            ) : null}
          </>
        ) : null}

        {state === "completed" ? (
          <>
            <DesktopCompletionSuccessBanner />
            <CompletionProof order={order} />
            <OrderPublicReviewPanel order={order} compact preview />
            <DesktopHistoryPanel order={order} state={state} />
          </>
        ) : null}
      </div>

      <aside className="flex min-h-0 min-w-0 flex-col border-l border-territory-border px-4 py-3">
        <DesktopAddressPanel order={order} state={state} />
        {state === "preparing" ? (
          <>
            <PaymentSummary order={order} defaultOpen completed={false} desktopFlat />
            <DesktopItemsPanel order={order} expanded />
          </>
        ) : null}
        {state === "in_delivery" || state === "stale" ? (
          <>
            <DesktopItemsPanel order={order} expanded={false} />
            <PaymentSummary order={order} defaultOpen completed={false} desktopFlat />
            <DesktopHistoryPanel order={order} state={state} />
          </>
        ) : null}
        {state === "completed" ? (
          <>
            <DesktopItemsPanel order={order} expanded />
            <PaymentSummary order={order} defaultOpen completed desktopFlat />
          </>
        ) : null}
        <div className={cn("mt-auto gap-2 pt-3", state === "completed" ? "flex flex-col" : "flex")}>
          <Button
            type="button"
            onClick={onPrimaryAction}
            className={cn(
              "min-h-9 flex-1 rounded-lg px-3 text-xs font-bold",
              state === "completed"
                ? "bg-territory-warning text-territory-ink hover:bg-territory-warning/90"
                : "bg-territory-brand text-white hover:bg-territory-brand/90",
            )}
          >
            {state === "completed" ? <Utensils className="h-4 w-4" aria-hidden="true" /> : <MessageCircle className="h-4 w-4" aria-hidden="true" />}
            <span className="ml-1.5">{sidebarActionLabel}</span>
          </Button>
          {state !== "preparing" ? (
            <Button
              type="button"
              variant="outline"
              onClick={onHelp}
              className="min-h-9 rounded-lg border-territory-brand bg-territory-surface px-3 text-xs font-bold text-territory-brand hover:bg-territory-raised hover:text-territory-brand"
            >
              <CircleAlert className="h-4 w-4" aria-hidden="true" />
              <span className="ml-1.5">{state === "completed" ? "Preciso de ajuda" : "Ajuda"}</span>
            </Button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

export default function OrderTrackingConceptSurface({
  order,
  trackingOverride,
  driverLocationOverride,
  reviewPreview = false,
  storeMenuUrl,
}: {
  order: OrderWithItems;
  trackingOverride?: UseOrderTrackingResult;
  driverLocationOverride?: DriverLocationData;
  reviewPreview?: boolean;
  storeMenuUrl?: string;
}) {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const liveTracking = useOrderTracking(order.id, {
    enabled: !trackingOverride,
  });
  const { rideRequest, hasTracking, isActive } = trackingOverride ?? liveTracking;
  const isDelivery = order.order_type === "delivery";
  const state = resolveTrackingState(order, rideRequest?.status, isActive);
  const sourceMetadata = order.source_metadata ?? {};
  const hero = resolveHeroCopy(state, isDelivery);
  const estimatedMinutes = order.estimated_delivery_time;
  const deliveryEstimate =
    state === "in_delivery"
      ? typeof sourceMetadata.delivery_estimate_label === "string" && sourceMetadata.delivery_estimate_label.trim()
        ? sourceMetadata.delivery_estimate_label
        : estimatedMinutes
          ? `Previsão: ${estimatedMinutes} min`
          : null
      : null;
  const heroDescription =
    state === "completed"
      ? null
      : state === "in_delivery" &&
    typeof sourceMetadata.delivery_estimate_note === "string" &&
    sourceMetadata.delivery_estimate_note.trim()
      ? sourceMetadata.delivery_estimate_note
      : state === "stale" && order.updated_at
        ? `Última posição recebida às ${formatTime(order.updated_at) ?? "não informada"}.`
      : hero.description;
  const staleNote =
    state === "stale"
      ? typeof sourceMetadata.stale_estimate_note === "string" && sourceMetadata.stale_estimate_note.trim()
        ? sourceMetadata.stale_estimate_note
        : "A previsão será atualizada quando o sinal voltar."
      : null;
  const driverName = rideRequest && "driver" in rideRequest ? rideRequest.driver?.name ?? null : null;
  const driverPhone = rideRequest && "driver" in rideRequest ? rideRequest.driver?.phone ?? null : null;
  const driverAvatarUrl = rideRequest && "driver" in rideRequest ? rideRequest.driver?.profile?.avatar_url ?? null : null;
  const hasDriver = Boolean(rideRequest?.driver_profile_id);
  const storeName =
    typeof sourceMetadata.business_name === "string" && sourceMetadata.business_name.trim()
      ? sourceMetadata.business_name
      : order.source_reference ?? "Loja de gastronomia";
  const storeImage = order.items?.[0]?.item_image_url || foodImage;
  const hasRouteCoordinates =
    typeof rideRequest?.origin_lat === "number" &&
    typeof rideRequest?.origin_lng === "number" &&
    typeof rideRequest?.destination_lat === "number" &&
    typeof rideRequest?.destination_lng === "number";
  const trackingLabel = useMemo(
    () =>
      rideRequest?.status
        ? TRACKING_STATUS_LABELS[rideRequest.status] ?? rideRequest.status
        : hasTracking
          ? "Acompanhamento vinculado"
          : "Entrega manual pela loja",
    [hasTracking, rideRequest?.status],
  );
  const completedAtLabel = formatCompletedDateTime(order.delivered_at ?? order.completed_at);
  const primaryActionLabel = state === "completed" ? "Ver cardápio da loja" : "Falar com a loja";
  const primaryActionIcon = state === "completed" ? (
    <Utensils className="h-4 w-4" aria-hidden="true" />
  ) : (
    <MessageCircle className="h-4 w-4" aria-hidden="true" />
  );
  const handlePrimaryAction = () => {
    if (state === "completed") {
      if (storeMenuUrl) {
        navigate(storeMenuUrl);
      } else {
        navigate(-1);
      }
      return;
    }
    navigate(appUrls.messages);
  };

  return (
    <>
      <Helmet>
        <title>Acompanhar pedido #{order.order_number} | Gastronomia</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="h-dvh overflow-hidden bg-territory-canvas text-territory-ink md:h-auto md:min-h-screen md:overflow-visible">
        <DesktopTrackingHeader customerName={order.customer_name} onBack={() => navigate(-1)} />
        <header className="border-b border-territory-border bg-territory-surface md:hidden">
          <div className="mx-auto flex max-w-[28rem] items-center gap-4 px-4 py-0.5 sm:max-w-xl sm:px-6 md:max-w-2xl md:py-2.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Meus pedidos
            </button>
          </div>
        </header>

        <main className="hidden w-full space-y-3 px-6 pb-8 pt-6 md:block lg:px-8 xl:px-10">
          <div className="flex items-center gap-2 px-1 text-xs text-territory-muted">
            <span className="font-semibold text-territory-ink">{storeName}</span>
            <span aria-hidden="true">|</span>
            <span>Pedido #{order.order_number}</span>
          </div>
          <DesktopTrackingLayout
            order={order}
            state={state}
            hero={hero}
            deliveryEstimate={deliveryEstimate}
            heroDescription={heroDescription}
            staleNote={staleNote}
            completedAtLabel={completedAtLabel}
            trackingLabel={trackingLabel}
            hasDriver={hasDriver}
            rideRequest={rideRequest}
            driverLocationOverride={driverLocationOverride}
            hasRouteCoordinates={hasRouteCoordinates}
            driverName={driverName}
            driverPhone={driverPhone}
            driverAvatarUrl={driverAvatarUrl}
            onMessage={() => navigate(appUrls.messages)}
            onPrimaryAction={handlePrimaryAction}
            onHelp={() => navigate(appUrls.messages)}
            sourceMetadata={sourceMetadata}
          />
        </main>

        <main className="mx-auto w-full max-w-[28rem] space-y-2 overflow-hidden px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-1 sm:max-w-xl sm:px-6 sm:py-8 md:hidden">
          <section className="flex items-center gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={storeImage}
                alt=""
                className="h-12 w-12 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0">
                <h1 className="truncate font-heading text-xl font-bold tracking-[-0.04em]">
                  Pedido #{order.order_number}
                </h1>
                <p className="mt-0.5 truncate text-sm text-territory-muted">
                  {storeName}
                </p>
              </div>
            </div>
            <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-territory-ink" aria-hidden="true" />
          </section>

          <section
            className={cn(
              "rounded-xl",
              state === "preparing"
                ? "p-3"
                : state === "in_delivery" || state === "stale"
                  ? "p-2"
                  : "p-4 sm:p-5",
              state === "completed"
                ? "bg-territory-success/10"
                : state === "cancelled"
                  ? "bg-destructive/10"
                  : state === "stale"
                    ? "bg-territory-warning/20"
                      : state === "in_delivery"
                      ? "bg-territory-success/10"
                      : "bg-territory-warning/10",
            )}
            role="status"
            aria-live="polite"
          >
            <div className={cn(
              "flex items-start",
              state === "preparing" || state === "in_delivery" || state === "stale" ? "gap-2" : "gap-3",
            )}>
              <div className={cn(
                "flex shrink-0 items-center justify-center",
                state === "preparing"
                  ? "h-11 w-11"
                  : state === "completed"
                    ? "h-10 w-10 rounded-full bg-territory-brand"
                    : "h-10 w-10 rounded-full bg-territory-surface",
              )}>
                <StatusIcon state={state} />
              </div>
              <div className="min-w-0">
                <h2 className={cn(
                  "font-heading font-bold tracking-[-0.03em]",
                  state === "preparing" || state === "stale" ? "text-base leading-5" : "text-lg",
                )}>{hero.title}</h2>
                {deliveryEstimate ? (
                  <p className="mt-1 text-sm font-semibold text-territory-ink">{deliveryEstimate}</p>
                ) : null}
                {heroDescription ? (
                  <p className={cn(
                    deliveryEstimate || state === "stale"
                      ? "text-xs leading-4 text-territory-muted"
                      : "text-[0.8125rem] leading-5 text-territory-muted",
                    deliveryEstimate ? "mt-0.5" : "mt-1",
                  )}>{heroDescription}</p>
                ) : null}
                {staleNote ? (
                  <p className="mt-0.5 text-[0.6875rem] leading-4 text-territory-muted">{staleNote}</p>
                ) : null}
                {state === "stale" && order.updated_at && !staleNote ? (
                  <p className="mt-1 text-xs font-semibold text-territory-ink">
                    Última atualização: {formatTime(order.updated_at) ?? "não informada"}
                  </p>
                ) : null}
                {state === "completed" && completedAtLabel ? (
                  <p className="mt-1 text-sm font-semibold">{completedAtLabel}</p>
                ) : null}
              </div>
            </div>
          </section>

          {state === "preparing" ? (
            <PreparationStagesCard
              order={order}
              isDelivery={isDelivery}
              deliveryStageLabel={
                hasTracking
                  ? trackingLabel
                  : sourceMetadata.concept_mock === true
                    ? "Buscando entregador"
                    : "Entrega manual pela loja"
              }
            />
          ) : state === "in_delivery" || state === "stale" ? (
            <DeliveryStagesCard
              kitchenLabel={resolveKitchenLabel(order)}
              deliveryLabel={trackingLabel}
            />
          ) : null}

          {state === "preparing" && isDelivery ? <TrackingInfoCard state={state} /> : null}

          {(state === "in_delivery" || state === "stale") && hasDriver && rideRequest ? (
            hasRouteCoordinates ? (
              <RideTrackingMap
                driverProfileId={rideRequest.driver_profile_id!}
                rideId={rideRequest.id}
                destinationLat={rideRequest.destination_lat}
                destinationLon={rideRequest.destination_lng}
                originLat={rideRequest.origin_lat}
                originLon={rideRequest.origin_lng}
                showETA={false}
                compact
                mode={state === "stale" ? "snapshot" : "live"}
                locationOverride={driverLocationOverride}
                compactStatusLabel={
                  typeof sourceMetadata.map_update_label === "string"
                    ? sourceMetadata.map_update_label
                    : undefined
                }
                showSnapshotOverlay={false}
                trackingEnabled={!driverLocationOverride}
                className="rounded-xl"
              />
            ) : (
            <Card className="border-territory-border bg-territory-surface text-territory-ink">
              <CardContent className="flex items-start gap-3 p-4" role="status" aria-live="polite">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-territory-muted" aria-hidden="true" />
                <div>
                  <p className="font-bold">Mapa indisponível no momento</p>
                  <p className="mt-1 text-sm text-territory-muted">
                    O responsável já está vinculado, mas o sistema ainda não recebeu coordenadas completas para montar o trajeto.
                  </p>
                </div>
              </CardContent>
            </Card>
            )
          ) : null}

          {hasDriver && (state === "in_delivery" || state === "stale") ? (
            <Card className="border-territory-border bg-territory-surface text-territory-ink">
              <CardContent className="p-1.5 sm:p-3">
                <div className="flex items-center gap-3">
                  {driverAvatarUrl ? (
                    <img
                      src={driverAvatarUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-cover sm:h-12 sm:w-12"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-territory-raised sm:h-12 sm:w-12">
                      <UserRound className="h-6 w-6 text-territory-brand" aria-hidden="true" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{driverName ?? "Responsável pela entrega"}</p>
                    <p className="text-sm text-territory-muted">Entregador do seu pedido</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-9 border-territory-brand bg-territory-surface px-2 text-[0.6875rem] font-bold text-territory-brand hover:bg-territory-raised hover:text-territory-brand sm:min-h-10 sm:text-xs"
                    onClick={() => navigate(appUrls.messages)}
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Mensagem
                  </Button>
                  {driverPhone ? (
                    <Button
                      asChild
                      variant="outline"
                      className="min-h-9 border-territory-brand bg-territory-surface px-2 text-[0.6875rem] font-bold text-territory-brand hover:bg-territory-raised hover:text-territory-brand sm:min-h-10 sm:text-xs"
                    >
                      <a href={buildTelUrl(driverPhone) ?? undefined}>
                        <Phone className="h-4 w-4" aria-hidden="true" />
                        Ligar
                      </a>
                    </Button>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {state === "in_delivery" || state === "stale" ? (
            <TrackingInfoCard state={state} />
          ) : null}

          {state === "completed" ? <CompletionRecipientCard order={order} /> : null}
          {state === "completed" ? <CompletionProof order={order} /> : null}
          {state === "completed" ? (
            <OrderPublicReviewPanel order={order} compact preview={reviewPreview} />
          ) : null}

          {state === "preparing" ? (
            <PreparationAddressCard order={order} />
          ) : state === "completed" ? null : (
            <DeliveryAddressCard order={order} defaultOpen={false} />
          )}
          {state === "preparing" ? (
            <PreparationPaymentCard order={order} />
          ) : (
            <PaymentSummary
              order={order}
              defaultOpen={state === "completed" || state === "cancelled"}
              completed={state === "completed"}
            />
          )}
          <ItemsSummary order={order} />
          <HistorySummary
            order={order}
            showEmpty={state === "preparing" || state === "completed"}
            title={state === "completed" ? "Histórico completo" : "Histórico do pedido"}
          />

          <Button
            type="button"
            onClick={handlePrimaryAction}
            className="hidden min-h-12 w-full rounded-xl bg-territory-brand text-sm font-bold text-white hover:bg-territory-brand/90 md:flex"
          >
            {primaryActionIcon}
            <span className="ml-2">{primaryActionLabel}</span>
          </Button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="hidden min-h-10 w-full items-center justify-center gap-2 text-sm font-semibold text-territory-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand md:flex"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar para meus pedidos
          </button>
        </main>

        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.25rem+env(safe-area-inset-bottom))] pt-1 sm:px-6 md:hidden">
          <div className="mx-auto max-w-[28rem]">
            <Button
              type="button"
              onClick={handlePrimaryAction}
              className="pointer-events-auto min-h-11 w-full rounded-xl bg-territory-brand text-sm font-bold text-white shadow-lg shadow-territory-brand/20 hover:bg-territory-brand/90"
            >
              {primaryActionIcon}
              <span className="ml-2">{primaryActionLabel}</span>
            </Button>
            <button
              type="button"
              onClick={() => navigate(appUrls.messages)}
              className="pointer-events-auto flex min-h-6 w-full items-center justify-center text-[0.6875rem] font-semibold text-territory-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
            >
              Preciso de ajuda
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
