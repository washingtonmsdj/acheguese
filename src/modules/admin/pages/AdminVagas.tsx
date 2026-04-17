/**
 * AdminVagas - GestÃ£o administrativa de vagas de emprego
 * 
 * SSOT: Usa AdminVagasService (novo)
 * Migration: 20260416110000_create_vagas.sql
 * 
 * Atualizado para usar:
 * - Enums: vaga_status, vaga_contrato, vaga_modalidade, vaga_nivel, vaga_urgencia
 * - Full-text search em portuguÃªs
 * - Filtros territoriais integrados
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminVagasService } from "@/core/admin/services/AdminVagasRuntimeService";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  Search,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import type { VagaStatus, VagaContrato, VagaModalidade } from "@/modules/vagas/types/vagas.types";

const STATUS_OPTIONS: { value: VagaStatus; label: string }[] = [
  { value: "draft", label: "Rascunho" },
  { value: "pending_review", label: "Aguardando revisÃ£o" },
  { value: "published", label: "Publicada" },
  { value: "paused", label: "Pausada" },
  { value: "closed", label: "Encerrada" },
  { value: "expired", label: "Expirada" },
  { value: "rejected", label: "Rejeitada" },
  { value: "removed", label: "Removida" },
];

const ALL_STATUS_FILTER = "__all_status" as const;
const ALL_CONTRATO_FILTER = "__all_contrato" as const;
const ALL_MODALIDADE_FILTER = "__all_modalidade" as const;

export default function AdminVagas() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [contratoFilter, setContratoFilter] = useState<
    VagaContrato | typeof ALL_CONTRATO_FILTER
  >(ALL_CONTRATO_FILTER);
  const [modalidadeFilter, setModalidadeFilter] = useState<
    VagaModalidade | typeof ALL_MODALIDADE_FILTER
  >(ALL_MODALIDADE_FILTER);
  const [statusFilter, setStatusFilter] = useState<
    VagaStatus | typeof ALL_STATUS_FILTER
  >(ALL_STATUS_FILTER);
  const [page, setPage] = useState(1);

  // Buscar estatÃ­sticas
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

  const getStatusBadge = (status: VagaStatus) => {
    switch (status) {
      case "published":
        return <Badge variant="success">Publicada</Badge>;
      case "pending_review":
        return <Badge variant="default">Em revisÃ£o</Badge>;
      case "paused":
        return <Badge variant="warning">Pausada</Badge>;
      case "closed":
        return <Badge variant="secondary">Encerrada</Badge>;
      case "draft":
        return <Badge variant="outline">Rascunho</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitada</Badge>;
      case "removed":
        return <Badge variant="secondary">Removida</Badge>;
      case "expired":
        return <Badge variant="secondary">Expirada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display flex items-center gap-2">
          <Briefcase className="h-8 w-8" />
          GestÃ£o de Vagas
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie vagas de emprego e moderaÃ§Ã£o
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Vagas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.published || 0} publicadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Publicadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.published || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.total ? Math.round((stats.published / stats.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Em revisÃ£o
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pendingReview || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando moderaÃ§Ã£o
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Encerradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats?.closed || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Finalizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Destaques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.destaques || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Vagas com destaque ativo
            </p>
          </CardContent>
        </Card>
      </div>

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
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por tÃ­tulo, empresa ou descriÃ§Ã£o..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(v) =>
                    setStatusFilter(v as VagaStatus | typeof ALL_STATUS_FILTER)
                  }
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_STATUS_FILTER}>Todos</SelectItem>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={contratoFilter}
                  onValueChange={(v) =>
                    setContratoFilter(
                      v as VagaContrato | typeof ALL_CONTRATO_FILTER,
                    )
                  }
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_CONTRATO_FILTER}>Todos</SelectItem>
                    <SelectItem value="CLT">CLT</SelectItem>
                    <SelectItem value="PJ">PJ</SelectItem>
                    <SelectItem value="temporario">Temporário</SelectItem>
                    <SelectItem value="estagio">Estágio</SelectItem>
                    <SelectItem value="freelancer">Freelancer</SelectItem>
                    <SelectItem value="aprendiz">Aprendiz</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={modalidadeFilter}
                  onValueChange={(v) =>
                    setModalidadeFilter(
                      v as VagaModalidade | typeof ALL_MODALIDADE_FILTER,
                    )
                  }
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Modalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_MODALIDADE_FILTER}>Todas</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="remoto">Remoto</SelectItem>
                    <SelectItem value="hibrido">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setContratoFilter(ALL_CONTRATO_FILTER);
                    setModalidadeFilter(ALL_MODALIDADE_FILTER);
                    setStatusFilter(ALL_STATUS_FILTER);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

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
                        <TableHead>TÃ­tulo</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Contrato</TableHead>
                        <TableHead>Modalidade</TableHead>
                        <TableHead>NÃ­vel</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">AÃ§Ãµes</TableHead>
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
                          <TableCell>{getStatusBadge(vaga.status)}</TableCell>
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
                                onClick={() => {
                                  if (confirm("Tem certeza que deseja deletar esta vaga?")) {
                                    deleteMutation.mutate(vaga.id);
                                  }
                                }}
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

                  {/* PaginaÃ§Ã£o */}
                  {vagasData && vagasData.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        PÃ¡gina {vagasData.page} de {vagasData.totalPages}
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
                          PrÃ³xima
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
                            {vaga.empresa} â€¢ {vaga.contrato} â€¢ {vaga.modalidade}
                          </p>
                          {vaga.location && (
                            <p className="text-sm text-muted-foreground">
                              ðŸ“ {vaga.location.name}
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
                            onClick={() => {
                              toast.info("Funcionalidade de renovaÃ§Ã£o em desenvolvimento");
                            }}
                          >
                            Renovar
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
                  Nenhuma vaga expirando nos prÃ³ximos 7 dias
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Analytics em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

