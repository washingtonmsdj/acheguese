/**
 * BenefitCard
 * 
 * Card de benefício de cadastro
 */

import type { BenefitCardProps } from "../../sections/types";

export function BenefitCard({ benefit }: BenefitCardProps) {
  const Icon = benefit.icon;
  
  return (
    <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
      <div className={`${benefit.bgClass} p-2 rounded-lg shrink-0`}>
        <Icon className={`h-5 w-5 ${benefit.iconClass}`} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{benefit.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{benefit.description}</p>
      </div>
    </div>
  );
}
