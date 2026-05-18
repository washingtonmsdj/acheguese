/**
 * ðŸ“¦ CLASSIFIEDS MUTATIONS - SSOT Write Model
 *
 * Todas as operaÃ§Ãµes de escrita para classificados.
 * CriaÃ§Ã£o, atualizaÃ§Ã£o, exclusÃ£o (soft delete).
 *
 * @version 2.0.0 - ExtraÃ­do de ClassifiedService.impl.ts
 */

import { supabase } from "@/core/infrastructure/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import type { ClassifiedData, CreateClassifiedInput, UpdateClassifiedInput } from "./types";
import { CLASSIFIED_STATUS } from "../constants/statuses";
import { slugify } from "./ClassifiedUrlService";

function ensureStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return [];
}

function mapMutationClassified(data: Record<string, unknown>): ClassifiedData {
  const seller = data.seller as
    | { name?: string | null; avatar_url?: string | null; phone?: string | null; whatsapp?: string | null }
    | undefined;

  return {
    ...(data as unknown as ClassifiedData),
    photos: ensureStringArray(data.photos),
    seller_name: seller?.name,
    seller_avatar: seller?.avatar_url,
    seller_phone: seller?.phone,
    seller_whatsapp: seller?.whatsapp,
  };
}

// ============================================================
// HELPERS INTERNOS
// ============================================================

/**
 * Gera slug a partir do tÃ­tulo (importado dinamicamente do ClassifiedUrlService)
 */
async function generateSlug(title: string): Promise<string> {
  return slugify(title);
}

// ============================================================
// MUTATIONS - CRUD
// ============================================================

/**
 * Cria um novo classificado
 */
export async function createClassified(
  userId: string,
  input: CreateClassifiedInput,
): Promise<ClassifiedData> {
  try {
    // Gera slug automaticamente a partir do tÃ­tulo
    const slug = await generateSlug(input.title);

    const { data, error } = await supabase
      .from("classifieds")
      .insert({
        ...input,
        slug, // âœ… Slug gerado automaticamente
        seller_id: userId,
        status: CLASSIFIED_STATUS.ACTIVE, // Define status ao invÃ©s de is_active (que Ã© computed)
      })
      .select(
        `
        *,
        seller:profiles!seller_id (
          id,
          name,
          avatar_url,
          phone,
          whatsapp
        )
      `,
      )
      .single();

    if (error) {
      logger.error("Error creating classified:", error);
      throw error;
    }

    return mapMutationClassified(data as Record<string, unknown>);
  } catch (error) {
    logger.error("Error in createClassified:", error);
    trackError(error as Error, {
      component: "ClassifiedsMutations",
      action: "createClassified",
    });
    throw error;
  }
}

/**
 * Atualiza um classificado
 */
export async function updateClassified(
  id: string,
  userId: string,
  input: UpdateClassifiedInput,
): Promise<ClassifiedData> {
  try {
    const { data, error } = await supabase
      .from("classifieds")
      .update(input)
      .eq("id", id)
      .eq("seller_id", userId) // SÃ³ o vendedor pode atualizar
      .select(
        `
        *,
        seller:profiles!seller_id (
          id,
          name,
          avatar_url,
          phone,
          whatsapp
        )
      `,
      )
      .single();

    if (error) {
      logger.error("Error updating classified:", error);
      throw error;
    }

    return mapMutationClassified(data as Record<string, unknown>);
  } catch (error) {
    logger.error("Error in updateClassified:", error);
    trackError(error as Error, {
      component: "ClassifiedsMutations",
      action: "updateClassified",
    });
    throw error;
  }
}

/**
 * Deleta um classificado (soft delete - marca como inativo)
 */
export async function deleteClassified(id: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("classifieds")
      .update({ status: CLASSIFIED_STATUS.INACTIVE }) // Atualiza status ao invÃ©s de is_active (que Ã© computed)
      .eq("id", id)
      .eq("seller_id", userId); // SÃ³ o vendedor pode deletar

    if (error) {
      logger.error("Error deleting classified:", error);
      throw error;
    }

    return true;
  } catch (error) {
    logger.error("Error in deleteClassified:", error);
    trackError(error as Error, {
      component: "ClassifiedsMutations",
      action: "deleteClassified",
    });
    throw error;
  }
}

// ============================================================
// MUTATIONS - STATUS MANAGEMENT
// ============================================================

/**
 * Marca um classificado como vendido
 */
export async function markAsSold(
  id: string,
  userId: string,
): Promise<ClassifiedData> {
  try {
    const { data, error } = await supabase
      .from("classifieds")
      .update({ status: CLASSIFIED_STATUS.SOLD })
      .eq("id", id)
      .eq("seller_id", userId)
      .select(
        `
        *,
        seller:profiles!seller_id (
          id,
          name,
          avatar_url,
          phone,
          whatsapp
        )
      `,
      )
      .single();

    if (error) {
      logger.error("Error marking classified as sold:", error);
      throw error;
    }

    return mapMutationClassified(data as Record<string, unknown>);
  } catch (error) {
    logger.error("Error in markAsSold:", error);
    trackError(error as Error, {
      component: "ClassifiedsMutations",
      action: "markAsSold",
    });
    throw error;
  }
}

/**
 * Reativa um classificado inativo
 */
export async function reactivateClassified(
  id: string,
  userId: string,
): Promise<ClassifiedData> {
  try {
    const { data, error } = await supabase
      .from("classifieds")
      .update({ status: CLASSIFIED_STATUS.ACTIVE })
      .eq("id", id)
      .eq("seller_id", userId)
      .select(
        `
        *,
        seller:profiles!seller_id (
          id,
          name,
          avatar_url,
          phone,
          whatsapp
        )
      `,
      )
      .single();

    if (error) {
      logger.error("Error reactivating classified:", error);
      throw error;
    }

    return mapMutationClassified(data as Record<string, unknown>);
  } catch (error) {
    logger.error("Error in reactivateClassified:", error);
    trackError(error as Error, {
      component: "ClassifiedsMutations",
      action: "reactivateClassified",
    });
    throw error;
  }
}



