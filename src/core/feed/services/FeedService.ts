import { postService } from "@/core/posts/services";
import { SessionService } from "@/core/session/services/SessionService";
import type {
  Post,
  FeedParams,
  FeedResult,
  CreatePostData,
  UpdatePostData,
} from "../types";
import { FeedError } from "../types";

class FeedService {
  private adaptPost(post: unknown): Post {
    return post as Post;
  }

  async getFeed(params: FeedParams = {}): Promise<FeedResult> {
    try {
      const {
        location_id,
        location_ids,
        district_filter,
        city_filter,
        context = "all",
        cursor,
        limit = 20,
      } = params;

      const user = await SessionService.getCurrentUser();
      if ((context === "my_posts" || context === "saved") && !user) {
        throw new FeedError("User not authenticated", "UNAUTHENTICATED", 401);
      }

      const result = await postService.getFeed({
        location_id,
        location_ids,
        district_filter,
        city_filter,
        cursor,
        limit: limit + 1,
      });

      const posts = result.posts.map((post) => this.adaptPost(post));
      const hasMore = posts.length > limit;
      const resultPosts = hasMore ? posts.slice(0, limit) : posts;

      const nextCursor =
        hasMore && resultPosts.length > 0
          ? this.encodeCursor({
              created_at: resultPosts[resultPosts.length - 1].created_at,
            })
          : undefined;

      return { posts: resultPosts, nextCursor, hasMore };
    } catch (error) {
      if (error instanceof FeedError) throw error;
      throw new FeedError("Unexpected error fetching feed", "UNKNOWN_ERROR");
    }
  }

  async getPostById(postId: string): Promise<Post | null> {
    try {
      const post = await postService.getPostById(postId);
      return post ? this.adaptPost(post) : null;
    } catch (error) {
      if (error instanceof FeedError) throw error;
      throw new FeedError("Unexpected error fetching post", "UNKNOWN_ERROR");
    }
  }

  async createPost(profileId: string, data: CreatePostData): Promise<Post> {
    try {
      const created = await postService.createPost({
        author_profile_id: profileId,
        content: data.content,
        type: data.type,
        location_id: (data as { location_id?: string }).location_id || "",
      });
      return this.adaptPost(created);
    } catch (error) {
      if (error instanceof FeedError) throw error;
      throw new FeedError("Unexpected error creating post", "UNKNOWN_ERROR");
    }
  }

  async updatePost(postId: string, data: UpdatePostData): Promise<Post> {
    try {
      const updated = await postService.updatePost(postId, data);
      return this.adaptPost(updated);
    } catch (error) {
      if (error instanceof FeedError) throw error;
      throw new FeedError("Unexpected error updating post", "UNKNOWN_ERROR");
    }
  }

  async deletePost(postId: string): Promise<void> {
    try {
      await postService.deletePost(postId);
    } catch (error) {
      if (error instanceof FeedError) throw error;
      throw new FeedError("Unexpected error deleting post", "UNKNOWN_ERROR");
    }
  }

  private encodeCursor(data: { created_at: string }): string {
    return Buffer.from(JSON.stringify(data)).toString("base64");
  }
}

export const feedService = new FeedService();
