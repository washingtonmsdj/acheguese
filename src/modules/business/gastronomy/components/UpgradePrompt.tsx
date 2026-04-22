/**
 * UpgradePrompt — Componente de prompt de upgrade
 *
 * Mostra quando um recurso está bloqueado pelo plano atual.
 * Incentiva o usuário a fazer upgrade.
 *
 * SSOT: Usa useBillingPlan do core/billing para buscar dados do catálogo
 */

import { PlanTier } from '@/core/billing';
import { useBillingPlan } from '@/core/billing/hooks/useBillingPlans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Crown, Zap, Lock, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UpgradePromptProps {
  businessId: string;
  feature: string;
  requiredPlan: PlanTier;
  description?: string;
  benefits?: string[];
}

export function UpgradePrompt({
  businessId,
  feature,
  requiredPlan,
  description,
  benefits = [],
}: UpgradePromptProps) {
  // Buscar dados do plano do catálogo
  const planCode = requiredPlan === PlanTier.PRO ? 'gastronomy_pro' : 'gastronomy_delivery';
  const { data: planData } = useBillingPlan(planCode);
  
  const planName = planData?.name || (requiredPlan === PlanTier.PRO ? 'Pro' : 'Delivery');
  const planPrice = planData?.priceDisplay || (requiredPlan === PlanTier.PRO ? 'R$ 49,90/mês' : 'R$ 99,90/mês');
  const planIcon = requiredPlan === PlanTier.PRO ? <Crown className="w-5 h-5" /> : <Zap className="w-5 h-5" />;

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-muted">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {feature}
              <Badge variant="outline" className="flex items-center gap-1">
                {planIcon}
                {planName}
              </Badge>
            </CardTitle>
            <CardDescription>
              {description || `Este recurso está disponível no plano ${planName}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {benefits.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Com o plano {planName} você terá:</p>
            <ul className="space-y-1">
              {benefits.map((benefit, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <p className="text-sm font-medium">{planName}</p>
            <p className="text-xs text-muted-foreground">{planPrice}</p>
          </div>
          <Link to={`/dashboard/business/${businessId}/gastronomy/plans`}>
            <Button>
              <TrendingUp className="w-4 h-4 mr-2" />
              Fazer Upgrade
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * UpgradePromptInline — Versão inline para usar dentro de seções
 */
interface UpgradePromptInlineProps {
  businessId: string;
  feature: string;
  requiredPlan: PlanTier;
}

export function UpgradePromptInline({
  businessId,
  feature,
  requiredPlan,
}: UpgradePromptInlineProps) {
  // Buscar dados do plano do catálogo
  const planCode = requiredPlan === PlanTier.PRO ? 'gastronomy_pro' : 'gastronomy_delivery';
  const { data: planData } = useBillingPlan(planCode);
  
  const planName = planData?.name || (requiredPlan === PlanTier.PRO ? 'Pro' : 'Delivery');

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        <Lock className="w-5 h-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{feature}</p>
          <p className="text-xs text-muted-foreground">
            Disponível no plano {planName}
          </p>
        </div>
      </div>
      <Link to={`/dashboard/business/${businessId}/gastronomy/plans`}>
        <Button size="sm" variant="outline">
          Fazer Upgrade
        </Button>
      </Link>
    </div>
  );
}
