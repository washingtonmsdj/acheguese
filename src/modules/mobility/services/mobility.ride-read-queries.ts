import { supabase } from "@/core/infrastructure/supabase";
import { logger } from "@/shared/utils/logger";

const supabaseClient = supabase as any;

/**
 * Conversas de mobilidade do perfil
 */
export async function getMobilityConversations(profileId: string): Promise<unknown[]> {
  try {
    const { data, error } = await supabaseClient
      .from("mobility_conversations" as any)
      .select(`
        id,
        ride_id,
        passenger_profile_id,
        driver_profile_id,
        created_at,
        updated_at
      `)
      .or(`passenger_profile_id.eq.${profileId},driver_profile_id.eq.${profileId}`)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error("MobilityQueries.getMobilityConversations", { profileId, error });
    return [];
  }
}

/**
 * Última mensagem de uma conversa
 */
export async function getLastMessage(conversationId: string): Promise<unknown | null> {
  try {
    const { data, error } = await supabaseClient
      .from("mobility_messages" as any)
      .select("message")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("MobilityQueries.getLastMessage", { conversationId, error });
    return null;
  }
}

/**
 * Contar mensagens não lidas
 */
export async function getUnreadCount(conversationId: string, profileId: string): Promise<number> {
  try {
    const { count, error } = await supabaseClient
      .from("mobility_messages" as any)
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .eq("read", false)
      .neq("sender_profile_id", profileId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    logger.error("MobilityQueries.getUnreadCount", { conversationId, profileId, error });
    return 0;
  }
}

/**
 * Buscar corrida com endereços completos
 */
export async function getRideWithAddresses(rideId: string): Promise<unknown | null> {
  try {
    const { data, error } = await supabaseClient
      .from("ride_requests" as any)
      .select(`
        *,
        pickup_address:addresses!pickup_address_id(street, latitude, longitude),
        dropoff_address:addresses!dropoff_address_id(street, latitude, longitude),
        pickup_location:locations!pickup_location_id(name),
        dropoff_location:locations!dropoff_location_id(name)
      `)
      .eq("id", rideId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("MobilityQueries.getRideWithAddresses", error as Error);
    return null;
  }
}

/**
 * Informações básicas da corrida
 */
export async function getRideBasicInfo(rideId: string): Promise<unknown | null> {
  try {
    const { data, error } = await supabaseClient
      .from("ride_requests" as any)
      .select("id, origin, destination, status, final_price, suggested_price")
      .eq("id", rideId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("MobilityQueries.getRideBasicInfo", error as Error);
    return null;
  }
}

/**
 * Buscar corrida por token de compartilhamento
 */
export async function getRideByShareToken(token: string): Promise<unknown | null> {
  try {
    const { data, error } = await supabaseClient
      .from("ride_requests" as any)
      .select("*")
      .eq("share_token", token)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("MobilityQueries.getRideByShareToken", error as Error);
    return null;
  }
}

/**
 * Assentos disponíveis na corrida
 */
export async function getRideAvailableSeats(rideId: string): Promise<number> {
  try {
    const { data, error } = await supabaseClient
      .from("ride_requests" as any)
      .select("available_seats")
      .eq("id", rideId)
      .maybeSingle();

    if (error) throw error;
    return (data as { available_seats?: number } | null)?.available_seats ?? 0;
  } catch (error) {
    logger.error("MobilityQueries.getRideAvailableSeats", error as Error);
    return 0;
  }
}

export async function getRideStateAuditEntries(
  rideId: string,
  limit: number = 30,
): Promise<unknown[]> {
  const { data, error } = await supabaseClient
    .from("ride_state_audit")
    .select("*")
    .eq("ride_id", rideId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getOperationalVerificationEntries(
  rideId: string,
  limit: number = 5,
): Promise<unknown[]> {
  const { data, error } = await supabaseClient
    .from("operational_verifications")
    .select("*")
    .eq("ride_id", rideId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
