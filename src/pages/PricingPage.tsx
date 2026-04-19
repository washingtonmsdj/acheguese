/**
 * ══════════════════════════════════════════════════════════════════════════
 * PRICING PAGE
 * ══════════════════════════════════════════════════════════════════════════
 * 
 * Página de planos e preços com integração ao Stripe.
 * 
 * ══════════════════════════════════════════════════════════════════════════
 */
import { logger } from '@/shared/utils/logger';
import { useState } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { useBilling } from '@/core/billing/hooks/useBilling';
import { useSubscription } from '@/core/billing/hooks/useSubscription';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plans, isLoadingPlans, redirectToCheckout } = useBilling();
  const { planCode: currentPlanCode, isLoadingSubscription } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planCode: string) => {
    if (!user) {
      navigate('/login?redirect=/pricing');
      return;
    }

    if (planCode === 'free') {
      // Plano free não precisa de checkout
      return;
    }

    setLoadingPlan(planCode);
    try {
      await redirectToCheckout({
        planCode,
        successUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/pricing`,
      });
    } catch (error) {
      logger.error('Error redirecting to checkout:', error);
    } finally {
      setLoadingPlan(null);
    }
  };

  if (isLoadingPlans || isLoadingSubscription) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Escolha o plano ideal para você
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Comece grátis e faça upgrade quando precisar de mais recursos
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans?.map((plan) => {
          const isCurrentPlan = currentPlanCode === plan.code;
          const isFeatured = plan.is_featured;
          const features = Array.isArray(plan.features) ? plan.features : [];

          return (
            <Card
              key={plan.code}
              className={`relative ${
                isFeatured ? 'border-primary shadow-lg scale-105' : ''
              }`}
            >
              {isFeatured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">
                      {plan.price_display}
                    </span>
                    {plan.billing_period === 'monthly' && (
                      <span className="text-muted-foreground">/mês</span>
                    )}
                  </div>
                  {plan.code === 'free' && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Para sempre
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {isCurrentPlan ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled
                  >
                    Plano Atual
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={isFeatured ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(plan.code)}
                    disabled={loadingPlan === plan.code}
                  >
                    {loadingPlan === plan.code ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : plan.code === 'free' ? (
                      'Começar Grátis'
                    ) : (
                      'Assinar Agora'
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-16 text-center">
        <p className="text-muted-foreground">
          Todos os planos incluem suporte por email.{' '}
          <a href="/contato" className="text-primary hover:underline">
            Entre em contato
          </a>{' '}
          para planos empresariais.
        </p>
      </div>
    </div>
  );
}
