/**
 * OrderTrackingCard - card de rastreamento GPS do pedido.
 *
 * Exibe o estado operacional da entrega mesmo quando ainda nao ha motoboy.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Clock, MapPin, Navigation, Phone, RefreshCw, User } from 'lucide-react';
import { RideTrackingMap } from '@/modules/mobility/components/RideTrackingMap';
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
    typeof rideRequest?.pickup_location?.lat === 'number' &&
    typeof rideRequest?.pickup_location?.lng === 'number' &&
    typeof rideRequest?.dropoff_location?.lat === 'number' &&
    typeof rideRequest?.dropoff_location?.lng === 'number';
  const statusLabel = rideRequest ? STATUS_LABELS[rideRequest.status] || rideRequest.status : 'Entrega ainda nao vinculada';

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
            destinationLat={rideRequest.dropoff_location!.lat}
            destinationLon={rideRequest.dropoff_location!.lng}
            originLat={rideRequest.pickup_location!.lat}
            originLon={rideRequest.pickup_location!.lng}
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
                  {rideRequest.driver_profile.full_name || 'Nao informado'}
                </p>
                {rideRequest.driver_profile.phone && (
                  <a
                    href={`tel:${rideRequest.driver_profile.phone}`}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    {rideRequest.driver_profile.phone}
                  </a>
                )}
              </div>
            </div>
          )}

          {rideRequest?.estimated_arrival_time && (
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Previsao de chegada</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(rideRequest.estimated_arrival_time).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )}

          {rideRequest?.recipient_name && (
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Destinatario</p>
                <p className="text-xs text-muted-foreground">{rideRequest.recipient_name}</p>
                {rideRequest.recipient_phone && (
                  <p className="text-xs text-muted-foreground">{rideRequest.recipient_phone}</p>
                )}
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
                  ? 'Aguarde enquanto encontramos um entregador disponivel.'
                  : 'Quando o pedido gerar a entrega SSOT, o rastreamento aparecera aqui.'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
