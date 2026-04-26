/**
 * OrderTrackingCard — Card de rastreamento GPS do pedido
 * 
 * Exibe mapa em tempo real com localização do entregador
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Navigation, MapPin, Clock, User, Phone, RefreshCw } from 'lucide-react';
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
  driver_arriving: 'Entregador a caminho',
  pickup_confirmed: 'Pedido coletado',
  in_delivery: 'Em rota de entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  failed: 'Falha na entrega',
};

export function OrderTrackingCard({ order, className }: OrderTrackingCardProps) {
  const { rideRequest, hasTracking, isActive, isLoading, refetch } = useOrderTracking(order.id);

  // Não exibir se não tem rastreamento
  if (!hasTracking || !rideRequest) {
    return null;
  }

  const statusLabel = STATUS_LABELS[rideRequest.status] || rideRequest.status;
  const hasDriver = !!rideRequest.driver_profile_id;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-teal-400" />
            <CardTitle>Rastreamento em Tempo Real</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <Badge variant="default" className="gap-1">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                Ativo
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <CardDescription>
          Acompanhe a localização do entregador em tempo real
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mapa de rastreamento */}
        {hasDriver && (
          <RideTrackingMap
            driverProfileId={rideRequest.driver_profile_id!}
            rideId={rideRequest.id}
            destinationLat={rideRequest.dropoff_location?.lat || 0}
            destinationLon={rideRequest.dropoff_location?.lng || 0}
            originLat={rideRequest.pickup_location?.lat || 0}
            originLon={rideRequest.pickup_location?.lng || 0}
            showETA={true}
            className="h-96 rounded-lg overflow-hidden"
          />
        )}

        {/* Status e informações */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Status da entrega */}
          <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">Status da Entrega</p>
              <p className="text-xs text-muted-foreground">{statusLabel}</p>
            </div>
          </div>

          {/* Informações do entregador */}
          {hasDriver && rideRequest.driver_profile && (
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Entregador</p>
                <p className="text-xs text-muted-foreground">
                  {rideRequest.driver_profile.full_name || 'Não informado'}
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

          {/* Tempo estimado */}
          {rideRequest.estimated_arrival_time && (
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Previsão de Chegada</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(rideRequest.estimated_arrival_time).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Destinatário */}
          {rideRequest.recipient_name && (
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Destinatário</p>
                <p className="text-xs text-muted-foreground">
                  {rideRequest.recipient_name}
                </p>
                {rideRequest.recipient_phone && (
                  <p className="text-xs text-muted-foreground">
                    {rideRequest.recipient_phone}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mensagem se ainda não tem motorista */}
        {!hasDriver && (
          <div className="flex items-center justify-center p-8 rounded-lg border border-dashed bg-muted/50">
            <div className="text-center space-y-2">
              <Navigation className="h-8 w-8 text-muted-foreground mx-auto animate-pulse" />
              <p className="text-sm font-medium">Buscando entregador...</p>
              <p className="text-xs text-muted-foreground">
                Aguarde enquanto encontramos um entregador disponível
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
