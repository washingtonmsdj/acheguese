/**
 * CommentService Types - GATE 4A FASE 2
 *
 * Tipos TypeScript para o serviço de comentários
 */

import type { ProfileSummary } from "@/core/profiles/views/ProfileSummary";

export interface Comment {
  id: string;
  post_id: string;
  author_profile_id: string;
  content: string;
  parent_id?: string | null;
  likes_count: number;
  created_at: string;
  updated_at: string;

  // Relacionamentos
  profile?: ProfileSummary;
}

export interface CommentWithReplies extends Comment {
  replies: Comment[];
}

export interface CreateCommentData {
  content: string;
  parent_id?: string | null;
}

export interface UpdateCommentData {
  content?: string;
}

export interface CommentStats {
  likes_count: number;
  replies_count: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export class CommentError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = "CommentError";
    this.code = code;
    this.status = status;
  }
}
