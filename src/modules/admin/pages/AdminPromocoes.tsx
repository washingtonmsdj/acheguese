/**
 * AdminPromocoes - Gestão administrativa de promoções
 * 
 * SSOT: Usa adminPromotionsService
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminPromotionsService } from "@/core/admin";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  Ticket,
  TrendingUp,
  Eye,
  EyeOff,
  Trash2,
  Clock,
  Trophy,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import { formatBrl } from "@/shared/utils/currency";
import {
  AdminStatsCard,
  AdminFiltersBar,
  AdminPagination,
  type FilterOption,
} from "@/core/admin/components";
import type { Promotion } from "@/core/admin/services/AdminPromotionsService";
import { useConfirmActionDialog } from "@/shared/hooks/useConfirmActionDialog";

const statusFromTab = (
  tab: string,
): "active" | "expired" | "scheduled" | "all" =>
  tab === "active" || tab === "expired" || tab === "scheduled" ? tab : "all";

export default function AdminPromocoes() {
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirmActionDialog();
  const [activeTab, setActiveTab] = useState<"all" | "expiring" | "top" | "analytics">("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "expired" | "scheduled">("");
  const [page, setPage] = useState(1);

  // Buscar estatísticas
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-promotions-stats"],
    queryFn: () => adminPromotionsService.getStats(),
  });

  // Buscar promoções
  const { data: promotionsData, isLoading } = useQuery({
    queryKey: ["admin-promotions", page, search, typeFilter, statusFilter, activeTab],
    queryFn: () =>
      adminPromotionsService.getAllPromotions({
        page,
        limit: 20,
        search,
        type: typeFilter || undefined,
        status: activeTab === "all" ? (statusFilter || undefined) : statusFromTab(activeTab),
      }),
  });

  // Buscar promoções expirando
  const { data: expiringPromotions } = useQuery({
    queryKey: ["admin-promotions-expiring"],
    queryFn: () => adminPromotionsService.getExpiringPromotions(7),
    enabled: activeTab === "expiring",
  });

  // Buscar top promoções
  const { data: topPromotions } = useQuery({
    queryKey: ["admin-promotions-top"],
    queryFn: () => adminPromotionsService.getTopPromotions(10),
    enabled: activeTab === "top",
  });

  // Mutations
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminPromotionsService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-promotions-stats"] });
      toast.success("Status atualizado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminPromotionsService.deletePromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-promotions-stats"] });
      toast.success("Promoção deletada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao deletar promoção");
    },
  });

  const filters: FilterOption[] = [
    {
      label: "Tipo",
      value: "type",
      placeholder: "Todos os tipos",
      options: [
        { label: "Percentual", value: "percentage" },
        { label: "Fixo", value: "fixed" },
        { label: "Brinde", value: "freebie" },
      ],
    },
    {
      label: "Status",
      value: "status",
      placeholder: "Todos os status",
      options: [
        { label: "Ativa", value: "active" },
        { label: "Expirada", value: "expired" },
        { label: "Agendada", value: "scheduled" },
      ],
    },
  ];

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "percentage":
        return <Badge variant="default">Percentual</Badge>;
      case "fixed":
        return <Badge variant="secondary">Fixo</Badge>;
      case "freebie":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Brinde</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getStatusBadge = (promotion: Promotion) => {
    const now = new Date();
    const startsAt = new Date(promotion.starts_at);
    const expiresAt = promotion.expires_at ? new Date(promotion.expires_at) : null;

    if (!promotion.is_active) {
      return <Badge variant="secondary">Inativa</Badge>;
    }
    if (startsAt > now) {
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Agendada</Badge>;
    }
    if (expiresAt && expiresAt < now) {
      return <Badge variant="destructive">Expirada</Badge>;
    }
    return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Ativa</Badge>;
  };

  const handleDeletePromotion = async (promotionId: string) => {
    const confirmed = await confirm({
      title: "Deletar promocao",
      description: "Esta promocao sera removida definitivamente.",
      confirmLabel: "Deletar",
      variant: "destructive",
    });

    if (confirmed) {
      deleteMutation.mutate(promotionId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display flex items-center gap-2">
          <Ticket className="h-8 w-8" />
          Gestão de Promoções
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie promoções, cupons e descontos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          title="Total de Promoções"
          value={stats?.total || 0}
          subtitle={`${stats?.active || 0} ativas`}
          icon={Ticket}
          loading={loadingStats}
        />
        <AdminStatsCard
          title="Expiradas"
          value={stats?.expired || 0}
          subtitle={`${stats?.total ? Math.round((stats.expired / stats.total) * 100) : 0}% do total`}
          icon={Clock}
          iconColor="text-red-600"
          loading={loadingStats}
        />
        <AdminStatsCard
          title="Total de Uso"
          value={stats?.totalUsage || 0}
          subtitle="Vezes utilizadas"
          icon={TrendingUp}
          iconColor="text-green-600"
          loading={loadingStats}
        />
        <AdminStatsCard
          title="Valor Total"
          value={`R$ ${(stats?.totalDiscountValue || 0).toFixed(2)}`}
          subtitle="Em descontos"
          icon={Trophy}
          iconColor="text-yellow-600"
          loading={loadingStats}
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "all" | "expiring" | "top" | "analytics")
        }
      >
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Todas
          </TabsTrigger>
          <TabsTrigger value="expiring" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Expirando
          </TabsTrigger>
          <TabsTrigger value="top" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Mais Usadas
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Todas as Promoções Tab */}
        <TabsContent value="all" className="space-y-4">
          {/* Filtros */}
          <AdminFiltersBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por código ou título..."
            filters={filters}
            filterValues={{ type: typeFilter, status: statusFilter }}
            onFilterChange={(key, value) => {
              if (key === "type") setTypeFilter(value);
              if (key === "status") {
                setStatusFilter(value as "" | "active" | "expired" | "scheduled");
              }
            }}
            onClear={() => {
              setSearch("");
              setTypeFilter("");
              setStatusFilter("");
            }}
            actions={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Promoção
              </Button>
            }
          />

          {/* Tabela de Promoções */}
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Desconto</TableHead>
                        <TableHead>Uso</TableHead>
                        <TableHead>Validade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promotionsData?.data?.map((promo: Promotion) => (
                        <TableRow key={promo.id}>
                          <TableCell className="font-mono font-bold">
                            {promo.code}
                          </TableCell>
                          <TableCell>{promo.title}</TableCell>
                          <TableCell>{getTypeBadge(promo.type)}</TableCell>
                          <TableCell>
                            {promo.type === "percentage"
                              ? `${promo.discount_value}%`
                              : promo.type === "fixed"
                              ? `R$ ${promo.discount_value}`
                              : "Brinde"}
                          </TableCell>
                          <TableCell>
                            {promo.usage_count}
                            {promo.usage_limit && ` / ${promo.usage_limit}`}
                          </TableCell>
                          <TableCell>
                            {promo.expires_at
                              ? format(new Date(promo.expires_at), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })
                              : "Sem limite"}
                          </TableCell>
                          <TableCell>{getStatusBadge(promo)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  toggleMutation.mutate({
                                    id: promo.id,
                                    isActive: !promo.is_active,
                                  })
                                }
                              >
                                {promo.is_active ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeletePromotion(promo.id)}
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
                  {promotionsData && (
                    <AdminPagination
                      currentPage={page}
                      totalPages={promotionsData.totalPages}
                      totalItems={promotionsData.count}
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
              {expiringPromotions && expiringPromotions.length > 0 ? (
                <div className="space-y-4">
                  {expiringPromotions.map((promo: Promotion) => (
                    <div key={promo.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">{promo.code}</span>
                            {getTypeBadge(promo.type)}
                          </div>
                          <h3 className="font-semibold mt-1">{promo.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Expira em:{" "}
                            {format(new Date(promo.expires_at), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Uso: {promo.usage_count}
                            {promo.usage_limit && ` / ${promo.usage_limit}`}
                          </p>
                        </div>
                        {Boolean((promo as Promotion & { business?: { logo_url?: string; name?: string } }).business) && (
                          <div className="flex items-center gap-2">
                            {(promo as Promotion & { business?: { logo_url?: string; name?: string } }).business?.logo_url && (
                              <img
                                src={(promo as Promotion & { business?: { logo_url?: string; name?: string } }).business?.logo_url}
                                alt={(promo as Promotion & { business?: { name?: string } }).business?.name || "Business"}
                                className="h-8 w-8 rounded object-cover"
                              />
                            )}
                            <span className="text-sm">
                              {(promo as Promotion & { business?: { name?: string } }).business?.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma promoção expirando nos próximos 7 dias
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Promoções Tab */}
        <TabsContent value="top">
          <Card>
            <CardContent className="pt-6">
              {topPromotions && topPromotions.length > 0 ? (
                <div className="space-y-4">
                  {topPromotions.map((promo: Promotion, index: number) => (
                    <div key={promo.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">{promo.code}</span>
                            {getTypeBadge(promo.type)}
                          </div>
                          <h3 className="font-semibold mt-1">{promo.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Usado {promo.usage_count} vezes
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma promoção utilizada ainda
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Uso acumulado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats?.totalUsage ?? 0}</p>
                <p className="text-sm text-muted-foreground">resgates registrados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Valor concedido</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {formatBrl(stats?.totalDiscountValue ?? 0)}
                </p>
                <p className="text-sm text-muted-foreground">em descontos aplicados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tipos de promocao</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {(Object.entries(stats?.byType ?? {}) as [string, number][]).map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
                {Object.keys(stats?.byType ?? {}).length === 0 && (
                  <p className="text-muted-foreground">Sem dados por tipo</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      <ConfirmDialog />
    </div>
  );
}
