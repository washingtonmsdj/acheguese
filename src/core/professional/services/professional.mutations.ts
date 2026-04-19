/**
 * 📝 PROFESSIONAL MUTATIONS - SSOT v2.0
 *
 * Operações de escrita para profissionais.
 * Todas as mutations são pure functions que recebem parâmetros e retornam dados atualizados.
 *
 * @version 2.0.0 - Refatoração SSOT
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import { ReviewsService } from "@/core/reviews";
import {
  createProfessionalSchema,
  updateProfessionalSchema,
} from "@/shared/schemas/professional/professionalSchemas";
import type {
  Professional,
  CreateProfessionalInput,
  UpdateProfessionalInput,
  ProfessionalJob,
  CreateProfessionalJobInput,
} from "../types";
import type { z } from "zod";

// Re-exportar tipos para conveniência
export type { Professional, CreateProfessionalInput, UpdateProfessionalInput };

// ============================================================================
// 🔧 VALIDATION HELPERS
// ============================================================================

// Importação dinâmica dos sanitizadores
async function getSanitizers() {
  const {
    sanitizeString,
    sanitizeArray,
    sanitizeUrl,
    sanitizeEmail,
    sanitizePhone,
  } = await import("@/shared/utils/sanitization");
  return {
    sanitizeString,
    sanitizeArray,
    sanitizeUrl,
    sanitizeEmail,
    sanitizePhone,
  };
}

// ============================================================================
// 🎯 CREATE MUTATIONS
// ============================================================================

/**
 * Criar novo profissional
 */
export async function createProfessional(
  input: CreateProfessionalInput,
  userId: string,
): Promise<Professional> {
  try {
    // 1. Sanitização
    const sanitizers = await getSanitizers();
    const sanitized = {
      ...input,
      name: sanitizers.sanitizeString(input.name),
      description: sanitizers.sanitizeString(input.description),
      phone: sanitizers.sanitizePhone(input.phone),
      whatsapp: sanitizers.sanitizePhone(input.whatsapp),
      email: sanitizers.sanitizeEmail(input.email),
      website: sanitizers.sanitizeUrl(input.website),
      facebook: sanitizers.sanitizeUrl(input.facebook),
      linkedin: sanitizers.sanitizeUrl(input.linkedin),
      address: sanitizers.sanitizeString(input.address),
      neighborhood: sanitizers.sanitizeString(input.neighborhood),
      city: sanitizers.sanitizeString(input.city),
      state: sanitizers.sanitizeString(input.state),
      cep: sanitizers.sanitizeString(input.cep),
      education: sanitizers.sanitizeString(input.education),
      price_range: sanitizers.sanitizeString(input.price_range),
      instagram: sanitizers.sanitizeString(input.instagram),
      logo_url: sanitizers.sanitizeUrl(input.logo_url),
      banner_url: sanitizers.sanitizeUrl(input.banner_url),
      portfolio_images: input.portfolio_images
        ? (input.portfolio_images
            .map((url) => sanitizers.sanitizeUrl(url))
            .filter(Boolean) as string[])
        : undefined,
      certifications: sanitizers.sanitizeArray(
        Array.isArray(input.certifications)
          ? input.certifications.join(",")
          : "",
      ),
    };

    // 2. Validação
    const validationResult = createProfessionalSchema.safeParse(sanitized);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(", ");
      throw new Error(`Validação falhou: ${errors}`);
    }

    const validatedData = validationResult.data;

    // 3. Criar no banco
    const { data, error } = await (supabase as any)
      .from("professional_data")
      .insert({
        profile_id: userId,
        professional_name: validatedData.name,
        service_category: validatedData.category,
        service_subcategory: validatedData.subcategory,
        description: validatedData.description,
        certifications: validatedData.certifications
          ? validatedData.certifications.split(",").map((s: string) => s.trim())
          : [],
        experience_years: validatedData.experience_years,
        education: validatedData.education,
        price_range: validatedData.price_range,
        service_areas: validatedData.service_areas || [],
        service_radius_km: validatedData.service_radius_km,
        available_hours: validatedData.available_hours || {},
        whatsapp: validatedData.whatsapp,
        email: validatedData.email,
        website: validatedData.website,
        facebook: validatedData.facebook,
        linkedin: validatedData.linkedin,
        instagram: validatedData.instagram,
        logo_url: validatedData.logo_url,
        banner_url: validatedData.banner_url,
        portfolio_images: validatedData.portfolio_images || [],
        is_active: true,
        is_verified: false,
        is_accepting_clients: true,
        location_id: validatedData.location_id,
        address_id: validatedData.address_id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    logger.info("[professional.mutations] Professional created:", data.id);
    return data as Professional;
  } catch (error) {
    logger.error("[professional.mutations] Error creating professional:", error);
    trackError(error as Error, {
      component: "professional.mutations",
      action: "createProfessional",
      metadata: { userId },
    });
    throw error;
  }
}

// ============================================================================
// ✏️ UPDATE MUTATIONS
// ============================================================================

/**
 * Atualizar profissional existente
 */
export async function updateProfessional(
  id: string,
  input: UpdateProfessionalInput,
): Promise<Professional> {
  try {
    // 1. Sanitização
    const sanitizers = await getSanitizers();
    const sanitized: Record<string, any> = {};

    if (input.name !== undefined) {
      sanitized.professional_name = sanitizers.sanitizeString(input.name);
    }
    if (input.description !== undefined) {
      sanitized.description = sanitizers.sanitizeString(input.description);
    }
    if (input.phone !== undefined) {
      sanitized.phone = sanitizers.sanitizePhone(input.phone);
    }
    if (input.whatsapp !== undefined) {
      sanitized.whatsapp = sanitizers.sanitizePhone(input.whatsapp);
    }
    if (input.email !== undefined) {
      sanitized.email = sanitizers.sanitizeEmail(input.email);
    }
    if (input.website !== undefined) {
      sanitized.website = sanitizers.sanitizeUrl(input.website);
    }
    if (input.facebook !== undefined) {
      sanitized.facebook = sanitizers.sanitizeUrl(input.facebook);
    }
    if (input.linkedin !== undefined) {
      sanitized.linkedin = sanitizers.sanitizeUrl(input.linkedin);
    }
    if (input.instagram !== undefined) {
      sanitized.instagram = sanitizers.sanitizeString(input.instagram);
    }
    if (input.logo_url !== undefined) {
      sanitized.logo_url = sanitizers.sanitizeUrl(input.logo_url);
    }
    if (input.banner_url !== undefined) {
      sanitized.banner_url = sanitizers.sanitizeUrl(input.banner_url);
    }
    if (input.portfolio_images !== undefined) {
      sanitized.portfolio_images = input.portfolio_images
        .map((url) => sanitizers.sanitizeUrl(url))
        .filter(Boolean);
    }
    if (input.certifications !== undefined) {
      sanitized.certifications = sanitizers.sanitizeArray(
        Array.isArray(input.certifications)
          ? input.certifications.join(",")
          : "",
      )
        .split(",")
        .map((s: string) => s.trim());
    }
    if (input.category !== undefined) {
      sanitized.service_category = input.category;
    }
    if (input.subcategory !== undefined) {
      sanitized.service_subcategory = input.subcategory;
    }
    if (input.experience_years !== undefined) {
      sanitized.experience_years = input.experience_years;
    }
    if (input.education !== undefined) {
      sanitized.education = input.education;
    }
    if (input.price_range !== undefined) {
      sanitized.price_range = input.price_range;
    }
    if (input.service_areas !== undefined) {
      sanitized.service_areas = input.service_areas;
    }
    if (input.service_radius_km !== undefined) {
      sanitized.service_radius_km = input.service_radius_km;
    }
    if (input.available_hours !== undefined) {
      sanitized.available_hours = input.available_hours;
    }
    if (input.location_id !== undefined) {
      sanitized.location_id = input.location_id;
    }
    if (input.address_id !== undefined) {
      sanitized.address_id = input.address_id;
    }
    if (input.status !== undefined) {
      sanitized.is_active = input.status === "active";
    }

    // 2. Validação (se houver dados para validar)
    if (Object.keys(sanitized).length > 0) {
      const validationResult = updateProfessionalSchema.safeParse({
        ...input,
        ...sanitized,
      });

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((e) => e.message).join(", ");
        throw new Error(`Validação falhou: ${errors}`);
      }
    }

    // 3. Atualizar no banco
    const { data, error } = await (supabase as any)
      .from("professional_data")
      .update({
        ...sanitized,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    logger.info("[professional.mutations] Professional updated:", id);
    return data as Professional;
  } catch (error) {
    logger.error("[professional.mutations] Error updating professional:", error);
    trackError(error as Error, {
      component: "professional.mutations",
      action: "updateProfessional",
      metadata: { id },
    });
    throw error;
  }
}

/**
 * Soft delete de profissional
 */
export async function deleteProfessional(id: string): Promise<void> {
  try {
    const { data: professional, error: resolveError } = await (supabase as any)
      .from("professional_data")
      .select("id, profile_id")
      .eq("id", id)
      .single();

    if (resolveError || !professional) {
      throw new Error("Profissional não encontrado");
    }

    const { error } = await (supabase as any)
      .from("professional_data")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    logger.info("[professional.mutations] Professional soft deleted:", id);
  } catch (error) {
    logger.error("[professional.mutations] Error deleting professional:", error);
    trackError(error as Error, {
      component: "professional.mutations",
      action: "deleteProfessional",
      metadata: { id },
    });
    throw error;
  }
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
    const { data, error } = await (supabase as any)
      .from("professional_jobs")
      .insert({
        professional_id: professionalId,
        title: jobData.title,
        description: jobData.description,
        price: jobData.price,
        price_type: jobData.price_type,
        category: jobData.category,
        duration_hours: jobData.duration_hours,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    logger.info("[professional.mutations] Job created:", data.id);
    return data as ProfessionalJob;
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

    const { error } = await (supabase as any)
      .from("professional_data")
      .update({
        is_active: isActive,
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
 * Atualizar status de denúncia de profissional (admin)
 */
export async function updateProfessionalReport(
  reportId: string,
  status: string,
): Promise<void> {
  try {
    // ✅ SSOT - Usar ModerationService para atualizar reports
    const { ModerationService } = await import("@/core/moderation/services/ModerationService");
    await ModerationService.updateReportStatus(reportId, status);

    logger.info("[professional.mutations] Report status updated:", { reportId, status });
  } catch (error) {
    logger.error("[professional.mutations] Error updating report:", error);
    trackError(error as Error, {
      component: "professional.mutations",
      action: "updateProfessionalReport",
      metadata: { reportId, status },
    });
    throw error;
  }
}

/**
 * Incrementar visualizações do profissional
 */
export async function incrementViews(professionalId: string): Promise<void> {
  try {
    await supabase.rpc("increment_professional_views", {
      professional_id: professionalId,
    });
    logger.info("[professional.mutations] Views incremented:", professionalId);
  } catch (error) {
    // Silently fail - views are not critical
    logger.warn("[professional.mutations] Failed to increment views:", error);
  }
}
