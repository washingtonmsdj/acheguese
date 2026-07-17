import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { CapabilityPreviewCardProps } from "../../sections/types";
import { CapabilityActionBadge, CapabilityPreviewBadge } from "../badges";

export function CapabilityPreviewCard({
  capabilityPreview,
}: CapabilityPreviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Previa de capacidades da interface</CardTitle>
        <CardDescription>
          Indicadores visuais calculados a partir do perfil e das roles. A
          autorizacao real ocorre no backend.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <CapabilityPreviewBadge capabilityPreview={capabilityPreview} />
          {capabilityPreview?.sourceRoles.map((role) => (
            <Badge key={`role-${role}`} variant="outline">
              {role}
            </Badge>
          ))}
          {capabilityPreview?.sourceMembershipRoles.map((role) => (
            <Badge key={`membership-${role}`} variant="secondary">
              membership:{role}
            </Badge>
          ))}
        </div>

        {capabilityPreview ? (
          <>
            <div className="text-xs text-muted-foreground">
              {capabilityPreview.allowedActions} visiveis -{" "}
              {capabilityPreview.deniedActions} ocultas -{" "}
              {capabilityPreview.targetDependentActions} dependem do recurso
            </div>

            <div className="space-y-2">
              {capabilityPreview.actionMatrix.map((action) => (
                <div
                  key={action.action}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="font-medium">{action.action}</div>
                  <CapabilityActionBadge status={action.status} />
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs text-muted-foreground">
              {capabilityPreview.notes.map((note) => (
                <div key={note}>{note}</div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-muted-foreground">
            Nao foi possivel carregar a previa de capacidades da interface.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
