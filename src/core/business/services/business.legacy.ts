// @ts-nocheck
/**
 * 📜 BUSINESS LEGACY — Compatibilidade com tabela `businesses`
 * 
 * Responsabilidade única: operações na tabela legada `businesses`
 * LOTE 9A: Boundary canônico para retrocompatibilidade
 * 
 * ⚠️ Esses métodos existem apenas para transição gradual
 * Novo código deve usar a tabela `business_data`
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { PAGINATION } from "@/shared/constants";

const supabaseAny = supabase as any;
import { sanitizeForILike } from "@/shared/utils/sqlSanitization";
import { sanitizeSearchQuery } from "./validators";

/**
 * Buscar empresas por texto na tabela legada
 * LOTE 9A - Boundary canônico para busca full-text
 */
export async function searchBusinessesLegacy(
  query: string,
  limit = 20,
): Promise<unknown[]> {
  try {
    // Validação
    const sanitized = sanitizeSearchQuery(query);
    if (!sanitized) {
      return [];
    }

    const sanitizedQuery = sanitizeForILike(sanitized);
    if (!sanitizedQuery) {
      return [];
    }

    const { data, error } = await supabaseAny.from("businesses")
      .select(
        "id, name, categoria, description, logo, rating, total_avaliacoes, neighborhood, slug, nicho, city, is_premium",
      )
      .eq("status", "active")
      .or(
        `name.ilike.%${sanitizedQuery}%,categoria.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`,
      )
      .limit(limit);

    if (error) {
      logger.error("Error in searchBusinessesLegacy:", error);
      return [];
    }
    return (data as unknown[]) || [];
  } catch (error) {
    logger.error("Error in searchBusinessesLegacy:", error);
    return [];
  }
}

/**
 * Buscar empresas recentes na tabela legada
 */
export async function getRecentBusinessesLegacy(
  limit = PAGINATION.SMALL_LIMIT,
): Promise<unknown[]> {
  try {
    const { data, error } = await supabase
      .from("businesses")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("Error in getRecentBusinessesLegacy:", error);
      return [];
    }
    return (data as unknown[]) || [];
  } catch (error) {
    logger.error("Error in getRecentBusinessesLegacy:", error);
    return [];
  }
}
