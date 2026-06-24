export type LaunchSurfaceKey =
  | "home"
  | "community"
  | "business"
  | "gastronomy"
  | "services"
  | "classifieds"
  | "touristPoints"
  | "map"
  | "nearby"
  | "search"
  | "education"
  | "jobs"
  | "events"
  | "communication"
  | "mobility"
  | "coupons"
  | "gamification"
  | "publicAnalytics"
  | "communityAlerts"
  | "communityIssues"
  | "communityLostFound"
  | "communityCommunication"
  | "familySafety";

export const PUBLIC_LAUNCH_SURFACES: Record<LaunchSurfaceKey, boolean> = {
  home: true,
  community: true,
  business: true,
  gastronomy: true,
  services: true,
  classifieds: true,
  touristPoints: true,
  map: true,
  nearby: true,
  search: true,
  education: false,
  jobs: false,
  events: false,
  communication: false,
  mobility: false,
  coupons: false,
  gamification: false,
  publicAnalytics: false,
  communityAlerts: false,
  communityIssues: false,
  communityLostFound: false,
  communityCommunication: false,
  familySafety: false,
};

const NAV_ITEM_SURFACES: Partial<Record<string, LaunchSurfaceKey>> = {
  home: "home",
  neighborhood: "community",
  community: "community",
  business: "business",
  gastronomy: "gastronomy",
  services: "services",
  education: "education",
  classifieds: "classifieds",
  jobs: "jobs",
  events: "events",
  nearby: "nearby",
  map: "map",
  mobility: "mobility",
  search: "search",
};

const CLASSIFIED_CATEGORY_SURFACES: Partial<Record<string, LaunchSurfaceKey>> = {
  vagas: "jobs",
};

const BUSINESS_CATEGORY_SURFACES: Partial<Record<string, LaunchSurfaceKey>> = {
  educacao: "education",
};

const COMMUNITY_FEED_CHANNEL_SURFACES: Partial<Record<string, LaunchSurfaceKey>> = {
  alertas: "communityAlerts",
  eventos: "events",
  oportunidades: "jobs",
  vagas: "jobs",
};

const COMMUNITY_POST_INTENT_SURFACES: Partial<Record<string, LaunchSurfaceKey>> = {
  alerta_urgente: "communityAlerts",
  reportar_problema: "communityIssues",
  evento: "events",
  mutirao: "events",
  encontro: "events",
  oportunidade: "jobs",
  vaga: "jobs",
  promocao: "coupons",
};

const COMMUNITY_POST_FORMAT_SURFACES: Partial<Record<string, LaunchSurfaceKey>> = {
  event_card: "events",
  opportunity_card: "jobs",
  issue_card: "communityIssues",
};

export function isLaunchSurfaceEnabled(surface: LaunchSurfaceKey): boolean {
  return PUBLIC_LAUNCH_SURFACES[surface];
}

export function isLaunchClassifiedCategoryEnabled(categoryId: string): boolean {
  const surface = CLASSIFIED_CATEGORY_SURFACES[categoryId];
  return surface ? isLaunchSurfaceEnabled(surface) : true;
}

export function isLaunchBusinessCategoryEnabled(categoryId: string): boolean {
  const surface = BUSINESS_CATEGORY_SURFACES[categoryId];
  return surface ? isLaunchSurfaceEnabled(surface) : true;
}

export function isLaunchCommunityFeedChannelEnabled(channelId: string): boolean {
  const surface = COMMUNITY_FEED_CHANNEL_SURFACES[channelId];
  return surface ? isLaunchSurfaceEnabled(surface) : true;
}

export function isLaunchCommunityPostEnabled(post: {
  content_intent?: string | null;
  display_format?: string | null;
  type?: string | null;
  distribution_channels?: readonly string[] | null;
}): boolean {
  const intentSurface = post.content_intent
    ? COMMUNITY_POST_INTENT_SURFACES[post.content_intent]
    : undefined;
  if (intentSurface && !isLaunchSurfaceEnabled(intentSurface)) return false;

  const formatSurface = post.display_format
    ? COMMUNITY_POST_FORMAT_SURFACES[post.display_format]
    : undefined;
  if (formatSurface && !isLaunchSurfaceEnabled(formatSurface)) return false;

  const typeSurface = post.type ? COMMUNITY_POST_INTENT_SURFACES[post.type] : undefined;
  if (typeSurface && !isLaunchSurfaceEnabled(typeSurface)) return false;

  return (post.distribution_channels ?? []).every(isLaunchCommunityFeedChannelEnabled);
}

export function isLaunchNavItemEnabled(id: string): boolean {
  const surface = NAV_ITEM_SURFACES[id];
  return surface ? isLaunchSurfaceEnabled(surface) : true;
}

export function filterLaunchItems<T extends { id: string }>(items: readonly T[]): T[] {
  return items.filter((item) => isLaunchNavItemEnabled(item.id));
}

export function filterLaunchSections<T extends { items: readonly { id: string }[] }>(
  sections: readonly T[],
): T[] {
  return sections
    .map((section) => ({
      ...section,
      items: filterLaunchItems(section.items),
    }))
    .filter((section) => section.items.length > 0) as T[];
}
