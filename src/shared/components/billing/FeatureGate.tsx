/**
 * ══════════════════════════════════════════════════════════════════════════
 * FEATURE GATE COMPONENT
 * ══════════════════════════════════════════════════════════════════════════
 * 
 * Componente para proteger recursos premium.
 * 
 * ══════════════════════════════════════════════════════════════════════════
 */

import { ReactNode } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useSubscription } from '@/core/billing/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

interface FeatureGateProps {
  children: ReactNode;
  requiredPlan?: 'pro' | 'delivery';
  feature?: string;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export function FeatureGate({
  children,
  requiredPlan,
  feature,
  fallback,
  showUpgradePrompt = true,
}: FeatureGateProps) {
  const navigate = useNavigate();
  const { isPro, isDelivery, planCode } = useSubscription();

  // Check if user has required plan
  const hasAccess = () => {
    if (requiredPlan === 'pro') {
      return isPro || isDelivery;
    }
    if (requiredPlan === 'delivery') {
      return isDelivery;
    }
    return true;
  };

  // If user has access, render children
  if (hasAccess()) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  if (showUpgradePrompt) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Recurso Premium</CardTitle>
              <CardDescription>
                Disponível no plano {requiredPlan === 'delivery' ? 'Delivery' : 'Pro'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {requiredPlan === 'delivery' 
              ? 'Faça upgrade para o plano Delivery para acessar este recurso e muito mais.'
              : 'Faça upgrade para o plano Pro para desbloquear este recurso.'}
          </p>
          <Button
            className="w-full"
            onClick={() => navigate('/pricing')}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Ver Planos
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No prompt, just hide
  return null;
}

/**
 * Hook version for conditional rendering
 */
export function useFeatureGate(requiredPlan?: 'pro' | 'delivery') {
  const { isPro, isDelivery } = useSubscription();

  const hasAccess = () => {
    if (requiredPlan === 'pro') {
      return isPro || isDelivery;
    }
    if (requiredPlan === 'delivery') {
      return isDelivery;
    }
    return true;
  };

  return {
    hasAccess: hasAccess(),
    isPro,
    isDelivery,
  };
}
