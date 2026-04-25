/**
 * GastronomyPlansPage - Comparacao e upgrade de planos
 *
 * SSOT: Planos vindos de billing_plans (banco), nao de constantes hardcoded.
 */

import { logger } from '@/shared/utils/logger';
import { useParams, useNavigate } from 'react-router-dom';
import { useBusinessSubscription } from '@/core/billing';
import { useBillingPlans } from '@/core/billing/hooks/useBillingPlans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Check, ArrowLeft, Crown } from 'lucide-react';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';

export default function GastronomyPlansPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();

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

  const handleUpgrade = (targetPlanCode: string) => {
    logger.debug('Upgrade solicitado para:', targetPlanCode);
    alert(`Upgrade para ${targetPlanCode} sera implementado em breve!`);
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
                    <Button className="w-full" onClick={() => handleUpgrade(plan.code)}>
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
