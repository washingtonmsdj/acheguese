/**
 * AdminCommunityIssues - Gestão administrativa de problemas urbanos
 * 
 * SSOT: Usa adminCommunityIssuesService
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminCommunityIssuesService } from "@/core/admin";
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
  AlertCircle,
  CheckCircle,
  XCircle,
  Trash2,
  TrendingUp,
  Search,
  ArrowUp,
  ArrowDown,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ISSUE_CATEGORY_LABELS,
  ISSUE_STATUS_LABELS,
  ISSUE_PRIORITY_LABELS,
  ISSUE_REPORT_REASON_LABELS,
} from "@/core/community-issues";
import type { IssueCategory, IssueStatus, IssuePriority } from "@/core/community-issues";

export default function AdminCommunityIssues() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | "">("");
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | "">("");
  
  // Dialogs
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removalReason, setRemovalReason] = useState("");
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<IssueStatus | "">("");
  const [showPriorityDialog, setShowPriorityDialog] = useState(false);
  const [newPriority, setNewPriority] = useState<IssuePriority | "">("");

  // Buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ["admin-community-issues-stats"],
    queryFn: () => adminCommunityIssuesService.getStats(),
  });

  // Buscar issues
  const { data: issuesData, isLoading } = useQuery({
    queryKey: ["admin-community-issues", page, search, statusFilter, categoryFilter, priorityFilter, activeTab],
    queryFn: () =>
      adminCommunityIssuesService.getAllIssues({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        priority: priorityFilter || undefined,
        underReview: activeTab === "review" ? true : undefined,
      }),
  });

  // Buscar issues sob revisão
  const { data: reviewIssues } = useQuery({
    queryKey: ["admin-community-issues-review"],
    queryFn: () => adminCommunityIssuesService.getIssuesUnderReview(),
    enabled: activeTab === "review",
  });

  // Buscar analytics
  const { data: topSupported } = useQuery({
    queryKey: ["admin-community-issues-top-supported"],
    queryFn: () => adminCommunityIssuesService.getTopSupportedIssues(10),
    enabled: activeTab === "analytics",
  });

  const { data: topReported } = useQuery({
    queryKey: ["admin-community-issues-top-reported"],
    queryFn: () => adminCommunityIssuesService.getTopReportedIssues(10),
    enabled: activeTab === "analytics",
  });

  const { data: categoryStats } = useQuery({
    queryKey: ["admin-community-issues-category-stats"],
    queryFn: () => adminCommunityIssuesService.getStatsByCategory(),
    enabled: activeTab === "analytics",
  });

  const { data: resolutionRate } = useQuery({
    queryKey: ["admin-community-issues-resolution-rate"],
    queryFn: () => adminCommunityIssuesService.getResolutionRate(),
    enabled: activeTab === "analytics",
  });

  // Mutations
  const removeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminCommunityIssuesService.removeIssue(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-issues"] });
      queryClient.invalidateQueries({ queryKey: ["admin-community-issues-stats"] });
      toast.success("Issue removido com sucesso");
      setShowRemoveDialog(false);
      setSelectedIssue(null);
      setRemovalReason("");
    },
    onError: () => {
      toast.error("Erro ao remover issue");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: IssueStatus }) =>
      adminCommunityIssuesService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-issues"] });
      queryClient.invalidateQueries({ queryKey: ["admin-community-issues-stats"] });
      toast.success("Status atualizado");
      setShowStatusDialog(false);
      setSelectedIssue(null);
      setNewStatus("");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: IssuePriority }) =>
      adminCommunityIssuesService.updatePriority(id, priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-issues"] });
      toast.success("Prioridade atualizada");
      setShowPriorityDialog(false);
      setSelectedIssue(null);
      setNewPriority("");
    },
    onError: () => {
      toast.error("Erro ao atualizar prioridade");
    },
  });

  const clearReviewMutation = useMutation({
    mutationFn: (id: string) => adminCommunityIssuesService.clearUnderReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-issues"] });
      queryClient.invalidateQueries({ queryKey: ["admin-community-issues-review"] });
      queryClient.invalidateQueries({ queryKey: ["admin-community-issues-stats"] });
      toast.success("Issue aprovado");
    },
    onError: () => {
      toast.error("Erro ao aprovar issue");
    },
  });

  const getStatusBadge = (status: IssueStatus) => {
    const variants: Record<IssueStatus, { variant: any; label: string }> = {
      aberto: { variant: "default", label: "Aberto" },
      em_analise: { variant: "secondary", label: "Em Análise" },
      em_andamento: { variant: "outline", label: "Em Andamento" },
      resolvido: { variant: "default", label: "Resolvido" },
      rejeitado: { variant: "destructive", label: "Rejeitado" },
    };
    const config = variants[status] || variants.aberto;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: IssuePriority) => {
    const variants: Record<IssuePriority, { variant: any; icon: any }> = {
      baixa: { variant: "outline", icon: ArrowDown },
      media: { variant: "secondary", icon: null },
      alta: { variant: "default", icon: ArrowUp },
      urgente: { variant: "destructive", icon: AlertCircle },
    };
    const config = variants[priority] || variants.media;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {ISSUE_PRIORITY_LABELS[priority]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display flex items-center gap-2">
          <AlertCircle className="h-8 w-8" />
          Gestão de Problemas Urbanos
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie issues, moderação e resolução de problemas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Abertos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.aberto || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.em_andamento || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolvidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.resolvido || 0}
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
            <div className="text-2xl font-bold text-red-600">
              {stats?.underReview || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todos os Issues</TabsTrigger>
          <TabsTrigger value="review">
            Sob Revisão
            {stats?.underReview ? (
              <Badge variant="destructive" className="ml-2">
                {stats.underReview}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Todos os Issues Tab */}
        <TabsContent value="all" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por título, descrição ou bairro..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value as IssueStatus)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(ISSUE_STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={categoryFilter || "all"} onValueChange={(value) => setCategoryFilter(value === "all" ? "" : value as IssueCategory)}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {Object.entries(ISSUE_CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={priorityFilter || "all"} onValueChange={(value) => setPriorityFilter(value === "all" ? "" : value as IssuePriority)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {Object.entries(ISSUE_PRIORITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Issues */}
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
                        <TableHead>Título</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Localização</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Apoios</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {issuesData?.data?.map((issue: any) => (
                        <TableRow key={issue.id}>
                          <TableCell className="font-medium max-w-xs">
                            <div className="truncate">{issue.title}</div>
                            {issue.under_review && (
                              <Badge variant="outline" className="mt-1">
                                Em Revisão
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {ISSUE_CATEGORY_LABELS[issue.category as IssueCategory]}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{issue.neighborhood_display}</div>
                              <div className="text-muted-foreground">{issue.city}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(issue.status)}
                          </TableCell>
                          <TableCell>
                            {getPriorityBadge(issue.priority)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{issue.support_count || 0}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(issue.created_at), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {issue.under_review && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => clearReviewMutation.mutate(issue.id)}
                                  disabled={clearReviewMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedIssue(issue);
                                  setShowStatusDialog(true);
                                }}
                              >
                                <Clock className="h-4 w-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedIssue(issue);
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
                  {issuesData && issuesData.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Página {issuesData.page} de {issuesData.totalPages}
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
                          disabled={page === issuesData.totalPages}
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
              <CardTitle>Issues Sob Revisão</CardTitle>
              <CardDescription>
                Issues que atingiram o limite de reports e precisam de análise
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviewIssues && reviewIssues.length > 0 ? (
                <div className="space-y-4">
                  {reviewIssues.map((issue: any) => (
                    <div key={issue.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge>{ISSUE_CATEGORY_LABELS[issue.category as IssueCategory]}</Badge>
                            {getPriorityBadge(issue.priority)}
                            <Badge variant="destructive">{issue.report_count} reports</Badge>
                          </div>
                          <h3 className="font-medium mb-1">{issue.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {issue.description}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {issue.neighborhood_display}, {issue.city}
                          </p>
                          
                          {issue.reports && issue.reports.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm font-medium mb-2">Motivos dos Reports:</p>
                              <div className="flex flex-wrap gap-2">
                                {issue.reports.map((report: any) => (
                                  <Badge key={report.id} variant="outline">
                                    {ISSUE_REPORT_REASON_LABELS[report.reason]}
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
                            onClick={() => clearReviewMutation.mutate(issue.id)}
                            disabled={clearReviewMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedIssue(issue);
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
                  Nenhum issue sob revisão no momento
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Taxa de Resolução */}
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Resolução</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">
                    {resolutionRate?.rate || 0}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {resolutionRate?.resolved || 0} resolvidos de {resolutionRate?.total || 0} total
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Issues Mais Apoiados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Issues Mais Apoiados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topSupported && topSupported.length > 0 ? (
                  <div className="space-y-3">
                    {topSupported.slice(0, 5).map((issue: any, index: number) => (
                      <div key={issue.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">
                            #{index + 1} - {issue.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {issue.neighborhood_display}
                          </p>
                        </div>
                        <Badge variant="outline">{issue.support_count} apoios</Badge>
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

            {/* Estatísticas por Categoria */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Issues por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryStats && Object.keys(categoryStats).length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(categoryStats)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                          <p className="text-sm">
                            {ISSUE_CATEGORY_LABELS[category as IssueCategory]}
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
      </Tabs>

      {/* Dialog de Remoção */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Issue</DialogTitle>
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
                setSelectedIssue(null);
                setRemovalReason("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedIssue && removalReason.trim()) {
                  removeMutation.mutate({ id: selectedIssue.id, reason: removalReason });
                } else {
                  toast.error("Informe o motivo da remoção");
                }
              }}
              disabled={removeMutation.isPending || !removalReason.trim()}
            >
              Remover Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Atualização de Status */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Status</DialogTitle>
            <DialogDescription>
              Selecione o novo status para este issue
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as IssueStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ISSUE_STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowStatusDialog(false);
                setSelectedIssue(null);
                setNewStatus("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedIssue && newStatus) {
                  updateStatusMutation.mutate({ id: selectedIssue.id, status: newStatus as IssueStatus });
                } else {
                  toast.error("Selecione um status");
                }
              }}
              disabled={updateStatusMutation.isPending || !newStatus}
            >
              Atualizar Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
