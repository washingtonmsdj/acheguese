import type {
  IssueCategory,
  IssuePriority,
  IssueStatus,
} from "@/core/community/issues";
import type { ISSUE_REPORT_REASON_LABELS } from "@/core/community/issues";

export type IssueAdminItem = {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  neighborhood_display: string;
  city: string;
  status: IssueStatus;
  priority: IssuePriority;
  support_count?: number;
  report_count: number;
  created_at: string;
  under_review?: boolean;
  reports?: Array<{ id: string; reason: keyof typeof ISSUE_REPORT_REASON_LABELS }>;
};

export type IssueStatsSummary = {
  total: number;
  aberto: number;
  em_andamento: number;
  resolvido: number;
  underReview: number;
};

export type IssueResolutionRate = {
  rate: number;
  resolved: number;
  total: number;
};
