import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Bike, Clock, DollarSign } from 'lucide-react';
import type { GastronomyBusiness } from '../types';
import { formatBrl } from '../utils/currency';

interface Props {
  business: GastronomyBusiness;
}

export function DeliveryInfoCard({ business }: Props) {
  const { gastronomy_profile } = business;

  if (!gastronomy_profile.delivery_enabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Informações de Entrega</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {gastronomy_profile.delivery_time_min && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {gastronomy_profile.delivery_time_min}-{gastronomy_profile.delivery_time_max} min
            </span>
          </div>
        )}
        
        {gastronomy_profile.delivery_fee !== undefined && (
          <div className="flex items-center gap-2">
            <Bike className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Taxa: {formatBrl(gastronomy_profile.delivery_fee)}
            </span>
          </div>
        )}
        
        {gastronomy_profile.minimum_order && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Pedido mínimo: {formatBrl(gastronomy_profile.minimum_order)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
