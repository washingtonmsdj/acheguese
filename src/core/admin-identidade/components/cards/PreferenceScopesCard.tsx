/**
 * PreferenceScopesCard Component
 * 
 * Card de preferências por escopo
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { PreferenceScopesCardProps } from "../../sections/types";
import { PreferenceScopeBadge, PreferenceFieldBadge } from "../badges";

export function PreferenceScopesCard({ scopes }: PreferenceScopesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferencias por escopo</CardTitle>
        <CardDescription>Separacao entre perfil publico, vinculos, reputacao e notificacoes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {scopes.map((scope) => (
          <div key={scope.scope} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="font-medium">{scope.label}</div>
                <div className="text-xs text-muted-foreground">
                  {scope.configuredFields}/{scope.applicableFields} campo(s) aplicaveis configurados
                </div>
              </div>
              <PreferenceScopeBadge scope={scope} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {scope.fields.map((field) => (
                <span key={`${scope.scope}-${field.key}`}>
                  <PreferenceFieldBadge field={field} />
                </span>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
