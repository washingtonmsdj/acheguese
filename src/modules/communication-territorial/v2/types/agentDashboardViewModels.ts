import type {
  CommunicationChannel,
  CommunicationPublication,
  CommunicationChannelTerritory,
} from "../../types";

export type DashboardView =
  | "overview"
  | "publications"
  | "drafts"
  | "analytics"
  | "territories"
  | "schedule"
  | "team";

export type DashboardChannelView = CommunicationChannel;

export type DashboardPublicationView = CommunicationPublication;

export type DashboardTerritoryView = CommunicationChannelTerritory & {
  city?: string;
  state?: string;
};

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
