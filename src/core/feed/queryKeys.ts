export const communityFeedQueryKeys = {
  root: ["community-feed"] as const,
  list: (locationScope: string, territoryKey: string) =>
    ["community-feed", locationScope, territoryKey] as const,
} as const;
