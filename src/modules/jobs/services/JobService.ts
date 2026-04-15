// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/shared/utils/logger";
import { MOCK_JOBS } from "../data/mock-jobs";
import { JOB_CATEGORIES } from "../types/job.types";
import type { Job, JobContractType, JobModality } from "../types/job.types";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

export interface NeighborhoodWithJobCount {
  location_id: string;
  location_name: string;
  location_slug: string;
  count: number;
}

export interface JobFilterInput {
  search?: string;
  selectedCategory?: string | null;
  selectedContract?: JobContractType | null;
  selectedModality?: JobModality | null;
}

interface TerritoryJobInput {
  routeResolved?: ResolvedTerritory;
  activeMemberIds?: string[];
}

function isMissingJobsTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return code === "42P01" || code === "PGRST204" || code === "PGRST116";
}

class JobServiceClass {
  /**
   * Canonical source of listing jobs for the jobs module.
   * Current implementation uses local mock data while DB schema is not finalized.
   */
  getTerritoryJobs(_input: TerritoryJobInput = {}): Job[] {
    return MOCK_JOBS.filter((job) => job.status === "ativa");
  }

  /**
   * Canonical business rules for jobs filters.
   */
  filterJobs(jobs: Job[], filters: JobFilterInput): Job[] {
    const {
      search = "",
      selectedCategory = null,
      selectedContract = null,
      selectedModality = null,
    } = filters;

    return jobs.filter((job) => {
      if (job.status !== "ativa") return false;

      if (search) {
        const query = search.toLowerCase();
        const match =
          job.titulo.toLowerCase().includes(query) ||
          job.empresa.toLowerCase().includes(query) ||
          job.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          (job.bairro && job.bairro.toLowerCase().includes(query));

        if (!match) return false;
      }

      if (selectedContract && job.contrato !== selectedContract) {
        return false;
      }

      if (selectedModality && job.modalidade !== selectedModality) {
        return false;
      }

      if (selectedCategory) {
        const category = JOB_CATEGORIES.find((item) => item.id === selectedCategory);
        if (category) {
          const label = category.label.toLowerCase();
          const matchCategory =
            job.tags.some((tag) => tag.toLowerCase().includes(label)) ||
            job.titulo.toLowerCase().includes(label) ||
            job.descricao.toLowerCase().includes(label);

          if (!matchCategory) return false;
        }
      }

      return true;
    });
  }

  /**
   * Canonical source for neighborhoods with active jobs.
   * If jobs table is not present yet, returns an empty list to keep runtime stable.
   */
  async getNeighborhoodsWithJobs(cityId: string): Promise<NeighborhoodWithJobCount[]> {
    const { data, error } = await supabase
      .from("jobs")
      .select("location_id, locations!inner(id, name, slug, parent_id)")
      .eq("is_active", true)
      .eq("status", "active")
      .eq("locations.parent_id", cityId);

    if (error) {
      if (isMissingJobsTableError(error)) {
        return [];
      }
      logger.error("Error fetching neighborhoods with jobs", error as Error, { cityId });
      throw error;
    }

    if (!data || data.length === 0) return [];

    const grouped = new Map<string, { name: string; slug: string; count: number }>();

    data.forEach((row) => {
      const location = row.locations as any;
      if (!location) return;

      const current = grouped.get(location.id);
      if (current) {
        current.count += 1;
        return;
      }

      grouped.set(location.id, {
        name: location.name,
        slug: location.slug,
        count: 1,
      });
    });

    return Array.from(grouped.entries())
      .map(([id, info]) => ({
        location_id: id,
        location_name: info.name,
        location_slug: info.slug,
        count: info.count,
      }))
      .sort((a, b) => b.count - a.count);
  }
}

export const jobService = new JobServiceClass();

