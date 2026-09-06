/**
 * OperationalStatusCard — Card de status operacional
 *
 * Mostra status de abertura, horários e configurações.
 * SSOT: Usa useBusinessStatus e useOperationConfig
 */

import { useBusinessStatus, useOperationConfig } from '../../hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Clock, CheckCircle, XCircle, Package, Truck, UtensilsCrossed } from 'lucide-react';

interface OperationalStatusCardProps {
  businessDataId: string;
}

export function OperationalStatusCard({ businessDataId }: OperationalStatusCardProps) {
  const { isOpen, nextOpening, isLoading: statusLoading } = useBusinessStatus(businessDataId);
  const { config, isLoading: configLoading } = useOperationConfig(businessDataId);

  if (statusLoading || configLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  const isTemporarilyClosed = config?.is_temporarily_closed ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Status Operacional
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status de Abertura */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            {isOpen && !isTemporarilyClosed ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
            <div>
              <p className="font-semibold text-lg">
                {isTemporarilyClosed
                  ? 'Fechado Temporariamente'
                  : isOpen
                  ? 'Aberto'
                  : 'Fechado'}
              </p>
              {isTemporarilyClosed && config?.temporarily_closed_reason && (
                <p className="text-sm text-muted-foreground">
                  {config.temporarily_closed_reason}
                </p>
              )}
              {!isTemporarilyClosed && nextOpening && !isOpen && (
                <p className="text-sm text-muted-foreground">
                  Próxima abertura: {nextOpening.opens_at}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modos de Operação */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Modos de Operação Ativos:</p>
          <div className="flex flex-wrap gap-2">
            {config?.accepts_pickup && (
              <Badge variant="outline" className="gap-1">
                <Package className="w-3 h-3" />
                Retirada
              </Badge>
            )}
            {config?.accepts_delivery && (
              <Badge variant="outline" className="gap-1">
                <Truck className="w-3 h-3" />
                Entrega
              </Badge>
            )}
            {config?.accepts_dine_in && (
              <Badge variant="outline" className="gap-1">
                <UtensilsCrossed className="w-3 h-3" />
                Consumo Local
              </Badge>
            )}
          </div>
        </div>

        {/* Tempo de Preparo */}
        {config?.preparation_time_min && (
          <div className="text-sm">
            <span className="text-muted-foreground">Tempo de preparo: </span>
            <span className="font-medium">{config.preparation_time_min} minutos</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
