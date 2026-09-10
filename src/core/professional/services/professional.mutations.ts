/**
 * 📝 PROFESSIONAL MUTATIONS - SSOT v2.0
 *
 * Operações de escrita para profissionais.
 * Mutations de domínio permanecem aqui; comandos administrativos são enviados
 * ao broker autenticado e autorizados no backend.
 *
 * @version 2.1.0 - Admin availability brokered
 */

import {
  resolveSupabaseFunctionErrorMessage,
  supabase,
} from "@/integrations/supabase";
import { PublicViewTrackingService } from "@/core/analytics/services/PublicViewTrackingService";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import { ReviewsService } from "@/core/reviews";
import type {
  Professional,
  ProfessionalStatus,
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

type AdminAvailabilityStatus = Extract<ProfessionalStatus, "active" | "inactive">;

const professionalMutationsDb = supabase as unknown as ProfessionalMutationsDbClient;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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

/** Criar serviço para profissional. */
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
      throw new Error(error.message ?? "Falha ao criar serviço");
    }
    if (!data) {
      throw new Error("Serviço criado sem retorno do banco");
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
// ⚙️ ADMIN COMMAND ADAPTER
// ============================================================================

/**
 * Altera disponibilidade pelo broker administrativo. O browser não escreve
 * `professional_data` diretamente; autorização efetiva ocorre na Edge Function.
 */
export async function updateProfessionalStatus(
  id: string,
  status: AdminAvailabilityStatus,
): Promise<void> {
  try {
    const isAcceptingClients = status === "active";
    const { data, error } = await supabase.functions.invoke("admin-professional-rpc", {
      body: {
        action: "setAvailability",
        params: {
          professionalId: id,
          isAcceptingClients,
        },
      },
    });

    if (error) {
      const brokerMessage =
        (await resolveSupabaseFunctionErrorMessage(error)) ??
        error.message ??
        "Falha ao atualizar disponibilidade do profissional";
      throw new Error(brokerMessage);
    }

    if (!isRecord(data)) {
      throw new Error("Resposta invalida ao atualizar disponibilidade do profissional");
    }
    if (typeof data.error === "string") {
      throw new Error(data.error);
    }

    const updated = isRecord(data.data) ? data.data : null;
    if (
      !updated ||
      updated.id !== id ||
      updated.is_accepting_clients !== isAcceptingClients
    ) {
      throw new Error("Resposta invalida ao atualizar disponibilidade do profissional");
    }

    logger.info("[professional.mutations] Professional availability updated:", {
      id,
      status,
    });
  } catch (error) {
    logger.error("[professional.mutations] Error updating availability:", error);
    trackError(error as Error, {
      component: "professional.mutations",
      action: "updateProfessionalStatus",
      metadata: { id, status },
    });
    throw error;
  }
}

/** Deletar avaliação de profissional (admin). */
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

/** Incrementar visualizações do profissional. */
export async function incrementViews(professionalId: string): Promise<void> {
  try {
    await PublicViewTrackingService.track("professional", professionalId);
    logger.info("[professional.mutations] Views incremented:", professionalId);
  } catch (error) {
    // Visualizações não podem bloquear a navegação principal.
    logger.warn("[professional.mutations] Failed to increment views:", error);
  }
}
