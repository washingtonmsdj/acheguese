/**
 * OrderTrackingBadge — Badge de rastreamento ativo
 * 
 * Exibe badge quando pedido tem rastreamento GPS ativo
 */

import { Badge } from '@/shared/components/ui/badge';
import { Navigation } from 'lucide-react';
import { useOrderTracking } from '../../hooks/useOrderTracking';

interface OrderTrackingBadgeProps {
  orderId: string;
  className?: string;
}

export function OrderTrackingBadge({ orderId, className }: OrderTrackingBadgeProps) {
  const { isActive, isLoading } = useOrderTracking(orderId);

  if (isLoading || !isActive) {
    return null;
  }

  return (
    <Badge variant="outline" className={`gap-1 ${className}`}>
      <Navigation className="h-3 w-3 animate-pulse text-teal-400" />
      Rastreamento Ativo
    </Badge>
  );
}
