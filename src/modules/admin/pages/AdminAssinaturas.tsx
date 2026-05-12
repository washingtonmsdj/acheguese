/**
 * AdminAssinaturas - Gestão administrativa de assinaturas
 * 
 * SSOT: Usa adminSubscriptionsService
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminSubscriptionsService } from "@/core/admin";
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
import {
  CreditCard,
  TrendingUp,
  XCircle,
  CheckCircle,
  Clock,
  DollarSign,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AdminStatsCard,
  AdminFiltersBar,
  AdminPagination,
  type FilterOption,
} from "@/modules/admin/components";

export default function AdminAssinaturas() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Buscar estatísticas
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-subscriptions-stats"],
    queryFn: () => adminSubscriptionsService.getStats(),
  });

  // Buscar assinaturas
  const { data: subscriptionsData, isLoading } = useQuery({
    queryKey: ["admin-subscriptions", page, search, planFilter, statusFilter],
    queryFn: () =>
      adminSubscriptionsService.getAllSubscriptions({
        page,
        limit: 20,
        search,
        planType: planFilter || undefined,
        status: statusFilter || undefined,
      }),
  });

  // Buscar assinaturas expirando
  const { data: expiringSubscriptions } = useQuery({
    queryKey: ["admin-subscriptions-expiring"],
    queryFn: () => adminSubscriptionsService.getExpiringSubscriptions(7),
    enabled: activeTab === "expiring",
  });

  // Buscar churn rate
  const { data: churnData } = useQuery({
    queryKey: ["admin-subscriptions-churn"],
    queryFn: () => adminSubscriptionsService.getChurnRate(3),
    enabled: activeTab === "analytics",
  });

  // Mutations
  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminSubscriptionsService.cancelSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions-stats"] });
      toast.success("Assinatura cancelada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao cancelar assinatura");
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => adminSubscriptionsService.reactivateSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions-stats"] });
      toast.success("Assinatura reativada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao reativar assinatura");
    },
  });
  type SubscriptionItem = NonNullable<typeof subscriptionsData>["data"][number];
  type ExpiringSubscriptionItem = NonNullable<typeof expiringSubscriptions>[number];

  const filters: FilterOption[] = [
    {
      label: "Plano",
      value: "plan",
      placeholder: "Todos os planos",
      options: [
        { label: "Free", value: "free" },
        { label: "Basic", value: "basic" },
        { label: "Premium", value: "premium" },
        { label: "Enterprise", value: "enterprise" },
      ],
    },
    {
      label: "Status",
      value: "status",
      placeholder: "Todos os status",
      options: [
        { label: "Ativa", value: "active" },
        { label: "Expirada", value: "expired" },
        { label: "Cancelada", value: "cancelled" },
        { label: "Pendente", value: "pending" },
      ],
    },
  ];

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "free":
        return <Badge variant="secondary">Free</Badge>;
      case "basic":
        return <Badge variant="default">Basic</Badge>;
      case "premium":
        return <Badge variant="success">Premium</Badge>;
      case "enterprise":
        return <Badge variant="destructive">Enterprise</Badge>;
      default:
        return <Badge>{plan}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Ativa</Badge>;
      case "expired":
        return <Badge variant="destructive">Expirada</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelada</Badge>;
      case "pending":
        return <Badge variant="warning">Pendente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display flex items-center gap-2">
          <CreditCard className="h-8 w-8" />
          Gestão de Assinaturas
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie assinaturas, planos e receita
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          title="Total de Assinaturas"
          value={stats?.total || 0}
          subtitle={`${stats?.active || 0} ativas`}
          icon={CreditCard}
          loading={loadingStats}
        />
        <AdminStatsCard
          title="MRR"
          value={`R$ ${(stats?.monthlyRecurringRevenue || 0).toFixed(2)}`}
          subtitle="Receita recorrente mensal"
          icon={DollarSign}
          iconColor="text-green-600"
          loading={loadingStats}
        />
        <AdminStatsCard
          title="Receita Total"
          value={`R$ ${(stats?.totalRevenue || 0).toFixed(2)}`}
          subtitle="Histórico completo"
          icon={TrendingUp}
          iconColor="text-blue-600"
          loading={loadingStats}
        />
        <AdminStatsCard
          title="Tempo Médio"
          value={`${Math.round(stats?.averageLifetime || 0)} dias`}
          subtitle="Duração média"
          icon={Clock}
          iconColor="text-purple-600"
          loading={loadingStats}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
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

        {/* Todas as Assinaturas Tab */}
        <TabsContent value="all" className="space-y-4">
          {/* Filtros */}
          <AdminFiltersBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por email..."
            filters={filters}
            filterValues={{ plan: planFilter, status: statusFilter }}
            onFilterChange={(key, value) => {
              if (key === "plan") setPlanFilter(value);
              if (key === "status") setStatusFilter(value);
            }}
            onClear={() => {
              setSearch("");
              setPlanFilter("");
              setStatusFilter("");
            }}
          />

          {/* Tabela de Assinaturas */}
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
                        <TableHead>Plano</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Início</TableHead>
                        <TableHead>Expira</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptionsData?.data?.map((sub: SubscriptionItem) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">
                            {sub.user?.email || sub.user_id}
                          </TableCell>
                          <TableCell>{getPlanBadge(sub.plan_type)}</TableCell>
                          <TableCell>
                            R$ {(sub.amount_cents / 100).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(sub.started_at), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell>
                            {sub.expires_at
                              ? format(new Date(sub.expires_at), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })
                              : "Sem limite"}
                          </TableCell>
                          <TableCell>{getStatusBadge(sub.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {sub.status === "active" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        "Tem certeza que deseja cancelar esta assinatura?"
                                      )
                                    ) {
                                      cancelMutation.mutate(sub.id);
                                    }
                                  }}
                                >
                                  <XCircle className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                              {sub.status === "cancelled" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => reactivateMutation.mutate(sub.id)}
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                              <Button size="sm" variant="ghost">
                                <ArrowUp className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <ArrowDown className="h-4 w-4 text-orange-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Paginação */}
                  {subscriptionsData && (
                    <AdminPagination
                      currentPage={page}
                      totalPages={subscriptionsData.totalPages}
                      totalItems={subscriptionsData.count}
                      itemsPerPage={20}
                      onPageChange={setPage}
                    />
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
              {expiringSubscriptions && expiringSubscriptions.length > 0 ? (
                <div className="space-y-4">
                  {expiringSubscriptions.map((sub: ExpiringSubscriptionItem) => (
                    <div key={sub.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {sub.user?.email || sub.user_id}
                            </span>
                            {getPlanBadge(sub.plan_type)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Expira em:{" "}
                            {format(new Date(sub.expires_at), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Valor: R$ {(sub.amount_cents / 100).toFixed(2)}/mês
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            toast.info("Funcionalidade de renovação em desenvolvimento");
                          }}
                        >
                          Renovar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma assinatura expirando nos próximos 7 dias
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="space-y-4">
            {/* Churn Rate Card */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Taxa de Cancelamento (Churn)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Churn Rate</p>
                    <p className="text-2xl font-bold">
                      {churnData?.churnRate.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total de Assinaturas
                    </p>
                    <p className="text-2xl font-bold">
                      {churnData?.totalSubscriptions || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Canceladas</p>
                    <p className="text-2xl font-bold text-red-600">
                      {churnData?.cancelledSubscriptions || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Distribuição por Plano */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Distribuição por Plano</h3>
                <div className="space-y-2">
                  {stats?.byPlan &&
                    Object.entries(stats.byPlan).map(([plan, count]) => (
                      <div key={plan} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getPlanBadge(plan)}
                        </div>
                        <span className="font-semibold">{count as number}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
