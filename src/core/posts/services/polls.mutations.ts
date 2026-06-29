/**
 * Poll write mutations.
 */

import { supabase } from "@/integrations/supabase";
import type { Database, Json } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import type { CreatePollData, Poll, PollOption } from "../types";
import { PostError } from "../types";

export type { CreatePollData, Poll };

type PollRow = Database["public"]["Tables"]["community_polls"]["Row"];
type PollInsert = Database["public"]["Tables"]["community_polls"]["Insert"];
type PollUpdate = Database["public"]["Tables"]["community_polls"]["Update"];
type PollOptionRow = Database["public"]["Tables"]["community_poll_options"]["Row"];
type PollOptionInsert = Database["public"]["Tables"]["community_poll_options"]["Insert"];
type PollOptionUpdate = Database["public"]["Tables"]["community_poll_options"]["Update"];
type PollVoteInsert = Database["public"]["Tables"]["community_poll_votes"]["Insert"];

function toPollOption(row: PollOptionRow): PollOption {
  return {
    id: row.id,
    poll_id: row.poll_id,
    text: row.text,
    position: row.position,
    votes: row.votes,
    created_at: "",
  };
}

function toStoredPollOption(row: PollOptionRow): Array<Json> {
  return [
    {
      id: row.id,
      text: row.text,
      votes: row.votes,
      position: row.position,
    } as Json,
  ];
}

function toPoll(row: PollRow, optionRows: PollOptionRow[]): Poll {
  const options = optionRows.map(toPollOption);
  return {
    id: row.id,
    post_id: row.post_id,
    question: row.question,
    options,
    total_votes: options.reduce((sum, option) => sum + option.votes, 0),
    expires_at: row.expires_at ?? row.created_at,
    created_at: row.created_at,
    updated_at: row.created_at,
  };
}

async function fetchPollOptions(pollId: string): Promise<PollOptionRow[]> {
  const { data, error } = await supabase
    .from("community_poll_options")
    .select("*")
    .eq("poll_id", pollId)
    .order("position", { ascending: true });

  if (error) {
    throw new PostError(error.message, error.code);
  }

  return data ?? [];
}

export async function createPoll(data: CreatePollData): Promise<Poll> {
  try {
    if (!data.question || data.question.trim().length < 10) {
      throw new PostError("A pergunta deve ter pelo menos 10 caracteres", "INVALID_QUESTION");
    }

    if (!data.options || data.options.length < 2) {
      throw new PostError("A enquete deve ter pelo menos 2 opcoes", "INVALID_OPTIONS");
    }

    if (data.options.length > 6) {
      throw new PostError("Enquete pode ter no maximo 6 opcoes", "INVALID_OPTIONS");
    }

    if (data.options.some((option) => !option.text || option.text.trim().length < 1)) {
      throw new PostError("Todas as opcoes devem ter texto", "INVALID_OPTION_TEXT");
    }

    const pollInsert: PollInsert = {
      post_id: data.postId,
      question: data.question.trim(),
      expires_at: new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
      options: [],
    };

    const { data: poll, error: pollError } = await supabase
      .from("community_polls")
      .insert(pollInsert)
      .select("*")
      .single();

    if (pollError || !poll) {
      throw new PostError(pollError?.message ?? "Erro ao criar enquete", pollError?.code ?? "CREATE_ERROR");
    }

    const optionsToInsert: PollOptionInsert[] = data.options.map((option, index) => ({
      poll_id: poll.id,
      text: option.text.trim(),
      position: option.position || index,
      votes: 0,
    }));

    const { data: options, error: optionsError } = await supabase
      .from("community_poll_options")
      .insert(optionsToInsert)
      .select("*");

    if (optionsError) {
      await supabase.from("community_polls").delete().eq("id", poll.id);
      throw new PostError(optionsError.message, optionsError.code);
    }

    const optionRows = options ?? [];
    const pollOptionsJson = optionRows.flatMap(toStoredPollOption);
    const pollUpdate: PollUpdate = { options: pollOptionsJson };

    const { error: updateError } = await supabase
      .from("community_polls")
      .update(pollUpdate)
      .eq("id", poll.id);

    if (updateError) {
      trackError(updateError as Error, {
        component: "polls.mutations",
        action: "createPoll",
        metadata: { pollId: poll.id, step: "update_options" },
      });
    }

    return toPoll(poll, optionRows);
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

export async function updatePollVoteCounts(
  pollId: string,
  optionId: string,
): Promise<{ options: PollOption[]; total_votes: number }> {
  try {
    const optionsBeforeUpdate = await fetchPollOptions(pollId);
    const optionRow = optionsBeforeUpdate.find((option) => option.id === optionId);

    if (!optionRow) {
      throw new PostError("Opcao da enquete nao encontrada", "OPTION_NOT_FOUND");
    }

    const optionUpdate: PollOptionUpdate = { votes: optionRow.votes + 1 };
    const { error: optionError } = await supabase
      .from("community_poll_options")
      .update(optionUpdate)
      .eq("id", optionId);

    if (optionError) {
      throw new PostError(optionError.message, optionError.code);
    }

    const updatedOptions = await fetchPollOptions(pollId);
    const totalVotes = updatedOptions.reduce((sum, option) => sum + option.votes, 0);

    const pollUpdate: PollUpdate = {
      options: updatedOptions.flatMap(toStoredPollOption),
    };

    const { error: pollError } = await supabase
      .from("community_polls")
      .update(pollUpdate)
      .eq("id", pollId);

    if (pollError) {
      throw new PostError(pollError.message, pollError.code);
    }

    return {
      options: updatedOptions.map(toPollOption),
      total_votes: totalVotes,
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

export async function votePoll(pollId: string, optionId: string, userId: string): Promise<void> {
  try {
    const { data: existingVote, error: checkError } = await supabase
      .from("community_poll_votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_id", userId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw new PostError(checkError.message, checkError.code);
    }

    if (existingVote) {
      throw new PostError("Voce ja votou nesta enquete", "ALREADY_VOTED");
    }

    const voteInsert: PollVoteInsert = {
      poll_id: pollId,
      option_id: optionId,
      user_id: userId,
    };

    const { error: voteError } = await supabase.from("community_poll_votes").insert(voteInsert);

    if (voteError) {
      throw new PostError(voteError.message, voteError.code);
    }

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
