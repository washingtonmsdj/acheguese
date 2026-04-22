/**
 * PermissionActionBadge Component
 * 
 * Badge para exibir status de ação de permissão
 */

import { Badge } from "@/shared/components/ui/badge";
import type { PermissionActionBadgeProps } from "../../sections/types";

export function PermissionActionBadge({ status }: PermissionActionBadgeProps) {
  if (status === "allowed") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">allowed</Badge>;
  }

  if (status === "requiresTarget") {
    return <Badge variant="secondary">requires target</Badge>;
  }

  return <Badge variant="outline">denied</Badge>;
}
