/**
 * AdminIdentidadePage (REFATORADO)
 * 
 * Página de Governança de Identidade
 * 
 * REFATORAÇÃO: 882 linhas → ~150 linhas (orquestração limpa)
 * SSOT: Todas as sections e componentes tipados
 * Sem gambiarras: Código profissional e modular
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminProfileGovernanceService } from "@/core/admin";
import { AdminErrorState } from "@/core/admin/components";
import { AdminIdentidadeLayout } from "./AdminIdentidadeLayout";
import {
  AdminIdentidadeHeaderSection,
  AdminIdentidadeStatsSection,
  AdminIdentidadeFiltersSection,
  AdminIdentidadeTableSection,
  AdminIdentidadeDetailDialog,
} from "../sections";

export default function AdminIdentidadePage() {
  // ============================================
  // State Management
  // ============================================
  const [search, setSearch] = useState("");
  const [profileType, setProfileType] = useState("");
  const [visibility, setVisibility] = useState<"all" | "public" | "private">("all");
  const [page, setPage] = useState(1);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // ============================================
  // Data Fetching
  // ============================================
  const statsQuery = useQuery({
    queryKey: ["admin-profile-identity-stats"],
    queryFn: () => adminProfileGovernanceService.getStats(),
  });

  const profilesQuery = useQuery({
    queryKey: ["admin-profile-identity-list", page, search, profileType, visibility],
    queryFn: () =>
      adminProfileGovernanceService.getProfiles({
        page,
        limit: 20,
        search: search || undefined,
        profileType: profileType || undefined,
        visibility,
      }),
  });

  const detailQuery = useQuery({
    queryKey: ["admin-profile-identity-detail", selectedProfileId],
    queryFn: () => adminProfileGovernanceService.getProfileDetail(selectedProfileId!),
    enabled: Boolean(selectedProfileId),
  });

  // ============================================
  // Computed Values
  // ============================================
  const pageData = profilesQuery.data;
  const isRefreshing =
    statsQuery.isFetching || profilesQuery.isFetching || detailQuery.isFetching;

  // ============================================
  // Event Handlers
  // ============================================
  const handleRefreshAll = () => {
    void statsQuery.refetch();
    void profilesQuery.refetch();
    if (selectedProfileId) {
      void detailQuery.refetch();
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleProfileTypeChange = (value: string) => {
    setProfileType(value);
    setPage(1);
  };

  const handleVisibilityChange = (value: string) => {
    setVisibility((value || "all") as "all" | "public" | "private");
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setProfileType("");
    setVisibility("all");
    setPage(1);
  };

  const handleSelectProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
  };

  const handleCloseDetail = () => {
    setSelectedProfileId(null);
  };

  // ============================================
  // Main Render
  // ============================================
  return (
    <AdminIdentidadeLayout>
      {/* Header */}
      <AdminIdentidadeHeaderSection
        isRefreshing={isRefreshing}
        onRefresh={handleRefreshAll}
      />

      {/* Stats */}
      <AdminIdentidadeStatsSection
        stats={statsQuery.data}
        loading={statsQuery.isLoading}
        error={statsQuery.isError}
      />

      {/* Stats Error */}
      {statsQuery.isError && (
        <AdminErrorState
          title="Falha ao carregar estatisticas de identidade"
          description="O agregado canonico de `profile` nao retornou o snapshot administrativo nesta tentativa."
          onRetry={() => {
            void statsQuery.refetch();
          }}
        />
      )}

      {/* Filters */}
      <AdminIdentidadeFiltersSection
        search={search}
        profileType={profileType}
        visibility={visibility}
        onSearchChange={handleSearchChange}
        onProfileTypeChange={handleProfileTypeChange}
        onVisibilityChange={handleVisibilityChange}
        onClear={handleClearFilters}
      />

      {/* Table */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr),minmax(320px,1fr)]">
        <AdminIdentidadeTableSection
          profiles={pageData?.data || []}
          loading={profilesQuery.isLoading}
          error={profilesQuery.isError}
          page={page}
          totalPages={pageData?.totalPages || 1}
          totalItems={pageData?.total || 0}
          onPageChange={setPage}
          onSelectProfile={handleSelectProfile}
          onRetry={() => {
            void profilesQuery.refetch();
          }}
        />
      </div>

      {/* Detail Dialog */}
      <AdminIdentidadeDetailDialog
        open={Boolean(selectedProfileId)}
        profileId={selectedProfileId}
        detail={detailQuery.data}
        loading={detailQuery.isLoading}
        error={detailQuery.isError}
        onOpenChange={handleCloseDetail}
        onRetry={() => {
          void detailQuery.refetch();
        }}
      />
    </AdminIdentidadeLayout>
  );
}
