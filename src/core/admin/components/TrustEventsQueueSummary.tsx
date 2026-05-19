import { TrendingDown } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { TrustPolicyDecision } from "@/core/trust";
import {
  ACTION_LABELS,
  getRiskVariant,
  renderProfileShortId,
  RISK_LABELS,
} from "./TrustEventsQueue.constants";

interface TrustEventsQueueSummaryProps {
  decisionsCount: number;
  attentionQueue: TrustPolicyDecision[];
}

export function TrustEventsQueueSummary({
  decisionsCount,
  attentionQueue,
}: TrustEventsQueueSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-amber-600" />
          Score e reincidencia operacional ({decisionsCount})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {attentionQueue.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">
            Nenhum perfil com risco operacional relevante nos eventos carregados.
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {attentionQueue.map((decision) => (
              <div
                key={`${decision.profile_id}:${decision.role}`}
                className="rounded-lg border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={getRiskVariant(decision.risk_level)}>
                        {RISK_LABELS[decision.risk_level]}
                      </Badge>
                      <Badge variant="outline">{decision.role}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium">
                      Perfil #{renderProfileShortId(decision.profile_id)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Politica de despacho: {decision.dispatch_policy}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold">
                      {decision.summary.reliability_score}
                    </p>
                    <p className="text-xs text-muted-foreground">score</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-md bg-muted p-2">
                    <p className="font-semibold">{decision.recurrence_30d}</p>
                    <p className="text-muted-foreground">30 dias</p>
                  </div>
                  <div className="rounded-md bg-muted p-2">
                    <p className="font-semibold">{decision.recurrence_90d}</p>
                    <p className="text-muted-foreground">90 dias</p>
                  </div>
                  <div className="rounded-md bg-muted p-2">
                    <p className="font-semibold">
                      {decision.summary.average_rating?.toFixed(1) ?? "-"}
                    </p>
                    <p className="text-muted-foreground">media</p>
                  </div>
                </div>

                <p className="mt-3 text-sm">
                  Acao recomendada:{" "}
                  <span className="font-medium">
                    {ACTION_LABELS[decision.recommended_action]}
                  </span>
                </p>
                {decision.reasons.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Motivos: {decision.reasons.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
