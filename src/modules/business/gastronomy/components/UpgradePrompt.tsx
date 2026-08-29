/**
 * UpgradePrompt — Componente de prompt de upgrade
 *
 * Mostra quando um recurso está bloqueado pelo plano atual.
 * O módulo conversa com uma oferta genérica do core billing e não com plan code
 * direto. Nome/preco do plano vem do owner canonico de billing; nao existe
 * fallback monetario hardcoded no modulo.
 */

import { useBillingPlan } from '@/core/billing/hooks/useBillingPlans';
import { BillingOfferService, type BillingOfferKey } from '@/core/billing/services/BillingOfferService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Crown, Zap, Lock, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';

interface UpgradePromptProps {
  businessId: string;
  feature: string;
  offerKey: BillingOfferKey;
  description?: string;
  benefits?: string[];
}

export function UpgradePrompt({
  businessId,
  feature,
  offerKey,
  description,
  benefits = [],
}: UpgradePromptProps) {
  const offer = BillingOfferService.getOffer(offerKey);
  const { data: planData } = useBillingPlan(offer.planCode);

  const planName = planData?.name || offer.label;
  const planPrice = planData?.priceDisplay || 'Preço indisponível';
  const planIcon = offer.icon === 'crown' ? <Crown className="w-5 h-5" /> : <Zap className="w-5 h-5" />;

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
          <Link to={businessManagementRoutes.planos(businessId)}>
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
  offerKey: BillingOfferKey;
}

export function UpgradePromptInline({
  businessId,
  feature,
  offerKey,
}: UpgradePromptInlineProps) {
  const offer = BillingOfferService.getOffer(offerKey);
  const { data: planData } = useBillingPlan(offer.planCode);
  const planName = planData?.name || offer.label;

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
      <Link to={businessManagementRoutes.planos(businessId)}>
        <Button size="sm" variant="outline">
          Fazer Upgrade
        </Button>
      </Link>
    </div>
  );
}
