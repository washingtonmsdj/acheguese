/**
 * OrderTrackingCard - card de rastreamento GPS do pedido.
 *
 * Exibe o estado operacional da entrega mesmo quando ainda não há motoboy.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Clock, MapPin, Navigation, RefreshCw, User } from 'lucide-react';
import { RideTrackingMap } from '@/core/mobility/components';
import { useOrderTracking } from '../../hooks/useOrderTracking';
import type { Order } from '@/modules/business/gastronomy/services/OrderService';

interface OrderTrackingCardProps {
  order: Order;
  className?: string;
}

const STATUS_LABELS: Record<string, string> = {
  requested: 'Solicitado',
  searching_driver: 'Buscando entregador',
  driver_assigned: 'Entregador encontrado',
  driver_accepted: 'Entregador confirmou',
  driver_arriving: 'Entregador a caminho da coleta',
  pickup_confirmed: 'Pedido coletado',
  in_delivery: 'Em rota de entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  failed: 'Falha na entrega',
  failed_delivery: 'Falha na entrega',
};

export function OrderTrackingCard({ order, className }: OrderTrackingCardProps) {
  const { rideRequest, hasTracking, isActive, isLoading, refetch } = useOrderTracking(order.id);
  const hasDriver = !!rideRequest?.driver_profile_id;
  const hasRouteCoordinates =
    typeof rideRequest?.origin_lat === 'number' &&
    typeof rideRequest?.origin_lng === 'number' &&
    typeof rideRequest?.destination_lat === 'number' &&
    typeof rideRequest?.destination_lng === 'number';
  const statusLabel = rideRequest ? STATUS_LABELS[rideRequest.status] || rideRequest.status : 'Entrega ainda não vinculada';

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
              <Badge variant="default" className="gap-1">
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
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <CardDescription>
          Loja, cliente e entregador devem enxergar o mesmo estado operacional da entrega.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasDriver && rideRequest && hasRouteCoordinates && (
          <RideTrackingMap
            driverProfileId={rideRequest.driver_profile_id!}
            rideId={rideRequest.id}
            destinationLat={rideRequest.destination_lat}
            destinationLon={rideRequest.destination_lng}
            originLat={rideRequest.origin_lat}
            originLon={rideRequest.origin_lng}
            showETA
            className="h-72 sm:h-96 rounded-lg overflow-hidden"
          />
        )}
        {hasDriver && rideRequest && !hasRouteCoordinates && (
          <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
            Mapa indisponivel no momento: aguardando coordenadas completas de coleta e entrega no SSOT.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">Status da entrega</p>
              <p className="text-xs text-muted-foreground">{statusLabel}</p>
            </div>
          </div>

          {hasDriver && rideRequest?.driver_profile && (
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Entregador</p>
                <p className="text-xs text-muted-foreground">
                  {rideRequest.driver_profile.name || 'Não informado'}
                </p>
              </div>
            </div>
          )}

          {rideRequest?.estimated_duration && (
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Tempo estimado</p>
                <p className="text-xs text-muted-foreground">
                  {rideRequest.estimated_duration} min
                </p>
              </div>
            </div>
          )}

          {rideRequest?.destination_address && (
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Destino</p>
                <p className="text-xs text-muted-foreground">{rideRequest.destination_address}</p>
              </div>
            </div>
          )}
        </div>

        {!hasDriver && (
          <div className="flex items-center justify-center p-8 rounded-lg border border-dashed bg-muted/50">
            <div className="text-center space-y-2">
              <Navigation className="h-8 w-8 text-muted-foreground mx-auto animate-pulse" />
              <p className="text-sm font-medium">
                {hasTracking ? 'Buscando entregador...' : 'Entrega ainda sem motoboy vinculado'}
              </p>
              <p className="text-xs text-muted-foreground">
                {hasTracking
                  ? 'Aguarde enquanto encontramos um entregador disponível.'
                  : 'Quando o pedido gerar a entrega SSOT, o rastreamento aparecera aqui.'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
