/**
 * IssueBadge Component
 * 
 * Badge para exibir issues de perfil
 */

import { Badge } from "@/shared/components/ui/badge";
import type { IssueBadgeProps } from "../../sections/types";
import { issueLabel } from "../../utils";

export function IssueBadge({ issue }: IssueBadgeProps) {
  if (issue === "public_without_username" || issue === "suspended") {
    return <Badge variant="destructive">{issueLabel(issue)}</Badge>;
  }

  if (issue === "public_unverified") {
    return <Badge className="bg-orange-500 hover:bg-orange-500">{issueLabel(issue)}</Badge>;
  }

  return <Badge variant="secondary">{issueLabel(issue)}</Badge>;
}
