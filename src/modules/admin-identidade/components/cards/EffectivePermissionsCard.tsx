/**
 * EffectivePermissionsCard Component
 * 
 * Card de permissões efetivas
 */

import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { EffectivePermissionsCardProps } from "../../sections/types";
import { PermissionGovernanceBadge, PermissionActionBadge } from "../badges";

export function EffectivePermissionsCard({ permissionGovernance }: EffectivePermissionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissoes efetivas</CardTitle>
        <CardDescription>Snapshot atual do AuthorizationEngine e das fontes administrativas do perfil.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <PermissionGovernanceBadge permissionGovernance={permissionGovernance} />
          {permissionGovernance?.sourceRoles.map((role) => (
            <Badge key={`role-${role}`} variant="outline">
              {role}
            </Badge>
          ))}
          {permissionGovernance?.sourceMembershipRoles.map((role) => (
            <Badge key={`membership-${role}`} variant="secondary">
              membership:{role}
            </Badge>
          ))}
        </div>

        {permissionGovernance ? (
          <>
            <div className="text-xs text-muted-foreground">
              {permissionGovernance.allowedActions} allowed -{" "}
              {permissionGovernance.deniedActions} denied -{" "}
              {permissionGovernance.targetDependentActions} dependem de target
            </div>

            <div className="space-y-2">
              {permissionGovernance.actionMatrix.map((action) => (
                <div
                  key={action.action}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="font-medium">{action.action}</div>
                  <PermissionActionBadge status={action.status} />
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs text-muted-foreground">
              {permissionGovernance.notes.map((note) => (
                <div key={note}>{note}</div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-muted-foreground">
            Nao foi possivel carregar o snapshot de permissoes efetivas.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
