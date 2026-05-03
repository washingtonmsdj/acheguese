import type { TerritoryFilter } from "@/core/location";
import {
  lostFoundService,
  type LostFoundComment,
  type LostFoundPost,
} from "@/modules/community/lostfound/services/LostFoundService";

class LostFoundRuntimeService {
  async getPosts(
    filters: {
      tipo?: "perdido" | "achado";
      categoria?: string;
      resolvido?: boolean;
      territoryFilter?: TerritoryFilter;
    } = {},
  ): Promise<LostFoundPost[]> {
    return lostFoundService.getPosts(filters);
  }

  async getPostById(id: string): Promise<LostFoundPost | null> {
    return lostFoundService.getPostById(id);
  }

  async createPost(
    postData: Omit<LostFoundPost, "id" | "created_at" | "updated_at">,
  ): Promise<LostFoundPost | null> {
    return lostFoundService.createPost(postData);
  }

  async updatePost(id: string, updates: Partial<LostFoundPost>): Promise<boolean> {
    return lostFoundService.updatePost(id, updates);
  }

  async toggleResolved(id: string): Promise<boolean> {
    const post = await this.getPostById(id);
    if (!post) return false;
    return this.updatePost(id, { resolvido: !post.resolvido });
  }

  async getComments(postId: string): Promise<LostFoundComment[]> {
    return lostFoundService.getComments(postId);
  }

  async createComment(
    commentData: Omit<LostFoundComment, "id" | "created_at">,
  ): Promise<LostFoundComment | null> {
    return lostFoundService.createComment(commentData);
  }

  async getPostsPage(
    filters: { tipo?: string; categoria?: string; territoryFilter?: TerritoryFilter } = {},
    from: number,
    to: number,
  ): Promise<LostFoundPost[]> {
    return lostFoundService.getPostsPage(filters, from, to);
  }
}

export const lostFoundRuntimeService = new LostFoundRuntimeService();
export { lostFoundService };
export { lostFoundRuntimeService as LostFoundService };
export type { LostFoundComment, LostFoundPost };
