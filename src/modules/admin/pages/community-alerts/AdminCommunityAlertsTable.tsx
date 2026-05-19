import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Trash2, XCircle } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  ALERT_CATEGORY_LABELS,
  type AlertCategory,
} from "@/shared/services/communityAlerts";
import { getAlertStatusBadge } from "./AdminCommunityAlertBadges";
import type { AlertAdminItem } from "./AdminCommunityAlerts.types";

interface AlertsPageData {
  data?: AlertAdminItem[];
  page: number;
  totalPages: number;
}

interface AdminCommunityAlertsTableProps {
  alertsData?: AlertsPageData;
  isLoading: boolean;
  page: number;
  isClearingReview: boolean;
  isEndingAlert: boolean;
  onPageChange: (page: number) => void;
  onClearReview: (alertId: string) => void;
  onEndAlert: (alertId: string) => void;
  onOpenRemoveDialog: (alert: AlertAdminItem) => void;
}

export function AdminCommunityAlertsTable({
  alertsData,
  isLoading,
  page,
  isClearingReview,
  isEndingAlert,
  onPageChange,
  onClearReview,
  onEndAlert,
  onOpenRemoveDialog,
}: AdminCommunityAlertsTableProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Localizacao</TableHead>
                  <TableHead>Descricao</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reports</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertsData?.data?.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">
                      {ALERT_CATEGORY_LABELS[alert.category as AlertCategory]}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{alert.neighborhood_display}</div>
                        <div className="text-muted-foreground">{alert.city}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{alert.description}</TableCell>
                    <TableCell>
                      {getAlertStatusBadge(alert.status)}
                      {alert.under_review && (
                        <Badge variant="outline" className="ml-2">
                          Em Revisao
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {alert.report_count > 0 ? (
                        <Badge variant="destructive">{alert.report_count}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(alert.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {alert.under_review && alert.status === "ativo" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onClearReview(alert.id)}
                            disabled={isClearingReview}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                        {alert.status === "ativo" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEndAlert(alert.id)}
                            disabled={isEndingAlert}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onOpenRemoveDialog(alert)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {alertsData && alertsData.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Pagina {alertsData.page} de {alertsData.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => onPageChange(page - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === alertsData.totalPages}
                    onClick={() => onPageChange(page + 1)}
                  >
                    Proxima
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
