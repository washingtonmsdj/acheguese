/**
 * GastronomyPlansPage — Página de comparação e upgrade de planos
 *
 * Mostra os 3 planos disponíveis (Free, Pro, Delivery) com:
 * - Recursos de cada plano
 * - Preços
 * - CTAs de upgrade
 * - Comparação lado a lado
 *
 * SSOT: Usa PLANS do core/billing
 */
import { logger } from '@/shared/utils/logger';
import { useParams, useNavigate } from 'react-router-dom';
import { useBusinessSubscription, PLANS, PlanTier } from '@/core/billing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Crown, Zap, Check, ArrowLeft } from 'lucide-react';
export default function GastronomyPlansPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { planTier, isLoading } = useBusinessSubscription(businessId!);

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <p>Carregando planos...</p>
      </div>
    );
  }

  const freePlan = PLANS[PlanTier.FREE];
  const proPlan = PLANS[PlanTier.PRO];
  const deliveryPlan = PLANS[PlanTier.DELIVERY];

  const handleUpgrade = (targetPlan: PlanTier) => {
    // TODO: Integrar com Stripe/gateway de pagamento
    logger.debug('Upgrade para:', targetPlan);
    alert(`Upgrade para ${targetPlan} será implementado em breve!`);
  };

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/dashboard/business/${businessId}/gastronomy`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Escolha seu Plano</h1>
        <p className="text-muted-foreground mt-2">
          Selecione o plano ideal para o seu negócio e desbloqueie recursos poderosos
        </p>
      </div>

      {/* Plano Atual */}
      {planTier && (
        <div className="bg-muted/50 border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            Plano atual:{' '}
            <span className="font-medium text-foreground">
              {planTier === 'free' && 'Free'}
              {planTier === 'pro' && 'Pro'}
              {planTier === 'delivery' && 'Delivery'}
            </span>
          </p>
        </div>
      )}

      {/* Grid de Planos */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Free */}
        <Card className={planTier === 'free' ? 'border-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Free
              {planTier === 'free' && (
                <Badge variant="outline">Atual</Badge>
              )}
            </CardTitle>
            <CardDescription>Para começar</CardDescription>
            <div className="pt-4">
              <span className="text-3xl font-bold">{freePlan.price}</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {freePlan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {planTier === 'free' ? (
              <Button variant="outline" className="w-full" disabled>
                Plano Atual
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleUpgrade(PlanTier.FREE)}
              >
                Voltar para Free
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Pro */}
        <Card className={planTier === 'pro' ? 'border-primary' : 'border-2'}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Pro
              </span>
              {planTier === 'pro' ? (
                <Badge variant="outline">Atual</Badge>
              ) : (
                <Badge>Recomendado</Badge>
              )}
            </CardTitle>
            <CardDescription>Para crescer</CardDescription>
            <div className="pt-4">
              <span className="text-3xl font-bold">{proPlan.price}</span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {proPlan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {planTier === 'pro' ? (
              <Button variant="outline" className="w-full" disabled>
                Plano Atual
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleUpgrade(PlanTier.PRO)}
              >
                Fazer Upgrade
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Delivery */}
        <Card className={planTier === 'delivery' ? 'border-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                Delivery
              </span>
              {planTier === 'delivery' && (
                <Badge variant="outline">Atual</Badge>
              )}
            </CardTitle>
            <CardDescription>Completo</CardDescription>
            <div className="pt-4">
              <span className="text-3xl font-bold">{deliveryPlan.price}</span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {deliveryPlan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {planTier === 'delivery' ? (
              <Button variant="outline" className="w-full" disabled>
                Plano Atual
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleUpgrade(PlanTier.DELIVERY)}
              >
                Fazer Upgrade
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Comparação Detalhada */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Comparação Detalhada</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-medium">Recurso</th>
                <th className="text-center p-4 font-medium">Free</th>
                <th className="text-center p-4 font-medium">Pro</th>
                <th className="text-center p-4 font-medium">Delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="p-4">Página pública</td>
                <td className="text-center p-4">
                  <Check className="w-5 h-5 text-primary mx-auto" />
                </td>
                <td className="text-center p-4">
                  <Check className="w-5 h-5 text-primary mx-auto" />
                </td>
                <td className="text-center p-4">
                  <Check className="w-5 h-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="p-4">Itens do cardápio</td>
                <td className="text-center p-4 text-sm text-muted-foreground">Até 20</td>
                <td className="text-center p-4 text-sm text-muted-foreground">Ilimitado</td>
                <td className="text-center p-4 text-sm text-muted-foreground">Ilimitado</td>
              </tr>
              <tr>
                <td className="p-4">Link premium (/p/slug)</td>
                <td className="text-center p-4 text-muted-foreground">—</td>
                <td className="text-center p-4">
                  <Check className="w-5 h-5 text-primary mx-auto" />
                </td>
                <td className="text-center p-4">
                  <Check className="w-5 h-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="p-4">QR Code personalizado</td>
                <td className="text-center p-4 text-muted-foreground">—</td>
                <td className="text-center p-4">
                  <Check className="w-5 h-5 text-primary mx-auto" />
                </td>
                <td className="text-center p-4">
                  <Check className="w-5 h-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="p-4">Promoções</td>
                <td className="text-center p-4 text-muted-foreground">—</td>
                <td className="text-center p-4 text-sm text-muted-foreground">Até 10</td>
                <td className="text-center p-4 text-sm text-muted-foreground">Ilimitado</td>
              </tr>
              <tr>
                <td className="p-4">Analytics</td>
                <td className="text-center p-4 text-muted-foreground">—</td>
                <td className="text-center p-4 text-sm text-muted-foreground">Básico</td>
                <td className="text-center p-4 text-sm text-muted-foreground">Avançado</td>
              </tr>
              <tr>
                <td className="p-4">Pedidos internos</td>
                <td className="text-center p-4 text-muted-foreground">—</td>
                <td className="text-center p-4 text-muted-foreground">—</td>
                <td className="text-center p-4">
                  <Check className="w-5 h-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="p-4">Rede de motoboys</td>
                <td className="text-center p-4 text-muted-foreground">—</td>
                <td className="text-center p-4 text-muted-foreground">—</td>
                <td className="text-center p-4">
                  <Check className="w-5 h-5 text-primary mx-auto" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
