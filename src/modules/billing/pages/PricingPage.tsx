import { useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/core/auth/hooks/useAuth";
import { useBilling } from "@/core/billing/hooks/useBilling";
import { useSubscription } from "@/core/billing/hooks/useSubscription";
import { BILLING_PATHS } from "@/core/billing/routes/billingRoutes";
import { buildPublicAbsoluteUrl } from "@/shared/config/publicAppOrigin";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plans, isLoadingPlans, plansError, redirectToCheckout } = useBilling();
  const { planCode, isLoadingSubscription } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (code: string) => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(BILLING_PATHS.pricing)}`);
      return;
    }
    if (code === "free") return;

    setLoadingPlan(code);
    try {
      await redirectToCheckout({
        planCode: code,
        successUrl: buildPublicAbsoluteUrl(BILLING_PATHS.checkoutSuccess),
        cancelUrl: buildPublicAbsoluteUrl(BILLING_PATHS.checkoutCancel),
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  if (isLoadingPlans || isLoadingSubscription) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-territory-canvas text-territory-ink">
        <Loader2 className="h-8 w-8 animate-spin text-territory-brand" aria-label="Carregando planos" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-territory-canvas px-4 py-10 text-territory-ink sm:px-6 lg:py-14">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-territory-sun/35 text-territory-ink">
            <Sparkles className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Planos do Achegue-se</h1>
          <p className="mt-2 text-sm leading-6 text-territory-muted sm:text-base">
            O catálogo publicado é a fonte de verdade para preços, recursos e contratação.
          </p>
        </header>

        {plansError ? (
          <div className="rounded-2xl border border-territory-error/25 bg-territory-error/10 p-4 text-sm text-territory-error">
            Não foi possível carregar o catálogo de planos agora.
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Planos disponíveis">
            {plans?.map((plan) => {
              const current = planCode === plan.code;
              return (
                <Card key={plan.code} className={`relative border-territory-border bg-territory-surface text-territory-ink shadow-sm ${plan.isFeatured ? "ring-2 ring-territory-brand/30" : ""}`}>
                  {plan.isFeatured ? <Badge className="absolute right-4 top-4 bg-territory-sun text-territory-ink hover:bg-territory-sun">Recomendado</Badge> : null}
                  <CardHeader>
                    <CardTitle className="font-heading text-xl">{plan.name}</CardTitle>
                    <CardDescription className="text-territory-muted">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div>
                      <strong className="text-3xl">{plan.priceDisplay}</strong>
                      {plan.billingPeriod === "monthly" ? <span className="ml-1 text-sm text-territory-muted">/mês</span> : null}
                    </div>
                    <ul className="space-y-2.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-territory-success" aria-hidden="true" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className={`w-full ${plan.isFeatured ? "bg-territory-sun text-territory-ink hover:bg-territory-sun/90" : "border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"}`} variant={plan.isFeatured ? "default" : "outline"} disabled={current || loadingPlan === plan.code} onClick={() => void handleSelectPlan(plan.code)}>
                      {loadingPlan === plan.code ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                      {current ? "Plano atual" : plan.code === "free" ? "Plano gratuito" : "Escolher plano"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
