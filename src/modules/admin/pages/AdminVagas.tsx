/**
 * AdminVagas - Gestão administrativa de vagas de emprego
 * 
 * SSOT: Usa adminVagasService
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminVagasService } from "@/core/admin";
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
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ["admin-vagas-stats"],
    queryFn: () => adminVagasService.getStats(),
  });

  // Buscar vagas
  const { data: vagasData, isLoading } = useQuery({
    queryKey: ["admin-vagas", page, search, categoryFilter, statusFilter, activeTab],
    queryFn: () =>
      adminVagasService.getAllVagas({
        page,
        limit: 20,
        search,
        category: categoryFilter || undefined,
        status: activeTab === "pending" ? "pending" : statusFilter || undefined,
      }),
  });

  // Buscar vagas pendentes
  const { data: pendingVagas } = useQuery({
    queryKey: ["admin-vagas-pending"],
    queryFn: () => adminVagasService.getPendingVagas(),
    enabled: activeTab === "pending",
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id: string) => adminVagasService.approveVaga(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vagas"] });
      queryClient.invalidateQueries({ queryKey: ["admin-vagas-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-vagas-pending"] });
      toast.success("Vaga aprovada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao aprovar vaga");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminVagasService.rejectVaga(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vagas"] });
      queryClient.invalidateQueries({ queryKey: ["admin-vagas-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-vagas-pending"] });
      toast.success("Vaga rejeitada");
    },
    onError: () => {
      toast.error("Erro ao rejeitar vaga");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminVagasService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vagas"] });
      queryClient.invalidateQueries({ queryKey: ["admin-vagas-stats"] });
      toast.success("Status atualizado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminVagasService.deleteVaga(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vagas"] });
      queryClient.invalidateQueries({ queryKey: ["admin-vagas-stats"] });
      toast.success("Vaga deletada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao deletar vaga");
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="success">Aprovada</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitada</Badge>;
      case "pending":
        return <Badge variant="warning">Pendente</Badge>;
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Vagas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.active || 0} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando moderação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Aprovadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.approved || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.total ? Math.round((stats.approved / stats.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rejeitadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.rejected || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.total ? Math.round((stats.rejected / stats.total) * 100) : 0}% do total
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
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pendentes
            {stats?.pending ? (
              <Badge variant="warning" className="ml-1">
                {stats.pending}
              </Badge>
            ) : null}
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
                      placeholder="Buscar por título ou descrição..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovada</SelectItem>
                    <SelectItem value="rejected">Rejeitada</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("");
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
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ativo</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vagasData?.data?.map((vaga: any) => (
                        <TableRow key={vaga.id}>
                          <TableCell className="font-medium">{vaga.title}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {vaga.company?.logo_url && (
                                <img
                                  src={vaga.company.logo_url}
                                  alt={vaga.company.name}
                                  className="h-6 w-6 rounded object-cover"
                                />
                              )}
                              <span>{vaga.company?.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{vaga.type}</TableCell>
                          <TableCell>{getStatusBadge(vaga.status)}</TableCell>
                          <TableCell>
                            {vaga.is_active ? (
                              <Badge variant="success">Sim</Badge>
                            ) : (
                              <Badge variant="secondary">Não</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {vaga.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => approveMutation.mutate(vaga.id)}
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const reason = prompt("Motivo da rejeição (opcional):");
                                      rejectMutation.mutate({ id: vaga.id, reason: reason || undefined });
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  toggleMutation.mutate({
                                    id: vaga.id,
                                    isActive: !vaga.is_active,
                                  })
                                }
                              >
                                {vaga.is_active ? (
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

        {/* Pendentes Tab */}
        <TabsContent value="pending">
          <Card>
            <CardContent className="pt-6">
              {pendingVagas && pendingVagas.length > 0 ? (
                <div className="space-y-4">
                  {pendingVagas.map((vaga: any) => (
                    <div key={vaga.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{vaga.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {vaga.company?.name}
                          </p>
                          <p className="text-sm mt-2">{vaga.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => approveMutation.mutate(vaga.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const reason = prompt("Motivo da rejeição:");
                              if (reason) {
                                rejectMutation.mutate({ id: vaga.id, reason });
                              }
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma vaga pendente de moderação
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
