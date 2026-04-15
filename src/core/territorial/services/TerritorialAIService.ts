// @ts-nocheck
/**
 * TerritorialAIService - SSOT para conteúdo gerado por IA de territórios
 * 
 * Responsável por:
 * - Invocar edge function de geração de conteúdo
 * - Buscar conteúdo AI de territórios
 * - Atualizar conteúdo AI
 * 
 * @module territorial
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";

export interface TerritoryAIContent {
  id: string;
  territory_slug: string;
  territory_name: string;
  description: string | null;
  history: string | null;
  demographics: Record<string, any>;
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

export class TerritorialAIService {
  /**
   * Busca conteúdo AI de um território
   * ✅ SSOT para territory_ai_content
   */
  static async getAIContent(territorySlug: string): Promise<TerritoryAIContent | null> {
    try {
      const { data, error } = await supabase
        .from('territory_ai_content')
        .select('*')
        .eq('territory_slug', territorySlug)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching AI content:', error);
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

  /**
   * Gera conteúdo AI para um território via edge function
   * ✅ SSOT para functions.invoke('territory-ai-content')
   */
  static async generateAIContent(params: {
    territory_slug: string;
    territory_name: string;
    members?: string[];
  }): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('territory-ai-content', {
        body: params,
      });

      if (error) {
        logger.error('Error invoking AI generation:', error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      trackError(err as Error, {
        component: "TerritorialAIService",
        action: "generateAIContent",
        metadata: params,
      });
      throw err;
    }
  }

  /**
   * Atualiza conteúdo AI de um território
   * ✅ SSOT para territory_ai_content updates
   */
  static async updateAIContent(
    territorySlug: string,
    updates: Partial<TerritoryAIContent>
  ): Promise<TerritoryAIContent> {
    try {
      const { data, error } = await supabase
        .from('territory_ai_content')
        .update({
          ...updates,
          is_manual_override: true,
          manually_edited_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('territory_slug', territorySlug)
        .select()
        .single();

      if (error) {
        logger.error('Error updating AI content:', error);
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

// Export singleton
export const territorialAIService = TerritorialAIService;
