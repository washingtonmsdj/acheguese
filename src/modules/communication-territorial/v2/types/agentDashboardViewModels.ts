export type DashboardView =
  | "overview"
  | "publications"
  | "drafts"
  | "analytics"
  | "territories"
  | "schedule"
  | "team";

export interface DashboardChannelView {
  id: string;
  slug: string;
  public_name?: string;
  name?: string;
  verification_status?: string;
  description?: string;
}

export interface DashboardPublicationView {
  id: string;
  title?: string;
  content?: string;
  body?: string;
  media_url?: string;
  created_at: string;
  updated_at?: string;
  scheduled_at?: string | null;
  status?: string;
}

export interface DashboardTerritoryView {
  id: string;
  name?: string;
  city?: string;
  state?: string;
}

export type DashboardTeamMemberView = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type DashboardActivityView = {
  type: "publish" | "edit" | "delete" | "draft";
  title: string;
  time: string;
};
