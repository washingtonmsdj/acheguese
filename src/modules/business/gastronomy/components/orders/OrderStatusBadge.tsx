/**
 * OrderStatusBadge - badge de status do pedido.
 */

import type { ComponentType } from 'react';
import {
  CheckCircle,
  CheckCircle2,
  ChefHat,
  Clock,
  Package,
  Truck,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { getRecordValue } from '@/shared/utils/recordLookup';
import type { OrderStatus } from '@/modules/business/gastronomy/services/OrderService';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: ComponentType<{ className?: string }>;
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
    label: 'Saiu para entrega',
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
    label: 'Concluido',
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

function getSizeClass(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'text-xs';
    case 'md':
      return 'text-sm';
    case 'lg':
      return 'text-base';
    default:
      return 'text-sm';
  }
}

function getIconSizeClass(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'w-3 h-3';
    case 'md':
      return 'w-4 h-4';
    case 'lg':
      return 'w-5 h-5';
    default:
      return 'w-4 h-4';
  }
}

export function OrderStatusBadge({ status, size = 'md' }: OrderStatusBadgeProps) {
  const config = getRecordValue(STATUS_CONFIG, status) ?? STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`gap-1 ${getSizeClass(size)}`}>
      <Icon className={`${getIconSizeClass(size)} ${config.color}`} />
      {config.label}
    </Badge>
  );
}
