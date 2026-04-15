/**
 * ModerationService Types - GATE 4A FASE 3
 *
 * Tipos TypeScript para o serviço de moderação
 */

export interface PostReport {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;

  // Relacionamentos
  post?: any;
  reporter?: any;
  reviewer?: any;
}

export interface CommentReport {
  id: string;
  comment_id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;

  // Relacionamentos
  comment?: any;
  post?: any;
  reporter?: any;
  reviewer?: any;
}

export interface ModerationLog {
  id: string;
  action: ModerationAction;
  target_type: "post" | "comment" | "user";
  target_id: string;
  moderator_profile_id: string;
  reason: string;
  evidence?: string[];
  created_at: string;

  // Relacionamentos
  moderator?: any;
}

export interface ModerationStats {
  pending_reports: {
    posts: number;
    comments: number;
    total: number;
  };
  resolved_reports: {
    approved: number;
    rejected: number;
    total: number;
  };
  content_actions: {
    hidden: number;
    removed: number;
    total: number;
  };
}

export interface ModerationFilters {
  status?: "pending" | "approved" | "rejected";
  target_type?: "post" | "comment";
  priority?: "high" | "medium" | "low";
  date_from?: string;
  date_to?: string;
  moderator_profile_id?: string;
  limit?: number;
  offset?: number;
}

export interface LogFilters {
  action?: ModerationAction;
  target_type?: "post" | "comment" | "user";
  moderator_profile_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export type ModerationAction =
  | "approve"
  | "reject"
  | "remove"
  | "hide"
  | "unhide"
  | "warn"
  | "warn_author"
  | "ban_author"
  | "suspend"
  | "ban";

export interface PendingPost {
  id: string;
  content: string;
  type?: string;
  images?: string[];
  author_profile_id: string;
  author_name: string;
  author_avatar: string;
  author_reputation: number;
  author_previous_reports: number;
  reports: any[];
  reports_count: number;
  priority: number;
  created_at: string;
  status: string;
}

export interface PendingComment {
  id: string;
  content: string;
  author_profile_id: string;
  author_name: string;
  author_avatar: string;
  post_id: string;
  reports: any[];
  reports_count: number;
  priority: number;
  created_at: string;
  status: string;
}

export class ModerationError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = "ModerationError";
    this.code = code;
    this.status = status;
  }
}
