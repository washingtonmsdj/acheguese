/**
 * ReputationSourceBadge Component
 * 
 * Badge para exibir status de fonte de reputação
 */

import { Badge } from "@/shared/components/ui/badge";
import type { ReputationSourceBadgeProps } from "../../sections/types";

export function ReputationSourceBadge({ source }: ReputationSourceBadgeProps) {
  if (source.status === "canonical") {
    return <Badge className="bg-sky-600 hover:bg-sky-600">Canonico</Badge>;
  }

  if (source.status === "legacy") {
    return <Badge className="bg-amber-600 hover:bg-amber-600">Legado controlado</Badge>;
  }

  if (source.status === "derived") {
    return <Badge variant="secondary">Derivado</Badge>;
  }

  return <Badge variant="outline">Sem sinal</Badge>;
}
