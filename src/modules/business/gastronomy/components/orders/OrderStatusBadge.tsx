/**
 * OrderStatusBadge — Badge de status do pedido
 *
 * Mostra status com cor e ícone apropriados.
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
    label: 'Concluído',
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

function getStatusConfig(status: OrderStatus) {
  switch (status) {
    case 'pending': return STATUS_CONFIG.pending;
    case 'confirmed': return STATUS_CONFIG.confirmed;
    case 'preparing': return STATUS_CONFIG.preparing;
    case 'ready': return STATUS_CONFIG.ready;
    case 'out_for_delivery': return STATUS_CONFIG.out_for_delivery;
    case 'delivered': return STATUS_CONFIG.delivered;
    case 'completed': return STATUS_CONFIG.completed;
    case 'cancelled': return STATUS_CONFIG.cancelled;
    default: return STATUS_CONFIG.pending;
  }
}

function getSizeClass(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm': return 'text-xs';
    case 'md': return 'text-sm';
    case 'lg': return 'text-base';
    default: return 'text-sm';
  }
}

function getIconSizeClass(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm': return 'w-3 h-3';
    case 'md': return 'w-4 h-4';
    case 'lg': return 'w-5 h-5';
    default: return 'w-4 h-4';
  }
}

export function OrderStatusBadge({ status, size = 'md' }: OrderStatusBadgeProps) {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`gap-1 ${getSizeClass(size)}`}>
      <Icon className={`${getIconSizeClass(size)} ${config.color}`} />
      {config.label}
    </Badge>
  );
}

