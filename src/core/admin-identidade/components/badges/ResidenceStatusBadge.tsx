/**
 * ResidenceStatusBadge Component
 * 
 * Badge para exibir status de residência canônica
 */

import { Badge } from "@/shared/components/ui/badge";
import type { ResidenceStatusBadgeProps } from "../../sections/types";

export function ResidenceStatusBadge({ residence }: ResidenceStatusBadgeProps) {
  if (!residence) {
    return <Badge variant="outline">Sem residencia canonica</Badge>;
  }

  if (residence.status === "verified") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Verificada</Badge>;
  }

  if (residence.status === "pending_verification") {
    return <Badge className="bg-orange-500 hover:bg-orange-500">Verificacao pendente</Badge>;
  }

  return <Badge variant="secondary">Nao verificada</Badge>;
}
