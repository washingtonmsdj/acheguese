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
    expect(page).toContain(
      'from "@/core/community-feed/hooks/useFeedFilters"',
    );
    expect(page).toContain("useCommunityFilters()");
    expect(filters).toContain('const STORAGE_KEY = "community_filters_v2"');
    expect(filters).toContain('locationScope: "neighborhood"');
    expect(filters).toContain("export function useCommunityFilters()");
    expect(
      existsSync(resolve(ROOT, "src/core/community/hooks/useCommunityFiltersAAA.ts")),
    ).toBe(false);
  });


  it("owns Community post detail hook in core/community-feed", () => {
    const page = read("src/core/community-feed/hooks/useComunidadePage.ts");
    expect(page).toContain(
      'from "@/core/community-feed/hooks/usePostById"',
    );
    expect(
      existsSync(resolve(ROOT, "src/core/community-feed/hooks/usePostById.ts")),
    ).toBe(true);
    expect(
      existsSync(resolve(ROOT, "src/core/community/hooks/usePostById.ts")),
    ).toBe(false);
  });


  it("does not recreate the orphaned generic usePost hook", () => {
    expect(
      existsSync(resolve(ROOT, "src/core/community/hooks/usePost.ts")),
    ).toBe(false);
  });


  it("owns Poll UI and vote hook in core/community-feed", () => {
    const pollCard = read("src/core/community-feed/components/PollCard.tsx");
    const postDetail = read(
      "src/core/community-feed/components/PostDetailModal.tsx",
    );

    expect(pollCard).toContain(
      '@/core/community-feed/hooks/usePollVote',
    );
    expect(postDetail).toContain(
      '@/core/community-feed/components/PollCard',
    );

    for (const canonicalPath of [
      "src/core/community-feed/components/PollCard.tsx",
      "src/core/community-feed/hooks/usePollVote.ts",
    ]) {
      expect(existsSync(resolve(ROOT, canonicalPath))).toBe(true);
    }

    for (const retiredPath of [
      "src/core/community/components/PollCard.tsx",
      "src/core/community/hooks/usePollVote.ts",
      "src/core/community/components/detail-modal/CommentInput.tsx",
      "src/core/community/components/detail-modal/CommentsList.tsx",
      "src/core/community/components/detail-modal/DetailModalContent.tsx",
      "src/core/community/components/detail-modal/DetailModalHeader.tsx",
      "src/core/community/components/detail-modal/DetailModalMetrics.tsx",
    ]) {
      expect(existsSync(resolve(ROOT, retiredPath))).toBe(false);
    }
  });


  it("keeps Community territory resolution in routing without a Community facade", () => {
    const shell = read(
      "src/core/routing/components/CommunityTerritorialShell.tsx",
    );

    expect(shell).toContain(
      "@/core/routing/hooks/useResolveTerritoryFromUrl",
    );
    expect(shell).not.toContain("useCommunityScopeResolver");
    expect(
      existsSync(
        resolve(ROOT, "src/core/community/hooks/useCommunityScopeResolver.ts"),
      ),
    ).toBe(false);
  });


  it("owns Feed post/comment moderation hook in core/community-feed", () => {
    const page = read("src/core/community-feed/hooks/useComunidadePage.ts");
    const panel = read(
      "src/core/community-feed/components/comments/PostCommentsPanel.tsx",
    );
    const hook = read("src/core/community-feed/hooks/useModeration.ts");

    expect(page).toContain(
      "@/core/community-feed/hooks/useModeration",
    );
    expect(panel).toContain(
      "@/core/community-feed/hooks/useModeration",
    );
    expect(hook).toContain('targetType: "post"');
    expect(hook).toContain('targetType: "comment"');
    expect(hook).toContain("@/core/community/moderation");
    expect(
      existsSync(resolve(ROOT, "src/core/community/hooks/useModeration.ts")),
    ).toBe(false);
  });


  it("owns the post-context direct-message adapter in core/community-feed", () => {
    const feed = read(
      "src/core/community-feed/components/UnifiedFeedWithMessages.tsx",
    );
    const hook = read("src/core/community-feed/hooks/useMessageModal.ts");

    expect(feed).toContain(
      "@/core/community-feed/hooks/useMessageModal",
    );
    expect(hook).toContain(
      "@/core/community/hooks/useDirectMessages",
    );
    expect(hook).toContain("UnifiedPost");
    expect(
      existsSync(resolve(ROOT, "src/core/community/hooks/useMessageModal.ts")),
    ).toBe(false);
  });


  it("does not recreate the generic Community hooks barrel", () => {
    expect(
      existsSync(resolve(ROOT, "src/core/community/hooks/index.ts")),
    ).toBe(false);
  });


  it("does not recreate retired Community post UI hooks", () => {
    for (const retiredPath of [
      "src/core/community/hooks/composer/useCreatePost.ts",
      "src/core/community/hooks/posts/usePostCard.ts",
    ]) {
      expect(existsSync(resolve(ROOT, retiredPath))).toBe(false);
    }

    const composer = read(
      "src/core/community-feed/components/CreatePostModal.tsx",
    );
    expect(composer).not.toContain("outros dispositivos sincronizados");
    expect(composer).toContain("apagado deste dispositivo");
  });


  it("does not recreate the obsolete Community PostForm", () => {
    expect(
      existsSync(resolve(ROOT, "src/core/community/components/PostForm.tsx")),
    ).toBe(false);

    const composer = read(
      "src/core/community-feed/components/CreatePostModal.tsx",
    );
    expect(composer).toContain("export function CreatePostModal");
  });

});
