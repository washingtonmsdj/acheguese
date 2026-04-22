/**
 * StatusBadge Component
 * 
 * Badge para exibir status do perfil (público/privado, ativo/inativo, verificado/suspenso)
 */

import { Badge } from "@/shared/components/ui/badge";
import type { StatusBadgeProps } from "../../sections/types";

export function StatusBadge({ profile }: StatusBadgeProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {profile.isPublic ? (
        <Badge className="bg-sky-600 hover:bg-sky-600">Publico</Badge>
      ) : (
        <Badge variant="outline">Privado</Badge>
      )}
      {profile.isSuspended ? (
        <Badge variant="destructive">Suspenso</Badge>
      ) : profile.isActive ? (
        profile.isVerified ? (
          <Badge className="bg-emerald-600 hover:bg-emerald-600">Verificado</Badge>
        ) : (
          <Badge variant="outline">Ativo</Badge>
        )
      ) : (
        <Badge variant="secondary">Inativo</Badge>
      )}
    </div>
  );
}
