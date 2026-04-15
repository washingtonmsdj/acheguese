 
import React from "react";
import { Check, Sparkles, TrendingUp, Crown } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { SUBSCRIPTION_PLANS, type PlanType } from "@/shared/types/subscription";
import { cn } from "@/shared/utils/cn";
import { SUBSCRIPTION_PLAN } from "@/shared/types/constants";
interface SubscriptionPlansProps {
  currentPlan?: PlanType;
  onSelectPlan: (planId: PlanType) => void;
}

const PLAN_ICONS = {
  basico: Sparkles,
  profissional: TrendingUp,
  premium: Crown,
};

export default function SubscriptionPlans({
  currentPlan,
  onSelectPlan,
}: SubscriptionPlansProps) {
  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Escolha seu plano</h2>
        <p className="text-muted-foreground">
          Selecione o plano ideal para o seu negócio crescer
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const Icon = PLAN_ICONS[plan.id];
          const isCurrentPlan = currentPlan === plan.id;
          const isPopular = plan.featured;

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative p-6 flex flex-col",
                isPopular && "border-primary border-2 shadow-lg",
                isCurrentPlan && "bg-primary/5",
              )}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  Mais Popular
                </Badge>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    plan.id === SUBSCRIPTION_PLAN.BASICO &&
                      "bg-blue-500/10 text-blue-600",
                    plan.id === "profissional" && "bg-primary/10 text-primary",
                    plan.id === SUBSCRIPTION_PLAN.PREMIUM_20 &&
                      "bg-yellow-500/10 text-yellow-600",
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">{plan.name}</h3>
                  {isCurrentPlan && (
                    <Badge variant="outline" className="text-xs">
                      Plano Atual
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">R$ {plan.price}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                {plan.recursos.map((recurso, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{recurso}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => onSelectPlan(plan.id)}
                disabled={isCurrentPlan}
                variant={isPopular ? "default" : "outline"}
                className="w-full"
              >
                {isCurrentPlan ? "Plano Atual" : "Selecionar Plano"}
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Todos os planos incluem 14 dias de teste grátis</p>
        <p>Cancele a qualquer momento, sem multas</p>
      </div>
    </div>
  );
}
