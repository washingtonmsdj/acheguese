/**
 * AdminCommunityAlerts - Gestão administrativa de alertas comunitários
 * 
 * SSOT: Usa adminCommunityAlertsService
 * 
 * Funcionalidades:
 * - Listagem de todos os alertas com filtros
 * - Moderação de alertas reportados
 * - Gestão de termos bloqueados
 * - Analytics e estatísticas
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminCommunityAlertsService } from "@/core/admin";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Badge } from "@/shared/components/ui/badge";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Shield,
  TrendingUp,
  Filter,
  Search,
  Plus,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ALERT_CATEGORY_LABELS,
  ALERT_REPORT_REASON_LABELS,
} from "@/core/community-alerts";
import type { AlertCategory, AlertStatus } from "@/core/community-alerts";

export default function AdminCommunityAlerts() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState<AlertCategory | "">("");
  
  // Dialogs
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removalReason, setRemovalReason] = useState("");
  const [showBlockedTermsDialog, setShowBlockedTermsDialog] = useState(false);
  const [newBlockedTerm, setNewBlockedTerm] = useState("");

  // Buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ["admin-community-alerts-stats"],
    queryFn: () => adminCommunityAlertsService.getStats(),
  });

  // Buscar alertas
  const { data: alertsData, isLoading } = useQuery({
    queryKey: ["admin-community-alerts", page, search, statusFilter, categoryFilter, activeTab],
    queryFn: () =>
      adminCommunityAlertsService.getAllAlerts({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        underReview: activeTab === "review" ? true : undefined,
      }),
  });

  // Buscar alertas sob revisão
  const { data: reviewAlerts } = useQuery({
    queryKey: ["admin-community-alerts-review"],
    queryFn: () => adminCommunityAlertsService.getAlertsUnderReview(),
    enabled: activeTab === "review",
  });

  // Buscar alertas mais reportados
  const { data: topReported } = useQuery({
    queryKey: ["admin-community-alerts-top-reported"],
    queryFn: () => adminCommunityAlertsService.getTopReportedAlerts(10),
    enabled: activeTab === "analytics",
  });

  // Buscar estatísticas por categoria
  const { data: categoryStats } = useQuery({
    queryKey: ["admin-community-alerts-category-stats"],
    queryFn: () => adminCommunityAlertsService.getStatsByCategory(),
    enabled: activeTab === "analytics",
  });

  // Buscar termos bloqueados
  const { data: blockedTerms } = useQuery({
    queryKey: ["admin-community-alerts-blocked-terms"],
    queryFn: () => adminCommunityAlertsService.getBlockedTerms(),
    enabled: activeTab === "blocked-terms",
  });

  // Mutations
  const removeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminCommunityAlertsService.removeAlert(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-community-alerts-stats"] });
      toast.success("Alerta removido com sucesso");
      setShowRemoveDialog(false);
      setSelectedAlert(null);
      setRemovalReason("");
    },
    onError: () => {
      toast.error("Erro ao remover alerta");
    },
  });

  const clearReviewMutation = useMutation({
    mutationFn: (id: string) => adminCommunityAlertsService.clearUnderReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-community-alerts-review"] });
      queryClient.invalidateQueries({ queryKey: ["admin-community-alerts-stats"] });
      toast.success("Alerta aprovado");
    },
    onError: () => {
      toast.error("Erro ao aprovar alerta");
    },
  });

  const endAlertMutation = useMutation({
    mutationFn: (id: string) => adminCommunityAlertsService.endAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-community-alerts-stats"] });
      toast.success("Alerta encerrado");
    },
    onError: () => {
      toast.error("Erro ao encerrar alerta");
    },
  });

  const addBlockedTermMutation = useMutation({
    mutationFn: (term: string) => adminCommunityAlertsService.addBlockedTerm(term),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-alerts-blocked-terms"] });
      toast.success("Termo bloqueado adicionado");
      setNewBlockedTerm("");
    },
    onError: () => {
      toast.error("Erro ao adicionar termo bloqueado");
    },
  });

  const removeBlockedTermMutation = useMutation({
    mutationFn: (termId: string) => adminCommunityAlertsService.removeBlockedTerm(termId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-alerts-blocked-terms"] });
      toast.success("Termo bloqueado removido");
    },
    onError: () => {
      toast.error("Erro ao remover termo bloqueado");
    },
  });

  const toggleBlockedTermMutation = useMutation({
    mutationFn: ({ termId, isActive }: { termId: string; isActive: boolean }) =>
      adminCommunityAlertsService.toggleBlockedTerm(termId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-alerts-blocked-terms"] });
      toast.success("Status do termo atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar termo");
    },
  });

  const handleRemoveAlert = () => {
    if (!selectedAlert || !removalReason.trim()) {
      toast.error("Informe o motivo da remoção");
      return;
    }
    removeMutation.mutate({ id: selectedAlert.id, reason: removalReason });
  };

  const getStatusBadge = (status: AlertStatus) => {
    const variants: Record<AlertStatus, { variant: any; label: string }> = {
      ativo: { variant: "default", label: "Ativo" },
      encerrado: { variant: "secondary", label: "Encerrado" },
      expirado: { variant: "outline", label: "Expirado" },
      removido: { variant: "destructive", label: "Removido" },
    };
    const config = variants[status] || variants.ativo;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display flex items-center gap-2">
          <AlertTriangle className="h-8 w-8" />
          Gestão de Alertas Comunitários
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie alertas, moderação e termos bloqueados
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.active || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sob Revisão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.underReview || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.totalReports || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média: {stats?.avgReportsPerAlert || 0} por alerta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todos os Alertas</TabsTrigger>
          <TabsTrigger value="review">
            Sob Revisão
            {stats?.underReview ? (
              <Badge variant="destructive" className="ml-2">
                {stats.underReview}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="blocked-terms">Termos Bloqueados</TabsTrigger>
        </TabsList>

        {/* Todos os Alertas Tab */}
        <TabsContent value="all" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por descrição ou bairro..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value as AlertStatus)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="encerrado">Encerrado</SelectItem>
                    <SelectItem value="expirado">Expirado</SelectItem>
                    <SelectItem value="removido">Removido</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter || "all"} onValueChange={(value) => setCategoryFilter(value === "all" ? "" : value as AlertCategory)}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {Object.entries(ALERT_CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Alertas */}
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Localização</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reports</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alertsData?.data?.map((alert: any) => (
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
                          <TableCell className="max-w-xs truncate">
                            {alert.description}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(alert.status)}
                            {alert.under_review && (
                              <Badge variant="outline" className="ml-2">
                                Em Revisão
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
                            {format(new Date(alert.created_at), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {alert.under_review && alert.status === "ativo" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => clearReviewMutation.mutate(alert.id)}
                                  disabled={clearReviewMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {alert.status === "ativo" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => endAlertMutation.mutate(alert.id)}
                                  disabled={endAlertMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedAlert(alert);
                                  setShowRemoveDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Paginação */}
                  {alertsData && alertsData.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Página {alertsData.page} de {alertsData.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={page === 1}
                          onClick={() => setPage(page - 1)}
                        >
                          Anterior
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={page === alertsData.totalPages}
                          onClick={() => setPage(page + 1)}
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sob Revisão Tab */}
        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas Sob Revisão</CardTitle>
              <CardDescription>
                Alertas que atingiram o limite de reports e precisam de análise
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviewAlerts && reviewAlerts.length > 0 ? (
                <div className="space-y-4">
                  {reviewAlerts.map((alert: any) => (
                    <div key={alert.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge>{ALERT_CATEGORY_LABELS[alert.category as AlertCategory]}</Badge>
                            <Badge variant="destructive">{alert.report_count} reports</Badge>
                          </div>
                          <p className="text-sm font-medium mb-1">
                            {alert.neighborhood_display}, {alert.city}
                          </p>
                          <p className="text-sm text-muted-foreground mb-3">
                            {alert.description}
                          </p>
                          
                          {alert.reports && alert.reports.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm font-medium mb-2">Motivos dos Reports:</p>
                              <div className="flex flex-wrap gap-2">
                                {alert.reports.map((report: any) => (
                                  <Badge key={report.id} variant="outline">
                                    {ALERT_REPORT_REASON_LABELS[report.reason]}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => clearReviewMutation.mutate(alert.id)}
                            disabled={clearReviewMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedAlert(alert);
                              setShowRemoveDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum alerta sob revisão no momento
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Alertas Mais Reportados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Alertas Mais Reportados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topReported && topReported.length > 0 ? (
                  <div className="space-y-3">
                    {topReported.map((alert: any, index: number) => (
                      <div key={alert.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            #{index + 1} - {ALERT_CATEGORY_LABELS[alert.category as AlertCategory]}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {alert.neighborhood_display}
                          </p>
                        </div>
                        <Badge variant="destructive">{alert.report_count} reports</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum alerta reportado
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas por Categoria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Alertas por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryStats && Object.keys(categoryStats).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(categoryStats)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between">
                          <p className="text-sm">
                            {ALERT_CATEGORY_LABELS[category as AlertCategory]}
                          </p>
                          <Badge variant="outline">{count as number}</Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum dado disponível
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Termos Bloqueados Tab */}
        <TabsContent value="blocked-terms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Termos Bloqueados
              </CardTitle>
              <CardDescription>
                Gerencie termos que não podem ser usados em alertas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Adicionar Termo */}
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Novo termo bloqueado..."
                  value={newBlockedTerm}
                  onChange={(e) => setNewBlockedTerm(e.target.value)}
                />
                <Button
                  onClick={() => {
                    if (newBlockedTerm.trim()) {
                      addBlockedTermMutation.mutate(newBlockedTerm);
                    }
                  }}
                  disabled={addBlockedTermMutation.isPending || !newBlockedTerm.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              {/* Lista de Termos */}
              {blockedTerms && blockedTerms.length > 0 ? (
                <div className="space-y-2">
                  {blockedTerms.map((term: any) => (
                    <div
                      key={term.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {term.term}
                        </code>
                        {!term.is_active && (
                          <Badge variant="outline">Inativo</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            toggleBlockedTermMutation.mutate({
                              termId: term.id,
                              isActive: !term.is_active,
                            })
                          }
                          disabled={toggleBlockedTermMutation.isPending}
                        >
                          {term.is_active ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeBlockedTermMutation.mutate(term.id)}
                          disabled={removeBlockedTermMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum termo bloqueado cadastrado
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Remoção */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Alerta</DialogTitle>
            <DialogDescription>
              Informe o motivo da remoção. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Motivo da remoção..."
              value={removalReason}
              onChange={(e) => setRemovalReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRemoveDialog(false);
                setSelectedAlert(null);
                setRemovalReason("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveAlert}
              disabled={removeMutation.isPending || !removalReason.trim()}
            >
              Remover Alerta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
