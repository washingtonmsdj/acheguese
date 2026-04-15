/**
 * Profile - Perfil do usuário
 *
 * Representa o perfil completo de um usuário no sistema.
 * Conecta-se 1:1 com User (core/users).
 */
export interface Profile {
  id: string;
  user_id: string; // FK para User
  display_name: string;
  avatar_url?: string;
  bio?: string;
}
