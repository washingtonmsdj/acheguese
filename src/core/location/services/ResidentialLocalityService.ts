import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

export interface ResidentialLocality {
  id: string;
  city_location_id: string;
  slug: string;
  name: string;
  status: "active" | "pending_review" | "inactive";
  source: string;
  aliases: string[];
  metadata: Record<string, unknown>;
}

function toResidentialLocality(row: Record<string, unknown>): ResidentialLocality {
  return {
    id: String(row.id),
    city_location_id: String(row.city_location_id),
    slug: String(row.slug),
    name: String(row.name),
    status: row.status as ResidentialLocality["status"],
    source: String(row.source),
    aliases: Array.isArray(row.aliases) ? (row.aliases as string[]) : [],
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
}

export class ResidentialLocalityService {
  async listActiveByCity(cityLocationId: string): Promise<ResidentialLocality[]> {
    if (!cityLocationId) return [];

    const { data, error } = await supabase
      .from("residential_localities" as never)
      .select("*")
      .eq("city_location_id", cityLocationId)
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) {
      const message = String(error.message ?? "");
      const relationMissing =
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        message.includes("Could not find the table 'public.residential_localities'") ||
        message.toLowerCase().includes("relation \"public.residential_localities\" does not exist");

      if (relationMissing) {
        logger.warn(
          "[ResidentialLocalityService] residential_localities table not available yet; returning empty list",
        );
        return [];
      }

      throw new Error(`Failed to load residential localities: ${message}`);
    }

    return ((data ?? []) as unknown as Record<string, unknown>[]).map(
      toResidentialLocality,
    );
  }
}

export const residentialLocalityService = new ResidentialLocalityService();
