/**
 * TerritorialAIService - SSOT para conteudo gerado por IA de territorios
 *
 * Responsavel por:
 * - Invocar edge function de geracao de conteudo
 * - Buscar conteudo AI de territorios
 * - Atualizar conteudo AI
 */

import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";

export interface TerritoryAIContent {
  id: string;
  territory_slug: string;
  territory_name: string;
  description: string | null;
  history: string | null;
  demographics: Record<string, unknown>;
  events: Array<{
    name: string;
    description: string;
    frequency: string;
    category: string;
  }>;
  ai_generated_at: string | null;
  manually_edited_at: string | null;
  is_manual_override: boolean;
  created_at: string;
  updated_at: string;
}

interface TerritoryAIGenerateResponse {
  error?: string;
  [key: string]: unknown;
}

type QueryResult<T> = Promise<{ data: T; error: { code?: string; message?: string } | null }>;

interface QueryBuilder<TRow> {
  select(columns?: string): QueryBuilder<TRow>;
  update(values: unknown): QueryBuilder<TRow>;
  eq(column: string, value: unknown): QueryBuilder<TRow>;
  maybeSingle(): QueryResult<TRow | null>;
  single(): QueryResult<TRow>;
}

interface TerritorialDbClient {
  from<TRow>(table: string): QueryBuilder<TRow>;
  functions: {
    invoke<TResponse>(
      name: string,
      options: { body?: unknown },
    ): Promise<{ data: TResponse | null; error: { message?: string } | null }>;
  };
}

const territorialDb = supabase as unknown as TerritorialDbClient;

export class TerritorialAIService {
  static async getAIContent(
    territorySlug: string,
  ): Promise<TerritoryAIContent | null> {
    try {
      const { data, error } = await territorialDb
        .from<TerritoryAIContent>("territory_ai_content")
        .select("*")
        .eq("territory_slug", territorySlug)
        .maybeSingle();

      if (error) {
        logger.error("Error fetching AI content:", error);
        throw error;
      }

      return data;
    } catch (err) {
      trackError(err as Error, {
        component: "TerritorialAIService",
        action: "getAIContent",
        metadata: { territorySlug },
      });
      return null;
    }
  }

  static async generateAIContent(params: {
    territory_slug: string;
    territory_name: string;
    members?: string[];
  }): Promise<TerritoryAIGenerateResponse> {
    try {
      const { data, error } =
        await territorialDb.functions.invoke<TerritoryAIGenerateResponse>(
          "territory-ai-content",
          {
            body: params,
          },
        );

      if (error) {
        logger.error("Error invoking AI generation:", error);
        throw error;
      }

      const response = data ?? {};
      if (response.error) {
        throw new Error(response.error);
      }

      return response;
    } catch (err) {
      trackError(err as Error, {
        component: "TerritorialAIService",
        action: "generateAIContent",
        metadata: params,
      });
      throw err;
    }
  }

  static async updateAIContent(
    territorySlug: string,
    updates: Partial<TerritoryAIContent>,
  ): Promise<TerritoryAIContent> {
    try {
      const { data, error } = await territorialDb
        .from<TerritoryAIContent>("territory_ai_content")
        .update({
          ...updates,
          is_manual_override: true,
          manually_edited_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("territory_slug", territorySlug)
        .select()
        .single();

      if (error) {
        logger.error("Error updating AI content:", error);
        throw error;
      }

      return data;
    } catch (err) {
      trackError(err as Error, {
        component: "TerritorialAIService",
        action: "updateAIContent",
        metadata: { territorySlug, updates },
      });
      throw err;
    }
  }
}

export const territorialAIService = TerritorialAIService;
