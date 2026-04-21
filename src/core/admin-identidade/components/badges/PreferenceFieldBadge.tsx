/**
 * PreferenceFieldBadge Component
 * 
 * Badge para exibir estado de campo de preferência
 */

import { Badge } from "@/shared/components/ui/badge";
import type { PreferenceFieldBadgeProps } from "../../sections/types";

export function PreferenceFieldBadge({ field }: PreferenceFieldBadgeProps) {
  if (field.state === "enabled") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">{field.label}</Badge>;
  }

  if (field.state === "disabled") {
    return <Badge variant="secondary">{field.label}</Badge>;
  }

  if (field.state === "unset") {
    return <Badge className="bg-orange-500 hover:bg-orange-500">{field.label}</Badge>;
  }

  return <Badge variant="outline">{field.label}</Badge>;
}
