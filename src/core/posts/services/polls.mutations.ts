/**
 * 🗳️ POLLS MUTATIONS - SSOT v2.0
 *
 * Operações de escrita para enquetes (polls).
 *
 * @version 2.0.0 - Refatoração SSOT
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import type { Poll, CreatePollData } from "../types";
import { PostError } from "../types";

// Re-exportar tipos para conveniência
export type { Poll, CreatePollData };

/**
 * Cria uma enquete vinculada a um post
 */
export async function createPoll(data: CreatePollData): Promise<Poll> {
  try {
    // Validações
    if (!data.question || data.question.trim().length < 10) {
      throw new PostError(
        "A pergunta deve ter pelo menos 10 caracteres",
        "INVALID_QUESTION",
      );
    }

    if (!data.options || data.options.length < 2) {
      throw new PostError(
        "A enquete deve ter pelo menos 2 opções",
        "INVALID_OPTIONS",
      );
    }

    if (data.options.length > 6) {
      throw new PostError(
        "Enquete pode ter no maximo 6 opcoes",
        "INVALID_OPTIONS",
      );
    }

    if (data.options.some((o) => !o.text || o.text.trim().length < 1)) {
      throw new PostError(
        "Todas as opções devem ter texto",
        "INVALID_OPTION_TEXT",
      );
    }

    // Criar enquete
    const { data: poll, error: pollError } = await (supabase as any)
      .from("community_polls")
      .insert({
        post_id: data.postId,
        question: data.question.trim(),
        expires_at: new Date(
          Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000,
        ).toISOString(),
        options: [],
      })
      .select("*")
      .single();

    if (pollError) {
      throw new PostError(pollError.message, pollError.code);
    }

    // Criar opções
    const optionsToInsert = data.options.map((option, index) => ({
      poll_id: poll.id,
      text: option.text.trim(),
      position: option.position || index,
      votes: 0,
    }));

    const { data: options, error: optionsError } = await (supabase as any)
      .from("community_poll_options")
      .insert(optionsToInsert)
      .select("*");

    if (optionsError) {
      // Rollback - deletar enquete criada
      await (supabase as any).from("community_polls").delete().eq("id", poll.id);
      throw new PostError(optionsError.message, optionsError.code);
    }

    const optionsForPoll = (options || []).map((option: any) => ({
      id: option.id,
      text: option.text,
      votes: option.votes || 0,
      position: option.position,
    }));

    const { error: updateError } = await (supabase as any)
      .from("community_polls")
      .update({ options: optionsForPoll })
      .eq("id", poll.id);

    if (updateError) {
      trackError(updateError as Error, {
        component: "polls.mutations",
        action: "createPoll",
        metadata: { pollId: poll.id, step: "update_options" },
      });
    }

    return {
      ...poll,
      options: optionsForPoll,
      total_votes: 0,
    } as Poll;
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[polls.mutations] Error creating poll:", error);
    trackError(error as Error, {
      component: "polls.mutations",
      action: "createPoll",
      metadata: { postId: data.postId },
    });
    throw new PostError("Erro ao criar enquete", "CREATE_ERROR");
  }
}

/**
 * Atualiza contadores de votos após um voto
 */
export async function updatePollVoteCounts(
  pollId: string,
  optionId: string,
): Promise<{ options: any[]; total_votes: number }> {
  try {
    // Incrementar voto da opção
    const { error: optionError } = await (supabase as any)
      .from("community_poll_options")
      .update({ votes: (supabase as any).rpc("increment", { x: 1 }) })
      .eq("id", optionId);

    if (optionError) {
      throw new PostError(optionError.message, optionError.code);
    }

    // Incrementar total de votos da enquete
    const { error: pollError } = await (supabase as any)
      .from("community_polls")
      .update({
        total_votes: (supabase as any).rpc("increment", { x: 1 }),
      })
      .eq("id", pollId);

    if (pollError) {
      throw new PostError(pollError.message, pollError.code);
    }

    // Buscar opções atualizadas
    const { data: options, error: fetchError } = await (supabase as any)
      .from("community_poll_options")
      .select("*")
      .eq("poll_id", pollId)
      .order("position", { ascending: true });

    if (fetchError) {
      throw new PostError(fetchError.message, fetchError.code);
    }

    const total_votes = (options || []).reduce(
      (sum: number, opt: any) => sum + (opt.votes || 0),
      0,
    );

    return {
      options: options || [],
      total_votes,
    };
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[polls.mutations] Error updating poll counts:", error);
    trackError(error as Error, {
      component: "polls.mutations",
      action: "updatePollVoteCounts",
      metadata: { pollId, optionId },
    });
    throw new PostError("Erro ao atualizar votos", "UPDATE_ERROR");
  }
}

/**
 * Registra um voto em uma enquete
 */
export async function votePoll(
  pollId: string,
  optionId: string,
  userId: string,
): Promise<void> {
  try {
    // Verificar se usuário já votou
    const { data: existingVote, error: checkError } = await (supabase as any)
      .from("community_poll_votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_id", userId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw new PostError(checkError.message, checkError.code);
    }

    if (existingVote) {
      throw new PostError("Você já votou nesta enquete", "ALREADY_VOTED");
    }

    // Registrar voto
    const { error: voteError } = await (supabase as any)
      .from("community_poll_votes")
      .insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: userId,
      });

    if (voteError) {
      throw new PostError(voteError.message, voteError.code);
    }

    // Atualizar contadores
    await updatePollVoteCounts(pollId, optionId);
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[polls.mutations] Error voting in poll:", error);
    trackError(error as Error, {
      component: "polls.mutations",
      action: "votePoll",
      metadata: { pollId, optionId, userId },
    });
    throw new PostError("Erro ao registrar voto", "VOTE_ERROR");
  }
}
