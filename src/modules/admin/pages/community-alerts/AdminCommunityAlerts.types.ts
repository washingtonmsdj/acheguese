import type {
  AlertCategory,
  AlertStatus,
} from "@/core/community/alerts";
import type { ALERT_REPORT_REASON_LABELS } from "@/core/community/alerts";

export type AlertAdminItem = {
  id: string;
  category: AlertCategory;
  neighborhood_display: string;
  city: string;
  description: string;
  status: AlertStatus;
  under_review?: boolean;
  report_count: number;
  created_at: string;
  reports?: Array<{ id: string; reason: keyof typeof ALERT_REPORT_REASON_LABELS }>;
};

export type BlockedTermItem = {
  id: string;
  term: string;
  is_active: boolean;
};

export type AlertStatsSummary = {
  total: number;
  active: number;
  underReview: number;
  totalReports: number;
  avgReportsPerAlert: number;
};
