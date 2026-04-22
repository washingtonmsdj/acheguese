/**
 * ReputationVisibilityBadge Component
 * 
 * Badge para exibir visibilidade de fonte de reputação
 */

import { Badge } from "@/shared/components/ui/badge";
import type { ReputationVisibilityBadgeProps } from "../../sections/types";

export function ReputationVisibilityBadge({ source }: ReputationVisibilityBadgeProps) {
  if (source.visibility === "public") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Publico</Badge>;
  }

  if (source.visibility === "private") {
    return <Badge variant="secondary">Privado</Badge>;
  }

  return <Badge variant="outline">Interno</Badge>;
}
