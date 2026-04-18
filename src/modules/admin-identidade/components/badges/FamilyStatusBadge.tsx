/**
 * FamilyStatusBadge Component
 * 
 * Badge para exibir status de família
 */

import { Badge } from "@/shared/components/ui/badge";
import type { FamilyStatusBadgeProps } from "../../sections/types";

export function FamilyStatusBadge({ family }: FamilyStatusBadgeProps) {
  if (family.status === "available") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Coberto</Badge>;
  }

  if (family.status === "empty") {
    return <Badge variant="secondary">Sem vinculos</Badge>;
  }

  return <Badge className="bg-orange-500 hover:bg-orange-500">Nao modelado localmente</Badge>;
}
