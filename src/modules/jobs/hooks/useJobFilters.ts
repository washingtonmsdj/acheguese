import { useState, useMemo, useCallback } from "react";
import { jobService } from "../services";
import type { JobContractType, JobModality } from "../types/job.types";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

interface UseJobFiltersParams {
  routeResolved?: ResolvedTerritory;
  activeMemberIds?: string[];
}

export function useJobFilters(params: UseJobFiltersParams = {}) {
  const { routeResolved, activeMemberIds } = params;

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<JobContractType | null>(null);
  const [selectedModality, setSelectedModality] = useState<JobModality | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const territoryJobs = useMemo(() => {
    return jobService.getTerritoryJobs({
      routeResolved,
      activeMemberIds,
    });
  }, [routeResolved, activeMemberIds]);

  const filteredJobs = useMemo(() => {
    return jobService.filterJobs(territoryJobs, {
      search,
      selectedCategory,
      selectedContract,
      selectedModality,
    });
  }, [territoryJobs, search, selectedCategory, selectedContract, selectedModality]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setSelectedCategory(null);
    setSelectedContract(null);
    setSelectedModality(null);
  }, []);

  const hasActiveFilters = Boolean(
    search || selectedCategory || selectedContract || selectedModality,
  );

  const hasTerritory = Boolean(routeResolved);

  return {
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    selectedContract,
    setSelectedContract,
    selectedModality,
    setSelectedModality,
    showFilters,
    setShowFilters,
    expandedJob,
    setExpandedJob,
    filteredJobs,
    hasActiveFilters,
    hasTerritory,
    clearFilters,
    isLoading: false,
  };
}
