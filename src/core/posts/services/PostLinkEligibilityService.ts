import { getPostById } from "@/core/posts/services/posts.queries";
import type { Post } from "@/core/posts/types";
import { logger } from "@/shared/utils/logger";

type PostVisibilityFields = Post & {
  hidden?: boolean | null;
  is_hidden?: boolean | null;
  is_published?: boolean | null;
  is_removed?: boolean | null;
};

export class PostLinkEligibilityService {
  static async isCommunityLinkEligible(postId: string): Promise<boolean> {
    try {
      const post = (await getPostById(postId)) as PostVisibilityFields | null;

      return Boolean(
        post &&
          post.is_published === true &&
          post.is_hidden !== true &&
          post.is_removed !== true &&
          post.hidden !== true,
      );
    } catch (error) {
      logger.warn("Post community link eligibility check failed", {
        postId,
        error,
      });
      return false;
    }
  }
}
