/**
 * IdentityCard Component
 * 
 * Card de identidade do perfil (dados básicos)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { IdentityCardProps } from "../../sections/types";
import { StatusBadge } from "../badges";
import { label } from "../../utils";

export function IdentityCard({ detail }: IdentityCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Identidade</CardTitle>
        <CardDescription>Leitura publica e privada do perfil selecionado.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <StatusBadge profile={detail.profile} />
        <div>
          <span className="text-muted-foreground">Nome:</span> {detail.profile.name}
        </div>
        <div>
          <span className="text-muted-foreground">Display:</span>{" "}
          {detail.profile.displayName || "-"}
        </div>
        <div>
          <span className="text-muted-foreground">Tipo:</span>{" "}
          {label(detail.profile.profileType)}
        </div>
        <div>
          <span className="text-muted-foreground">Username:</span>{" "}
          {detail.profile.username ? `@${detail.profile.username}` : "-"}
        </div>
        <div>
          <span className="text-muted-foreground">Rota publica:</span>{" "}
          {detail.profile.publicUrl || "Nao exposta"}
        </div>
        <div>
          <span className="text-muted-foreground">User ID:</span>{" "}
          <span className="font-mono text-xs">{detail.profile.userId}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Profile ID:</span>{" "}
          <span className="font-mono text-xs">{detail.profile.id}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Email:</span> {detail.auth?.email || "-"}
        </div>
        <div>
          <span className="text-muted-foreground">Telefone:</span> {detail.auth?.phone || "-"}
        </div>
      </CardContent>
    </Card>
  );
}
