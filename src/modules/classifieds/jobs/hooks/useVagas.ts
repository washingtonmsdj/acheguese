/**
 * useVagas — Hook de lógica de negócio para vagas
 *
 * ✅ SSOT compliant - usa VagasService (banco de dados)
 * ✅ Centraliza filtros e lógica fora da UI
 * ✅ Suporte a território ativo (location e group)
 * ✅ Cache via React Query
 * 
 * Migrado de MOCK_VAGAS para banco de dados
 */

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { VagasService } from "../services/VagasService";
import type { Vaga, VagaContrato, VagaModalidade, VagaNivel } from "../types/vagas.types";
import { VAGA_CATEGORIAS } from "../types/vagas.types";
import { useModuleTerritoryFilter } from "@/core/location/hooks/useModuleTerritoryFilter";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

interface UseVagasParams {
  resolved?: ResolvedTerritory;
  activeMemberIds?: string[];
}

export function useVagas(params: UseVagasParams = {}) {
  const { resolved } = params;
  
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<VagaContrato | null>(null);
  const [selectedModality, setSelectedModality] = useState<VagaModalidade | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<VagaNivel | null>(null);

  const moduleTerritory = useModuleTerritoryFilter({ routeResolved: resolved });
  const locationId = moduleTerritory.resolvedLocationIds[0] ?? "";
  const locationIds = moduleTerritory.resolvedLocationIds;

  const { data, isLoading: isVagasLoading, isError } = useQuery({
    queryKey: ['vagas', locationIds],
    queryFn: () =>
      VagasService.getVagas({
        locationId,
        locationIds,
        limit: 200,
      }),
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: locationIds.length > 0,
  });

  const allVagas = useMemo(() => data?.vagas ?? [], [data?.vagas]);

  // Filtros client-side (busca textual e categorias)
  const filteredVagas = useMemo(() => {
    return allVagas.filter((vaga) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          vaga.titulo.toLowerCase().includes(q) ||
          vaga.empresaNome.toLowerCase().includes(q) ||
          vaga.tags.some(t => t.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (selectedContract && vaga.contrato !== selectedContract) return false;
      if (selectedModality && vaga.modalidade !== selectedModality) return false;
      if (selectedLevel && vaga.nivel !== selectedLevel) return false;
      if (selectedCategory && selectedCategory !== "todos") {
        const cat = VAGA_CATEGORIAS.find(c => c.id === selectedCategory);
        if (cat) {
          const catLabel = cat.label.toLowerCase();
          const match =
            vaga.tags.some(t => t.toLowerCase().includes(catLabel)) ||
            vaga.titulo.toLowerCase().includes(catLabel) ||
            vaga.descricao.toLowerCase().includes(catLabel);
          if (!match) return false;
        }
      }
      return true;
    });
  }, [allVagas, search, selectedCategory, selectedContract, selectedModality, selectedLevel]);

  const urgentVagas = useMemo(() => allVagas.filter(v => v.urgencia === "urgente"), [allVagas]);
  const recentVagas = useMemo(() => [...allVagas].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4), [allVagas]);
  const featuredVagas = useMemo(() => allVagas.filter(v => v.highlightType !== "none"), [allVagas]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setSelectedCategory(null);
    setSelectedContract(null);
    setSelectedModality(null);
    setSelectedLevel(null);
  }, []);

  const hasActiveFilters = Boolean(search || selectedCategory || selectedContract || selectedModality || selectedLevel);

  const getRelatedVagas = useCallback((vaga: Vaga, limit = 3): Vaga[] => {
    return allVagas
      .filter(v => v.id !== vaga.id && v.tags.some(t => vaga.tags.includes(t)))
      .slice(0, limit);
  }, [allVagas]);

  const getVagaById = useCallback((id: string): Vaga | undefined => {
    return allVagas.find(v => v.id === id);
  }, [allVagas]);

  return {
    search, setSearch,
    selectedCategory, setSelectedCategory,
    selectedContract, setSelectedContract,
    selectedModality, setSelectedModality,
    selectedLevel, setSelectedLevel,
    filteredVagas,
    urgentVagas,
    recentVagas,
    featuredVagas,
    hasActiveFilters,
    clearFilters,
    getRelatedVagas,
    getVagaById,
    isLoading: moduleTerritory.isLoading || isVagasLoading,
    isError,
  };
}
