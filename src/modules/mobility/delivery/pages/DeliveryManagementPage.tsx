import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useOutletContext } from "react-router-dom";
import { Bike, CheckCircle2, ChevronRight, Clock3, Package, RefreshCw, Store, Truck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { useOrderDelivery } from "@/modules/mobility/delivery/hooks/useOrderDelivery";
import { OrderDeliverySSOTService } from "@/core/mobility/delivery/services/OrderDeliverySSOTService";
import { LOGISTICS_STATUS, type LogisticsStatus } from "@/core/mobility/delivery/logistics/types";
import { ORDER_SOURCE_TYPE, type OrderRecord } from "@/core/mobility/delivery/order/types";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";

interface DeliveryBusinessContext {
  businessId: string;
  businessDataId: string;
  business: { name?: string | null };
}

const STATUS_LABELS: Record<LogisticsStatus, string> = {
  pending: "Aguardando",
  accepted: "Aceito",
  preparing: "Em preparo",
  ready_for_pickup: "Pronto",
  picked_up: "Em entrega",
  delivered: "Entregue",
  canceled: "Cancelado",
  failed: "Falha",
};

const STATUS_TONES: Record<LogisticsStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-blue-100 text-blue-800",
  preparing: "bg-blue-100 text-blue-800",
  ready_for_pickup: "bg-yellow-100 text-yellow-900",
  picked_up: "bg-emerald-100 text-emerald-800",
  delivered: "bg-emerald-100 text-emerald-800",
  canceled: "bg-slate-100 text-slate-700",
  failed: "bg-red-100 text-red-800",
};

function nextAction(order: OrderRecord): { label: string; kind: "accept" | "prepare" | "ready" | "pickup" | "delivered" } | null {
  switch (order.logistics_status) {
    case LOGISTICS_STATUS.PENDING:
      return { label: "Aceitar pedido", kind: "accept" };
    case LOGISTICS_STATUS.ACCEPTED:
      return { label: "Iniciar preparo", kind: "prepare" };
    case LOGISTICS_STATUS.PREPARING:
      return { label: "Marcar como pronto", kind: "ready" };
    case LOGISTICS_STATUS.READY_FOR_PICKUP:
      return { label: "Registrar saída", kind: "pickup" };
    case LOGISTICS_STATUS.PICKED_UP:
      return { label: "Confirmar entrega", kind: "delivered" };
    default:
      return null;
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function OrderDeliveryCard({ order, onRefresh }: { order: OrderRecord; onRefresh: () => Promise<void> }) {
  const { acceptOrder, startPreparing, markReadyForPickup, markPickedUp, markDelivered } = useOrderDelivery();
  const action = nextAction(order);
  const [busy, setBusy] = useState(false);

  const execute = useCallback(async () => {
    if (!action) return;
    setBusy(true);
    try {
      const result =
        action.kind === "accept"
          ? await acceptOrder(order.id)
          : action.kind === "prepare"
            ? await startPreparing(order.id)
            : action.kind === "ready"
              ? await markReadyForPickup(order.id)
              : action.kind === "pickup"
                ? await markPickedUp(order.id)
                : await markDelivered(order.id);
      if (result.success) await onRefresh();
    } finally {
      setBusy(false);
    }
  }, [action, acceptOrder, markDelivered, markPickedUp, markReadyForPickup, onRefresh, order.id, startPreparing]);

  const customerName = order.source_context.source_metadata?.customer_name;
  const deliveryAddress = order.source_context.source_metadata?.delivery_address;
  const addressLabel = typeof deliveryAddress === "string" ? deliveryAddress : "Endereço de entrega não informado";

  return (
    <Card className="overflow-hidden border-territory-border shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-territory-muted">
              <Package className="h-4 w-4" aria-hidden="true" />
              <span>Pedido #{order.id.slice(0, 8)}</span>
              <Badge className={cn("border-0", STATUS_TONES[order.logistics_status])}>
                {STATUS_LABELS[order.logistics_status]}
              </Badge>
            </div>
            <h2 className="mt-2 truncate text-base font-bold text-territory-ink">
              {typeof customerName === "string" && customerName.trim() ? customerName : "Cliente"}
            </h2>
            <p className="mt-1 text-sm text-territory-muted">{addressLabel}</p>
          </div>
          <span className="shrink-0 font-bold text-territory-ink">
            {formatCurrency(order.financial_breakdown.order_total)}
          </span>
        </div>

        <div className="mt-4 grid gap-2 text-xs text-territory-muted sm:grid-cols-3">
          <span className="flex items-center gap-2"><Store className="h-4 w-4" />Entrega da loja</span>
          <span className="flex items-center gap-2"><Clock3 className="h-4 w-4" />Atualizado em {new Date(order.updated_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
          <span className="flex items-center gap-2"><Truck className="h-4 w-4" />{order.courier_profile_id ? "Entregador atribuído" : "Sem entregador atribuído"}</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-territory-border pt-3">
          {action ? (
            <Button onClick={execute} disabled={busy} size="sm">
              {busy ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {action.label}
            </Button>
          ) : null}
          <Link
            to={businessManagementRoutes.gastronomyPedidoDetalhe(order.merchant_profile_id, order.id)}
            className="inline-flex min-h-9 items-center rounded-md border border-territory-border px-3 text-sm font-semibold text-territory-ink hover:bg-territory-surface-raised"
          >
            Ver pedido <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DeliveryManagementPage() {
  const { businessDataId, business } = useOutletContext<DeliveryBusinessContext>();
  const [status, setStatus] = useState<LogisticsStatus | "all">("all");

  const ordersQuery = useQuery({
    queryKey: ["delivery-management", businessDataId, status],
    queryFn: async () => {
      const result = await OrderDeliverySSOTService.listOrdersBySource(
        ORDER_SOURCE_TYPE.GASTRONOMY,
        businessDataId,
        status === "all" ? { limit: 100 } : { logistics_status: status, limit: 100 },
      );
      if (!result.success) throw new Error(result.error || "Não foi possível carregar as entregas.");
      return result.data ?? [];
    },
    enabled: Boolean(businessDataId),
  });

  const refresh = useCallback(async () => {
    await ordersQuery.refetch();
  }, [ordersQuery]);

  useEffect(() => {
    if (ordersQuery.error) toast.error(ordersQuery.error.message);
  }, [ordersQuery.error]);

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const openOrders = orders.filter((order) => !["delivered", "canceled", "failed"].includes(order.logistics_status)).length;

  return (
    <>
      <Helmet>
        <title>Entregas | {business?.name ?? "Empresa"}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5 sm:px-6 sm:py-7">
        <header className="flex flex-col gap-4 border-b border-territory-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-territory-muted">
              <Bike className="h-4 w-4" aria-hidden="true" /> Operação de entregas
            </div>
            <h1 className="mt-2 font-heading text-2xl font-extrabold tracking-[-0.04em] text-territory-ink sm:text-3xl">Entregas</h1>
            <p className="mt-1 max-w-2xl text-sm text-territory-muted">
              Acompanhe pedidos reais e avance cada etapa somente após confirmação da operação.
            </p>
          </div>
          <Button variant="outline" onClick={refresh} disabled={ordersQuery.isFetching}>
            <RefreshCw className={cn("mr-2 h-4 w-4", ordersQuery.isFetching && "animate-spin")} /> Atualizar
          </Button>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pedidos na fila</p><p className="mt-1 text-2xl font-extrabold">{orders.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Em andamento</p><p className="mt-1 text-2xl font-extrabold">{openOrders}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Modalidade atual</p><p className="mt-1 text-sm font-bold">Frota própria da loja</p></CardContent></Card>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar entregas por status">
          {(["all", ...Object.values(LOGISTICS_STATUS)] as const).map((value) => (
            <Button key={value} type="button" size="sm" variant={status === value ? "default" : "outline"} onClick={() => setStatus(value)}>
              {value === "all" ? "Todas" : STATUS_LABELS[value]}
            </Button>
          ))}
        </div>

        {ordersQuery.isLoading ? (
          <div className="rounded-xl border border-dashed border-territory-border p-8 text-center text-sm text-territory-muted">Carregando entregas…</div>
        ) : orders.length === 0 ? (
          <Card><CardHeader><CardTitle>Nenhuma entrega nesta visão</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Quando um pedido de gastronomia estiver nesta etapa, ele aparecerá aqui. Nenhum entregador ou movimento é inventado quando não existe dado operacional.</CardContent></Card>
        ) : (
          <div className="grid gap-3">{orders.map((order) => <OrderDeliveryCard key={order.id} order={order} onRefresh={refresh} />)}</div>
        )}
      </div>
    </>
  );
}
