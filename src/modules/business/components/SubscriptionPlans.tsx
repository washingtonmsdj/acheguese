import { Check, Crown, Sparkles, Truck, TrendingUp } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useBillingPlans } from "@/core/billing/hooks/useBillingPlans";
import { PlanTier } from "@/core/billing/types";
import { cn } from "@/shared/utils/cn";
import type { BillingPlan } from "@/core/billing/services/BillingPlanService";

interface SubscriptionPlansProps {
  currentPlan?: PlanTier;
  onSelectPlan: (planId: PlanTier) => void;
}

function getPlanIcon(plan: BillingPlan) {
  if (plan.code === PlanTier.FREE) return Sparkles;
  if (plan.code === PlanTier.DELIVERY) return Truck;
  if (plan.isFeatured) return Crown;
  return TrendingUp;
}

function formatPeriod(period: string) {
  if (period === "month" || period === "monthly") return "/mes";
  if (period === "year" || period === "yearly") return "/ano";
  return period ? `/${period}` : "";
}

export default function SubscriptionPlans({
  currentPlan,
  onSelectPlan,
}: SubscriptionPlansProps) {
  const { data: plans = [], isLoading, isError } = useBillingPlans();

  if (isLoading) {
    return (
      <div className="grid gap-4 py-6 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-80 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError || plans.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Nao foi possivel carregar os planos disponiveis.
      </Card>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-3xl font-bold">Escolha seu plano</h2>
        <p className="text-muted-foreground">
          Planos carregados do billing para refletir precos e recursos atuais.
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const Icon = getPlanIcon(plan);
          const planTier = plan.code as PlanTier;
          const isCurrentPlan = currentPlan === planTier;

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col p-6",
                plan.isFeatured && "border-2 border-primary shadow-lg",
                isCurrentPlan && "bg-primary/5",
              )}
            >
              {plan.isFeatured && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  Mais popular
                </Badge>
              )}

              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  {isCurrentPlan && (
                    <Badge variant="outline" className="text-xs">
                      Plano atual
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.priceDisplay}</span>
                  <span className="text-muted-foreground">
                    {formatPeriod(plan.billingPeriod)}
                  </span>
                </div>
                {plan.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                )}
              </div>

              <ul className="mb-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => onSelectPlan(planTier)}
                disabled={isCurrentPlan}
                variant={plan.isFeatured ? "default" : "outline"}
                className="w-full"
              >
                {isCurrentPlan ? "Plano atual" : "Selecionar plano"}
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Os recursos e limites sao definidos no billing central.</p>
      </div>
    </div>
  );
}
