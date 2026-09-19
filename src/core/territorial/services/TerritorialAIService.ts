/**
 * TerritorialAIService
 *
 * Public territory content is read-only through the Data API.
 * Administrative reads, generation and editing are owned by the
 * territory-ai-content Edge broker.
 */

import { supabase } from "@/integrations/supabase";
import {
  invokeNullableSupabaseBroker,
  invokeSupabaseBroker,
} from "@/core/infrastructure/edge-functions/edgeFunctionBroker";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";

export type TerritoryEventCategory =
  | "cultura"
  | "esporte"
  | "religioso"
  | "comunitário";

export interface TerritoryEvent {
  name: string;
  description: string;
  frequency: string;
  category: TerritoryEventCategory;
}

export interface TerritoryDemographics {
  estimated_population?: number;
  area_km2?: number;
  density?: string;
  main_characteristics?: string[];
  infrastructure?: string[];
  economy?: string;
}

export interface TerritoryAIContent {
  territory_slug: string;
  territory_name: string;
  description: string | null;
  history: string | null;
  demographics: TerritoryDemographics;
  events: TerritoryEvent[];
  ai_generated_at: string | null;
}

export interface TerritoryAIAdminContent extends TerritoryAIContent {
  id: string;
  manually_edited_at: string | null;
  is_manual_override: boolean;
  created_at: string;
  updated_at: string;
}

export interface TerritoryAIContentUpdateInput {
  description: string | null;
  history: string | null;
  demographics: TerritoryDemographics;
  events: TerritoryEvent[];
}

const TERRITORY_AI_FUNCTION = "territory-ai-content";
const SERVICE_NAME = "TerritorialAIService";

const PUBLIC_COLUMNS = [
  "territory_slug",
  "territory_name",
  "description",
  "history",
  "demographics",
  "events",
  "ai_generated_at",
].join(",");

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase();
}

export class TerritorialAIService {
  static async getAIContent(
    territorySlug: string,
  ): Promise<TerritoryAIContent | null> {
    const slug = normalizeSlug(territorySlug);
    if (!slug) return null;

    try {
      const { data, error } = await supabase
        .from("territory_ai_content")
        .select(PUBLIC_COLUMNS)
        .eq("territory_slug", slug)
        .maybeSingle();

      if (error) {
        logger.error("Error fetching public territory AI content:", error);
        throw error;
      }

      return (data as unknown as TerritoryAIContent | null) ?? null;
    } catch (error) {
      trackError(error as Error, {
        component: SERVICE_NAME,
        action: "getAIContent",
        metadata: { territorySlug: slug },
      });
      return null;
    }
  }

  static async getAdminContent(
    territorySlug: string,
  ): Promise<TerritoryAIAdminContent | null> {
    const slug = normalizeSlug(territorySlug);
    if (!slug) return null;

    return await invokeNullableSupabaseBroker<
      TerritoryAIAdminContent,
      "get"
    >({
      action: "get",
      functionName: TERRITORY_AI_FUNCTION,
      params: { territory_slug: slug },
      serviceName: SERVICE_NAME,
    });
  }

  static async generateAIContent(
    territorySlug: string,
  ): Promise<TerritoryAIAdminContent> {
    const slug = normalizeSlug(territorySlug);
    if (!slug) throw new Error("Território inválido");

    return await invokeSupabaseBroker<TerritoryAIAdminContent, "generate">({
      action: "generate",
      functionName: TERRITORY_AI_FUNCTION,
      params: { territory_slug: slug },
      serviceName: SERVICE_NAME,
    });
  }

  static async updateAIContent(
    territorySlug: string,
    updates: TerritoryAIContentUpdateInput,
  ): Promise<TerritoryAIAdminContent> {
    const slug = normalizeSlug(territorySlug);
    if (!slug) throw new Error("Território inválido");

    return await invokeSupabaseBroker<TerritoryAIAdminContent, "update">({
      action: "update",
      functionName: TERRITORY_AI_FUNCTION,
      params: {
        territory_slug: slug,
        ...updates,
      },
      serviceName: SERVICE_NAME,
    });
  }
}

export const territorialAIService = TerritorialAIService;
