export type CommunitySocialView = "feed" | "groups" | "discussions";

export type CommunityModulePreviewView =
  | "business"
  | "services"
  | "classifieds"
  | "gastronomy";

export type CommunityOverviewView = CommunitySocialView | CommunityModulePreviewView;

export type CommunityOverviewSection = CommunityOverviewView | "map";

const COMMUNITY_OVERVIEW_VIEWS = new Set<string>([
  "feed",
  "groups",
  "discussions",
  "business",
  "services",
  "classifieds",
  "gastronomy",
]);

const COMMUNITY_SOCIAL_VIEWS = new Set<string>(["feed", "groups", "discussions"]);

export function isCommunityOverviewView(
  view: string | null | undefined,
): view is CommunityOverviewView {
  return Boolean(view && COMMUNITY_OVERVIEW_VIEWS.has(view));
}

export function isCommunitySocialView(
  view: CommunityOverviewSection | null | undefined,
): view is CommunitySocialView {
  return Boolean(view && COMMUNITY_SOCIAL_VIEWS.has(view));
}
