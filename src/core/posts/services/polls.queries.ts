/**
 * Poll read queries.
 */

import { supabase } from "@/integrations/supabase";
import type { Database } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import type { Poll, PollOption } from "../types";
import { PostError } from "../types";

type PollRow = Database["public"]["Tables"]["community_polls"]["Row"];
type PollOptionRow = Database["public"]["Tables"]["community_poll_options"]["Row"];

type PollQueryRow = Omit<PollRow, "options"> & {
  options?: PollOptionRow[] | null;
};

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

function toPoll(row: PollQueryRow): Poll {
  const options = (row.options ?? []).map(toPollOption);
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

async function fetchPoll(column: "id" | "post_id", value: string): Promise<Poll | null> {
  try {
    const { data, error } = await supabase
      .from("community_polls")
      .select(
        `
        *,
        options:community_poll_options(*)
      `,
      )
      .eq(column, value)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new PostError(error.message, error.code);
    }

    return data ? toPoll(data as unknown as PollQueryRow) : null;
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[polls.queries] Error fetching poll:", error);
    trackError(error as Error, {
      component: "polls.queries",
      action: column === "id" ? "getPollById" : "getPollByPostId",
      metadata: { [column]: value },
    });
    throw new PostError("Erro ao buscar enquete", "FETCH_ERROR");
  }
}

export async function getPollById(pollId: string): Promise<Poll | null> {
  return fetchPoll("id", pollId);
}

export async function getPollByPostId(postId: string): Promise<Poll | null> {
  return fetchPoll("post_id", postId);
}
