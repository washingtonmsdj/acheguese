/**
 * PROFILE SERVICE - FASE 3
 * Service layer SSOT para operações de perfil
 * Fonte: ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md v3.0
 * 
 * REGRAS:
 * - Zero acesso direto ao Supabase fora deste service
 * - Todas as operações passam por RPCs ou views públicas
 * - Authenticated usa RLS via queries diretas
 * - Anon usa apenas views públicas
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase/supabase';
import { SessionService } from '@/core/session/services/SessionService';
import { SessionState } from '@/core/session/state/SessionState';
import { BusinessService } from './businessService';
import { ProfessionalService } from './professionalService';
import { DriverService } from './driverService';
import { ProfileMembersService } from './profileMembersService';
import type {
  Profile,
  CreateProfileInput,
  UpdateProfileInput,
  ServiceResponse,
  ProfileWithExtension,
  LoadProfileEditorInput,
  ProfileEditorSnapshot,
  SaveProfileEditorInput,
  ProfileEditorExtensionForms,
  BusinessData,
  ProfessionalData,
  DriverData,
} from './types';

type PublicProfileRecord = Record<string, unknown>;

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export class MultiProfileService {
  private static getEditablePersonalHandle(
    profile?: Pick<Profile, 'profile_type' | 'handle'> | null,
  ): string | null {
    if (!profile || profile.profile_type !== 'personal') {
      return null;
    }

    return profile.handle ?? '';
  }

  private static buildBaseForm(profile: Profile): UpdateProfileInput {
    return {
      display_name: profile.display_name,
      bio: profile.bio ?? '',
      contact_email: profile.contact_email ?? '',
      phone: profile.phone ?? '',
      website: profile.website ?? '',
      location: profile.location ?? '',
      location_id: profile.location_id ?? undefined,
      street: profile.street ?? '',
      state: profile.state ?? '',
      public_location_visibility: profile.public_location_visibility ?? 'city_only',
      is_public: profile.is_public,
      show_contact_email: profile.show_contact_email,
      show_phone: profile.show_phone,
      show_linked_profiles: profile.show_linked_profiles,
      show_business_links: profile.show_business_links,
      show_professional_links: profile.show_professional_links,
    };
  }

  private static async loadExtensionForms(
    profile: Pick<Profile, 'id' | 'profile_type'>,
  ): Promise<ProfileEditorExtensionForms> {
    if (profile.profile_type === 'business') {
      const bizForm = await BusinessService.getBusinessData(profile.id);
      return {
        bizForm: bizForm || {},
        proForm: {},
        drvForm: {},
      };
    }

    if (profile.profile_type === 'professional') {
      const proForm = await ProfessionalService.getProfessionalData(profile.id);
      return {
        bizForm: {},
        proForm: proForm || {},
        drvForm: {},
      };
    }

    if (profile.profile_type === 'driver') {
      const drvForm = await DriverService.getDriverData(profile.id);
      return {
        bizForm: {},
        proForm: {},
        drvForm: drvForm || {},
      };
    }

    return {
      bizForm: {},
      proForm: {},
      drvForm: {},
    };
  }

  private static async saveExtensionForms(
    profile: Pick<Profile, 'id' | 'profile_type'>,
    forms: ProfileEditorExtensionForms,
  ): Promise<ServiceResponse<void>> {
    try {
      if (profile.profile_type === 'business') {
        const {
          profile_id: _unusedProfileId,
          created_at: _unusedCreatedAt,
          updated_at: _unusedUpdatedAt,
          ...bizUpdates
        } = forms.bizForm as BusinessData & {
          created_at?: string;
          updated_at?: string;
        };

        const result = await BusinessService.updateBusinessData(profile.id, bizUpdates);
        if (!result.success) {
          return { success: false, error: result.error };
        }
      }

      if (profile.profile_type === 'professional') {
        const {
          profile_id: _unusedProfileId,
          created_at: _unusedCreatedAt,
          updated_at: _unusedUpdatedAt,
          ...proUpdates
        } = forms.proForm as ProfessionalData & {
          created_at?: string;
          updated_at?: string;
        };

        const result = await ProfessionalService.updateProfessionalData(profile.id, proUpdates);
        if (!result.success) {
          return { success: false, error: result.error };
        }
      }

      if (profile.profile_type === 'driver') {
        const {
          profile_id: _unusedProfileId,
          created_at: _unusedCreatedAt,
          updated_at: _unusedUpdatedAt,
          ...drvUpdates
        } = forms.drvForm as DriverData & {
          created_at?: string;
          updated_at?: string;
        };

        const result = await DriverService.updateDriverData(profile.id, drvUpdates);
        if (!result.success) {
          return { success: false, error: result.error };
        }
      }

      return { success: true };
    } catch (error: unknown) {
      return {
        success: false,
        error: errorMessage(error, 'Failed to save profile extension'),
      };
    }
  }

  /**
   * Criar perfil com extensão (via RPC)
   */
  static async createProfile(input: CreateProfileInput): Promise<ServiceResponse<{ profile_id: string; handle: string }>> {
    try {
      const { data, error } = await supabase.rpc('create_profile_with_extension', {
        p_profile_type: input.profile_type,
        p_handle: input.handle,
        p_display_name: input.display_name,
        p_avatar_url: input.avatar_url || null,
        p_bio: input.bio || null,
        p_extension_data: input.extension_data || null,
      });

      if (error) throw error;

      return data as ServiceResponse<{ profile_id: string; handle: string }>;
    } catch (error: unknown) {
      return {
        success: false,
        error: errorMessage(error, 'Failed to create profile'),
      };
    }
  }

  /**
   * Listar perfis do usuário autenticado (via RLS)
   */
  static async getMyProfiles(userId?: string): Promise<Profile[]> {
    try {
      const cachedUser = SessionState.getState().user;
      const resolvedUserId =
        userId ??
        cachedUser?.id ??
        (await SessionService.getCurrentUser())?.id;
      if (!resolvedUserId) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', resolvedUserId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []) as Profile[];
    } catch (error: unknown) {
      logger.error('Error fetching my profiles:', error);
      return [];
    }
  }

  /**
   * Buscar perfil por ID (via RLS)
   */
  static async getProfileById(profileId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) throw error;

      return data as Profile;
    } catch (error: unknown) {
      logger.error('Error fetching profile by id:', error);
      return null;
    }
  }

  /**
   * Buscar perfil público por handle (via view pública)
   */
  static async getPublicProfileByHandle(handle: string): Promise<PublicProfileRecord | null> {
    try {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('handle', handle)
        .single();

      if (error) throw error;

      return data;
    } catch (error: unknown) {
      logger.error('Error fetching public profile:', error);
      return null;
    }
  }

  /**
   * Buscar perfil público business por handle
   */
  static async getPublicBusinessProfile(handle: string): Promise<PublicProfileRecord | null> {
    try {
      const { data, error } = await supabase
        .from('public_business_profiles')
        .select('*')
        .eq('handle', handle)
        .single();

      if (error) throw error;

      return data;
    } catch (error: unknown) {
      logger.error('Error fetching public business profile:', error);
      return null;
    }
  }

  /**
   * Buscar perfil público professional por handle
   */
  static async getPublicProfessionalProfile(handle: string): Promise<PublicProfileRecord | null> {
    try {
      const { data, error } = await supabase
        .from('public_professional_profiles')
        .select('*')
        .eq('handle', handle)
        .single();

      if (error) throw error;

      return data;
    } catch (error: unknown) {
      logger.error('Error fetching public professional profile:', error);
      return null;
    }
  }

  /**
   * Buscar perfil público driver por handle
   */
  static async getPublicDriverProfile(handle: string): Promise<PublicProfileRecord | null> {
    try {
      const { data, error } = await supabase
        .from('public_driver_profiles')
        .select('*')
        .eq('handle', handle)
        .single();

      if (error) throw error;

      return data;
    } catch (error: unknown) {
      logger.error('Error fetching public driver profile:', error);
      return null;
    }
  }

  /**
   * Atualizar perfil (via RLS)
   */
  static async updateProfile(profileId: string, updates: UpdateProfileInput): Promise<ServiceResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profileId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as Profile,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: errorMessage(error, 'Failed to update profile'),
      };
    }
  }

  /**
   * Atualizar handle (via RPC)
   */
  static async updateHandle(profileId: string, newHandle: string): Promise<ServiceResponse<{ handle: string }>> {
    try {
      const { data, error } = await supabase.rpc('update_profile_handle', {
        p_profile_id: profileId,
        p_new_handle: newHandle,
      });

      if (error) throw error;

      return data as ServiceResponse<{ handle: string }>;
    } catch (error: unknown) {
      return {
        success: false,
        error: errorMessage(error, 'Failed to update handle'),
      };
    }
  }

  /**
   * Verifica se o usuario pode editar o perfil.
   * Permite:
   * - ownership estrutural (`profiles.user_id = auth.uid`)
   * - owner/admin operacional em `profile_members`
   */
  static async canEditProfile(
    profileId: string,
    userId: string,
    availableProfiles: Profile[] = [],
  ): Promise<boolean> {
    const ownedProfile = availableProfiles.find((profile) => profile.id === profileId);
    if (ownedProfile?.user_id === userId) {
      return true;
    }

    return ProfileMembersService.isManager(profileId, userId);
  }

  /**
   * Carrega o snapshot canonico de edicao de perfil.
   */
  static async loadProfileEditor(
    input: LoadProfileEditorInput,
  ): Promise<ServiceResponse<ProfileEditorSnapshot>> {
    try {
      const { profileId, userId, availableProfiles = [] } = input;
      const isAllowed = await this.canEditProfile(profileId, userId, availableProfiles);

      if (!isAllowed) {
        return {
          success: false,
          error: 'ACCESS_DENIED',
        };
      }

      // Sempre hidrata o editor com o registro canônico completo da tabela profiles.
      // O snapshot de `availableProfiles` pode ser resumido e omitir campos opcionais
      // (ex.: bio, contato, localização), causando formulário "vazio" ao reabrir.
      const profileFromDb = await this.getProfileById(profileId);
      const profile =
        profileFromDb ||
        availableProfiles.find((candidate) => candidate.id === profileId);

      if (!profile) {
        return {
          success: false,
          error: 'PROFILE_NOT_FOUND',
        };
      }

      const extensionForms = await this.loadExtensionForms(profile);
      const editableUsername = this.getEditablePersonalHandle(profile);

      return {
        success: true,
        data: {
          profile,
          baseForm: this.buildBaseForm(profile),
          editableUsername,
          username: editableUsername ?? '',
          originalUsername: editableUsername ?? '',
          ...extensionForms,
        },
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: errorMessage(error, 'Failed to load profile editor'),
      };
    }
  }

  /**
   * Persiste o agregado de edicao do perfil.
   *
   * Ordem:
   * 1. campos base do profile
   * 2. extensao por tipo
   * 3. handle/username publico, quando aplicavel
   *
   * O handle e aplicado por ultimo para evitar mutacao de identidade publica
   * quando o restante do payload falha antes.
   */
  static async saveProfileEditor(
    input: SaveProfileEditorInput,
  ): Promise<ServiceResponse<Profile>> {
    try {
      const baseResult = await this.updateProfile(input.profile.id, input.baseForm);
      if (!baseResult.success || !baseResult.data) {
        return {
          success: false,
          error: baseResult.error || 'Failed to update profile',
        };
      }

      const extensionResult = await this.saveExtensionForms(input.profile, {
        bizForm: input.bizForm,
        proForm: input.proForm,
        drvForm: input.drvForm,
      });

      if (!extensionResult.success) {
        return {
          success: false,
          error: extensionResult.error,
        };
      }

      const normalizedUsername = input.username?.trim();
      const originalUsername = input.originalUsername?.trim();
      const shouldUpdateHandle =
        input.profile.profile_type === 'personal' &&
        normalizedUsername &&
        normalizedUsername !== originalUsername;

      if (shouldUpdateHandle) {
        const handleResult = await this.updateHandle(input.profile.id, normalizedUsername);
        if (!handleResult.success) {
          return {
            success: false,
            error:
              handleResult.error ||
              'Profile saved, but failed to update public username',
          };
        }
      }

      return {
        success: true,
        data: {
          ...baseResult.data,
          handle:
            shouldUpdateHandle && normalizedUsername
              ? normalizedUsername
              : baseResult.data.handle,
        },
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: errorMessage(error, 'Failed to save profile editor'),
      };
    }
  }

  /**
   * Deletar perfil (via RPC)
   */
  static async deleteProfile(profileId: string): Promise<ServiceResponse<{ profile_id: string }>> {
    try {
      const { data, error } = await supabase.rpc('delete_profile', {
        p_profile_id: profileId,
      });

      if (error) throw error;

      return data as ServiceResponse<{ profile_id: string }>;
    } catch (error: unknown) {
      return {
        success: false,
        error: errorMessage(error, 'Failed to delete profile'),
      };
    }
  }

  /**
   * Transferir ownership (via RPC)
   */
  static async transferOwnership(profileId: string, newOwnerUserId: string): Promise<ServiceResponse<{ profile_id: string }>> {
    try {
      const { data, error } = await supabase.rpc('transfer_profile_ownership', {
        p_profile_id: profileId,
        p_new_owner_user_id: newOwnerUserId,
      });

      if (error) throw error;

      return data as ServiceResponse<{ profile_id: string }>;
    } catch (error: unknown) {
      return {
        success: false,
        error: errorMessage(error, 'Failed to transfer ownership'),
      };
    }
  }
}

