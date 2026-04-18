/**
 * SecondaryEntitiesCard Component
 * 
 * Card de entidades secundárias (residência e família)
 */

import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { SecondaryEntitiesCardProps } from "../../sections/types";
import { ResidenceStatusBadge, FamilyStatusBadge } from "../badges";

export function SecondaryEntitiesCard({ residence, family }: SecondaryEntitiesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entidades secundarias</CardTitle>
        <CardDescription>Coverage atual de residencia canonica e family no centro de identidade.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="rounded-lg border p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="font-medium">Residencia</div>
              <div className="text-xs text-muted-foreground">
                {residence?.locationName || "Sem territorio principal"}
              </div>
            </div>
            <ResidenceStatusBadge residence={residence} />
          </div>

          {residence ? (
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <div>{residence.addressLine || "Endereco detalhado indisponivel"}</div>
              <div>
                {residence.postalCode || "CEP nao informado"} -{" "}
                {residence.country || "Pais nao informado"}
              </div>
            </div>
          ) : (
            <div className="mt-3 text-xs text-muted-foreground">
              Nenhuma residencia primaria canonica vinculada ao usuario.
            </div>
          )}
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="font-medium">Family</div>
              <div className="text-xs text-muted-foreground">
                {family.activeChildrenCount} filho(s) ativos - {family.activeParentsCount} responsavel(is)
              </div>
            </div>
            <FamilyStatusBadge family={family} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">
              pendentes: {family.pendingInvitesCount}
            </Badge>
            {family.relationshipTypes.map((relationshipType) => (
              <Badge key={relationshipType} variant="secondary">
                {relationshipType}
              </Badge>
            ))}
          </div>

          {family.notes.length ? (
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              {family.notes.map((note) => (
                <div key={note}>{note}</div>
              ))}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
