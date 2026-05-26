import { CheckCircle, Trash2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  ALERT_CATEGORY_LABELS,
  ALERT_REPORT_REASON_LABELS,
  type AlertCategory,
} from "@/core/community/alerts";
import type { AlertAdminItem } from "./AdminCommunityAlerts.types";

interface AdminCommunityAlertsReviewListProps {
  reviewAlerts?: AlertAdminItem[];
  isClearingReview: boolean;
  onClearReview: (alertId: string) => void;
  onOpenRemoveDialog: (alert: AlertAdminItem) => void;
}

export function AdminCommunityAlertsReviewList({
  reviewAlerts,
  isClearingReview,
  onClearReview,
  onOpenRemoveDialog,
}: AdminCommunityAlertsReviewListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas Sob Revisao</CardTitle>
        <CardDescription>
          Alertas que atingiram o limite de reports e precisam de analise
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reviewAlerts && reviewAlerts.length > 0 ? (
          <div className="space-y-4">
            {reviewAlerts.map((alert) => (
              <div key={alert.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge>{ALERT_CATEGORY_LABELS[alert.category as AlertCategory]}</Badge>
                      <Badge variant="destructive">{alert.report_count} reports</Badge>
                    </div>
                    <p className="mb-1 text-sm font-medium">
                      {alert.neighborhood_display}, {alert.city}
                    </p>
                    <p className="mb-3 text-sm text-muted-foreground">{alert.description}</p>

                    {alert.reports && alert.reports.length > 0 && (
                      <div className="mt-3 border-t pt-3">
                        <p className="mb-2 text-sm font-medium">Motivos dos Reports:</p>
                        <div className="flex flex-wrap gap-2">
                          {alert.reports.map((report) => (
                            <Badge key={report.id} variant="outline">
                              {ALERT_REPORT_REASON_LABELS[report.reason]}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onClearReview(alert.id)}
                      disabled={isClearingReview}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onOpenRemoveDialog(alert)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            Nenhum alerta sob revisao no momento
          </p>
        )}
      </CardContent>
    </Card>
  );
}
