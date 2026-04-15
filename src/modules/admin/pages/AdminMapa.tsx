import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Layers3,
  Map,
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  Telescope,
} from "lucide-react";
import {
  adminMapGovernanceService,
  type AdminMapGovernanceHotspot,
  type AdminMapGovernanceIssue,
} from "@/core/admin";
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
  type FilterOption,
} from "@/modules/admin/components";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

const ITEMS_PER_PAGE = 10;

function issueBadge(issue: AdminMapGovernanceIssue) {
  switch (issue) {
    case "missing_coordinates":
      return <Badge variant="destructive">Sem coordenadas</Badge>;
    case "needs_refinement":
      return <Badge className="bg-orange-500 hover:bg-orange-500">Refinar coordenadas</Badge>;
    case "group_without_members":
      return <Badge variant="secondary">Grupo sem membros</Badge>;
    case "route_disabled":
      return <Badge variant="secondary">Rota desativada</Badge>;
    default:
      return <Badge variant="outline">Oculto do seletor</Badge>;
  }
}

function stateBadge(status: string) {
  if (status === "active") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Ativo</Badge>;
  }
  if (status === "inactive") {
    return <Badge variant="secondary">Inativo</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
}

function visibilityBadge(enabled: boolean, label: string) {
  return enabled ? (
    <Badge className="bg-sky-600 hover:bg-sky-600">{label}</Badge>
  ) : (
    <Badge variant="outline">{label}</Badge>
  );
}

function surfaceBadge(status: "official" | "attention") {
  return status === "official" ? (
    <Badge className="bg-emerald-600 hover:bg-emerald-600">Oficial</Badge>
  ) : (
    <Badge className="bg-orange-500 hover:bg-orange-500">Atencao</Badge>
  );
}

function providerBadge(status: "official" | "compatibility" | "attention") {
  if (status === "official") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Oficial</Badge>;
  }
  if (status === "compatibility") {
    return <Badge className="bg-orange-500 hover:bg-orange-500">Compatibilidade</Badge>;
  }
  return <Badge variant="destructive">Atencao</Badge>;
}

function matchesHotspotSearch(hotspot: AdminMapGovernanceHotspot, search: string) {
  if (!search.trim()) return true;
  const query = search.trim().toLowerCase();
  return [
    hotspot.name,
    hotspot.scope,
    hotspot.issueLabel,
    hotspot.geographicPath,
    hotspot.anchorCityName,
    hotspot.coordinatesSource,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
}

export default function AdminMapa() {
  const [search, setSearch] = useState("");
  const [issueFilter, setIssueFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [page, setPage] = useState(1);

  const snapshotQuery = useQuery({
    queryKey: ["admin-map-governance"],
    queryFn: () => adminMapGovernanceService.getSnapshot(),
  });

  const filters = useMemo<FilterOption[]>(
    () => [
      {
        label: "Problema",
        value: "issue",
        placeholder: "Todos os problemas",
        options: [
          { label: "Sem coordenadas", value: "missing_coordinates" },
          { label: "Refinar coordenadas", value: "needs_refinement" },
          { label: "Oculto do seletor", value: "selector_hidden" },
          { label: "Rota desativada", value: "route_disabled" },
          { label: "Grupo sem membros", value: "group_without_members" },
        ],
      },
      {
        label: "Escopo",
        value: "scope",
        placeholder: "Todos os escopos",
        options: [
          { label: "Estado", value: "state" },
          { label: "Cidade", value: "city" },
          { label: "Bairro", value: "district" },
          { label: "Grupo", value: "group" },
        ],
      },
    ],
    [],
  );

  const filteredHotspots = useMemo(() => {
    const hotspots = snapshotQuery.data?.hotspots ?? [];

    return hotspots.filter((hotspot) => {
      if (issueFilter && hotspot.issue !== issueFilter) return false;
      if (scopeFilter && hotspot.scope !== scopeFilter) return false;
      return matchesHotspotSearch(hotspot, search);
    });
  }, [issueFilter, scopeFilter, search, snapshotQuery.data?.hotspots]);

  const totalPages = Math.max(1, Math.ceil(filteredHotspots.length / ITEMS_PER_PAGE));
  const paginatedHotspots = filteredHotspots.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const snapshot = snapshotQuery.data;
  const stats = snapshot?.stats;
  const isRefreshing = snapshotQuery.isFetching;
  const retrySnapshot = () => {
    void snapshotQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Governanca do Mapa"
        description="Cobertura administrativa oficial do produto mapa, consolidando providers, camadas, territorios e hotspots operacionais."
        icon={Map}
        actions={
          <Button
            variant="outline"
            onClick={retrySnapshot}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        }
      />

      <AdminStatsGrid>
        <AdminStatsCard
          title="Locations mapeadas"
          value={
            snapshotQuery.isError
              ? "--"
              : stats
                ? `${stats.mappedLocations}/${stats.totalLocations}`
                : 0
          }
          subtitle={
            snapshotQuery.isError
              ? "Falha ao carregar coverage"
              : `${stats?.locationsNeedingRefinement || 0} com refinamento pendente`
          }
          icon={MapPin}
          loading={snapshotQuery.isLoading}
        />
        <AdminStatsCard
          title="Territorios visiveis"
          value={snapshotQuery.isError ? "--" : stats?.visibleTerritories || 0}
          subtitle={
            snapshotQuery.isError
              ? "Falha ao carregar territorios"
              : `${stats?.navigableTerritories || 0} com rota publica ativa`
          }
          icon={Navigation}
          iconColor="text-sky-600"
          loading={snapshotQuery.isLoading}
        />
        <AdminStatsCard
          title="Pontos turisticos"
          value={snapshotQuery.isError ? "--" : stats?.touristPointsMapped || 0}
          subtitle={
            snapshotQuery.isError
              ? "Falha ao carregar catalogo"
              : `${stats?.touristPointsInactive || 0} fora do runtime publico`
          }
          icon={Telescope}
          iconColor="text-emerald-600"
          loading={snapshotQuery.isLoading}
        />
        <AdminStatsCard
          title="Atencoes abertas"
          value={snapshotQuery.isError ? "--" : stats?.attentionItems || 0}
          subtitle={
            snapshotQuery.isError
              ? "Falha ao carregar hotspots"
              : `${stats?.totalGroups || 0} grupos territoriais em operacao`
          }
          icon={AlertTriangle}
          iconColor="text-orange-600"
          loading={snapshotQuery.isLoading}
        />
      </AdminStatsGrid>

      {snapshotQuery.isError ? (
        <AdminErrorState
          title="Falha ao carregar governance do mapa"
          description="O snapshot canonico do produto mapa nao foi retornado pelo agregado administrativo nesta tentativa."
          onRetry={retrySnapshot}
        />
      ) : (
        <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr),minmax(320px,1fr)]">
        <AdminSectionCard
          title="Cobertura territorial"
          description="Leitura consolidada de locations e grupos que suportam o produto mapa."
          icon={Route}
        >
          <AdminDataState
            loading={snapshotQuery.isLoading}
            isEmpty={!snapshotQuery.isLoading && !snapshot?.coverage.length}
            emptyTitle="Sem cobertura territorial consolidada"
            emptyDescription="Nao foi possivel consolidar a cobertura territorial do mapa."
          >
            <AdminTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Escopo</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Ativos</TableHead>
                  <TableHead>Mapeados</TableHead>
                  <TableHead>Seletor</TableHead>
                  <TableHead>URL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot?.coverage.map((item) => (
                  <TableRow key={item.scope}>
                    <TableCell className="font-medium">{item.scope}</TableCell>
                    <TableCell>{item.total}</TableCell>
                    <TableCell>{item.active}</TableCell>
                    <TableCell>{item.mapped ?? "-"}</TableCell>
                    <TableCell>{item.selectorVisible}</TableCell>
                    <TableCell>{item.navigable}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </AdminTable>
          </AdminDataState>
        </AdminSectionCard>

        <AdminSectionCard
          title="Superficies do produto"
          description="Rotas publicas atualmente acopladas ao dominio `map`."
          icon={Map}
        >
          <AdminDataState
            loading={snapshotQuery.isLoading}
            isEmpty={!snapshotQuery.isLoading && !(snapshot?.surfaces.length || 0)}
            emptyTitle="Sem superficies catalogadas"
            emptyDescription="Nenhuma superficie publica do mapa foi consolidada neste momento."
          >
            <div className="space-y-3">
              {(snapshot?.surfaces ?? []).map((surface) => (
                <div key={surface.route} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium">{surface.route}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {surface.owner}
                      </div>
                    </div>
                    {surfaceBadge(surface.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{surface.note}</p>
                </div>
              ))}
            </div>
          </AdminDataState>
        </AdminSectionCard>
      </div>

      <AdminFiltersBar
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Buscar hotspot por nome, path, escopo ou origem de coordenadas"
        filters={filters}
        filterValues={{ issue: issueFilter, scope: scopeFilter }}
        onFilterChange={(key, value) => {
          if (key === "issue") setIssueFilter(value);
          if (key === "scope") setScopeFilter(value);
          setPage(1);
        }}
        onClear={() => {
          setSearch("");
          setIssueFilter("");
          setScopeFilter("");
          setPage(1);
        }}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr),minmax(320px,1fr)]">
        <AdminSectionCard
          title="Hotspots operacionais"
          description="Pontos de atencao do mapa consolidados em uma fila administrativa unica."
          icon={AlertTriangle}
        >
          <AdminDataState
            loading={snapshotQuery.isLoading}
            isEmpty={!snapshotQuery.isLoading && !paginatedHotspots.length}
            emptyTitle="Nenhum hotspot encontrado"
            emptyDescription="Nenhum hotspot corresponde aos filtros atuais."
          >
            <AdminTable
              footer={
                <AdminPagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={filteredHotspots.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setPage}
                />
              }
            >
                <TableHeader>
                  <TableRow>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Problema</TableHead>
                    <TableHead>Visibilidade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedHotspots.map((hotspot) => (
                    <TableRow key={hotspot.id}>
                      <TableCell className="min-w-[260px]">
                        <div className="space-y-1">
                          <div className="font-medium">{hotspot.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {hotspot.scope}
                            {hotspot.anchorCityName ? ` - ancora em ${hotspot.anchorCityName}` : ""}
                            {hotspot.memberCount != null
                              ? ` - ${hotspot.memberCount} membro(s)`
                              : ""}
                          </div>
                          <div className="text-xs text-muted-foreground break-all">
                            {hotspot.geographicPath ||
                              hotspot.coordinatesSource ||
                              "Sem path geografico"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[180px]">
                        <div className="flex gap-2 flex-wrap">
                          {issueBadge(hotspot.issue)}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[220px]">
                        <div className="flex gap-2 flex-wrap">
                          {visibilityBadge(hotspot.selectorVisible, "Seletor")}
                          {visibilityBadge(hotspot.navigable, "URL")}
                          {hotspot.hasCoordinates === null
                            ? null
                            : visibilityBadge(hotspot.hasCoordinates, "Coords")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          {stateBadge(hotspot.status)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </AdminTable>
          </AdminDataState>
        </AdminSectionCard>

        <div className="space-y-4">
          <AdminSectionCard title="Providers e contratos" icon={Layers3}>
            <AdminDataState
              loading={snapshotQuery.isLoading}
              isEmpty={!snapshotQuery.isLoading && !(snapshot?.providers.length || 0)}
              emptyTitle="Sem providers consolidados"
              emptyDescription="Nao ha providers registrados para leitura administrativa."
            >
              <div className="space-y-3">
                {(snapshot?.providers ?? []).map((provider) => (
                  <div key={provider.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{provider.label}</div>
                        <div className="text-xs text-muted-foreground">{provider.owner}</div>
                      </div>
                      {providerBadge(provider.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{provider.detail}</p>
                  </div>
                ))}
              </div>
            </AdminDataState>
          </AdminSectionCard>

          <AdminSectionCard
            title="Camadas runtime"
            description="SSOT das camadas operacionais expostas hoje no mapa."
          >
            <AdminDataState
              loading={snapshotQuery.isLoading}
              isEmpty={!snapshotQuery.isLoading && !(snapshot?.layers.length || 0)}
              emptyTitle="Sem camadas runtime"
              emptyDescription="Nenhuma camada operacional do mapa foi consolidada."
            >
              <div className="space-y-3">
                {(snapshot?.layers ?? []).map((layer) => (
                  <div key={layer.key} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{layer.label}</div>
                        <div className="text-xs text-muted-foreground">{layer.source}</div>
                      </div>
                      {providerBadge(layer.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {layer.note} Rota principal: {layer.route}.
                    </p>
                  </div>
                ))}
              </div>
            </AdminDataState>
          </AdminSectionCard>

          <AdminSectionCard title="Pontos turisticos por categoria">
            <AdminDataState
              loading={snapshotQuery.isLoading}
              isEmpty={!snapshotQuery.isLoading && !(snapshot?.touristPointCategories.length || 0)}
              emptyTitle="Sem categorias consolidadas"
              emptyDescription="Nao ha categorias de pontos turisticos suficientes para leitura administrativa."
            >
              <div className="space-y-3">
                {(snapshot?.touristPointCategories ?? []).map((category) => (
                  <div key={category.category} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{category.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {category.mapped}/{category.total} com coordenadas validas
                        </div>
                      </div>
                      <Badge variant="outline">{category.total}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </AdminDataState>
          </AdminSectionCard>

          <AdminSectionCard title="Leitura objetiva">
            <AdminDataState
              isEmpty={!snapshot?.notes.length}
              emptyTitle="Sem observacoes adicionais"
              emptyDescription="Nenhuma nota operacional adicional foi registrada nesta leitura."
            >
              <div className="space-y-2 text-sm text-muted-foreground">
                {snapshot?.notes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            </AdminDataState>
          </AdminSectionCard>
        </div>
      </div>
        </>
      )}
    </div>
  );
}


