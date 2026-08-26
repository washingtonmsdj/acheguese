import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("posts vs community_posts SSOT", () => {
  it("keeps runtime consumers away from the legacy community_posts table", () => {
    const runtimeFiles = [
      "src/core/profiles/services/profile.queries.ts",
      "supabase/functions/user-export-data/index.ts",
      "supabase/functions/user-delete-account/index.ts",
      "src/core/community/services/CommunityQAService.ts",
    ];

    for (const file of runtimeFiles) {
      const content = readProjectFile(file);
      expect(content, `Legacy community_posts query in ${file}`).not.toMatch(
        /\.from\(['"]community_posts['"]\)/,
      );
    }
  });

  it("keeps social feed, profile stats, and LGPD flows on canonical tables", () => {
    const profileQueries = readProjectFile(
      "src/core/profiles/services/profile.queries.ts",
    );
    expect(profileQueries).toMatch(
      /postService\.getPostsCountByAuthor\(activeProfile\.id\)/,
    );

    const exportFunction = readProjectFile(
      "supabase/functions/user-export-data/index.ts",
    );
    expect(exportFunction).not.toMatch(/\.single\(\)/);
    expect(exportFunction).toMatch(/const profileIds = \(profiles \?\? \[\]\)/);
    expect(exportFunction).toMatch(/\.from\('posts'\)/);
    expect(exportFunction).toMatch(/\.from\('community_questions'\)/);
    expect(exportFunction).toMatch(/\.from\('question_answers'\)/);

    const deleteFunction = readProjectFile(
      "supabase/functions/user-delete-account/index.ts",
    );
    expect(deleteFunction).toMatch(/\.from\('posts'\)/);
    expect(deleteFunction).toMatch(/\.from\('community_questions'\)/);
    expect(deleteFunction).toMatch(/\.from\('question_answers'\)/);
  });

  it("keeps architecture docs from reintroducing the obsolete Q&A table contract", () => {
    const plan = readProjectFile("plans/COMMUNITY_FIRST_ARCHITECTURE_PLAN.md");
    expect(plan).toMatch(
      /community_posts.*nao deve ser consultada por runtime/i,
    );

    const postsArchitecture = readProjectFile(
      "docs/07-modules/ARQUITETURA_POSTS_SSOT.md",
    );
    expect(postsArchitecture).toMatch(/community_questions/);
    expect(postsArchitecture).toMatch(/question_answers/);
    expect(postsArchitecture).not.toMatch(
      /CommunityQAService[\s\S]{0,160}community_posts/,
    );

    const communityArchitecture = readProjectFile(
      "docs/03-architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md",
    );
    expect(communityArchitecture).toMatch(/Posts\/feed: `posts`/);
    expect(communityArchitecture).toMatch(
      /community_questions[\s\S]*question_answers/,
    );
  });
});
