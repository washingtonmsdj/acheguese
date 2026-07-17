import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  RefreshCw,
} from "lucide-react";
import {
  COMMUNITY_RPC_OBSERVABILITY_WINDOWS,
  type CommunityRpcObservabilityWindow,
  type CommunityRpcSloState,
} from "@/core/admin/services/CommunityRpcOperationsService";
import { useCommunityRpcOperations } from "@/core/admin/hooks/useCommunityRpcOperations";
import { AdminSectionCard } from "@/core/admin/components/AdminSectionCard";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

function actionLabel(action: string): string {
  return action === "createAlert" ? "Criacao de alerta" : action;
}

function sloReasonLabel(reason: string): string {
  switch (reason) {
    case "minimum_sample_not_reached":
      return "Amostra minima ainda nao atingida";
    case "error_rate_threshold_exceeded":
      return "Taxa de erro acima do limite";
    case "p95_duration_threshold_exceeded":
      return "Latencia p95 acima do limite";
    default:
      return reason;
  }
}

function parseObservabilityWindow(value: string): CommunityRpcObservabilityWindow {
  const parsed = Number(value);
  return COMMUNITY_RPC_OBSERVABILITY_WINDOWS.find((minutes) => minutes === parsed) ?? 15;
}

function formatDuration(value: number): string {
  return `${Math.round(value).toLocaleString("pt-BR")} ms`;
}

function formatPercent(value: number): string {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}

function sloPresentation(status: CommunityRpcSloState) {
  if (status === "healthy") {
    return {
      label: "Saudavel",
      icon: CheckCircle2,
      badgeClassName: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
    };
  }
  if (status === "alert") {
    return {
      label: "Alerta",
      icon: AlertTriangle,
      badgeClassName: "border-destructive/30 bg-destructive/10 text-destructive",
    };
  }
  return {
    label: "Sem amostra suficiente",
    icon: CircleDashed,
    badgeClassName: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  };
}

export function CommunityRpcOperationsPanel() {
  const [windowMinutes, setWindowMinutes] =
    useState<CommunityRpcObservabilityWindow>(15);
  const operationsQuery = useCommunityRpcOperations(windowMinutes);
  const snapshot = operationsQuery.data;

  const metrics = useMemo(
    () =>
      [...(snapshot?.metrics ?? [])].sort(
        (left, right) =>
          new Date(right.bucketStartedAt).getTime() - new Date(left.bucketStartedAt).getTime(),
      ),
    [snapshot?.metrics],
  );

  return (
    <AdminSectionCard
      title="Operacao do broker comunitario"
      description="SLO administrativo e percentis por minuto do community-rpc. A atualizacao automatica ocorre a cada 60 segundos."
      icon={Activity}
      actions={
        <>
          <Select
            value={String(windowMinutes)}
            onValueChange={(value) => setWindowMinutes(parseObservabilityWindow(value))}
          >
            <SelectTrigger className="w-32" aria-label="Janela de observabilidade">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMMUNITY_RPC_OBSERVABILITY_WINDOWS.map((minutes) => (
                <SelectItem key={minutes} value={String(minutes)}>
                  Ultimos {minutes} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Atualizar metricas operacionais"
            title="Atualizar metricas"
            disabled={operationsQuery.isFetching}
            onClick={() => void operationsQuery.refetch()}
          >
            <RefreshCw
              className={operationsQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"}
              aria-hidden="true"
            />
          </Button>
        </>
      }
      contentClassName="space-y-5"
    >
      {operationsQuery.isError ? (
        <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
          <p className="font-medium text-destructive">Falha ao carregar a telemetria comunitaria.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Verifique a sessao administrativa e a disponibilidade dos RPCs operacionais.
          </p>
        </div>
      ) : null}

      {!operationsQuery.isError && operationsQuery.isLoading ? (
        <div className="flex min-h-28 items-center justify-center text-sm text-muted-foreground">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          Carregando metricas
        </div>
      ) : null}

      {!operationsQuery.isError && !operationsQuery.isLoading ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(snapshot?.sloStatuses ?? []).map((slo) => {
              const presentation = sloPresentation(slo.status);
              const StatusIcon = presentation.icon;
              return (
                <section key={slo.action} className="rounded-md border p-4" aria-label={actionLabel(slo.action)}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">{actionLabel(slo.action)}</h3>
                    <Badge variant="outline" className={presentation.badgeClassName}>
                      <StatusIcon className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                      {presentation.label}
                    </Badge>
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Requisicoes</dt>
                      <dd className="mt-1 font-semibold">{slo.totalRequests.toLocaleString("pt-BR")}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Erros</dt>
                      <dd className="mt-1 font-semibold">{formatPercent(slo.errorRatePercent)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">p95</dt>
                      <dd className="mt-1 font-semibold">{formatDuration(slo.p95DurationMs)}</dd>
                    </div>
                  </dl>
                  {slo.reasons.length > 0 ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {slo.reasons.map(sloReasonLabel).join("; ")}.
                    </p>
                  ) : null}
                </section>
              );
            })}
          </div>

          {(snapshot?.sloStatuses.length ?? 0) === 0 ? (
            <div className="rounded-md border border-dashed p-5 text-center">
              <p className="font-medium">Ainda nao ha requisicoes auditadas nesta janela.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                O estado permanece sem evidencia ate existir uma amostra operacional.
              </p>
            </div>
          ) : null}

          {metrics.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Minuto</TableHead>
                    <TableHead>Acao</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Erros</TableHead>
                    <TableHead className="text-right">p50</TableHead>
                    <TableHead className="text-right">p95</TableHead>
                    <TableHead className="text-right">p99</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.slice(0, 30).map((metric) => (
                    <TableRow key={`${metric.bucketStartedAt}-${metric.action}`}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(metric.bucketStartedAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {actionLabel(metric.action)}
                      </TableCell>
                      <TableCell className="text-right">{metric.totalRequests}</TableCell>
                      <TableCell className="text-right">
                        {formatPercent(metric.errorRatePercent)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {formatDuration(metric.p50DurationMs)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {formatDuration(metric.p95DurationMs)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {formatDuration(metric.p99DurationMs)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </>
      ) : null}
    </AdminSectionCard>
  );
}
