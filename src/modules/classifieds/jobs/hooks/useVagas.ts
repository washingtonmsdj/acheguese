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
import { useTerritoryFilter } from "@/core/location";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

interface UseVagasParams {
  resolved?: ResolvedTerritory;
  activeMemberIds?: string[];
}

export function useVagas(params: UseVagasParams = {}) {
  const { resolved, activeMemberIds } = params;
  
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<VagaContrato | null>(null);
  const [selectedModality, setSelectedModality] = useState<VagaModalidade | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<VagaNivel | null>(null);

  // ✅ SSOT: Filtro territorial canônico — suporta location e group
  const territoryFilter = useTerritoryFilter(resolved, activeMemberIds);

  // ✅ SSOT: Busca vagas do banco de dados
  const { data: allVagas = [], isLoading, isError } = useQuery({
    queryKey: ['vagas', territoryFilter],
    queryFn: () => VagasService.getVagas({ territoryFilter }),
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: true,
  });

  // Filtros client-side (busca textual e categorias)
  const filteredVagas = useMemo(() => {
    return allVagas.filter((vaga) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          vaga.titulo.toLowerCase().includes(q) ||
          vaga.empresa.toLowerCase().includes(q) ||
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
  const featuredVagas = useMemo(() => allVagas.filter(v => v.destaque), [allVagas]);

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
    isLoading,
    isError,
  };
}
