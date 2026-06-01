import { logger } from "@/shared/utils/logger";
import { supabase } from "@/integrations/supabase";

export interface LocationRecord {
  id: string;
  name: string;
  type: "country" | "state" | "city" | "district" | "neighborhood";
  parent_id?: string;
  slug: string;
  created_at: string;
}

type LocationWithChildren = LocationRecord & { children?: LocationWithChildren[] };

export class LocationsReadService {
  static async getAll(): Promise<LocationRecord[]> {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("name");

    if (error) {
      logger.error("LocationsReadService.getAll", error);
      throw error;
    }

    return (data as LocationRecord[]) || [];
  }

  static async getById(id: string): Promise<LocationRecord | null> {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      logger.error("LocationsReadService.getById", error);
      throw error;
    }

    return (data as LocationRecord) || null;
  }

  static async getByType(type: LocationRecord["type"]): Promise<LocationRecord[]> {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("type", type)
      .order("name");

    if (error) {
      logger.error("LocationsReadService.getByType", error);
      throw error;
    }

    return (data as LocationRecord[]) || [];
  }

  static async getTree(): Promise<LocationWithChildren[]> {
    const locations = await this.getAll();
    const tree: LocationWithChildren[] = [];
    const map = new Map<string, LocationWithChildren>();

    for (const location of locations) {
      map.set(location.id, { ...location, children: [] });
    }

    for (const location of locations) {
      const node = map.get(location.id);
      if (!node) continue;

      if (location.parent_id) {
        const parent = map.get(location.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        tree.push(node);
      }
    }

    return tree;
  }
}

