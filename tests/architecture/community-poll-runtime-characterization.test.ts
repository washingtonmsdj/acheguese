import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

function source(relativePath: string): string {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

describe("community Poll runtime characterization", () => {
  it("creates a Poll post through one authoritative command", () => {
    const composer = source(
      "src/core/community/components/composer/CreatePostModal.tsx",
    );

    expect(composer).toContain("createPollPostWithImages");
  });

  it("casts a vote with one server mutation and no client counter writer", () => {
    const voteHook = source("src/core/community/hooks/usePollVote.ts");

    expect(voteHook.match(/PostsFacade\.polls\.votePoll/g)).toHaveLength(1);
    expect(voteHook).not.toContain("updatePollVoteCounts");
  });

  it("loads Poll state only once in the Post detail path", () => {
    const detailHook = source("src/core/community/hooks/usePostById.ts");
    const interactions = source(
      "src/core/posts/services/posts.user.queries.ts",
    );

    expect(detailHook.match(/getPollByPostId/g)).toHaveLength(1);
    expect(interactions).not.toContain("pollQueries.getPollByPostId");
    expect(interactions).not.toContain('from("community_poll_votes")');
  });
});
