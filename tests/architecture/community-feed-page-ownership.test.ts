import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 Community feed page ownership", () => {
  it("owns NovoPostPage and its spec only in core/community-feed", () => {
    const canonical = read("src/core/community-feed/pages/NovoPostPage.tsx");
    const lazyImports = read("src/app/routes/lazyImports.ts");

    expect(canonical).toContain('from "@/core/community-feed/components/CreatePostModal"');
    expect(canonical).toContain('from "@/core/community-experience/access"');
    expect(canonical).not.toContain('@/core/community/components/composer/CreatePostModal');
    expect(canonical).not.toContain('from "@/core/community/access"');
    expect(lazyImports).toContain('import("@/core/community-feed/pages/NovoPostPage")');
    expect(existsSync(resolve(ROOT, "src/core/community/pages/NovoPostPage.tsx"))).toBe(false);
    expect(existsSync(resolve(ROOT, "src/core/community-feed/pages/NovoPostPage.spec.tsx"))).toBe(true);
    expect(existsSync(resolve(ROOT, "src/core/community/pages/NovoPostPage.spec.tsx"))).toBe(false);
  });

  it("owns the post composer implementation in core/community-feed", () => {
    const modal = read(
      "src/core/community-feed/components/CreatePostModal.tsx",
    );
    const formHook = read(
      "src/core/community-feed/hooks/useCreatePostForm.ts",
    );
    const communityPage = read(
      "src/core/community-feed/pages/ComunidadePage.tsx",
    );

    expect(modal).toContain(
      "@/core/community-feed/hooks/useCreatePostForm",
    );
    expect(formHook).toContain("export function useCreatePostForm");
    expect(communityPage).toContain(
      "@/core/community-feed/components/CreatePostModal",
    );

    for (const legacyPath of [
      "src/core/community/components/composer/CreatePostModal.tsx",
      "src/core/community/components/composer/CreatePostModal.permissions.ts",
      "src/core/community/components/composer/CreatePostModal.spec.ts",
      "src/core/community/hooks/composer/useCreatePostForm.ts",
      "src/core/community-feed/components/CreatePostModal.ts",
    ]) {
      expect(existsSync(resolve(ROOT, legacyPath))).toBe(false);
    }
  });

  it("owns comments modal only in core/community-feed", () => {
    const commentsModal = read(
      "src/core/community-feed/components/CommentsModal.tsx",
    );
    const communityModals = read(
      "src/core/community-feed/components/page/CommunityModals.tsx",
    );

    expect(commentsModal).toContain("export function CommentsModal");
    expect(communityModals).toContain(
      "@/core/community-feed/components/CommentsModal",
    );
    expect(
      existsSync(resolve(ROOT, "src/core/community/components/CommentsModal.tsx")),
    ).toBe(false);
  });

  it("does not recreate the orphaned legacy sidebar island", () => {
    for (const retiredPath of [
      "src/core/community/components/CommunityRightSidebar.lazy.tsx",
      "src/core/community/components/WidgetErrorBoundary.tsx",
      "src/core/community/components/widgets/TrendingWidget.tsx",
      "src/core/community/components/widgets/SponsoredWidget.tsx",
      "src/core/community/components/widgets/WidgetSkeleton.tsx",
      "src/core/community/hooks/useTrendingTopics.ts",
    ]) {
      expect(existsSync(resolve(ROOT, retiredPath))).toBe(false);
    }
  });

  it("owns post comments UI and feed-scoped hooks in core/community-feed", () => {
    const panel = read(
      "src/core/community-feed/components/comments/PostCommentsPanel.tsx",
    );
    const commentsModal = read(
      "src/core/community-feed/components/CommentsModal.tsx",
    );
    const postDetailModal = read(
      "src/core/community-feed/components/PostDetailModal.tsx",
    );
    const communityHooks = read("src/core/community/hooks/index.ts");

    expect(panel).toContain(
      "@/core/community-feed/hooks/comments/useComments",
    );
    expect(panel).toContain(
      "@/core/community-feed/hooks/comments/useCommentActions",
    );
    expect(panel).toContain(
      "@/core/community-feed/hooks/comments/useCommentInteractions",
    );
    expect(commentsModal).toContain(
      "@/core/community-feed/components/comments/PostCommentsPanel",
    );
    expect(postDetailModal).toContain(
      "@/core/community-feed/components/comments/PostCommentsPanel",
    );
    expect(communityHooks).not.toContain('export { useComments }');

    for (const canonicalPath of [
      "src/core/community-feed/components/comments/CommentItem.tsx",
      "src/core/community-feed/components/comments/CommentsList.tsx",
      "src/core/community-feed/components/comments/CommentsModalComposer.tsx",
      "src/core/community-feed/components/comments/PostCommentsPanel.tsx",
      "src/core/community-feed/hooks/comments/useComments.ts",
      "src/core/community-feed/hooks/comments/useCommentActions.ts",
      "src/core/community-feed/hooks/comments/useCommentInteractions.ts",
    ]) {
      expect(existsSync(resolve(ROOT, canonicalPath))).toBe(true);
    }

    for (const legacyPath of [
      "src/core/community/components/comments/CommentItem.tsx",
      "src/core/community/components/comments/CommentsList.tsx",
      "src/core/community/components/comments/CommentsModalComposer.tsx",
      "src/core/community/components/comments/PostCommentsPanel.tsx",
      "src/core/community/hooks/useComments.ts",
      "src/core/community/hooks/useCommentActions.ts",
      "src/core/community/hooks/useCommentInteractions.ts",
    ]) {
      expect(existsSync(resolve(ROOT, legacyPath))).toBe(false);
    }
  });


  it("uses one Community Feed filter owner", () => {
    const page = read("src/core/community-feed/hooks/useComunidadePage.ts");
    const filters = read("src/core/community-feed/hooks/useFeedFilters.ts");
    const communityHooks = read("src/core/community/hooks/index.ts");

    expect(page).toContain(
      'from "@/core/community-feed/hooks/useFeedFilters"',
    );
    expect(page).toContain("useCommunityFilters()");
    expect(filters).toContain('const STORAGE_KEY = "community_filters_v2"');
    expect(filters).toContain('locationScope: "neighborhood"');
    expect(filters).toContain("export function useCommunityFilters()");
    expect(communityHooks).not.toContain("useFeedFilters");
    expect(
      existsSync(resolve(ROOT, "src/core/community/hooks/useCommunityFiltersAAA.ts")),
    ).toBe(false);
  });

});
