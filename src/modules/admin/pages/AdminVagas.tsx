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
import { AdminVagasService } from "@/modules/vagas/services/AdminVagasService";
import type { VagaStatus, VagaContrato, VagaModalidade, VagaNivel } from "@/modules/vagas/services/VagasService";
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

export default function AdminVagas() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [contratoFilter, setContratoFilter] = useState<VagaContrato | "">("");
  const [modalidadeFilter, setModalidadeFilter] = useState<VagaModalidade | "">("");
  const [statusFilter, setStatusFilter] = useState<VagaStatus | "">("");
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
        contrato: contratoFilter || undefined,
        modalidade: modalidadeFilter || undefined,
        status: statusFilter || undefined,
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

  const preenchidaMutation = useMutation({
    mutationFn: (id: string) => AdminVagasService.marcarPreenchida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vagas"] });
      queryClient.invalidateQueries({ queryKey: ["admin-vagas-stats"] });
      toast.success("Vaga marcada como preenchida");
    },
    onError: () => {
      toast.error("Erro ao marcar vaga como preenchida");
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
      case "ativa":
        return <Badge variant="success">Ativa</Badge>;
      case "pausada":
        return <Badge variant="warning">Pausada</Badge>;
      case "encerrada":
        return <Badge variant="secondary">Encerrada</Badge>;
      case "preenchida":
        return <Badge variant="default">Preenchida</Badge>;
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
          Gestão de Vagas
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie vagas de emprego e moderação
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
              {stats?.ativas || 0} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.ativas || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.total ? Math.round((stats.ativas / stats.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pausadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pausadas || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Temporariamente inativas
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
            <div className="text-2xl font-bold text-gray-600">{stats?.encerradas || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Finalizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Preenchidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.preenchidas || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Candidatos contratados
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
                      placeholder="Buscar por título, empresa ou descrição..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as VagaStatus | "")}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="pausada">Pausada</SelectItem>
                    <SelectItem value="encerrada">Encerrada</SelectItem>
                    <SelectItem value="preenchida">Preenchida</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={contratoFilter} onValueChange={(v) => setContratoFilter(v as VagaContrato | "")}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="CLT">CLT</SelectItem>
                    <SelectItem value="PJ">PJ</SelectItem>
                    <SelectItem value="Temporário">Temporário</SelectItem>
                    <SelectItem value="Estágio">Estágio</SelectItem>
                    <SelectItem value="Freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={modalidadeFilter} onValueChange={(v) => setModalidadeFilter(v as VagaModalidade | "")}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Modalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="Presencial">Presencial</SelectItem>
                    <SelectItem value="Remoto">Remoto</SelectItem>
                    <SelectItem value="Híbrido">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setContratoFilter("");
                    setModalidadeFilter("");
                    setStatusFilter("");
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
                              {vaga.destaque && (
                                <Badge variant="default" className="text-xs">Destaque</Badge>
                              )}
                              {vaga.urgencia === 'urgente' && (
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
                              {vaga.status === "ativa" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => pausarMutation.mutate(vaga.id)}
                                  title="Pausar"
                                >
                                  <Clock className="h-4 w-4 text-yellow-600" />
                                </Button>
                              )}
                              {vaga.status === "pausada" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => ativarMutation.mutate(vaga.id)}
                                  title="Ativar"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                              {(vaga.status === "ativa" || vaga.status === "pausada") && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => preenchidaMutation.mutate(vaga.id)}
                                    title="Marcar como preenchida"
                                  >
                                    <CheckCircle className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => encerrarMutation.mutate(vaga.id)}
                                    title="Encerrar"
                                  >
                                    <XCircle className="h-4 w-4 text-gray-600" />
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  toggleDestaqueMutation.mutate({
                                    id: vaga.id,
                                    destaque: !vaga.destaque,
                                  })
                                }
                                title={vaga.destaque ? "Remover destaque" : "Destacar"}
                              >
                                {vaga.destaque ? (
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
                            {vaga.destaque && (
                              <Badge variant="default">Destaque</Badge>
                            )}
                            {vaga.urgencia === 'urgente' && (
                              <Badge variant="destructive">Urgente</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {vaga.empresa} • {vaga.contrato} • {vaga.modalidade}
                          </p>
                          {vaga.location && (
                            <p className="text-sm text-muted-foreground">
                              📍 {vaga.location.name}
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
                              toast.info("Funcionalidade de renovação em desenvolvimento");
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
                  Nenhuma vaga expirando nos próximos 7 dias
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
