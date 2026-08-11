/**
 * Authoritative Poll commands.
 *
 * The browser invokes one PostgreSQL transaction per command and never writes
 * Poll tables or counters directly.
 */

import { supabase } from "@/integrations/supabase";
import type { Json } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import type { Post, Poll } from "../types";
import { PostError } from "../types";
import { parsePollDto } from "./polls.queries";
import * as postQueries from "./posts.queries";

export interface CreatePollPostCommand {
  author_profile_id: string;
  content: string;
  location_id: string;
  reach?: "street" | "neighborhood" | "city";
  images?: string[];
  tags?: string[];
  content_intent?: string;
  distribution_channels?: string[];
  content_payload?: Json;
  poll: {
    question: string;
    options: string[];
    duration_days: number;
    allow_multiple_choice: boolean;
    allow_comments: boolean;
  };
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

function readCreatedPostId(value: Json): string {
  if (
    value === null ||
    Array.isArray(value) ||
    typeof value !== "object" ||
    typeof value.id !== "string"
  ) {
    throw new PostError(
      "Resposta invalida ao criar enquete",
      "INVALID_POLL_CREATE_RESPONSE",
    );
  }

  return value.id;
}

export async function createPostWithPoll(
  command: CreatePollPostCommand,
): Promise<Post> {
  try {
    const payload: Json = {
      author_profile_id: command.author_profile_id,
      content: command.content,
      location_id: command.location_id,
      reach: command.reach ?? "neighborhood",
      images: command.images ?? [],
      tags: command.tags ?? [],
      content_intent: command.content_intent ?? null,
      display_format: "poll_card",
      distribution_channels: command.distribution_channels ?? [],
      content_payload: command.content_payload ?? {},
      poll: {
        question: command.poll.question,
        options: command.poll.options,
        duration_days: command.poll.duration_days,
        allow_multiple_choice: command.poll.allow_multiple_choice,
        allow_comments: command.poll.allow_comments,
      },
    };

    const { data, error } = await supabase.rpc("create_post_with_poll", {
      payload,
    });

    if (error) {
      throw new PostError(error.message, error.code ?? "POLL_CREATE_FAILED");
    }

    const postId = readCreatedPostId(data);
    const post = await postQueries.getPostById(postId);
    if (!post) {
      throw new PostError(
        "Post da enquete nao encontrado apos criacao",
        "POLL_POST_NOT_FOUND",
      );
    }

    return post;
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[polls.mutations] Error creating Poll Post:", error);
    trackError(toError(error), {
      component: "polls.mutations",
      action: "createPostWithPoll",
      metadata: { locationId: command.location_id },
    });
    throw new PostError("Erro ao criar enquete", "POLL_CREATE_FAILED");
  }
}

export async function votePoll(
  pollId: string,
  optionId: string,
  profileId: string,
): Promise<Poll> {
  try {
    const { data, error } = await supabase.rpc("cast_community_poll_vote", {
      p_poll_id: pollId,
      p_option_id: optionId,
      p_profile_id: profileId,
    });

    if (error) {
      throw new PostError(error.message, error.code ?? "POLL_VOTE_FAILED");
    }

    return parsePollDto(data);
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[polls.mutations] Error voting in Poll:", error);
    trackError(toError(error), {
      component: "polls.mutations",
      action: "votePoll",
      metadata: { pollId, optionId, profileId },
    });
    throw new PostError("Erro ao registrar voto", "POLL_VOTE_FAILED");
  }
}
