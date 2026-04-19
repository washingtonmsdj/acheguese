/**
 * AdminReportsPassageirosV2 - Gestão de Reports de Corridas
 * 
 * SSOT: RideReportsService como fonte única
 * Funcionalidades:
 * - Listar reports com filtros
 * - Visualizar detalhes
 * - Atualizar status (pending → under_review → resolved/dismissed)
 * - Adicionar notas de resolução
 * - Estatísticas agregadas
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { RideReportsService, type RideReport, type ReportStatus, type ReportSeverity } from "@/modules/mobility/services/RideReportsService";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  Shield,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  TrendingUp,
  AlertCircle,
  User,
  Car,
  MapPin,
  DollarSign,
  Package,
  Ban,
  Search,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";

const REPORT_TYPE_LABELS: Record<string, string> = {
  safety_concern: "Segurança",
  driver_behavior: "Comportamento Motorista",
  passenger_behavior: "Comportamento Passageiro",
  route_issue: "Problema de Rota",
  payment_issue: "Problema de Pagamento",
  vehicle_condition: "Condição do Veículo",
  cancellation_abuse: "Abuso de Cancelamento",
  fraud_suspicion: "Suspeita de Fraude",
  other: "Outro",
};

const REPORT_TYPE_ICONS: Record<string, any> = {
  safety_concern: Shield,
  driver_behavior: User,
  passenger_behavior: User,
  route_issue: MapPin,
  payment_issue: DollarSign,
  vehicle_condition: Car,
  cancellation_abuse: Ban,
  fraud_suspicion: AlertTriangle,
  other: AlertCircle,
};

const SEVERITY_COLORS: Record<ReportSeverity, string> = {
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  under_review: "bg-blue-500/20 text-blue-400",
  resolved: "bg-green-500/20 text-green-400",
  dismissed: "bg-gray-500/20 text-gray-400",
};

export default function AdminReportsPassageirosV2() {
  const { canModerate, isChecking } = useAdminGuard();
  const queryClient = useQueryClient();

  // Filtros
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<ReportSeverity | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal de detalhes
  const [selectedReport, setSelectedReport] = useState<RideReport | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  // Buscar reports
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["admin-ride-reports", statusFilter, severityFilter],
    queryFn: async () => {
      const filters: any = {};
      if (statusFilter !== "all") filters.status = statusFilter;
      if (severityFilter !== "all") filters.severity = severityFilter;
      return RideReportsService.listReports(filters);
    },
    enabled: canModerate && !isChecking,
    staleTime: 30000, // 30 segundos
  });

  // Buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ["admin-ride-reports-stats"],
    queryFn: () => RideReportsService.getReportStats(),
    enabled: canModerate && !isChecking,
    staleTime: 60000, // 1 minuto
  });

  // Mutation para atualizar report
  const updateReportMutation = useMutation({
    mutationFn: ({ reportId, updates }: { reportId: string; updates: any }) =>
      RideReportsService.updateReport(reportId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ride-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-ride-reports-stats"] });
      toast.success("Report atualizado com sucesso");
      setDetailsOpen(false);
      setSelectedReport(null);
      setResolutionNotes("");
      setAdminNotes("");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar report: ${error.message}`);
    },
  });

  const handleViewDetails = (report: RideReport) => {
    setSelectedReport(report);
    setResolutionNotes(report.resolution_notes || "");
    setAdminNotes(report.admin_notes || "");
    setDetailsOpen(true);
  };

  const handleUpdateStatus = (status: ReportStatus) => {
    if (!selectedReport) return;
    updateReportMutation.mutate({
      reportId: selectedReport.id,
      updates: { status, resolutionNotes, adminNotes },
    });
  };

  // Filtrar por busca
  const filteredReports = reports.filter((report) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.title.toLowerCase().includes(query) ||
      report.description.toLowerCase().includes(query) ||
      report.id.toLowerCase().includes(query)
    );
  });

  if (isChecking) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!canModerate) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Acesso negado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Reports de Corridas</h1>
        <p className="text-muted-foreground">Gestão de problemas reportados</p>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Análise</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.underReview}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolvidos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Críticos</p>
                  <p className="text-2xl font-bold text-red-600">{stats.bySeverity.critical}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="under_review">Em Análise</SelectItem>
                  <SelectItem value="resolved">Resolvidos</SelectItem>
                  <SelectItem value="dismissed">Descartados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Severidade</label>
              <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, descrição ou ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Reports */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : filteredReports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum report encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const Icon = REPORT_TYPE_ICONS[report.report_type] || AlertCircle;
            return (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">{report.title}</h3>
                        <Badge className={SEVERITY_COLORS[report.severity]}>
                          {report.severity.toUpperCase()}
                        </Badge>
                        <Badge className={STATUS_COLORS[report.status]}>
                          {report.status === "pending" && "Pendente"}
                          {report.status === "under_review" && "Em Análise"}
                          {report.status === "resolved" && "Resolvido"}
                          {report.status === "dismissed" && "Descartado"}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {report.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Tipo: {REPORT_TYPE_LABELS[report.report_type]}</span>
                        <span>•</span>
                        <span>
                          Reportado: {format(new Date(report.reported_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                        <span>•</span>
                        <span>ID: {report.id.slice(0, 8)}</span>
                      </div>
                    </div>

                    <Button onClick={() => handleViewDetails(report)} variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Report</DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge className={cn("mt-1", STATUS_COLORS[selectedReport.status])}>
                    {selectedReport.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Severidade</label>
                  <Badge className={cn("mt-1", SEVERITY_COLORS[selectedReport.severity])}>
                    {selectedReport.severity}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Título</label>
                <p className="mt-1">{selectedReport.title}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                <p className="mt-1 text-sm">{selectedReport.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                <p className="mt-1">{REPORT_TYPE_LABELS[selectedReport.report_type]}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Notas de Resolução</label>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Adicionar notas de resolução..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Notas Admin (Internas)</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Notas internas para equipe..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedReport?.status === "pending" && (
              <Button onClick={() => handleUpdateStatus("under_review")} variant="default">
                Iniciar Análise
              </Button>
            )}
            {selectedReport?.status === "under_review" && (
              <>
                <Button onClick={() => handleUpdateStatus("resolved")} variant="default">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Resolver
                </Button>
                <Button onClick={() => handleUpdateStatus("dismissed")} variant="outline">
                  <XCircle className="h-4 w-4 mr-2" />
                  Descartar
                </Button>
              </>
            )}
            <Button onClick={() => setDetailsOpen(false)} variant="ghost">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
