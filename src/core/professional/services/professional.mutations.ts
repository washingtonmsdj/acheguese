/**
 * 📝 PROFESSIONAL MUTATIONS - SSOT v2.0
 *
 * Operações de escrita para profissionais.
 * Todas as mutations são pure functions que recebem parâmetros e retornam dados atualizados.
 *
 * @version 2.0.0 - Refatoração SSOT
 */

import { supabase } from "@/integrations/supabase";
import { PublicViewTrackingService } from "@/core/analytics/services/PublicViewTrackingService";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import { ReviewsService } from "@/core/reviews";
import type {
  Professional,
  CreateProfessionalInput,
  UpdateProfessionalInput,
  ProfessionalJob,
  CreateProfessionalJobInput,
} from "../types";

// Re-exportar tipos para conveniência
export type { Professional, CreateProfessionalInput, UpdateProfessionalInput };

interface QueryError {
  message?: string | null;
}

interface QueryArrayResult<TRow> {
  data: TRow[] | null;
  error: QueryError | null;
}

interface QuerySingleResult<TRow> {
  data: TRow | null;
  error: QueryError | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryArrayResult<TRow>> {
  select: (columns?: string) => QueryBuilder<TRow>;
  insert: (values: unknown | unknown[]) => QueryBuilder<TRow>;
  update: (values: unknown) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  single: () => Promise<QuerySingleResult<TRow>>;
}

interface ProfessionalMutationsDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}

interface ProfessionalJobRow {
  id: string;
  professional_id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  price: number | null;
  duration_hours: number | null;
  is_active: boolean | null;
  created_at: string;
}

type CreateProfessionalJobInputLike = CreateProfessionalJobInput & {
  title?: string;
  nome?: string;
  description?: string;
  descricao?: string;
  price?: number | null;
  preco?: number | null;
  price_type?: string;
  tipo_preco?: string;
  category?: string;
  categoria?: string;
  duration_hours?: number | null;
  duracao_horas?: number | null;
};

const professionalMutationsDb = supabase as unknown as ProfessionalMutationsDbClient;

function mapProfessionalJobRow(row: ProfessionalJobRow): ProfessionalJob {
  return {
    id: row.id,
    profile_id: row.professional_id,
    title: row.title ?? "Servico",
    description: row.description ?? "",
    category: row.category ?? "geral",
    price: row.price ?? undefined,
    duration: row.duration_hours != null ? String(row.duration_hours) : undefined,
    images: [],
    is_featured: false,
    is_active: row.is_active ?? true,
    created_at: row.created_at,
  };
}

function normalizeCreateJobInput(jobData: CreateProfessionalJobInput): {
  title: string;
  description: string;
  price: number | null;
  price_type: string;
  category: string;
  duration_hours: number | null;
} {
  const legacyJobData = jobData as CreateProfessionalJobInputLike;

  return {
    title: legacyJobData.title ?? legacyJobData.nome ?? "Servico",
    description: legacyJobData.description ?? legacyJobData.descricao ?? "",
    price: legacyJobData.price ?? legacyJobData.preco ?? null,
    price_type: legacyJobData.price_type ?? legacyJobData.tipo_preco ?? "fixed",
    category: legacyJobData.category ?? legacyJobData.categoria ?? "geral",
    duration_hours: legacyJobData.duration_hours ?? legacyJobData.duracao_horas ?? null,
  };
}

// ============================================================================
// 🛍️ JOBS MUTATIONS - Serviços/Trabalhos
// ============================================================================

/**
 * Criar serviço para profissional
 */
export async function createJob(
  professionalId: string,
  jobData: CreateProfessionalJobInput,
): Promise<ProfessionalJob> {
  try {
    const normalizedJobData = normalizeCreateJobInput(jobData);

    const { data, error } = await professionalMutationsDb
      .from<ProfessionalJobRow>("professional_jobs")
      .insert({
        professional_id: professionalId,
        ...normalizedJobData,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    logger.info("[professional.mutations] Job created:", data.id);
    return mapProfessionalJobRow(data);
  } catch (error) {
    logger.error("[professional.mutations] Error creating job:", error);
    trackError(error as Error, {
      component: "professional.mutations",
      action: "createJob",
      metadata: { professionalId },
    });
    throw error;
  }
}

// ============================================================================
// ⚙️ ADMIN MUTATIONS - Operações administrativas
// ============================================================================

/**
 * Atualizar status de profissional (admin)
 */
export async function updateProfessionalStatus(
  id: string,
  status: string,
): Promise<void> {
  try {
    const isActive = status === "active";

    const { error } = await professionalMutationsDb
      .from<Professional>("professional_data")
      .update({
        is_accepting_clients: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    logger.info("[professional.mutations] Professional status updated:", { id, status });
  } catch (error) {
    logger.error("[professional.mutations] Error updating status:", error);
    trackError(error as Error, {
      component: "professional.mutations",
      action: "updateProfessionalStatus",
      metadata: { id, status },
    });
    throw error;
  }
}

/**
 * Deletar avaliação de profissional (admin)
 */
export async function deleteProfessionalReview(reviewId: string): Promise<void> {
  try {
    await ReviewsService.removeReview(reviewId, "professional");
    logger.info("[professional.mutations] Review deleted:", reviewId);
  } catch (error) {
    logger.error("[professional.mutations] Error deleting review:", error);
    trackError(error as Error, {
      component: "professional.mutations",
      action: "deleteProfessionalReview",
      metadata: { reviewId },
    });
    throw error;
  }
}

/**
 * Incrementar visualizações do profissional
 */
export async function incrementViews(professionalId: string): Promise<void> {
  try {
    await PublicViewTrackingService.track("professional", professionalId);
    logger.info("[professional.mutations] Views incremented:", professionalId);
  } catch (error) {
    // Silently fail - views are not critical
    logger.warn("[professional.mutations] Failed to increment views:", error);
  }
}
