/**
 * AdminRoles - Gestão de roles e permissões
 * 
 * SSOT: Usa adminRolesService
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminRolesService } from "@/core/admin";
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
  Shield,
  UserCog,
  Clock,
  TrendingUp,
  XCircle,
  RefreshCw,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import { useSessionContext } from "@/core/session";

type RoleMutationInput = {
  userId: string;
  role: string;
  revokedBy?: string;
  renewedBy?: string;
  reason?: string;
  newExpiresAt?: string;
};

type RoleDataItem = {
  id: string;
  user_id: string;
  role: string;
  granted_at: string;
  expires_at?: string | null;
  is_active: boolean;
  user?: { email?: string | null } | null;
  granter?: { email?: string | null } | null;
};

export default function AdminRoles() {
  const queryClient = useQueryClient();
  const { user, activeProfile } = useSessionContext();
  const [activeTab, setActiveTab] = useState("roles");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ["admin-roles-stats"],
    queryFn: () => adminRolesService.getStats(),
  });

  // Buscar roles
  const { data: rolesData, isLoading } = useQuery({
    queryKey: ["admin-roles", page, search, roleFilter],
    queryFn: () =>
      adminRolesService.getAllRoles({
        page,
        limit: 20,
        search,
        role: roleFilter || undefined,
      }),
  });

  // Buscar roles expirando
  const { data: expiringRoles } = useQuery({
    queryKey: ["admin-roles-expiring"],
    queryFn: () => adminRolesService.getExpiringRoles(7),
    enabled: activeTab === "expiring",
  });

  // Mutations
  const revokeMutation = useMutation({
    mutationFn: ({ userId, role, revokedBy, reason }: RoleMutationInput) =>
      adminRolesService.revokeRole({ userId, role, revokedBy, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-roles-stats"] });
      toast.success("Role revogado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao revogar role");
    },
  });

  const renewMutation = useMutation({
    mutationFn: ({ userId, role, newExpiresAt, renewedBy }: RoleMutationInput) =>
      adminRolesService.renewRole({ userId, role, newExpiresAt, renewedBy }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-roles-expiring"] });
      toast.success("Role renovado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao renovar role");
    },
  });

  const actingUserId = user?.id ?? activeProfile?.id ?? "system";

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive">Admin</Badge>;
      case "moderator":
      return <Badge variant="outline">Moderador</Badge>;
      case "user":
        return <Badge variant="secondary">Usuário</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Gestão de Roles
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie roles e permissões de usuários
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRoles || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.activeRoles || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.byRole?.admin || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Acesso total ao sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Moderadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.byRole?.moderator || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Moderação de conteúdo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expirando
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.expiredRoles || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Próximos 7 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Todos os Roles
          </TabsTrigger>
          <TabsTrigger value="expiring" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Expirando
            {stats?.expiredRoles ? (
                    <Badge variant="outline" className="ml-1">
                {stats.expiredRoles}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Todos os Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filtrar por role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderador</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setRoleFilter("");
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Conceder Role
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Roles */}
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Concedido por</TableHead>
                        <TableHead>Concedido em</TableHead>
                        <TableHead>Expira em</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rolesData?.data?.map((roleData: RoleDataItem) => (
                        <TableRow key={roleData.id}>
                          <TableCell className="font-medium">
                            {roleData.user?.email || roleData.user_id}
                          </TableCell>
                          <TableCell>{getRoleBadge(roleData.role)}</TableCell>
                          <TableCell>
                            {roleData.granter?.email || "Sistema"}
                          </TableCell>
                          <TableCell>
                            {format(new Date(roleData.granted_at), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell>
                            {roleData.expires_at
                              ? format(new Date(roleData.expires_at), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })
                              : "Nunca"}
                          </TableCell>
                          <TableCell>
                            {roleData.is_active ? (
                        <Badge variant="secondary">Ativo</Badge>
                            ) : (
                              <Badge variant="secondary">Inativo</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {roleData.is_active && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const reason = prompt("Motivo da revogação (opcional):");
                                    revokeMutation.mutate({
                                      userId: roleData.user_id,
                                      role: roleData.role,
                                      revokedBy: actingUserId,
                                      reason: reason || undefined,
                                    });
                                  }}
                                >
                                  <XCircle className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Paginação */}
                  {rolesData && rolesData.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Página {rolesData.page} de {rolesData.totalPages}
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
                          disabled={page === rolesData.totalPages}
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
              {expiringRoles && expiringRoles.length > 0 ? (
                <div className="space-y-4">
                  {expiringRoles.map((roleData: RoleDataItem) => (
                    <div key={roleData.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {roleData.user?.email || roleData.user_id}
                            </span>
                            {getRoleBadge(roleData.role)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Expira em:{" "}
                            {format(new Date(roleData.expires_at), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            const days = prompt("Renovar por quantos dias?", "30");
                            if (days) {
                              const newDate = new Date();
                              newDate.setDate(newDate.getDate() + parseInt(days));
                              renewMutation.mutate({
                                userId: roleData.user_id,
                                role: roleData.role,
                                newExpiresAt: newDate.toISOString(),
                                renewedBy: actingUserId,
                              });
                            }
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Renovar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum role expirando nos próximos 7 dias
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
