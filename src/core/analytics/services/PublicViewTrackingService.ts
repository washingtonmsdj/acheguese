import { logger } from "@/shared/utils/logger";

export type PublicViewEntityType = "business" | "professional" | "vaga";

interface PublicViewTrackingPayload {
  entityType: PublicViewEntityType;
  entityId: string;
}

async function postPublicView(payload: PublicViewTrackingPayload): Promise<void> {
  const { PUBLIC_SUPABASE_CONFIG, buildSupabaseFunctionUrl } = await import(
    "@/shared/config/publicSupabase"
  );

  const response = await fetch(buildSupabaseFunctionUrl("track-public-view"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: PUBLIC_SUPABASE_CONFIG.publishableKey,
      Authorization: `Bearer ${PUBLIC_SUPABASE_CONFIG.publishableKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    logger.warn("[PublicViewTrackingService] View tracking rejected", {
      entityType: payload.entityType,
      status: response.status,
    });
  }
}

export const PublicViewTrackingService = {
  async track(entityType: PublicViewEntityType, entityId: string): Promise<void> {
    if (!entityId) return;

    try {
      await postPublicView({ entityType, entityId });
    } catch (error) {
      logger.warn("[PublicViewTrackingService] View tracking failed", error);
    }
  },
};
