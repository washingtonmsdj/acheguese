import { z } from "zod";
import type { Coordinates } from "@/core/geospatial";
import type { TerritoryFilter } from "@/core/location/types";

export const AIIntentTypeSchema = z.enum([
  "business_search",
  "service_search",
  "unknown",
]);

export type AIIntentType = z.infer<typeof AIIntentTypeSchema>;

export const AIIntentFiltersSchema = z.object({
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  radiusKm: z.number().min(0.5).max(50).optional(),
  delivery: z.boolean().optional(),
  urgent: z.boolean().optional(),
  priceHint: z.enum(["cheap", "regular", "premium"]).optional(),
});

export const AIIntentSchema = z.object({
  type: AIIntentTypeSchema,
  query: z.string().min(1),
  normalizedQuery: z.string().min(1),
  confidence: z.number().min(0).max(1),
  filters: AIIntentFiltersSchema.default({ tags: [] }),
  source: z.enum(["ai", "fallback"]),
});

export type AIIntent = z.infer<typeof AIIntentSchema>;
export type AIIntentFilters = z.infer<typeof AIIntentFiltersSchema>;

export interface IntentParserInput {
  query: string;
  locationId?: string;
}

export interface AIProvider {
  parseIntent(input: IntentParserInput): Promise<unknown>;
}

export interface AISearchContext {
  locationId?: string;
  territoryFilter?: TerritoryFilter;
  territoryLabel?: string;
  coordinates?: Coordinates | null;
}

export type AIActionContext = AISearchContext;

export type AIResultKind = "business" | "service";

export interface AIActionResultItem {
  id: string;
  kind: AIResultKind;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  url?: string;
  rating?: number;
  distanceMeters?: number;
  badges: string[];
}

export interface AIActionResult {
  intent: AIIntent;
  items: AIActionResultItem[];
  message: string;
}

export interface AIOrchestratorSearchInput {
  query: string;
  context: AISearchContext;
}
