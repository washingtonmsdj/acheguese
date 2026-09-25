import {
  isPlatformCapabilityEnabled,
  isProductModuleEnabled,
} from "./lifecycleRegistry";

type PublicEnv = Partial<Record<string, string>>;

const publicEnv = ((import.meta as ImportMeta & { env?: PublicEnv }).env ?? {}) as PublicEnv;

export const PRELAUNCH_LOCKDOWN_ENABLED =
  (publicEnv.VITE_PRELAUNCH_LOCKDOWN ?? "false") === "true";

export type LaunchSurfaceKey =
  | "home"
  | "profiles"
  | "community"
  | "business"
  | "billing"
  | "gastronomy"
  | "services"
  | "classifieds"
  | "touristPoints"
  | "map"
  | "nearby"
  | "search"
  | "messaging"
  | "education"
  | "jobs"
  | "events"
  | "communityEventsPreview"
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
  profiles: isPlatformCapabilityEnabled("profiles"),
  community: isProductModuleEnabled("community"),
  business: isProductModuleEnabled("business"),
  billing: isProductModuleEnabled("billing"),
  gastronomy: isProductModuleEnabled("gastronomy"),
  services: isProductModuleEnabled("services"),
  classifieds: isProductModuleEnabled("classifieds"),
  touristPoints: isProductModuleEnabled("touristPoints"),
  map: isPlatformCapabilityEnabled("map"),
  nearby: isPlatformCapabilityEnabled("nearby"),
  search: isPlatformCapabilityEnabled("search"),
  messaging: isPlatformCapabilityEnabled("messaging"),
  education: isProductModuleEnabled("education"),
  jobs: isProductModuleEnabled("jobs"),
  events: isProductModuleEnabled("events"),
  communityEventsPreview: isProductModuleEnabled("events"),
  communication: isProductModuleEnabled("communication"),
  mobility: isProductModuleEnabled("mobility"),
  coupons: isProductModuleEnabled("coupons"),
  gamification: isProductModuleEnabled("gamification"),
  publicAnalytics: isProductModuleEnabled("publicAnalytics"),
  communityAlerts: isProductModuleEnabled("communityAlerts"),
  communityIssues: isProductModuleEnabled("communityIssues"),
  communityLostFound: isProductModuleEnabled("communityLostFound"),
  communityCommunication: isProductModuleEnabled("communityCommunication"),
  familySafety: isProductModuleEnabled("familySafety"),
};

const CLASSIFIED_CATEGORY_SURFACES: Partial<Record<string, LaunchSurfaceKey>> = {
  vagas: "jobs",
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
  if (!isLaunchSurfaceEnabled("classifieds")) return false;
  const surface = CLASSIFIED_CATEGORY_SURFACES[categoryId];
  return surface ? isLaunchSurfaceEnabled(surface) : true;
}

export function isLaunchCommunityFeedChannelEnabled(channelId: string): boolean {
  if (!isLaunchSurfaceEnabled("community")) return false;
  const surface = COMMUNITY_FEED_CHANNEL_SURFACES[channelId];
  return surface ? isLaunchSurfaceEnabled(surface) : true;
}

export function isLaunchCommunityPostEnabled(post: {
  content_intent?: string | null;
  display_format?: string | null;
  type?: string | null;
  distribution_channels?: readonly string[] | null;
}): boolean {
  if (!isLaunchSurfaceEnabled("community")) return false;

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

