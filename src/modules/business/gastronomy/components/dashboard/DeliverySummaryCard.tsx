/**
 * DeliverySummaryCard — Card de resumo de entregas
 *
 * Mostra estatísticas de áreas de entrega.
 * SSOT: Usa useDeliverySummary
 */

import { useDeliverySummary } from '../../hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';
import { formatBrl } from '../../utils/currency';

interface DeliverySummaryCardProps {
  businessId: string;
}

export function DeliverySummaryCard({ businessId }: DeliverySummaryCardProps) {
  const {
    summary,
    isLoading,
    totalAreas,
    totalNeighborhoods,
    minDeliveryFee,
    maxDeliveryFee,
  } = useDeliverySummary(businessId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Áreas de Entrega
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalAreas > 0 ? (
          <>
            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">{totalAreas}</p>
                <p className="text-sm text-muted-foreground">Áreas</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">{totalNeighborhoods}</p>
                <p className="text-sm text-muted-foreground">Bairros</p>
              </div>
            </div>

            {/* Taxa de entrega */}
            {minDeliveryFee !== null && maxDeliveryFee !== null && (
              <div className="text-sm">
                <span className="text-muted-foreground">Taxa de entrega: </span>
                <span className="font-medium">
                  {minDeliveryFee === maxDeliveryFee
                    ? formatBrl(minDeliveryFee)
                    : `${formatBrl(minDeliveryFee)} - ${formatBrl(maxDeliveryFee)}`}
                </span>
              </div>
            )}

            {/* Link para gestão */}
            <Link to={businessManagementRoutes.gastronomyAreaEntrega(businessId)}>
              <Button variant="outline" className="w-full">
                Gerenciar Áreas
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Nenhuma área configurada
            </p>
            <Link to={businessManagementRoutes.gastronomyAreaEntrega(businessId)}>
              <Button variant="outline" className="w-full">
                Configurar Áreas
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
