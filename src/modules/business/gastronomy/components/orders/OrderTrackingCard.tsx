/**
 * OrderTrackingCard - card de rastreamento GPS do pedido.
 *
 * Exibe o estado operacional da entrega e somente monta rastreamento preciso
 * depois que o motorista aceitou a operacao.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { MapPin, Navigation, RefreshCw } from "lucide-react";
import { RideTrackingMap } from "@/core/mobility/components";
import { isDriverOwnedOpenRideStatus } from "@/core/mobility/core/RideLifecycleStatus";
import { useOrderTracking } from "../../hooks/useOrderTracking";
import type { Order } from "@/modules/business/gastronomy/services/OrderService";

interface OrderTrackingCardProps {
  order: Order;
  className?: string;
}

const STATUS_LABELS: Record<string, string> = {
  requested: "Solicitado",
  searching_driver: "Buscando responsavel pela entrega",
  driver_assigned: "Responsavel definido; aguardando confirmacao",
  driver_accepted: "Responsavel pela entrega confirmou",
  driver_arriving: "Responsavel a caminho da coleta",
  pickup_confirmed: "Pedido coletado",
  in_delivery: "Em rota de entrega",
  delivered: "Entregue",
  completed: "Entrega concluida",
  cancelled: "Cancelado",
  cancelled_by_driver: "Cancelado pelo entregador",
  cancelled_by_passenger: "Cancelado pelo solicitante",
  expired: "Solicitacao expirada",
  failed: "Falha na entrega",
  failed_delivery: "Falha na entrega",
};

export function OrderTrackingCard({ order, className }: OrderTrackingCardProps) {
  const { rideRequest, hasTracking, isActive, isLoading, refetch } =
    useOrderTracking(order.id);

  const canTrackDriver = Boolean(
    rideRequest?.driver_profile_id &&
      isDriverOwnedOpenRideStatus(rideRequest.status),
  );
  const hasRouteCoordinates = Boolean(
    rideRequest &&
      typeof rideRequest.origin_lat === "number" &&
      typeof rideRequest.origin_lng === "number" &&
      typeof rideRequest.destination_lat === "number" &&
      typeof rideRequest.destination_lng === "number",
  );
  const statusLabel = rideRequest
    ? STATUS_LABELS[rideRequest.status] || rideRequest.status
    : "Entrega sem rastreamento vinculado";

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-teal-500" />
            <CardTitle>Rastreamento da entrega</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <Badge variant="default" className="gap-1" aria-live="polite">
                <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                Ativo
              </Badge>
            )}
            {!isActive && hasTracking && <Badge variant="outline">Acompanhamento</Badge>}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
              aria-label="Atualizar rastreamento"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        <CardDescription>
          Loja e cliente acompanham o mesmo estado operacional da entrega.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {canTrackDriver && rideRequest && hasRouteCoordinates && (
          <RideTrackingMap
            driverProfileId={rideRequest.driver_profile_id!}
            rideId={rideRequest.id}
            destinationLat={rideRequest.destination_lat!}
            destinationLon={rideRequest.destination_lng!}
            originLat={rideRequest.origin_lat!}
            originLon={rideRequest.origin_lng!}
            showETA
            className="h-72 sm:h-96 rounded-lg overflow-hidden"
          />
        )}

        {canTrackDriver && rideRequest && !hasRouteCoordinates && (
          <div
            className="rounded-lg border border-dashed bg-muted/40 px-4 py-6 text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            Mapa indisponivel no momento: aguardando coordenadas completas de coleta e entrega no SSOT.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div
            className="flex items-start gap-3 p-4 rounded-lg border bg-card"
            role="status"
            aria-live="polite"
          >
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">Status da entrega</p>
              <p className="text-xs text-muted-foreground break-words">{statusLabel}</p>
            </div>
          </div>

          {rideRequest?.destination && (
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <Navigation className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Destino</p>
                <p className="text-xs text-muted-foreground break-words">
                  {rideRequest.destination}
                </p>
              </div>
            </div>
          )}
        </div>

        {isActive && !canTrackDriver && (
          <div
            className="flex items-center justify-center p-8 rounded-lg border border-dashed bg-muted/50"
            role="status"
            aria-live="polite"
          >
            <div className="text-center space-y-2">
              <Navigation className="h-8 w-8 text-muted-foreground mx-auto animate-pulse" />
              <p className="text-sm font-medium">
                Aguardando confirmacao operacional do entregador...
              </p>
              <p className="text-xs text-muted-foreground">
                O rastreamento preciso sera disponibilizado somente depois que o entregador aceitar a operacao.
              </p>
            </div>
          </div>
        )}

        {!hasTracking && (
          <div
            className="flex items-center justify-center p-8 rounded-lg border border-dashed bg-muted/50"
            role="status"
            aria-live="polite"
          >
            <div className="text-center space-y-2">
              <Navigation className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">Entrega manual pela loja</p>
              <p className="text-xs text-muted-foreground">
                Para frota propria, acompanhe pelos status do pedido. Quando houver entrega SSOT vinculada, o acompanhamento aparecera aqui.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
