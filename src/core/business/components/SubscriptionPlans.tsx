import { CreditCard } from "lucide-react";
import type { PlanTier } from "@/core/billing/types";

interface Props {
  currentPlan: PlanTier;
  onSelectPlan: (plan: PlanTier) => void;
}

export default function SubscriptionPlans({ currentPlan: _, onSelectPlan: __ }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
      <CreditCard className="h-10 w-10 opacity-40" />
      <p className="text-sm">Planos de assinatura em breve</p>
    </div>
  );
}
