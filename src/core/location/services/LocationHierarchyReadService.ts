import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

/**
 * Read model canônico para expansão territorial por IDs.
 *
 * Usa a RPC pública existente, que percorre a hierarquia por parent_id e retorna
 * somente UUIDs. Evita carregar rows completas de locations e count exact quando
 * o consumidor precisa apenas expandir um filtro territorial.
 */
export class LocationHierarchyReadService {
  static async getDescendantIds(locationId: string): Promise<string[]> {
    const { data, error } = await supabase.rpc(
      "rpc_get_location_descendants_ids",
      { p_location_id: locationId },
    );

    if (error) {
      logger.error(
        "[LocationHierarchyReadService] Failed to resolve descendant ids",
        error,
        { location_id: locationId },
      );
      throw error;
    }

    return data ?? [];
  }
}
