import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { classifiedReportService } from "@/shared/services/classifiedReports";
import { useSessionContext } from "@/core/session";
import type { ClassifiedReport } from "@/shared/services/classifiedReports/ClassifiedReportService";
import { cn } from "@/shared/utils/cn";

type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";
type ReportFilter = "all" | ReportStatus;

type ClassifiedReportRow = ClassifiedReport & {
  classified?: {
    id: string;
    title?: string;
    seller_id?: string;
  };
  reporter?: {
    id: string;
    name?: string;
    avatar_url?: string;
  };
};

const STATUS_LABEL: Record<ReportStatus, string> = {
  pending: "Pendente",
  reviewed: "Em análise",
  resolved: "Resolvida",
  dismissed: "Descartada",
};

const STATUS_BADGE_CLASS: Record<ReportStatus, string> = {
  pending: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  reviewed: "bg-sky-500/10 text-sky-700 border-sky-500/20",
  resolved: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  dismissed: "bg-muted text-muted-foreground border-border",
};

const REASON_LABEL: Record<string, string> = {
  fraud: "Fraude",
  fake: "Falso",
  inappropriate: "Inapropriado",
  spam: "Spam",
  duplicate: "Duplicado",
  "wrong-category": "Categoria incorreta",
  sold: "Anúncio já vendido",
  other: "Outro",
};

function formatDate(dateIso: string): string {
  return new Date(dateIso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminClassificadosDenuncias() {
  const queryClient = useQueryClient();
  const { user, activeProfile } = useSessionContext();

  const [statusFilter, setStatusFilter] = useState<ReportFilter>("all");
  const [search, setSearch] = useState("");
  const [notesByReport, setNotesByReport] = useState<Record<string, string>>({});

  const adminId = user?.id || activeProfile?.id || "";

  const {
    data: reports = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin", "classified-reports"],
    queryFn: async () => {
      const response = await classifiedReportService.getAllReports();
      return response as ClassifiedReportRow[];
    },
    staleTime: 20_000,
  });

  const stats = useMemo(() => {
    return reports.reduce(
      (acc, report) => {
        acc.total += 1;
        if (report.status === "pending") acc.pending += 1;
        if (report.status === "reviewed") acc.reviewed += 1;
        if (report.status === "resolved") acc.resolved += 1;
        if (report.status === "dismissed") acc.dismissed += 1;
        return acc;
      },
      { total: 0, pending: 0, reviewed: 0, resolved: 0, dismissed: 0 },
    );
  }, [reports]);

  const filteredReports = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return reports.filter((report) => {
      if (statusFilter !== "all" && report.status !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        report.classified?.title,
        report.reporter?.name,
        report.reason,
        report.description,
        report.admin_notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [reports, search, statusFilter]);

  const statusMutation = useMutation({
    mutationFn: async (payload: {
      reportId: string;
      nextStatus: Exclude<ReportStatus, "pending">;
      notes?: string;
    }) => {
      if (!adminId) {
        throw new Error("Admin não autenticado");
      }

      return classifiedReportService.updateReportStatus(
        payload.reportId,
        adminId,
        payload.nextStatus,
        payload.notes?.trim() || undefined,
      );
    },
    onSuccess: () => {
      toast.success("Denúncia atualizada");
      void queryClient.invalidateQueries({ queryKey: ["admin", "classified-reports"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Falha ao atualizar denúncia");
    },
  });

  const applyStatus = (report: ClassifiedReportRow, nextStatus: Exclude<ReportStatus, "pending">) => {
    const notes = notesByReport[report.id] || "";
    statusMutation.mutate({
      reportId: report.id,
      nextStatus,
      notes,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Denúncias de Classificados</h1>
          <p className="text-sm text-muted-foreground">
            Moderação operacional de denúncias com fluxo real de status
          </p>
        </div>
        <Button variant="outline" onClick={() => void refetch()} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Pendentes" value={stats.pending} accent="text-amber-700" />
        <StatCard label="Em análise" value={stats.reviewed} accent="text-sky-700" />
        <StatCard label="Resolvidas" value={stats.resolved} accent="text-emerald-700" />
        <StatCard label="Descartadas" value={stats.dismissed} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Fila de denúncias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por anúncio, denunciante ou motivo"
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ReportFilter)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendentes</option>
              <option value="reviewed">Em análise</option>
              <option value="resolved">Resolvidas</option>
              <option value="dismissed">Descartadas</option>
            </select>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
              Carregando denúncias...
            </div>
          ) : error ? (
            <div className="py-12 text-center space-y-2">
              <AlertTriangle className="h-6 w-6 mx-auto text-destructive" />
              <p className="text-sm text-destructive">Falha ao carregar denúncias</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma denúncia encontrada para os filtros atuais.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => {
                const isPending = report.status === "pending";
                const isReviewed = report.status === "reviewed";
                const isFinal = report.status === "resolved" || report.status === "dismissed";

                return (
                  <div key={report.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {report.classified?.title || "Anúncio sem título"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Denunciante: {report.reporter?.name || "Usuário não identificado"}
                        </p>
                      </div>
                      <Badge className={STATUS_BADGE_CLASS[report.status as ReportStatus]}>
                        {STATUS_LABEL[report.status as ReportStatus]}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">{REASON_LABEL[report.reason] || report.reason}</Badge>
                      <Badge variant="outline" className="text-muted-foreground">
                        <Clock3 className="h-3 w-3 mr-1" />
                        {formatDate(report.created_at)}
                      </Badge>
                    </div>

                    {report.description && (
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    )}

                    <div className="space-y-2">
                      <Input
                        value={notesByReport[report.id] || report.admin_notes || ""}
                        onChange={(event) =>
                          setNotesByReport((prev) => ({
                            ...prev,
                            [report.id]: event.target.value,
                          }))
                        }
                        placeholder="Nota administrativa (opcional)"
                      />

                      <div className="flex flex-wrap gap-2">
                        {(isPending || isReviewed) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => applyStatus(report, "reviewed")}
                            disabled={statusMutation.isPending}
                          >
                            Em análise
                          </Button>
                        )}

                        {(isPending || isReviewed) && (
                          <Button
                            size="sm"
                            onClick={() => applyStatus(report, "resolved")}
                            disabled={statusMutation.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Resolver
                          </Button>
                        )}

                        {!isFinal && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => applyStatus(report, "dismissed")}
                            disabled={statusMutation.isPending}
                          >
                            Descartar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn("text-2xl font-bold", accent)}>{value}</p>
      </CardContent>
    </Card>
  );
}

