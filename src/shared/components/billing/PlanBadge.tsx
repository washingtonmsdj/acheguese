/**
 * ══════════════════════════════════════════════════════════════════════════
 * PLAN BADGE COMPONENT
 * ══════════════════════════════════════════════════════════════════════════
 * 
 * Badge para exibir o plano atual do usuário.
 * 
 * ══════════════════════════════════════════════════════════════════════════
 */

import { Badge } from '@/shared/components/ui/badge';
import { useSubscription } from '@/core/billing/hooks/useSubscription';
import { Crown, Truck, Loader2 } from 'lucide-react';

interface PlanBadgeProps {
  showIcon?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
}

export function PlanBadge({ showIcon = true, variant }: PlanBadgeProps) {
  const { planCode, planName, isLoadingSubscription } = useSubscription();

  if (isLoadingSubscription) {
    return (
      <Badge variant="secondary">
        <Loader2 className="h-3 w-3 animate-spin" />
      </Badge>
    );
  }

  const getIcon = () => {
    if (!showIcon) return null;
    
    switch (planCode) {
      case 'pro':
        return <Crown className="h-3 w-3 mr-1" />;
      case 'delivery':
        return <Truck className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  const getBadgeVariant = () => {
    if (variant) return variant;
    
    switch (planCode) {
      case 'pro':
        return 'default';
      case 'delivery':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Badge variant={getBadgeVariant()}>
      {getIcon()}
      {planName}
    </Badge>
  );
}
