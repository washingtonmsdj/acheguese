/**
 * 📊 POLLS QUERIES - SSOT v2.0
 *
 * Operações de leitura para enquetes (polls).
 *
 * @version 2.0.0 - Refatoração SSOT
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import type { Poll } from "../types";
import { PostError } from "../types";

/**
 * Busca uma enquete por ID
 */
export async function getPollById(pollId: string): Promise<Poll | null> {
  try {
    const { data: poll, error } = await (supabase as any)
      .from("community_polls")
      .select(
        `
        *,
        options:community_poll_options(*)
      `,
      )
      .eq("id", pollId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new PostError(error.message, error.code);
    }

    return poll as Poll;
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[polls.queries] Error fetching poll:", error);
    trackError(error as Error, {
      component: "polls.queries",
      action: "getPollById",
      metadata: { pollId },
    });
    throw new PostError("Erro ao buscar enquete", "FETCH_ERROR");
  }
}

/**
 * Busca enquete por post ID
 */
export async function getPollByPostId(postId: string): Promise<Poll | null> {
  try {
    const { data: poll, error } = await (supabase as any)
      .from("community_polls")
      .select(
        `
        *,
        options:community_poll_options(*)
      `,
      )
      .eq("post_id", postId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new PostError(error.message, error.code);
    }

    return poll as Poll;
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[polls.queries] Error fetching poll by post:", error);
    trackError(error as Error, {
      component: "polls.queries",
      action: "getPollByPostId",
      metadata: { postId },
    });
    throw new PostError("Erro ao buscar enquete", "FETCH_ERROR");
  }
}
