import { Badge } from "@/shared/components/ui/badge";
import type { CapabilityPreviewBadgeProps } from "../../sections/types";

export function CapabilityPreviewBadge({
  capabilityPreview,
}: CapabilityPreviewBadgeProps) {
  if (!capabilityPreview) {
    return <Badge variant="outline">Sem previa</Badge>;
  }

  if (capabilityPreview.status === "active") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Ativo</Badge>;
  }

  if (capabilityPreview.status === "limited") {
    return <Badge className="bg-orange-500 hover:bg-orange-500">Limitado</Badge>;
  }

  return <Badge variant="destructive">Bloqueado</Badge>;
}
