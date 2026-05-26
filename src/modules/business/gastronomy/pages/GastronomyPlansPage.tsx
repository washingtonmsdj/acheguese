/**
 * GastronomyPlansPage - Comparacao e upgrade de planos
 *
 * SSOT: planos vindos de billing_plans (banco), não de constantes hardcoded.
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBusinessSubscription } from '@/core/billing';
import { useBillingPlans } from '@/core/billing/hooks/useBillingPlans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Check, ArrowLeft, Crown, Loader2 } from 'lucide-react';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';
import { BillingService } from '@/core/billing/services/BillingService';
import { buildPublicAbsoluteUrl } from '@/shared/config/publicAppOrigin';

export default function GastronomyPlansPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const [checkoutPlanCode, setCheckoutPlanCode] = useState<string | null>(null);

  const { planTier, isLoading: loadingSubscription } = useBusinessSubscription(businessId!);
  const { data: plans = [], isLoading: loadingPlans } = useBillingPlans();

  if (loadingSubscription || loadingPlans) {
    return (
      <div className="container max-w-6xl py-8">
        <p>Carregando planos...</p>
      </div>
    );
  }

  const sortedPlans = [...plans].sort((a, b) => a.displayOrder - b.displayOrder);

  const handleUpgrade = async (targetPlanCode: string) => {
    if (!businessId) return;

    if (targetPlanCode === 'free') {
      navigate(businessManagementRoutes.gastronomia(businessId));
      return;
    }

    setCheckoutPlanCode(targetPlanCode);
    try {
      const plansPath = businessManagementRoutes.planos(businessId);
      await BillingService.redirectToCheckout({
        planCode: targetPlanCode,
        businessId,
        subscriptionScope: 'business',
        entityFamily: 'company',
        vertical: 'gastronomy',
        successUrl: buildPublicAbsoluteUrl(`${plansPath}?upgrade=success`),
        cancelUrl: buildPublicAbsoluteUrl(plansPath),
      });
    } finally {
      setCheckoutPlanCode(null);
    }
  };

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(businessManagementRoutes.gastronomia(businessId!))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Escolha seu Plano</h1>
        <p className="text-muted-foreground mt-2">
          Compare recursos e escolha o melhor plano para o seu negocio.
        </p>
      </div>

      <div className="bg-muted/50 border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          Plano atual:{' '}
          <span className="font-medium text-foreground">{planTier}</span>
        </p>
      </div>

      {sortedPlans.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum plano ativo encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {sortedPlans.map((plan) => {
            const isCurrent = plan.code === planTier;
            const isFeatured = plan.isFeatured;

            return (
              <Card
                key={plan.id}
                className={isCurrent ? 'border-primary' : isFeatured ? 'border-2' : ''}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {isFeatured && <Crown className="w-5 h-5 text-amber-500" />}
                      {plan.name}
                    </span>
                    {isCurrent ? (
                      <Badge variant="outline">Atual</Badge>
                    ) : isFeatured ? (
                      <Badge>Recomendado</Badge>
                    ) : null}
                  </CardTitle>
                  <CardDescription>{plan.description || 'Plano de assinatura'}</CardDescription>
                  <div className="pt-4">
                    <span className="text-3xl font-bold">{plan.priceDisplay}</span>
                    {plan.priceCents > 0 && <span className="text-sm text-muted-foreground">/mes</span>}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={`${plan.id}-feature-${index}`} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Plano Atual
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(plan.code)}
                      disabled={checkoutPlanCode === plan.code}
                    >
                      {checkoutPlanCode === plan.code && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {plan.priceCents > 0 ? 'Fazer Upgrade' : 'Mudar para este plano'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
