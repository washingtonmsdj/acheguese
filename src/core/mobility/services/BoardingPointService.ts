import { supabase } from "@/core/supabase";
import { logger } from "@/shared/utils/logger";

export interface BoardingPointSuggestionInput {
  name: string;
  address: string;
}

export interface BoardingPointSummary {
  id: string;
  name: string;
  description: string;
  type: "mercado" | "praca" | "padaria" | "escola" | "igreja" | "cafe" | "outro";
  address: string;
  popular: boolean;
  rides_count: number;
}

interface PickupLocationJoin {
  id?: string;
  name?: string;
  full_name?: string;
  type?: string;
  geographic_path?: string;
}

function classifyLocationType(locationName: string, locationType?: string): BoardingPointSummary["type"] {
  const normalized = `${locationType ?? ""} ${locationName}`.toLowerCase();
  if (normalized.includes("mercado") || normalized.includes("supermercado")) return "mercado";
  if (normalized.includes("praça") || normalized.includes("praca") || normalized.includes("parque")) return "praca";
  if (normalized.includes("padaria")) return "padaria";
  if (normalized.includes("escola") || normalized.includes("colégio") || normalized.includes("colegio")) return "escola";
  if (normalized.includes("igreja") || normalized.includes("templo")) return "igreja";
  if (normalized.includes("cafe") || normalized.includes("cafeteria")) return "cafe";
  return "outro";
}

export class BoardingPointService {
  static async listMostUsedPoints(limit = 20): Promise<BoardingPointSummary[]> {
    try {
      const { data, error } = await supabase
        .from("ride_requests")
        .select(
          `
            pickup_location_id,
            pickup_location:locations!ride_requests_pickup_location_id_fkey (
              id,
              name,
              full_name,
              type,
              geographic_path
            )
          `,
        )
        .not("pickup_location_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(300);

      if (error) {
        logger.error("[BoardingPointService] Error fetching ride pickup points:", error);
        return [];
      }

      const aggregate = new Map<string, { location: PickupLocationJoin; ridesCount: number }>();
      for (const rawRow of data ?? []) {
        const row = rawRow as { pickup_location_id?: string; pickup_location?: PickupLocationJoin | PickupLocationJoin[] };
        const location = Array.isArray(row.pickup_location) ? row.pickup_location[0] : row.pickup_location;
        const locationId = row.pickup_location_id ?? location?.id;
        if (!locationId || !location?.name) continue;

        const existing = aggregate.get(locationId);
        if (existing) {
          existing.ridesCount += 1;
        } else {
          aggregate.set(locationId, {
            location,
            ridesCount: 1,
          });
        }
      }

      return Array.from(aggregate.entries())
        .map(([id, value]) => {
          const locationName = value.location.name ?? "Ponto sem nome";
          const address = value.location.full_name ?? locationName;
          return {
            id,
            name: locationName,
            description: `Ponto recorrente de embarque na região`,
            type: classifyLocationType(locationName, value.location.type),
            address,
            popular: value.ridesCount >= 5,
            rides_count: value.ridesCount,
          } satisfies BoardingPointSummary;
        })
        .sort((left, right) => right.rides_count - left.rides_count)
        .slice(0, limit);
    } catch (error) {
      logger.error("[BoardingPointService] Unexpected error listing boarding points:", error);
      return [];
    }
  }

  static async submitSuggestion(_input: BoardingPointSuggestionInput): Promise<{ accepted: boolean }> {
    // Sem tabela canônica de sugestões no banco no momento.
    return { accepted: false };
  }
}

