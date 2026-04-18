/**
 * PlanBadge Component
 * 
 * Badge para exibir plano de assinatura
 */

import { Badge } from "@/shared/components/ui/badge";
import type { PlanBadgeProps } from "../../sections/types";

export function PlanBadge({ plan }: PlanBadgeProps) {
  if (plan === "premium" || plan === "enterprise") {
    return <Badge className="bg-violet-600 hover:bg-violet-600">{plan}</Badge>;
  }

  if (plan === "basic") {
    return <Badge variant="secondary">basic</Badge>;
  }

  return <Badge variant="outline">{plan}</Badge>;
}
