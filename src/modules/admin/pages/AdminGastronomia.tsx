/**
 * AdminGastronomia - Gestão administrativa de gastronomia
 * 
 * SSOT: Usa adminGastronomyService
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Search,
  ChefHat,
  Menu as MenuIcon,
  UtensilsCrossed,
  TrendingUp,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { CUISINE_TYPES } from "@/core/gastronomy";

export default function AdminGastronomia() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profiles");
  const [search, setSearch] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState<string>("");
  const [priceFilter, setPriceFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ["admin-gastronomy-stats"],
    queryFn: () => adminGastronomyService.getStats(),
  });

  const { data: menuStats } = useQuery({
    queryKey: ["admin-menu-stats"],
    queryFn: () => adminGastronomyService.getMenuStats(),
  });

  // Buscar perfis
  const { data: profilesData, isLoading: loadingProfiles } = useQuery({
    queryKey: ["admin-gastronomy-profiles", page, search, cuisineFilter, priceFilter],
    queryFn: () =>
      adminGastronomyService.getAllProfiles({
        page,
        limit: 20,
        search,
        cuisineType: cuisineFilter || undefined,
        priceRange: priceFilter || undefined,
      }),
  });

  // Buscar menus
  const { data: menusData, isLoading: loadingMenus } = useQuery({
    queryKey: ["admin-gastronomy-menus", page, search],
    queryFn: () =>
      adminGastronomyService.getAllMenus({
        page,
        limit: 20,
        search,
      }),
    enabled: activeTab === "menus",
  });

  // Buscar itens
  const { data: itemsData, isLoading: loadingItems } = useQuery({
    queryKey: ["admin-gastronomy-items", page, search],
    queryFn: () =>
      adminGastronomyService.getAllMenuItems({
        page,
        limit: 20,
        search,
      }),
    enabled: activeTab === "items",
  });

  // Mutations
  const toggleProfileMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminGastronomyService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gastronomy-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-gastronomy-stats"] });
      toast.success("Status atualizado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: (id: string) => adminGastronomyService.deleteProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gastronomy-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-gastronomy-stats"] });
      toast.success("Perfil deletado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao deletar perfil");
    },
  });

  const toggleItemMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      adminGastronomyService.toggleMenuItem(id, isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gastronomy-items"] });
      toast.success("Item atualizado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao atualizar item");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display flex items-center gap-2">
          <ChefHat className="h-8 w-8" />
          Gestão de Gastronomia
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie perfis gastronômicos, menus e itens
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Perfis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.active || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Com Delivery
            </CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Menus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{menuStats?.totalMenus || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {menuStats?.totalCategories || 0} categorias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Itens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{menuStats?.totalItems || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Média: {menuStats?.avgItemsPerMenu?.toFixed(1) || 0} por menu
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
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
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Perfis Tab */}
        <TabsContent value="profiles" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Tipo de cozinha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {CUISINE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Faixa de preço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="$">$ - Econômico</SelectItem>
                    <SelectItem value="$$">$$ - Moderado</SelectItem>
                    <SelectItem value="$$$">$$$ - Caro</SelectItem>
                    <SelectItem value="$$$$">$$$$ - Muito Caro</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setCuisineFilter("");
                    setPriceFilter("");
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Perfis */}
          <Card>
            <CardContent className="pt-6">
              {loadingProfiles ? (
                <div className="text-center py-8">Carregando...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Tipo de Cozinha</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Delivery</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profilesData?.data?.map((profile: any) => (
                        <TableRow key={profile.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {profile.business?.logo_url && (
                                <img
                                  src={profile.business.logo_url}
                                  alt={profile.business.name}
                                  className="h-8 w-8 rounded object-cover"
                                />
                              )}
                              <span className="font-medium">{profile.business?.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{profile.cuisine_type}</TableCell>
                          <TableCell>{profile.price_range}</TableCell>
                          <TableCell>
                            {profile.delivery_available ? (
                              <Badge variant="success">Sim</Badge>
                            ) : (
                              <Badge variant="secondary">Não</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {profile.is_active ? (
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
                                    isActive: !profile.is_active,
                                  })
                                }
                              >
                                {profile.is_active ? (
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

                  {/* Paginação */}
                  {profilesData && profilesData.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Página {profilesData.page} de {profilesData.totalPages}
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
                          disabled={page === profilesData.totalPages}
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

        {/* Menus Tab */}
        <TabsContent value="menus">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Gestão de menus em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Gestão de itens em desenvolvimento...</p>
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
