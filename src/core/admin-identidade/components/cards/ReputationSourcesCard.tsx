/**
 * ReputationSourcesCard Component
 * 
 * Card de reputação por origem
 */

import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { ReputationSourcesCardProps } from "../../sections/types";
import { ReputationSourceBadge, ReputationVisibilityBadge } from "../badges";
import { formatScore } from "../../utils";

export function ReputationSourcesCard({ sources }: ReputationSourcesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reputacao por origem</CardTitle>
        <CardDescription>Decomposicao canonicamente auditada no agregado admin.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {sources.map((source) => (
          <div key={source.origin} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="font-medium">{source.label}</div>
                <div className="text-xs text-muted-foreground">
                  Score {formatScore(source.score)} - volume {source.volume}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <ReputationSourceBadge source={source} />
                <ReputationVisibilityBadge source={source} />
              </div>
            </div>

            {source.notes.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {source.notes.map((note) => (
                  <Badge key={`${source.origin}-${note}`} variant="outline">
                    {note}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
