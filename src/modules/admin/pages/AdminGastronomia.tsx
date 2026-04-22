/**
 * AdminGastronomia - Gestao administrativa de gastronomia
 *
 * SSOT: usa AdminGastronomyService do core/admin.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminGastronomyService } from "@/core/admin";
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
  ChefHat,
  Eye,
  EyeOff,
  Link2,
  Menu as MenuIcon,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { CUISINE_TYPES } from "@/shared/services/gastronomyFacade";

const PAGE_SIZE = 20;

export default function AdminGastronomia() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profiles");
  const [search, setSearch] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data: stats } = useQuery({
    queryKey: ["admin-gastronomy-stats"],
    queryFn: () => adminGastronomyService.getStats(),
  });

  const { data: menuStats } = useQuery({
    queryKey: ["admin-menu-stats"],
    queryFn: () => adminGastronomyService.getMenuStats(),
  });

  const { data: profilesData, isLoading: loadingProfiles } = useQuery({
    queryKey: ["admin-gastronomy-profiles", page, search, cuisineFilter, priceFilter],
    queryFn: () =>
      adminGastronomyService.getAllProfiles({
        page,
        limit: PAGE_SIZE,
        search,
        cuisineType: cuisineFilter !== "all" ? cuisineFilter : undefined,
        priceRange: priceFilter !== "all" ? priceFilter : undefined,
      }),
  });

  const { data: menusData, isLoading: loadingMenus } = useQuery({
    queryKey: ["admin-gastronomy-menus", page, search],
    queryFn: () =>
      adminGastronomyService.getAllMenus({
        page,
        limit: PAGE_SIZE,
        search,
      }),
    enabled: activeTab === "menus",
  });

  const { data: itemsData, isLoading: loadingItems } = useQuery({
    queryKey: ["admin-gastronomy-items", page, search],
    queryFn: () =>
      adminGastronomyService.getAllMenuItems({
        page,
        limit: PAGE_SIZE,
        search,
      }),
    enabled: activeTab === "items",
  });

  const { data: integrityData, isLoading: loadingIntegrity } = useQuery({
    queryKey: ["admin-gastronomy-integrity"],
    queryFn: () => adminGastronomyService.getIntegritySummary(),
    enabled: activeTab === "analytics",
  });

  const { data: ownershipData, isLoading: loadingOwnership } = useQuery({
    queryKey: ["admin-gastronomy-promotion-ownership"],
    queryFn: () => adminGastronomyService.getPromotionOwnershipSummary(),
    enabled: activeTab === "analytics",
  });

  const toggleProfileMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminGastronomyService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gastronomy-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-gastronomy-stats"] });
      toast.success("Status atualizado com sucesso");
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const deleteProfileMutation = useMutation({
    mutationFn: (id: string) => adminGastronomyService.deleteProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gastronomy-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-gastronomy-stats"] });
      toast.success("Perfil deletado com sucesso");
    },
    onError: () => toast.error("Erro ao deletar perfil"),
  });

  const toggleItemMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      adminGastronomyService.toggleMenuItem(id, isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gastronomy-items"] });
      toast.success("Item atualizado com sucesso");
    },
    onError: () => toast.error("Erro ao atualizar item"),
  });

  const toggleMenuMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminGastronomyService.toggleMenu(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gastronomy-menus"] });
      toast.success("Menu atualizado com sucesso");
    },
    onError: () => toast.error("Erro ao atualizar menu"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display flex items-center gap-2">
          <ChefHat className="h-8 w-8" />
          Gestao de Gastronomia
        </h1>
        <p className="text-muted-foreground mt-1">
          Governanca de perfis, catalogo e integridade operacional do vertical.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Perfis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats?.active || 0} ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.withDelivery || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.total ? Math.round((stats.withDelivery / stats.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Menus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{menuStats?.totalMenus || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{menuStats?.totalCategories || 0} categorias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{menuStats?.totalItems || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Media: {menuStats?.avgItemsPerMenu?.toFixed(1) || 0} por menu
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profiles" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Perfis
          </TabsTrigger>
          <TabsTrigger value="menus" className="flex items-center gap-2">
            <MenuIcon className="h-4 w-4" />
            Menus
          </TabsTrigger>
          <TabsTrigger value="items" className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4" />
            Itens
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Integridade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
                  <SelectTrigger className="w-full md:w-[220px]">
                    <SelectValue placeholder="Tipo de cozinha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {CUISINE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger className="w-full md:w-[220px]">
                    <SelectValue placeholder="Faixa de preco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="$">$ - Economico</SelectItem>
                    <SelectItem value="$$">$$ - Moderado</SelectItem>
                    <SelectItem value="$$$">$$$ - Caro</SelectItem>
                    <SelectItem value="$$$$">$$$$ - Muito caro</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setCuisineFilter("all");
                    setPriceFilter("all");
                    setPage(1);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              {loadingProfiles ? (
                <div className="text-center py-8">Carregando...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Negocio</TableHead>
                        <TableHead>Cozinha</TableHead>
                        <TableHead>Preco</TableHead>
                        <TableHead>Delivery</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profilesData?.data?.map((profile: any) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">{profile.business?.name || "-"}</TableCell>
                          <TableCell>{profile.cuisine_type}</TableCell>
                          <TableCell>{profile.price_range}</TableCell>
                          <TableCell>
                            {profile.delivery_enabled ? (
                              <Badge variant="success">Sim</Badge>
                            ) : (
                              <Badge variant="secondary">Nao</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {profile.status === "active" ? (
                              <Badge variant="success">Ativo</Badge>
                            ) : (
                              <Badge variant="secondary">Inativo</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  toggleProfileMutation.mutate({
                                    id: profile.id,
                                    isActive: profile.status !== "active",
                                  })
                                }
                              >
                                {profile.status === "active" ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm("Tem certeza que deseja deletar este perfil?")) {
                                    deleteProfileMutation.mutate(profile.id);
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
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menus">
          <Card>
            <CardContent className="pt-6">
              {loadingMenus ? (
                <div className="text-center py-8">Carregando...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Menu</TableHead>
                      <TableHead>Negocio</TableHead>
                      <TableHead>Categorias</TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acao</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {menusData?.data?.map((menu: any) => (
                      <TableRow key={menu.id}>
                        <TableCell className="font-medium">{menu.name}</TableCell>
                        <TableCell>{menu.businessName || "-"}</TableCell>
                        <TableCell>{menu.categoryCount}</TableCell>
                        <TableCell>{menu.itemCount}</TableCell>
                        <TableCell>
                          {menu.is_active ? (
                            <Badge variant="success">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              toggleMenuMutation.mutate({
                                id: menu.id,
                                isActive: !menu.is_active,
                              })
                            }
                          >
                            {menu.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items">
          <Card>
            <CardContent className="pt-6">
              {loadingItems ? (
                <div className="text-center py-8">Carregando...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Menu</TableHead>
                      <TableHead>Negocio</TableHead>
                      <TableHead>Preco</TableHead>
                      <TableHead>Imagem</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acao</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemsData?.data?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.categoryName || "-"}</TableCell>
                        <TableCell>{item.menuName || "-"}</TableCell>
                        <TableCell>{item.businessName || "-"}</TableCell>
                        <TableCell>R$ {Number(item.basePrice || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          {item.image_url ? (
                            <Badge variant="success">Com imagem</Badge>
                          ) : (
                            <Badge variant="secondary">Sem imagem</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.is_available ? (
                            <Badge variant="success">Disponivel</Badge>
                          ) : (
                            <Badge variant="secondary">Indisponivel</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              toggleItemMutation.mutate({
                                id: item.id,
                                isAvailable: !item.is_available,
                              })
                            }
                          >
                            {item.is_available ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Integridade operacional do catalogo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {loadingIntegrity ? (
                  <p className="text-muted-foreground">Carregando...</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Perfis sem menu</span>
                      <Badge variant="outline">{integrityData?.profilesWithoutMenus || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Menus sem categorias</span>
                      <Badge variant="outline">{integrityData?.menusWithoutCategories || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Categorias sem itens</span>
                      <Badge variant="outline">{integrityData?.categoriesWithoutItems || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Itens sem preco valido</span>
                      <Badge variant="outline">{integrityData?.itemsWithoutPrice || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Itens sem imagem</span>
                      <Badge variant="outline">{integrityData?.itemsWithoutImage || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Perfis inativos com menu ativo</span>
                      <Badge variant="destructive">
                        {integrityData?.inactiveProfilesWithActiveMenus || 0}
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Ownership de promocoes (gastronomia)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {loadingOwnership ? (
                  <p className="text-muted-foreground">Carregando...</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Negocios gastronomicos</span>
                      <Badge variant="outline">{ownershipData?.gastronomyBusinesses || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Promotions ativas/total</span>
                      <Badge variant="outline">
                        {ownershipData?.promotionsActive || 0}/{ownershipData?.promotionsTotal || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Coupons ativos/total</span>
                      <Badge variant="outline">
                        {ownershipData?.couponsActive || 0}/{ownershipData?.couponsTotal || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Menu promotions ativas/total</span>
                      <Badge variant="outline">
                        {ownershipData?.menuPromotionsActive || 0}/{ownershipData?.menuPromotionsTotal || 0}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2">
                      Governanca de promocoes e cupons permanece em
                      <code className="mx-1">/admin/promocoes</code> e
                      <code className="mx-1">/admin/cupons</code>.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


