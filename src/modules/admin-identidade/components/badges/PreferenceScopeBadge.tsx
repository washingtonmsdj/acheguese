/**
 * PreferenceScopeBadge Component
 * 
 * Badge para exibir status de escopo de preferências
 */

import { Badge } from "@/shared/components/ui/badge";
import type { PreferenceScopeBadgeProps } from "../../sections/types";

export function PreferenceScopeBadge({ scope }: PreferenceScopeBadgeProps) {
  if (scope.status === "configured") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Configurado</Badge>;
  }

  if (scope.status === "partial") {
    return <Badge className="bg-orange-500 hover:bg-orange-500">Parcial</Badge>;
  }

  return <Badge variant="destructive">Sem cobertura</Badge>;
}
