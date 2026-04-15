/**
 * DeliveryRequestCard — Card de solicitação de entrega
 *
 * Exibe informações de uma solicitação de entrega.
 * Consome hooks (SSOT).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { DeliveryRequest, DeliveryRequestStatus } from '@/core/delivery/DeliveryService';
import { MapPin, Phone, User, Clock, DollarSign, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DeliveryRequestCardProps {
  request: DeliveryRequest;
  onViewDetails?: (id: string) => void;
  onUpdateStatus?: (id: string, status: DeliveryRequestStatus) => void;
  onCancel?: (id: string) => void;
}

const statusConfig: Record<
  DeliveryRequestStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending: { label: 'Aguardando', variant: 'secondary' },
  accepted: { label: 'Aceita', variant: 'default' },
  picked_up: { label: 'Retirado', variant: 'default' },
  in_transit: { label: 'Em Trânsito', variant: 'default' },
  delivered: { label: 'Entregue', variant: 'outline' },
  failed: { label: 'Falhou', variant: 'destructive' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
};

export function DeliveryRequestCard({
  request,
  onViewDetails,
  onUpdateStatus,
  onCancel,
}: DeliveryRequestCardProps) {
  const statusInfo = statusConfig[request.status];

  const nextStatus: Record<DeliveryRequestStatus, DeliveryRequestStatus | null> = {
    pending: 'accepted',
    accepted: 'picked_up',
    picked_up: 'in_transit',
    in_transit: 'delivered',
    delivered: null,
    failed: null,
    cancelled: null,
  };

  const nextStatusLabel: Record<DeliveryRequestStatus, string> = {
    pending: 'Aceitar',
    accepted: 'Marcar como Retirado',
    picked_up: 'Marcar em Trânsito',
    in_transit: 'Marcar como Entregue',
    delivered: '',
    failed: '',
    cancelled: '',
  };

  const canAdvance = nextStatus[request.status] !== null;
  const canCancel = ['pending', 'accepted'].includes(request.status);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              Entrega #{request.request_number}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(request.requested_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Cliente */}
        <div className="flex items-start gap-2">
          <User className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">{request.customer_name}</p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              {request.customer_phone}
            </div>
          </div>
        </div>

        {/* Endereços */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Retirada</p>
              <p className="text-sm">{request.pickup_address}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Entrega</p>
              <p className="text-sm">{request.delivery_address}</p>
              {request.delivery_neighborhood && (
                <p className="text-xs text-muted-foreground">
                  {request.delivery_neighborhood}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Informações */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>R$ {request.delivery_fee.toFixed(2)}</span>
          </div>

          {request.estimated_duration_minutes && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{request.estimated_duration_minutes} min</span>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(request.id)}
              className="flex-1"
            >
              Ver Detalhes
            </Button>
          )}

          {canAdvance && onUpdateStatus && (
            <Button
              size="sm"
              onClick={() => onUpdateStatus(request.id, nextStatus[request.status]!)}
              className="flex-1"
            >
              {nextStatusLabel[request.status]}
            </Button>
          )}

          {canCancel && onCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onCancel(request.id)}
            >
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
