/**
 * MULTI-PROFILE TYPES - FASE 3
 * Tipos para arquitetura multi-perfil real
 * Fonte: ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md v3.0
 */

// Tipos do banco
export type ProfileType = 'personal' | 'business' | 'professional' | 'driver' | 'communication_channel';
export type ProfileRole = 'owner' | 'admin' | 'member';
export type LinkType = 'owns' | 'works_for' | 'drives_for' | 'partner';

/**
 * MultiProfileRecord — Perfil na arquitetura multi-profile
 *
 * Representa um perfil no contexto da arquitetura multi-profile (FASE 3).
 * Usa snake_case (shape do banco), tem handle obrigatório.
 *
 * ATENCAO: NAO confundir com Profile de core/profiles/domain/Profile.ts
 * - Profile (domain): camelCase, SSOT canônico, 36 campos
 * - MultiProfileRecord: snake_case, contexto multi-profile, shape do banco
 *
 * @see Profile em core/profiles/domain/Profile.ts para o SSOT canônico
 */
export interface MultiProfileRecord {
  id: string;
  user_id: string;
  profile_type: ProfileType;
  handle: string;
  display_name: string;
  // Cross-module aliases normalized at service boundary.
  name?: string;
  username?: string | null;
  avatar_url?: string;
  bio?: string;
  contact_email?: string;
  phone?: string;
  website?: string;
  location?: string;
  location_id?: string | null;
  main_territory_location_id?: string | null;
  city?: string;
  neighborhood?: string;
  street?: string;
  public_location_visibility?: 'hidden' | 'city_only' | 'district';
  state?: string;
  country: string;
  is_active: boolean;
  is_public: boolean;
  verified: boolean;
  verified_at?: string;
  show_contact_email: boolean;
  show_phone: boolean;
  show_linked_profiles: boolean;
  show_business_links: boolean;
  show_professional_links: boolean;
  short_bio?: string | null;
  reputation_score: number;
  trust_score: number;
  created_at: string;
  updated_at: string;
}

export type Profile = Partial<MultiProfileRecord> & {
  id: string;
  user_id: string;
  profile_type: ProfileType;
  display_name: string;
  created_at: string;
  updated_at: string;
};

// Business extension
export interface BusinessData {
  profile_id: string;
  legal_name: string | null;
  cnpj?: string | null;
  tax_id?: string | null;
  company_type?: 'mei' | 'ltda' | 'sa' | 'eireli' | 'other' | null;
  industry?: string | null;
  employee_count?: '1-10' | '11-50' | '51-200' | '201-500' | '500+' | null;
  founded_year?: number | null;
  business_address?: string | null;
  business_city?: string | null;
  business_state?: string | null;
  business_zip?: string | null;
  business_hours?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Professional extension. Cobertura territorial nao pertence a este shape:
// o SSOT e public.service_areas, acessado por ServiceAreasService.
export interface ProfessionalData {
  profile_id: string;
  profession: string;
  professional_name?: string;
  service_category?: string;
  specialties?: string[];
  license_number?: string;
  license_state?: string;
  years_experience?: number;
  education?: string;
  certifications?: string[];
  services_offered?: string[];
  availability_notes?: string;
  portfolio_items?: Array<{
    url: string;
    caption?: string;
    media_type?: 'image' | 'video' | 'document';
    is_cover?: boolean;
  }>;
  visibility?: 'public_listed' | 'public_unlisted' | 'private';
  hourly_rate?: number;
  accepts_remote: boolean;
  created_at: string;
  updated_at: string;
}

// Driver extension. Operational online/availability/location state is read-only
// here; mutations belong to DriverAvailabilityService / driver_availability.
export interface DriverData {
  profile_id: string;
  license_number: string;
  license_category: string;
  license_expiry: string;
  license_state: string;
  vehicle_type?: 'car' | 'motorcycle' | 'van' | 'truck';
  vehicle_plate?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_color?: string;
  documents_verified: boolean;
  documents_verified_at?: string;
  background_check_status?: 'pending' | 'approved' | 'rejected';
  background_check_date?: string;
  is_available: boolean;
  current_location?: Record<string, unknown> | null;
  last_location_update?: string;
  created_at: string;
  updated_at: string;
}

// Profile member
export interface ProfileMember {
  id: string;
  profile_id: string;
  user_id: string;
  role: ProfileRole;
  invited_by?: string;
  joined_at: string;
  is_active?: boolean;
  updated_at?: string;
  email?: string | null;
  display_name?: string | null;
}

// Profile link
export interface ProfileLink {
  id: string;
  from_profile_id: string;
  to_profile_id: string;
  link_type: LinkType;
  is_public: boolean;
  display_order: number;
  created_at: string;
}

// Perfil completo com extensão
export type ProfileWithExtension =
  | { profile: MultiProfileRecord; extension: null; type: 'personal' }
  | { profile: MultiProfileRecord; extension: BusinessData; type: 'business' }
  | { profile: MultiProfileRecord; extension: ProfessionalData; type: 'professional' }
  | { profile: MultiProfileRecord; extension: DriverData; type: 'driver' }
  | { profile: MultiProfileRecord; extension: null; type: 'communication_channel' };

// Dados para criação
export interface CreateProfileInput {
  profile_type: ProfileType;
  handle: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  extension_data?: Record<string, unknown>;
}

// Dados para atualização
export interface UpdateProfileInput {
  handle?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  contact_email?: string;
  phone?: string;
  website?: string;
  location?: string;
  location_id?: string;
  main_territory_location_id?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  public_location_visibility?: 'hidden' | 'city_only' | 'district';
  state?: string;
  short_bio?: string;
  community_reputation_score?: number;
  is_public?: boolean;
  show_contact_email?: boolean;
  show_phone?: boolean;
  show_linked_profiles?: boolean;
  show_business_links?: boolean;
  show_professional_links?: boolean;
}

export interface ProfileEditorExtensionForms {
  bizForm: Partial<BusinessData>;
  proForm: Partial<ProfessionalData>;
  drvForm: Partial<DriverData>;
}

export interface LoadProfileEditorInput {
  profileId: string;
  userId: string;
  availableProfiles?: ReadonlyArray<Profile>;
}

export interface ProfileEditorSnapshot extends ProfileEditorExtensionForms {
  profile: Profile;
  baseForm: UpdateProfileInput;
  editableUsername: string | null;
  username: string;
  originalUsername: string;
}

export interface SaveProfileEditorInput extends ProfileEditorExtensionForms {
  profile: Pick<Profile, 'id' | 'profile_type'>;
  baseForm: UpdateProfileInput;
  username?: string;
  originalUsername?: string;
}

// Response types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
