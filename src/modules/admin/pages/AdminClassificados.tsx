import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  EyeOff,
  Link2,
  ListTree,
  Search,
  Shield,
  Store,
  Tags,
  Trash2,
} from "lucide-react";
import { ALERT_STATUS } from "@/shared/types/constants";
import {
  adminClassifiedsService,
  type AdminClassifiedData,
} from "@/core/admin";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import {
  AdminDataState,
  AdminErrorState,
  AdminFiltersBar,
  AdminPageHeader,
  AdminPagination,
  AdminSectionCard,
  AdminStatsCard,
  AdminStatsGrid,
  AdminTable,
} from "@/modules/admin/components";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { toast } from "sonner";

const PAGE_SIZE = 20;
const SELLERS_LIMIT = 30;

function statusBadge(status: string) {
  if (status === ALERT_STATUS.ACTIVE) {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Ativo</Badge>;
  }
  if (status === "pending") {
    return <Badge className="bg-amber-500 hover:bg-amber-500">Pendente</Badge>;
  }
  if (status === "sold") {
    return <Badge className="bg-sky-600 hover:bg-sky-600">Vendido</Badge>;
  }
  if (status === "rejected") {
    return <Badge variant="destructive">Rejeitado</Badge>;
  }
  return <Badge variant="secondary">Inativo</Badge>;
}

function toCurrency(value?: number | null) {
  if (!value) return "-";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function toDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminClassificados() {
  const { canModerate, isChecking } = useAdminGuard();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState("catalog");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedClassified, setSelectedClassified] = useState<AdminClassifiedData | null>(null);

  const statsQuery = useQuery({
    queryKey: ["admin-classifieds", "stats"],
    queryFn: () => adminClassifiedsService.getStats(),
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin-classifieds", "categories"],
    queryFn: () => adminClassifiedsService.getCategoryCoverage(),
  });

  const sellersQuery = useQuery({
    queryKey: ["admin-classifieds", "sellers", SELLERS_LIMIT],
    queryFn: () => adminClassifiedsService.getSellerCoverage({ limit: SELLERS_LIMIT }),
    enabled: tab === "sellers",
  });

  const policyQuery = useQuery({
    queryKey: ["admin-classifieds", "policy-summary"],
    queryFn: () => adminClassifiedsService.getPolicySummary(),
    enabled: tab === "governance",
  });

  const classifiedsQuery = useQuery({
    queryKey: ["admin-classifieds", "catalog", page, search, statusFilter, categoryFilter],
    queryFn: () =>
      adminClassifiedsService.getAllClassifieds({
        page,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
      }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminClassifiedsService.toggleActive(id, isActive),
    onSuccess: () => {
      toast.success("Status atualizado");
      void queryClient.invalidateQueries({ queryKey: ["admin-classifieds"] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminClassifiedsService.deleteClassified(id),
    onSuccess: () => {
      toast.success("Classificado excluído");
      setSelectedClassified(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-classifieds"] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir classificado");
    },
  });

  const categoryOptions = useMemo(() => {
    return (categoriesQuery.data?.categories || []).map((category) => ({
      label: category.name,
      value: category.id,
    }));
  }, [categoriesQuery.data?.categories]);

  if (!isChecking && !canModerate) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <div className="text-center space-y-2">
          <Shield className="h-10 w-10 text-destructive mx-auto" />
          <p className="font-semibold">Acesso negado</p>
          <p className="text-sm text-muted-foreground">
            Apenas administradores podem gerenciar classificados.
          </p>
        </div>
      </div>
    );
  }

  const stats = statsQuery.data;
  const categoryCoverage = categoriesQuery.data;
  const policy = policyQuery.data;
  const catalog = classifiedsQuery.data;
  const sellers = sellersQuery.data;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Classificados"
        description="Coverage administrativo oficial de catálogo, taxonomia, vendedores e governança de URL."
        icon={ListTree}
      />

      <AdminStatsGrid>
        <AdminStatsCard
          title="Total de anúncios"
          value={stats?.total || 0}
          subtitle={`${stats?.active || 0} ativos · ${stats?.pending || 0} pendentes`}
          icon={ListTree}
          loading={statsQuery.isLoading}
        />
        <AdminStatsCard
          title="Categorias ativas"
          value={
            categoriesQuery.isLoading
              ? 0
              : `${categoryCoverage?.activeCategories || 0}/${categoryCoverage?.totalCategories || 0}`
          }
          subtitle={`${categoryCoverage?.totalSubcategories || 0} subcategorias`}
          icon={Tags}
          iconColor="text-sky-600"
          loading={categoriesQuery.isLoading}
        />
        <AdminStatsCard
          title="Vendedores com anúncios"
          value={sellers?.totalSellers || 0}
          subtitle={`${sellers?.sellersWithActiveAds || 0} com anúncios ativos`}
          icon={Store}
          iconColor="text-emerald-600"
          loading={sellersQuery.isLoading && tab === "sellers"}
        />
      </AdminStatsGrid>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="catalog">Catálogo</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="sellers">Vendedores</TabsTrigger>
          <TabsTrigger value="governance">Governança</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <AdminFiltersBar
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder="Buscar por título do classificado"
            filters={[
              {
                label: "Status",
                value: "status",
                placeholder: "Todos os status",
                options: [
                  { label: "Ativo", value: ALERT_STATUS.ACTIVE },
                  { label: "Pendente", value: "pending" },
                  { label: "Inativo", value: "inactive" },
                  { label: "Vendido", value: "sold" },
                  { label: "Rejeitado", value: "rejected" },
                ],
              },
              {
                label: "Categoria",
                value: "category",
                placeholder: "Todas as categorias",
                options: categoryOptions,
              },
            ]}
            filterValues={{ status: statusFilter === "all" ? "" : statusFilter, category: categoryFilter === "all" ? "" : categoryFilter }}
            onFilterChange={(key, value) => {
              if (key === "status") {
                setStatusFilter(value || "all");
                setPage(1);
              }
              if (key === "category") {
                setCategoryFilter(value || "all");
                setPage(1);
              }
            }}
            onClear={() => {
              setSearch("");
              setStatusFilter("all");
              setCategoryFilter("all");
              setPage(1);
            }}
          />

          {classifiedsQuery.isError ? (
            <AdminErrorState
              title="Falha ao carregar catálogo de classificados"
              description="A leitura administrativa do catálogo não foi concluída nesta tentativa."
              onRetry={() => void classifiedsQuery.refetch()}
            />
          ) : (
            <AdminSectionCard
              title="Anúncios"
              description="Gestão do ciclo de vida de anúncios no backoffice."
              icon={Search}
            >
              <AdminDataState
                loading={classifiedsQuery.isLoading}
                isEmpty={!catalog?.data.length}
                emptyTitle="Nenhum classificado encontrado"
                emptyDescription="Ajuste os filtros para ampliar os resultados."
              >
                <AdminTable
                  footer={
                    <AdminPagination
                      currentPage={catalog?.page || 1}
                      totalPages={catalog?.totalPages || 1}
                      totalItems={catalog?.total || 0}
                      itemsPerPage={PAGE_SIZE}
                      onPageChange={setPage}
                    />
                  }
                >
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(catalog?.data || []).map((classified) => (
                      <TableRow key={classified.id}>
                        <TableCell className="font-medium">{classified.title}</TableCell>
                        <TableCell>{classified.category || "-"}</TableCell>
                        <TableCell>{toCurrency(classified.price)}</TableCell>
                        <TableCell>{classified.seller_name || "Sem nome"}</TableCell>
                        <TableCell>{statusBadge(classified.status || "inactive")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setSelectedClassified(classified)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={toggleActiveMutation.isPending}
                              onClick={() =>
                                toggleActiveMutation.mutate({
                                  id: classified.id,
                                  isActive: classified.status !== ALERT_STATUS.ACTIVE,
                                })
                              }
                            >
                              {classified.status === ALERT_STATUS.ACTIVE ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (confirm(`Excluir classificado "${classified.title}"?`)) {
                                  deleteMutation.mutate(classified.id);
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
                </AdminTable>
              </AdminDataState>
            </AdminSectionCard>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          {categoriesQuery.isError ? (
            <AdminErrorState
              title="Falha ao carregar cobertura de categorias"
              description="Não foi possível montar a matriz de taxonomia do domínio de classificados."
              onRetry={() => void categoriesQuery.refetch()}
            />
          ) : (
            <AdminSectionCard
              title="Taxonomia oficial"
              description="Cobertura de categorias, subcategorias e uso no catálogo real."
              icon={Tags}
            >
              <AdminDataState
                loading={categoriesQuery.isLoading}
                isEmpty={!categoryCoverage?.categories.length}
                emptyTitle="Sem categorias registradas"
              >
                <AdminTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Subcategorias</TableHead>
                      <TableHead>Anúncios</TableHead>
                      <TableHead>Pendentes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(categoryCoverage?.categories || []).map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          {category.name}
                          <p className="text-xs text-muted-foreground">/{category.slug}</p>
                        </TableCell>
                        <TableCell>
                          {category.isActive ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-600">Ativa</Badge>
                          ) : (
                            <Badge variant="secondary">Inativa</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {category.activeSubcategories}/{category.subcategories}
                        </TableCell>
                        <TableCell>{category.activeClassifieds}/{category.classifieds}</TableCell>
                        <TableCell>{category.pendingClassifieds}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </AdminTable>
              </AdminDataState>
              <p className="text-xs text-muted-foreground mt-3">
                Anúncios sem categoria vinculada (`category_id`): {categoryCoverage?.unclassifiedAds || 0}
              </p>
            </AdminSectionCard>
          )}
        </TabsContent>

        <TabsContent value="sellers" className="space-y-4">
          {sellersQuery.isError ? (
            <AdminErrorState
              title="Falha ao carregar cobertura de vendedores"
              description="Não foi possível consolidar o agregado administrativo por seller."
              onRetry={() => void sellersQuery.refetch()}
            />
          ) : (
            <AdminSectionCard
              title="Vendedores no catálogo"
              description="Visão consolidada de volume e status por seller."
              icon={Store}
            >
              <AdminDataState
                loading={sellersQuery.isLoading}
                isEmpty={!sellers?.sellers.length}
                emptyTitle="Nenhum vendedor com anúncios"
              >
                <AdminTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Ativos</TableHead>
                      <TableHead>Pendentes</TableHead>
                      <TableHead>Vendidos</TableHead>
                      <TableHead>Último anúncio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(sellers?.sellers || []).map((seller) => (
                      <TableRow key={seller.sellerId}>
                        <TableCell className="font-medium">
                          {seller.sellerName}
                          <p className="text-xs text-muted-foreground">{seller.whatsapp || seller.phone || "Sem contato"}</p>
                        </TableCell>
                        <TableCell>{seller.totalAds}</TableCell>
                        <TableCell>{seller.activeAds}</TableCell>
                        <TableCell>{seller.pendingAds}</TableCell>
                        <TableCell>{seller.soldAds}</TableCell>
                        <TableCell>{toDate(seller.lastAdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </AdminTable>
              </AdminDataState>
            </AdminSectionCard>
          )}
        </TabsContent>

        <TabsContent value="governance" className="space-y-4">
          {policyQuery.isError ? (
            <AdminErrorState
              title="Falha ao carregar governança de classificados"
              description="A leitura de políticas e histórico de URL não foi concluída."
              onRetry={() => {
                void policyQuery.refetch();
              }}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <AdminStatsCard
                  title="Sem category_id"
                  value={policy?.missingCategoryId || 0}
                  subtitle={`Sem subcategory_id: ${policy?.missingSubcategoryId || 0}`}
                  icon={Tags}
                  iconColor="text-orange-600"
                  loading={policyQuery.isLoading}
                />
                <AdminStatsCard
                  title="Sem URL canônica"
                  value={(policy?.missingPublicId || 0) + (policy?.missingSlug || 0)}
                  subtitle={`Sem public_id: ${policy?.missingPublicId || 0} · sem slug: ${policy?.missingSlug || 0}`}
                  icon={Link2}
                  iconColor="text-orange-600"
                  loading={policyQuery.isLoading}
                />
                <AdminStatsCard
                  title="Categoria sem taxonomia"
                  value={policy?.withUnmappedCategoryOnly || 0}
                  subtitle={`Sem location_id: ${policy?.missingLocationId || 0}`}
                  icon={Shield}
                  iconColor="text-orange-600"
                  loading={policyQuery.isLoading}
                />
              </div>

            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(selectedClassified)} onOpenChange={() => setSelectedClassified(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do classificado</DialogTitle>
            <DialogDescription>Snapshot administrativo do anúncio selecionado.</DialogDescription>
          </DialogHeader>
          {selectedClassified ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Título</p>
                <p className="font-medium">{selectedClassified.title}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Descrição</p>
                <p className="whitespace-pre-wrap">{selectedClassified.description || "Sem descrição"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground">Preço</p>
                  <p>{toCurrency(selectedClassified.price)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p>{selectedClassified.status || "inactive"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vendedor</p>
                  <p>{selectedClassified.seller_name || "Sem nome"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Contato</p>
                  <p>{selectedClassified.seller_whatsapp || selectedClassified.seller_phone || "Sem contato"}</p>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
