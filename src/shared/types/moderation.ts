import { RIDE_STATUS, USER_ROLE } from "@/shared/types/constants";
// Types para o sistema de moderação

export type ReportType =
  | "spam"
  | "offensive_content"
  | "false_information"
  | "harassment"
  | "inappropriate_content"
  | "privacy_violation"
  | "other";

export type ModerationAction =
  | "approve"
  | "remove"
  | "hide"
  | "ban_author"
  | "warn_author"
  | "reject";

export type ModerationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "removed";

export type ModeratorLevel = 1 | 2 | 3 | 4;

export interface Report {
  id: string;
  target_type: "post" | "comment";
  target_id: string;
  reporter_id: string;
  reporter_name: string;
  reporter_avatar: string;
  type: ReportType;
  reason: string;
  description?: string;
  evidence_urls?: string[];
  priority: number;
  status: ModerationStatus;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface PendingPost {
  id: string;
  content: string;
  type: string;
  images?: string[];
  author_profile_id: string;
  author_name: string;
  author_avatar: string;
  author_reputation: number;
  author_previous_reports: number;
  reports: Report[];
  reports_count: number;
  priority: number;
  created_at: string;
  status: ModerationStatus;
}

export interface PendingComment {
  id: string;
  content: string;
  post_id: string;
  created_at: string;
  author: {
    id: string;
    name_completo: string;
    avatar_url: string;
    reputation: number;
  };
  post: {
    id: string;
    content: string;
    type: string;
  };
  reports: Array<{
    id: string;
    type: ReportType;
    reason: string;
    status: ModerationStatus;
    created_at: string;
    reporter: {
      id: string;
      name_completo: string;
      avatar_url: string;
    };
  }>;
  priority: number;
  priority_label: "high" | "medium" | "low";
}

export interface ModerationLog {
  id: string;
  action: ModerationAction;
  target_type: "post" | "comment" | "user";
  target_id: string;
  moderator_profile_id: string;
  moderator_name: string;
  reason: string;
  evidence?: string[];
  created_at: string;
  reversed_at?: string;
  reversed_by?: string;
  reversed_reason?: string;
}

export interface ProblematicUser {
  id: string;
  name: string;
  avatar_url: string;
  reputation: number;
  infractions_count: number;
  warnings_count: number;
  reports_count: number;
  last_infraction_at: string;
  is_banned: boolean;
  ban_expires_at?: string;
  ban_reason?: string;
}

export interface ModerationStats {
  pending_posts: number;
  pending_comments: number;
  disputes: number;
  reports: number;
  banned_users: number;
  avg_resolution_time: string;
  today_resolved: number;
  today_reports: number;
}

export interface ModerationFilters {
  status?: ModerationStatus[];
  type?: ReportType[];
  priority?: "high" | "medium" | "low";
  dateFrom?: Date;
  dateTo?: Date;
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  spam: "Spam",
  offensive_content: "Conteúdo Ofensivo",
  false_information: "Informação Falsa",
  harassment: "Assédio",
  inappropriate_content: "Conteúdo Inapropriado",
  privacy_violation: "Violação de Privacity",
  other: "Outro",
};

export const PRIORITY_COLORS = {
  high: {
    bg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.3)",
    text: "#F87171",
  },
  medium: {
    bg: "rgba(251, 191, 36, 0.1)",
    border: "rgba(251, 191, 36, 0.3)",
    text: "#FCD34D",
  },
  low: {
    bg: "rgba(34, 197, 94, 0.1)",
    border: "rgba(34, 197, 94, 0.3)",
    text: "#4ADE80",
  },
};

export const STATUS_COLORS = {
  pending: {
    bg: "rgba(251, 191, 36, 0.1)",
    border: "rgba(251, 191, 36, 0.3)",
    text: "#FCD34D",
  },
  under_review: {
    bg: "rgba(59, 130, 246, 0.1)",
    border: "rgba(59, 130, 246, 0.3)",
    text: "#60A5FA",
  },
  approved: {
    bg: "rgba(34, 197, 94, 0.1)",
    border: "rgba(34, 197, 94, 0.3)",
    text: "#4ADE80",
  },
  rejected: {
    bg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.3)",
    text: "#F87171",
  },
  removed: {
    bg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.3)",
    text: "#F87171",
  },
};

export function getPriorityLevel(priority: number): "high" | "medium" | "low" {
  if (priority >= 50) return "high";
  if (priority >= 20) return "medium";
  return "low";
}
