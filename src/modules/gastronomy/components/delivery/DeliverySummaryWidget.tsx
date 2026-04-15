/**
 * DeliverySummaryWidget — Widget com resumo das áreas de entrega
 *
 * Mostra estatísticas das áreas configuradas.
 * SSOT: Usa useDeliverySummary hook
 */

import { useDeliverySummary } from '../../hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { MapPin, TrendingUp, Clock } from 'lucide-react';

interface DeliverySummaryWidgetProps {
  businessId: string;
}

export function DeliverySummaryWidget({ businessId }: DeliverySummaryWidgetProps) {
  const {
    summary,
    isLoading,
    totalAreas,
    totalNeighborhoods,
    activeAreas,
    minDeliveryFee,
    maxDeliveryFee,
    avgEstimatedTime,
  } = useDeliverySummary(businessId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando resumo...</p>
        </CardContent>
      </Card>
    );
  }

  if (!summary || totalAreas === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Áreas de Entrega
          </CardTitle>
          <CardDescription>
            Configure áreas de entrega para começar a receber pedidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma área configurada ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Resumo das Áreas de Entrega
        </CardTitle>
        <CardDescription>
          Visão geral das suas configurações de entrega
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total de Áreas */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Áreas Totais</p>
            <p className="text-2xl font-bold">{totalAreas}</p>
            <p className="text-xs text-muted-foreground">
              {activeAreas} ativa(s)
            </p>
          </div>

          {/* Total de Bairros */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Bairros</p>
            <p className="text-2xl font-bold">{totalNeighborhoods}</p>
            <p className="text-xs text-muted-foreground">atendidos</p>
          </div>

          {/* Faixa de Taxa */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Taxa de Entrega
            </p>
            <p className="text-2xl font-bold">
              {minDeliveryFee !== null && maxDeliveryFee !== null ? (
                minDeliveryFee === maxDeliveryFee ? (
                  `R$ ${minDeliveryFee.toFixed(2)}`
                ) : (
                  `R$ ${minDeliveryFee.toFixed(2)} - ${maxDeliveryFee.toFixed(2)}`
                )
              ) : (
                '-'
              )}
            </p>
            <p className="text-xs text-muted-foreground">faixa de valores</p>
          </div>

          {/* Tempo Médio */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Tempo Médio
            </p>
            <p className="text-2xl font-bold">
              {avgEstimatedTime ? `${avgEstimatedTime} min` : '-'}
            </p>
            <p className="text-xs text-muted-foreground">estimado</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
