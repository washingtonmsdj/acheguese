/**
 * PermissionGovernanceBadge Component
 * 
 * Badge para exibir status de governança de permissões
 */

import { Badge } from "@/shared/components/ui/badge";
import type { PermissionGovernanceBadgeProps } from "../../sections/types";

export function PermissionGovernanceBadge({ permissionGovernance }: PermissionGovernanceBadgeProps) {
  if (!permissionGovernance) {
    return <Badge variant="outline">Sem snapshot</Badge>;
  }

  if (permissionGovernance.status === "active") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Ativo</Badge>;
  }

  if (permissionGovernance.status === "limited") {
    return <Badge className="bg-orange-500 hover:bg-orange-500">Limitado</Badge>;
  }

  return <Badge variant="destructive">Bloqueado</Badge>;
}
