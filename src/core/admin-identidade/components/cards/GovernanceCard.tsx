/**
 * GovernanceCard Component
 * 
 * Card de governança (snapshot efetivo da conta)
 */

import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { GovernanceCardProps } from "../../sections/types";
import { PlanBadge } from "../badges";

export function GovernanceCard({ detail }: GovernanceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Governanca</CardTitle>
        <CardDescription>Snapshot efetivo da conta e cobertura administrativa atual.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <PlanBadge plan={detail.profile.activePlan} />
          <Badge variant="outline">{detail.profile.subscriptionStatus}</Badge>
          {detail.roles.map((role) => (
            <Badge key={role.id} variant="outline">
              {role.role}
            </Badge>
          ))}
        </div>
        <div>
          <span className="text-muted-foreground">Reputacao:</span>{" "}
          {detail.effectiveContext?.reputation.score ?? detail.profile.reputation}
        </div>
        <div>
          <span className="text-muted-foreground">Origens reputacionais:</span>{" "}
          {
            detail.reputationSources.filter(
              (source) =>
                source.origin !== "profile_aggregate" && source.status !== "missing",
            ).length
          }
        </div>
        <div>
          <span className="text-muted-foreground">Escopos configurados:</span>{" "}
          {detail.preferenceScopes.filter((scope) => scope.status === "configured").length}/
          {detail.preferenceScopes.length}
        </div>
        <div>
          <span className="text-muted-foreground">Residencia canonica:</span>{" "}
          {detail.residence ? "sim" : "nao"}
        </div>
        <div>
          <span className="text-muted-foreground">Familia:</span>{" "}
          {detail.family.activeChildrenCount + detail.family.activeParentsCount}
          {" "}vinculo(s) ativo(s)
        </div>
        <div>
          <span className="text-muted-foreground">Perfis nesta conta:</span>{" "}
          {detail.siblingProfiles.length}
        </div>
        <div>
          <span className="text-muted-foreground">Entidades vinculadas:</span>{" "}
          {detail.linkedEntities.length}
        </div>
        <div>
          <span className="text-muted-foreground">Mudancas de username:</span>{" "}
          {detail.usernameHistory.length}
        </div>
        <div>
          <span className="text-muted-foreground">Permissoes:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {detail.effectiveContext ? (
            Object.entries(detail.effectiveContext.permissions).map(([key, value]) => (
              <Badge key={key} variant={value ? "secondary" : "outline"}>
                {key}
              </Badge>
            ))
          ) : (
            <Badge variant="outline">Sem snapshot</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
