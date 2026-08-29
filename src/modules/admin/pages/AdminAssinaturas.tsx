/**
 * AdminAssinaturas - observabilidade administrativa de assinaturas.
 *
 * Este painel é somente leitura. Mudanças comerciais pertencem ao Stripe
 * Checkout/Customer Portal e são materializadas pelo billing-webhook.
 */

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminSubscriptionsService } from "@/core/admin";
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
import { CreditCard, TrendingUp, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import { formatBrl } from "@/shared/utils/currency";
import {
  AdminStatsCard,
  AdminFiltersBar,
  AdminPagination,
  type FilterOption,
} from "@/core/admin/components";

export default function AdminAssinaturas() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-subscriptions-stats"],
    queryFn: () => adminSubscriptionsService.getStats(),
  });

  const { data: subscriptionsData, isLoading } = useQuery({
    queryKey: ["admin-subscriptions", page, search, planFilter, statusFilter],
    queryFn: () =>
      adminSubscriptionsService.getAllSubscriptions({
        page,
        limit: 20,
        search,
        planCode: planFilter || undefined,
        status: statusFilter || undefined,
      }),
  });

  const { data: expiringSubscriptions } = useQuery({
    queryKey: ["admin-subscriptions-expiring"],
    queryFn: () => adminSubscriptionsService.getExpiringSubscriptions(7),
    enabled: activeTab === "expiring",
  });

  const { data: churnData } = useQuery({
    queryKey: ["admin-subscriptions-churn"],
    queryFn: () => adminSubscriptionsService.getChurnRate(3),
    enabled: activeTab === "analytics",
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
        { label: "Pro", value: "pro" },
        { label: "Delivery", value: "delivery" },
      ],
    },
    {
      label: "Status",
      value: "status",
      placeholder: "Todos os status",
      options: [
        { label: "Ativa", value: "active" },
        { label: "Em teste", value: "trialing" },
        { label: "Pagamento pendente", value: "past_due" },
        { label: "Incompleta", value: "incomplete" },
        { label: "Incompleta expirada", value: "incomplete_expired" },
        { label: "Não paga", value: "unpaid" },
        { label: "Cancelada", value: "canceled" },
      ],
    },
  ];

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "free":
        return <Badge variant="secondary">Free</Badge>;
      case "pro":
        return <Badge variant="default">Pro</Badge>;
      case "delivery":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Delivery</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Ativa</Badge>;
      case "trialing":
        return <Badge variant="default">Em teste</Badge>;
      case "past_due":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pagamento pendente</Badge>;
      case "canceled":
        return <Badge variant="secondary">Cancelada</Badge>;
      case "unpaid":
        return <Badge variant="destructive">Não paga</Badge>;
      case "incomplete_expired":
        return <Badge variant="destructive">Incompleta expirada</Badge>;
      case "incomplete":
        return <Badge variant="outline">Incompleta</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display flex items-center gap-2">
          <CreditCard className="h-8 w-8" />
          Assinaturas
        </h1>
        <p className="text-muted-foreground mt-1">
          Observabilidade de contratos. Alterações comerciais são executadas pelo Stripe e materializadas pelo webhook de billing.
        </p>
      </div>

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
          subtitle="Histórico materializado"
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

        <TabsContent value="all" className="space-y-4">
          <AdminFiltersBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por email..."
            filters={filters}
            filterValues={{ plan: planFilter, status: statusFilter }}
            onFilterChange={(key, value) => {
              if (key === "plan") setPlanFilter(value);
              if (key === "status") setStatusFilter(value);
              setPage(1);
            }}
            onClear={() => {
              setSearch("");
              setPlanFilter("");
              setStatusFilter("");
              setPage(1);
            }}
          />

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
                        <TableHead>Fim do período</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptionsData?.data?.map((sub: SubscriptionItem) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">
                            {sub.user?.email || sub.user_id}
                          </TableCell>
                          <TableCell>{getPlanBadge(sub.plan_code)}</TableCell>
                          <TableCell>{formatBrl(sub.amount_cents / 100)}</TableCell>
                          <TableCell>
                            {format(new Date(sub.started_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {sub.expires_at
                              ? format(new Date(sub.expires_at), "dd/MM/yyyy", { locale: ptBR })
                              : "Sem limite"}
                          </TableCell>
                          <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

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

        <TabsContent value="expiring">
          <Card>
            <CardContent className="pt-6">
              {expiringSubscriptions && expiringSubscriptions.length > 0 ? (
                <div className="space-y-4">
                  {expiringSubscriptions.map((sub: ExpiringSubscriptionItem) => (
                    <div key={sub.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{sub.user?.email || sub.user_id}</span>
                            {getPlanBadge(sub.plan_code)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Fim do período: {sub.expires_at
                              ? format(new Date(sub.expires_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                              : "não informado"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Valor: {formatBrl(sub.amount_cents / 100)}/mês
                          </p>
                        </div>
                        {getStatusBadge(sub.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma assinatura ativa encerrando o período nos próximos 7 dias
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Taxa de Cancelamento (Churn)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Churn Rate</p>
                    <p className="text-2xl font-bold">{churnData?.churnRate.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Assinaturas</p>
                    <p className="text-2xl font-bold">{churnData?.totalSubscriptions || 0}</p>
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

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Distribuição por Plano</h3>
                <div className="space-y-2">
                  {stats?.byPlan &&
                    Object.entries(stats.byPlan).map(([plan, count]) => (
                      <div key={plan} className="flex items-center justify-between">
                        {getPlanBadge(plan)}
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
