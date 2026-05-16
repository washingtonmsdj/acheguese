import { supabase } from "@/integrations/supabase";

export interface TerritoryCommunityRoute {
  territory_type: "district" | "territorial_group";
  territory_id: string;
}

export class TerritoryCommunityRouteService {
  static async resolveByCityAndSlug(cityId: string, slug: string): Promise<TerritoryCommunityRoute | null> {
    try {
      const { data } = await supabase
        .from("territory_communities" as never)
        .select("territory_type, territory_id")
        .eq("city_id", cityId)
        .eq("slug", slug)
        .maybeSingle();

      if (!data) return null;
      const row = data as { territory_type?: string; territory_id?: string };
      if (!row.territory_id || (row.territory_type !== "district" && row.territory_type !== "territorial_group")) {
        return null;
      }
      return {
        territory_type: row.territory_type,
        territory_id: row.territory_id,
      };
    } catch {
      return null;
    }
  }
}

