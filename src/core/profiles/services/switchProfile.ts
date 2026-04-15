import { supabase } from "@/integrations/supabase";
import { ProfileService, profileService } from "./ProfileService";

/**
 * Troca o perfil ativo do usuário
 *
 * @param userId - ID do usuário
 * @param profileId - ID do perfil a ser ativado
 * @returns Resultado da operação
 * @throws Error se falhar
 */
export async function switchProfile(
  userId: string,
  profileId: string,
): Promise<void> {
  const { data, error } = await (supabase as any).rpc("switch_active_profile", {
    p_user_id: userId,
    p_profile_id: profileId,
  });

  if (error) {
    throw new Error(`Erro ao trocar perfil: ${error.message}`);
  }

  return data;
}

/**
 * Cria um novo perfil para o usuário
 *
 * @param userId - ID do usuário
 * @param profileType - Tipo do perfil
 * @param data - Dados do perfil
 * @returns Perfil criado
 */
export async function createProfile(
  userId: string,
  profileType: "driver" | "business" | "professional",
  data: {
    name: string;
    display_name: string;
    username: string;
    city: string;
  },
) {
  // ✅ MIGRADO - Usa ProfileService para criar perfil
  const profile = await profileService.createProfile({
    profile_type: profileType,
    ...data,
  });

  return profile;
}
