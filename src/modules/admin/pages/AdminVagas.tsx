/**
 * AdminVagas - Gestão administrativa de vagas de emprego
 *
 * SSOT: Usa AdminVagasService (novo)
 * Migration: 20260416110000_create_vagas.sql
 *
 * Atualizado para usar:
 * - Enums: vaga_status, vaga_contrato, vaga_modalidade, vaga_nivel, vaga_urgencia
 * - Full-text search em português
 * - Filtros territoriais integrados
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminVagasService } from "@/core/admin/services/AdminVagasRuntimeService";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useConfirmActionDialog } from "@/shared/hooks/useConfirmActionDialog";
import {
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Eye,
  EyeOff,
  Trash2,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import {
  ALL_CONTRATO_FILTER,
  ALL_MODALIDADE_FILTER,
  ALL_STATUS_FILTER,
  type ContratoFilter,
  type ModalidadeFilter,
  type StatusFilter,
} from "./AdminVagas.model";
import { AdminVagasAnalytics } from "./AdminVagasAnalytics";
import { AdminVagasFilters } from "./AdminVagasFilters";
import { AdminVagasStatsCards } from "./AdminVagasStatsCards";
import { AdminVagasStatusBadge } from "./AdminVagasStatusBadge";

export default function AdminVagas() {
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirmActionDialog();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [contratoFilter, setContratoFilter] =
    useState<ContratoFilter>(ALL_CONTRATO_FILTER);
  const [modalidadeFilter, setModalidadeFilter] =
    useState<ModalidadeFilter>(ALL_MODALIDADE_FILTER);
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>(ALL_STATUS_FILTER);
  const [page, setPage] = useState(1);

  // Buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ["admin-vagas-stats"],
    queryFn: () => AdminVagasService.getStats(),
  });

  // Buscar vagas
  const { data: vagasData, isLoading } = useQuery({
    queryKey: ["admin-vagas", page, search, contratoFilter, modalidadeFilter, statusFilter],
    queryFn: () =>
      AdminVagasService.getAllVagas({
        page,
        limit: 20,
        search: search || undefined,
        contrato:
          contratoFilter === ALL_CONTRATO_FILTER ? undefined : contratoFilter,
        modalidade:
          modalidadeFilter === ALL_MODALIDADE_FILTER
            ? undefined
            : modalidadeFilter,
        status: statusFilter === ALL_STATUS_FILTER ? undefined : statusFilter,
      }),
  });

  // Buscar vagas expirando
  const { data: expiringVagas } = useQuery({
    queryKey: ["admin-vagas-expiring"],
    queryFn: () => AdminVagasService.getVagasExpirando(7),
    enabled: activeTab === "expiring",
  });

  // Mutations
  const ativarMutation = useMutation({
    mutationFn: (id: string) => AdminVagasService.ativarVaga(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vagas"] });
      queryClient.invalidateQueries({ queryKey: ["admin-vagas-stats"] });
      toast.success("Vaga ativada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao ativar vaga");
    },
  });

  const pausarMutation = useMutation({
    mutationFn: (id: string) => AdminVagasService.pausarVaga(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vagas"] });
      queryClient.invalidateQueries({ queryKey: ["admin-vagas-stats"] });
      toast.success("Vaga pausada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao pausar vaga");
    },
  });

  const encerrarMutation = useMutation({
    mutationFn: (id: string) => AdminVagasService.encerrarVaga(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vagas"] });
      queryClient.invalidateQueries({ queryKey: ["admin-vagas-stats"] });
      toast.success("Vaga encerrada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao encerrar vaga");
    },
  });

  const renovarMutation = useMutation({
    mutationFn: (id: string) => AdminVagasService.renovarVaga(id, 30),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vagas"] });
      queryClient.invalidateQueries({ queryKey: ["admin-vagas-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-vagas-expiring"] });
      toast.success("Vaga renovada por 30 dias");
    },
    onError: () => {
      toast.error("Erro ao renovar vaga");
    },
  });

  const rejeitarMutation = useMutation({
    mutationFn: (id: string) => AdminVagasService.rejeitarVaga(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vagas"] });
      queryClient.invalidateQueries({ queryKey: ["admin-vagas-stats"] });
      toast.success("Vaga rejeitada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao rejeitar vaga");
    },
  });

  const toggleDestaqueMutation = useMutation({
    mutationFn: ({ id, destaque }: { id: string; destaque: boolean }) =>
      AdminVagasService.toggleDestaque(id, destaque),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vagas"] });
      queryClient.invalidateQueries({ queryKey: ["admin-vagas-stats"] });
      toast.success("Destaque atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar destaque");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => AdminVagasService.deleteVaga(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vagas"] });
      queryClient.invalidateQueries({ queryKey: ["admin-vagas-stats"] });
      toast.success("Vaga deletada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao deletar vaga");
    },
  });

  const handleDeleteVaga = async (vagaId: string) => {
    const confirmed = await confirm({
      title: "Deletar vaga",
      description: "Esta vaga sera removida da moderacao de empregos.",
      confirmLabel: "Deletar",
      variant: "destructive",
    });
    if (!confirmed) return;
    deleteMutation.mutate(vagaId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display flex items-center gap-2">
          <Briefcase className="h-8 w-8" />
          Gestão de Vagas
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie vagas de emprego e moderação
        </p>
      </div>

      <AdminVagasStatsCards stats={stats} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Todas
          </TabsTrigger>
          <TabsTrigger value="expiring" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Expirando
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Todas as Vagas Tab */}
        <TabsContent value="all" className="space-y-4">
          <AdminVagasFilters
            search={search}
            statusFilter={statusFilter}
            contratoFilter={contratoFilter}
            modalidadeFilter={modalidadeFilter}
            onSearchChange={setSearch}
            onStatusFilterChange={setStatusFilter}
            onContratoFilterChange={setContratoFilter}
            onModalidadeFilterChange={setModalidadeFilter}
          />

          {/* Tabela de Vagas */}
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Contrato</TableHead>
                        <TableHead>Modalidade</TableHead>
                        <TableHead>Nível</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vagasData?.data?.map((vaga) => (
                        <TableRow key={vaga.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {vaga.titulo}
                              {vaga.highlightType !== "none" && (
                                <Badge variant="default" className="text-xs">Destaque</Badge>
                              )}
                              {(vaga.urgencia === "urgente" || vaga.urgencia === "extrema") && (
                                <Badge variant="destructive" className="text-xs">Urgente</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{vaga.empresa}</span>
                              {vaga.location && (
                                <span className="text-xs text-muted-foreground">
                                  {vaga.location.name}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{vaga.contrato}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{vaga.modalidade}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{vaga.nivel}</Badge>
                          </TableCell>
                          <TableCell>
                            <AdminVagasStatusBadge status={vaga.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {vaga.status === "pending_review" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => ativarMutation.mutate(vaga.id)}
                                    title="Publicar"
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => rejeitarMutation.mutate(vaga.id)}
                                    title="Rejeitar"
                                  >
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  </Button>
                                </>
                              )}
                              {vaga.status === "published" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => pausarMutation.mutate(vaga.id)}
                                  title="Pausar"
                                >
                                  <Clock className="h-4 w-4 text-yellow-600" />
                                </Button>
                              )}
                              {vaga.status === "paused" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => ativarMutation.mutate(vaga.id)}
                                  title="Publicar"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                              {(vaga.status === "published" || vaga.status === "paused") && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => encerrarMutation.mutate(vaga.id)}
                                  title="Encerrar"
                                >
                                  <XCircle className="h-4 w-4 text-gray-600" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  toggleDestaqueMutation.mutate({
                                    id: vaga.id,
                                    destaque: vaga.highlightType === "none",
                                  })
                                }
                                title={vaga.highlightType !== "none" ? "Remover destaque" : "Destacar"}
                              >
                                {vaga.highlightType !== "none" ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteVaga(vaga.id)}
                                title="Deletar"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Paginação */}
                  {vagasData && vagasData.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Página {vagasData.page} de {vagasData.totalPages}
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
                          disabled={page === vagasData.totalPages}
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

        {/* Expirando Tab */}
        <TabsContent value="expiring">
          <Card>
            <CardContent className="pt-6">
              {expiringVagas && expiringVagas.length > 0 ? (
                <div className="space-y-4">
                  {expiringVagas.map((vaga) => (
                    <div key={vaga.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{vaga.titulo}</h3>
                            {vaga.highlightType !== "none" && (
                              <Badge variant="default">Destaque</Badge>
                            )}
                            {(vaga.urgencia === "urgente" || vaga.urgencia === "extrema") && (
                              <Badge variant="destructive">Urgente</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {vaga.empresa} • {vaga.contrato} • {vaga.modalidade}
                          </p>
                          {vaga.location && (
                            <p className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                              {vaga.location.name}
                            </p>
                          )}
                          <p className="text-sm mt-2 text-destructive font-medium">
                            Expira em: {vaga.expiresAt?.toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => renovarMutation.mutate(vaga.id)}
                            disabled={renovarMutation.isPending}
                          >
                            {renovarMutation.isPending ? "Renovando..." : "Renovar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => pausarMutation.mutate(vaga.id)}
                          >
                            Pausar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma vaga expirando nos próximos 7 dias
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <AdminVagasAnalytics stats={stats} />
        </TabsContent>
      </Tabs>
      <ConfirmDialog />
    </div>
  );
}
