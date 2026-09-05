import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("posts vs community_posts SSOT", () => {
  it("keeps functional runtime consumers away from the legacy community_posts table", () => {
    const functionalRuntimeFiles = [
      "src/core/profiles/services/profile.queries.ts",
      "supabase/functions/user-delete-account/index.ts",
      "src/core/community-recommendations/services/CommunityQAService.ts",
    ];

    for (const file of functionalRuntimeFiles) {
      const content = readProjectFile(file);
      expect(content, `Legacy community_posts query in ${file}`).not.toMatch(
        /\.from\(['"]community_posts['"]\)/,
      );
    }
  });

  it("keeps social profile stats and LGPD export profile-scoped on canonical contracts", () => {
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
    expect(exportFunction).toContain(
      "const profileIds = pickStringArray(profiles.map((row) => row.id));",
    );

    const profileScopedExportContracts = [
      ["posts", "posts"],
      ["communityQuestions", "community_questions"],
      ["questionAnswers", "question_answers"],
    ] as const;

    for (const [variableName, tableName] of profileScopedExportContracts) {
      const start = exportFunction.indexOf(
        `const ${variableName} = await requireProfileRows(`,
      );
      expect(start, `${variableName} export contract`).toBeGreaterThanOrEqual(0);
      const contract = exportFunction.slice(start, start + 600);
      expect(contract).toContain(`"${tableName}",`);
      expect(contract).toContain('"author_profile_id",');
      expect(contract).toContain("profileIds,");
    }

    const exportMatrix = JSON.parse(
      readProjectFile(
        "docs/09-reference/governance/privacy/LGPD_EXPORT_MATRIX.json",
      ),
    ) as {
      sections: Array<{ section: string; sources?: string[] }>;
    };
    const authoredContent = exportMatrix.sections.find(
      (section) => section.section === "authored_content",
    );
    expect(authoredContent?.sources).toContain("public.community_posts");

    const communityPostsStart = exportFunction.indexOf(
      "const communityPosts = await requireProfileRows(",
    );
    expect(communityPostsStart).toBeGreaterThanOrEqual(0);
    const communityPostsExport = exportFunction.slice(
      communityPostsStart,
      communityPostsStart + 600,
    );
    expect(communityPostsExport).toContain('"community_posts",');
    expect(communityPostsExport).toContain('"author_profile_id",');
    expect(communityPostsExport).toContain("profileIds,");

    const deleteFunction = readProjectFile(
      "supabase/functions/user-delete-account/index.ts",
    );
    expect(deleteFunction).toMatch(/\.from\('posts'\)/);
    expect(deleteFunction).toMatch(/\.from\('community_questions'\)/);
    expect(deleteFunction).toMatch(/\.from\('question_answers'\)/);
  });

  it("keeps architecture docs from reintroducing the obsolete Q&A table contract", () => {
    const plan = readProjectFile(
      "docs/10-archive/plans/COMMUNITY_FIRST_ARCHITECTURE_PLAN.md",
    );
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
