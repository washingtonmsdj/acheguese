/**
 * ProfileMobilityAdapter
 *
 * Adaptador temporário para métodos de mobilidade que estavam no ProfileService.
 *
 * TEMPORÁRIO: Estes métodos deveriam estar em MobilityService.
 * TODO: Migrar para MobilityService quando refatorar arquitetura de mobilidade.
 *
 * Responsabilidade: Gerenciar active_ride_id em profiles (campo legado de schema).
 *
 * OVERRIDE SSOT ativo (ssot/no-direct-profile-access: off):
 *   - getActiveRideId / setActiveRideId / clearActiveRideId: lêem/escrevem
 *     profiles.active_ride_id, campo de estado de mobilidade armazenado em profiles
 *     por decisão de schema legado. Não tem equivalente em ProfileIdentityService
 *     (mobilidade ≠ identidade).
 *   - getProfilesForRides (passenger): lê campos de mobilidade de passageiro
 *     (pontos, telefone, street) que não são expostos por ProfileIdentityService.
 *   Condição de remoção: quando MobilityService canônico for criado e active_ride_id
 *   for movido para tabela de estado de mobilidade separada.
 */

import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { profileService } from "@/core/profiles/services/ProfileService";

type ActiveRideRow = { active_ride_id: string | null };
type PassengerStatsRow = {
  passenger_rating: number | null;
  passenger_trust_level: string | null;
  is_suspended: boolean | null;
};
type PassengerRideProfileRow = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  city: string | null;
  neighborhood: string | null;
  street: string | null;
  pontos: number | null;
  telefone: string | null;
};

export class ProfileMobilityAdapter {
  /**
   * Obtém active_ride_id de um perfil
   * TEMPORÁRIO: Este campo deveria estar em tabela separada de estado de mobilidade
   */
  async getActiveRideId(profileId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("active_ride_id")
      .eq("id", profileId)
      .single();

    if (error) return null;
    return (data as ActiveRideRow | null)?.active_ride_id || null;
  }

  /**
   * Define active_ride_id de um perfil
   * TEMPORÁRIO: Este campo deveria estar em tabela separada de estado de mobilidade
   */
  async setActiveRideId(
    profileId: string,
    rideId: string | null,
  ): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({ active_ride_id: rideId })
      .eq("id", profileId);

    if (error) {
      trackError(new Error("Error setting active_ride_id"), {
        component: "ProfileMobilityAdapter",
        action: "setActiveRideId",
        metadata: { profileId, rideId, error },
      });
      throw error;
    }
  }

  /**
   * Limpa active_ride_id de um perfil (apenas se corresponder ao rideId fornecido)
   * TEMPORÁRIO: Este campo deveria estar em tabela separada de estado de mobilidade
   */
  async clearActiveRideId(profileId: string, rideId: string): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({ active_ride_id: null })
      .eq("id", profileId)
      .eq("active_ride_id", rideId);

    if (error) {
      trackError(new Error("Error clearing active_ride_id"), {
        component: "ProfileMobilityAdapter",
        action: "clearActiveRideId",
        metadata: { profileId, rideId, error },
      });
      throw error;
    }
  }

  /**
   * Estatísticas de reputação de passageiros — para painéis administrativos.
   * Lê campos de mobilidade de passageiro (passenger_rating, passenger_trust_level,
   * is_suspended) de profiles. Esses campos são de mobilidade, não de identidade.
   * TEMPORÁRIO: mover para MobilityService quando o serviço canônico for criado.
   */
  async getPassengerStats(): Promise<
    Array<{
      passenger_rating: number | null;
      passenger_trust_level: string | null;
      is_suspended: boolean | null;
    }>
  > {
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("passenger_rating, passenger_trust_level, is_suspended")
      .gte("passenger_completed_rides", 1);
    if (error) {
      trackError(new Error("Error fetching passenger stats"), {
        component: "ProfileMobilityAdapter",
        action: "getPassengerStats",
        metadata: { error },
      });
      return [];
    }
    return (data as PassengerStatsRow[] | null) || [];
  }

  /**
   * Busca dados básicos de perfis para mobilidade (passageiro/motorista).
   * (apenas identidade: id, name, avatar_url).
   *
   * Para passageiros: acesso direto necessário — campos de mobilidade
   * (pontos, telefone, street) não são expostos por ProfileIdentityService.
   * TEMPORÁRIO: remover quando MobilityService expor esses campos.
   */
  async getProfilesForRides(
    ids: string[],
    type: "passenger" | "driver",
  ): Promise<PassengerRideProfileRow[] | Awaited<ReturnType<typeof profileService.getProfilesByIds>>> {
    if (ids.length === 0) return [];

    if (type === "driver") {
      // Identidade pura — delega para service canônico
      return profileService.getProfilesByIds(ids);
    }

    // Passageiro: campos de mobilidade não disponíveis em ProfileIdentityService
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, name, avatar_url, city, neighborhood, street, pontos, telefone",
      )
      .in("id", ids);

    if (error) {
      trackError(new Error("Error fetching passenger profiles for rides"), {
        component: "ProfileMobilityAdapter",
        action: "getProfilesForRides",
        metadata: { ids, type, error },
      });
      return [];
    }

    return (data as PassengerRideProfileRow[] | null) || [];
  }
}

export const profileMobilityAdapter = new ProfileMobilityAdapter();
