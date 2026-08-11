/** Poll reads from the authoritative server DTO. */

import { supabase } from "@/integrations/supabase";
import type { Json } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import type { Poll, PollOption } from "../types";
import { PostError } from "../types";

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

function jsonObject(value: Json, code: string): Record<string, Json | undefined> {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new PostError("Resposta de enquete invalida", code);
  }
  return value;
}

function requiredString(
  object: Record<string, Json | undefined>,
  key: string,
): string {
  const value = object[key];
  if (typeof value !== "string") {
    throw new PostError("Resposta de enquete invalida", "INVALID_POLL_RESPONSE");
  }
  return value;
}

function requiredNumber(
  object: Record<string, Json | undefined>,
  key: string,
): number {
  const value = object[key];
  if (typeof value !== "number") {
    throw new PostError("Resposta de enquete invalida", "INVALID_POLL_RESPONSE");
  }
  return value;
}

function parsePollOption(value: Json): PollOption {
  const option = jsonObject(value, "INVALID_POLL_OPTION_RESPONSE");
  return {
    id: requiredString(option, "id"),
    poll_id: requiredString(option, "poll_id"),
    text: requiredString(option, "text"),
    position: requiredNumber(option, "position"),
    votes: requiredNumber(option, "votes"),
    created_at: requiredString(option, "created_at"),
  };
}

export function parsePollDto(value: Json): Poll {
  const poll = jsonObject(value, "INVALID_POLL_RESPONSE");
  const optionsValue = poll.options;
  if (!Array.isArray(optionsValue)) {
    throw new PostError("Resposta de enquete invalida", "INVALID_POLL_RESPONSE");
  }

  const expiresAt = poll.expires_at;
  const userVoteOptionId = poll.user_vote_option_id;

  return {
    id: requiredString(poll, "id"),
    post_id: requiredString(poll, "post_id"),
    question: requiredString(poll, "question"),
    options: optionsValue.map(parsePollOption),
    total_votes: requiredNumber(poll, "total_votes"),
    expires_at:
      typeof expiresAt === "string" ? expiresAt : requiredString(poll, "created_at"),
    created_at: requiredString(poll, "created_at"),
    updated_at: requiredString(poll, "updated_at"),
    allow_multiple_choice: poll.allow_multiple_choice === true,
    allow_comments: poll.allow_comments !== false,
    user_voted: poll.user_voted === true,
    user_vote_option_id:
      typeof userVoteOptionId === "string" ? userVoteOptionId : undefined,
  };
}

export async function getPollByPostId(postId: string): Promise<Poll | null> {
  try {
    const { data, error } = await supabase.rpc("get_community_poll_for_post", {
      p_post_id: postId,
    });

    if (error) {
      throw new PostError(error.message, error.code ?? "POLL_FETCH_FAILED");
    }

    return data === null ? null : parsePollDto(data);
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[polls.queries] Error fetching Poll:", error);
    trackError(toError(error), {
      component: "polls.queries",
      action: "getPollByPostId",
      metadata: { postId },
    });
    throw new PostError("Erro ao buscar enquete", "POLL_FETCH_FAILED");
  }
}

export async function getPollById(pollId: string): Promise<Poll | null> {
  const { data, error } = await supabase
    .from("community_polls")
    .select("post_id")
    .eq("id", pollId)
    .maybeSingle();

  if (error) {
    throw new PostError(error.message, error.code ?? "POLL_FETCH_FAILED");
  }

  return data ? getPollByPostId(data.post_id) : null;
}
