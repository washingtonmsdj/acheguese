/**
 * Post alert queries.
 */

import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { PostError } from "../types";

interface ActiveAlertRow {
  id: string;
  content: string;
  confirmations_count: number | null;
  is_verified: boolean | null;
}

export async function getActiveAlerts(
  locationId: string,
  limit: number = 5,
): Promise<
  Array<{
    id: string;
    content: string;
    confirmations_count: number;
    is_verified: boolean;
  }>
> {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("id, content, confirmations_count, is_verified")
      .eq("type", "alerta")
      .eq("location_id", locationId)
      .gte("confirmations_count", 2)
      .order("confirmations_count", { ascending: false })
      .limit(limit);

    if (error) {
      throw new PostError(error.message, error.code || "FETCH_FAILED");
    }

    return ((data as ActiveAlertRow[] | null) ?? []).map((row) => ({
      id: row.id,
      content: row.content,
      confirmations_count: row.confirmations_count ?? 0,
      is_verified: Boolean(row.is_verified),
    }));
  } catch (error) {
    if (error instanceof PostError) throw error;

    trackError(error as Error, {
      component: "posts.queries",
      action: "getActiveAlerts",
      metadata: { locationId, limit },
    });
    throw new PostError("Unexpected error fetching active alerts", "UNKNOWN_ERROR");
  }
}
