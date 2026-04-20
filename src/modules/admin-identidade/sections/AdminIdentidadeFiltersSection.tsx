/**
 * AdminIdentidadeFiltersSection Component
 * 
 * Barra de filtros
 */

import { useMemo } from "react";
import { AdminFiltersBar, type FilterOption } from "@/core/admin/components";
import type { AdminIdentidadeFiltersSectionProps } from "./types";

export function AdminIdentidadeFiltersSection({
  search,
  profileType,
  visibility,
  onSearchChange,
  onProfileTypeChange,
  onVisibilityChange,
  onClear,
}: AdminIdentidadeFiltersSectionProps) {
  const filters = useMemo<FilterOption[]>(
    () => [
      {
        label: "Tipo",
        value: "profileType",
        placeholder: "Todos os tipos",
        options: [
          { label: "Pessoal", value: "personal" },
          { label: "Empresa", value: "business" },
          { label: "Profissional", value: "professional" },
          { label: "Motorista", value: "driver" },
        ],
      },
      {
        label: "Visibilidade",
        value: "visibility",
        placeholder: "Todos os perfis",
        options: [
          { label: "Publicos", value: "public" },
          { label: "Privados", value: "private" },
        ],
      },
    ],
    [],
  );

  return (
    <AdminFiltersBar
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar por nome, username ou user_id"
      filters={filters}
      filterValues={{
        profileType,
        visibility: visibility === "all" ? "" : visibility,
      }}
      onFilterChange={(key, value) => {
        if (key === "profileType") {
          onProfileTypeChange(value);
        }
        if (key === "visibility") {
          onVisibilityChange(value || "all");
        }
      }}
      onClear={onClear}
    />
  );
}
