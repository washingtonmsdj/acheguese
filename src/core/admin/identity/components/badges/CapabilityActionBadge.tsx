import { Badge } from "@/shared/components/ui/badge";
import type { CapabilityActionBadgeProps } from "../../sections/types";

export function CapabilityActionBadge({ status }: CapabilityActionBadgeProps) {
  if (status === "allowed") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">visivel</Badge>;
  }

  if (status === "requiresTarget") {
    return <Badge variant="secondary">depende do recurso</Badge>;
  }

  return <Badge variant="outline">oculto</Badge>;
}
