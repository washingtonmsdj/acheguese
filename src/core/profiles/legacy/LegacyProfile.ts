/**
 * LegacyProfile — Compatibilidade Temporária
 * 
 * Tipos legados mantidos APENAS para compatibilidade durante migração.
 * 
 * ⚠️ DEPRECATED: Não use em código novo!
 * Use os tipos canônicos em src/core/profiles/domain/
 * 
 * Este arquivo será REMOVIDO após migração completa.
 * 
 * @deprecated Use Profile de src/core/profiles/domain/Profile.ts
 * @version 2.0.0
 */

import type { ProfileType } from '../domain/ProfileType';

/**
 * LegacyProfile — Tipo Legado
 * 
 * @deprecated Use Profile de src/core/profiles/domain/Profile.ts
 * 
 * Mantido apenas para compatibilidade com código antigo.
 * Será removido na Fase 3 da migração.
 */
export interface LegacyProfile {
  id: string;
  user_id: string;
  profile_type: ProfileType;
  name: string;
  display_name: string;
  username: string;
  type?: 'personal' | 'company' | 'service'; // Tipo legado
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  city: string;
  neighborhood?: string;
  state?: string;
  location_id?: string;
  street?: string;
  verified: boolean;
  is_verified?: boolean; // Alias legado
  reputation: number;
  is_active: boolean;
  is_suspended?: boolean;
  suspended?: boolean; // Alias legado
  suspended_at?: string;
  suspension_reason?: string;
  suspended_until?: string;
  alert_banned?: boolean;
  is_verified_resident?: boolean;
  verified_at?: string;
  pontos?: number; // Campo legado
  telefone?: string; // Campo legado (usar phone)
  phone?: string;
  whatsapp?: string;
  badges?: string[]; // Campo legado (não implementado)
  author_profile_id?: string; // Campo legado (não faz sentido)
  is_public?: boolean;
  show_email?: boolean;
  show_phone?: boolean;
  show_location?: boolean;
  allow_messages?: boolean;
  show_activity?: boolean;
  show_businesses?: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * LegacyProfileType — Tipo Legado
 * 
 * @deprecated Use ProfileType de src/core/profiles/domain/ProfileType.ts
 */
export type LegacyProfileType = 'personal' | 'company' | 'service';

/**
 * LegacyCreateProfileData — Input Legado
 * 
 * @deprecated Use CreateProfileInput de src/core/profiles/operations/CreateProfileInput.ts
 */
export interface LegacyCreateProfileData {
  profile_type: ProfileType;
  name: string;
  display_name?: string;
  username: string;
  city: string;
  type?: LegacyProfileType;
  bio?: string;
  avatar_url?: string;
  neighborhood?: string;
  street?: string;
}

/**
 * LegacyUpdateProfileData — Input Legado
 * 
 * @deprecated Use UpdateProfileInput de src/core/profiles/operations/UpdateProfileInput.ts
 */
export interface LegacyUpdateProfileData {
  name?: string;
  display_name?: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
  telefone?: string;
  whatsapp?: string;
  phone?: string;
  state?: string;
  location_id?: string;
  reputation?: number;
  suspended?: boolean;
  suspended_until?: string | null;
  is_verified_resident?: boolean;
  is_suspended?: boolean;
  pontos?: number;
  is_verified?: boolean;
  verified?: boolean;
  verified_at?: string | null;
  active_ride_id?: string | null;
  [key: string]: any;
}
