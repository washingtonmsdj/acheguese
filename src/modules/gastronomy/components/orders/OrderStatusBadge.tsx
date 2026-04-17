/**
 * OrderStatusBadge â€” Badge de status do pedido
 *
 * Mostra status com cor e Ã­cone apropriados.
 */

import { Badge } from '@/shared/components/ui/badge';
import {
  Clock,
  CheckCircle,
  ChefHat,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { OrderStatus } from '@/modules/gastronomy/services/OrderService';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  pending: {
    label: 'Pendente',
    variant: 'secondary',
    icon: Clock,
    color: 'text-yellow-600',
  },
  confirmed: {
    label: 'Confirmado',
    variant: 'default',
    icon: CheckCircle,
    color: 'text-blue-600',
  },
  preparing: {
    label: 'Preparando',
    variant: 'default',
    icon: ChefHat,
    color: 'text-orange-600',
  },
  ready: {
    label: 'Pronto',
    variant: 'default',
    icon: Package,
    color: 'text-purple-600',
  },
  out_for_delivery: {
    label: 'Saiu para Entrega',
    variant: 'default',
    icon: Truck,
    color: 'text-indigo-600',
  },
  delivered: {
    label: 'Entregue',
    variant: 'default',
    icon: CheckCircle2,
    color: 'text-green-600',
  },
  completed: {
    label: 'ConcluÃ­do',
    variant: 'outline',
    icon: CheckCircle2,
    color: 'text-green-600',
  },
  cancelled: {
    label: 'Cancelado',
    variant: 'destructive',
    icon: XCircle,
    color: 'text-red-600',
  },
};

export function OrderStatusBadge({ status, size = 'md' }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <Badge variant={config.variant} className={`gap-1 ${sizeClasses[size]}`}>
      <Icon className={`${iconSizes[size]} ${config.color}`} />
      {config.label}
    </Badge>
  );
}

