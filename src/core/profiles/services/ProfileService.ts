/**
/**
 * ProfileServiceLegacy - IDENTITY CORE (FASE PROFILE.1)
 * 
 * Fonte única de verdade da identidade do usuário
 * Responsável por:
 * - Dados básicos (nome, avatar, etc)
 * - Status (ativo, bloqueado, suspenso)
 * - Verificação
 * - Plano (basic/premium)
 * - Nível/score (apenas leitura)
 * - Permissões centralizadas
 * 
 * REGRAS:
 * - ZERO acessos diretos a supabase.from('profiles') fora deste service
 * - Todas as regras de negócio ficam aqui
 * - Hooks apenas fazem fetch/loading/error
 */

import { supabase } from "@/integrations/supabase";
import { SocialInteractionsService } from "@/core/social/services/SocialInteractionsService";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import { publicIdentityService, PublicIdentityService } from "@/core/public-identity";
import { createTypedQuery, callRPC } from "@/core/supabase/services/supabaseHelpers";
import type {
  AdminFilters,
  AdminProfileListItem,
  BannedUser,
  BasePermissions,
  Business,
  CreateProfileData,
  PlanType,
  Profile,
  ProfileContext,
  ProfileLikeActivityRecord,
  ProfilePollVoteActivityRecord,
  ProfilePrivateWorkspace,
  ProfilePrivacySettingsInput,
  ProfileSaveActivityRecord,
  ProfileStats,
  ProfileSummary,
  ProfileSummaryExtended,
  UpdateProfileData,
  ProfileVerificationStatusValue,
} from "./types";
import type {
  ProfilePermissions,
  ProfilePlan,
  ProfileReputation,
  ProfileStatus,
} from "@/core/profiles/contracts/ProfileRuntimeContracts";

export class ProfileServiceLegacy {
  // ============================================================================
  // FASE PROFILE.1 — IDENTITY CORE METHODS
  // ============================================================================

  /**
   * 🧠 PROFILE CONTEXT - Coração do sistema
   * Retorna contexto completo do usuário incluindo status, permissões e plano
   * @param userId - ID do usuário
   */
  async getProfileContext(userId: string): Promise<ProfileContext | null> {
    try {
      // Buscar perfil ativo
      const profile = await this.getActiveProfile(userId);
      if (!profile) {
        logger.warn("No active profile found for user", { userId });
        return null;
      }

      // Buscar dados complementares em paralelo
      const [bannedUser, subscription, verification] = await Promise.all([
        this._getBannedUserStatus(userId),
        this._getUserSubscription(userId),
        profile.id
          ? this._getVerificationStatus(profile.id)
          : Promise.resolve(null),
      ]);

      // Calcular status
      const status = this._calculateProfileStatus(profile, bannedUser);

      // Calcular permissões baseadas no status
      const permissions = await this._calculatePermissions(status, profile);

      // Calcular plano
      const plan = this._calculatePlan(subscription);

      // Calcular reputação
      const reputation = this._calculateReputation(profile);

      return {
        id: profile.id,
        name: profile.name,
        displayName: profile.display_name,
        username: profile.username,
        avatar: profile.avatar_url,
        status,
        permissions,
        plan,
        reputation,
        verified: profile.verified || verification?.verified || false,
      };
    } catch (error) {
      logger.error("Error getting profile context:", error);
      trackError(new Error("Error getting profile context"), {
        component: "ProfileService",
        action: "getProfileContext",
        metadata: { userId },
      });
      return null;
    }
  }

  // ============================================================================
  // MÉTODOS PRIVADOS - REGRAS DE NEGÓCIO
  // ============================================================================

  /**
   * Calcula status do perfil baseado em dados de moderação
   */
  private _calculateProfileStatus(
    profile: Profile,
    bannedUser: any,
  ): ProfileStatus {
    const isBanned = !!bannedUser;
    const isSuspended = profile.is_suspended || false;
    const isActive = profile.is_active && !isBanned && !isSuspended;

    return {
      isActive,
      isBlocked: isBanned,
      isSuspended,
      suspendedAt: profile.suspended_at,
      suspensionReason: profile.suspension_reason,
      suspendedUntil: profile.suspended_until,
    };
  }

  /**
   * Calcula permissões baseadas no status do usuário
   * ✅ LOTE 6 - Refatorado para usar AdminRolesService
   */
  private async _calculatePermissions(
    status: ProfileStatus,
    profile: Profile,
  ): Promise<ProfilePermissions> {
    // Usuário bloqueado ou suspenso não pode fazer nada
    if (status.isBlocked || status.isSuspended) {
      return {
        canPost: false,
        canComment: false,
        canMessage: false,
        canCreateBusiness: false,
        canModerate: false,
      };
    }

    // Usuário inativo tem permissões limitadas
    if (!status.isActive) {
      return {
        canPost: false,
        canComment: false,
        canMessage: true,
        canCreateBusiness: false,
        canModerate: false,
      };
    }

    // ✅ LOTE 6 - Verificar se é admin/moderador via AdminRolesService
    let canModerate = false;
    try {
      const { adminRolesService } =
        await import("@/core/admin/services/AdminRolesService");
      const roles = await adminRolesService.getUserRoles(profile.user_id);
      canModerate = roles.some(
        (r) => ["admin", "moderator"].includes(r.role) && r.is_active,
      );
    } catch (err) {
      // Silently fail - default to no moderation
    }

    // Usuário ativo normal
    return {
      canPost: true,
      canComment: true,
      canMessage: true,
      canCreateBusiness: true,
      canModerate,
    };
  }

  /**
   * Calcula plano do usuário
   */
  private _calculatePlan(subscription: any): ProfilePlan {
    if (!subscription || !subscription.active) {
      return {
        type: "basic",
        isPremium: false,
      };
    }

    return {
      type: subscription.plan_type || "premium",
      isPremium: true,
      expiresAt: subscription.expires_at,
    };
  }

  /**
   * Calcula reputação do usuário
   */
  private _calculateReputation(profile: Profile): ProfileReputation {
    return {
      level: Math.floor(profile.reputation / 100) + 1,
      score: profile.reputation || 0,
      rank: this._calculateRank(profile.reputation || 0),
    };
  }

  /**
   * Calcula rank baseado na reputação
   */
  private _calculateRank(reputation: number): string {
    if (reputation >= 1000) return "Expert";
    if (reputation >= 500) return "Avançado";
    if (reputation >= 100) return "Intermediário";
    return "Iniciante";
  }

  /**
   * Busca status de usuário banido
   * ✅ LOTE 9A - Delegado para ModerationService (SSOT para banned_users)
   */
  private async _getBannedUserStatus(userId: string): Promise<any | null> {
    try {
      const { ModerationService } =
        await import("@/core/moderation/services/ModerationService");
      return await ModerationService.getBannedStatus(userId);
    } catch (error) {
      logger.error("Error in _getBannedUserStatus:", error);
      return null;
    }
  }

  /**
   * Busca assinatura do usuário
   */
  private async _getUserSubscription(userId: string) {
    try {
      const { data, error } = await (supabase as any)
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("active", true)
        .maybeSingle();

      // Ignora erros de "não encontrado" ou "tabela não existe"
      if (error) {
        if (!["PGRST116", "42P01", "PGRST301"].includes(error.code || "")) {
          logger.error("Error fetching user subscription:", error);
        }
        return null;
      }

      return data;
    } catch (error) {
      logger.error("Error in _getUserSubscription:", error);
      return null;
    }
  }

  /**
   * Busca status de verificação
   */
  private async _getVerificationStatus(profileId: string) {
    try {
      const { VerificationService } = await import(
        "@/core/verification/services/VerificationService"
      );
      const verifications =
        await VerificationService.getProfileVerifications(profileId);
      return verifications[0] ?? null;
    } catch (error) {
      logger.error("Error in _getVerificationStatus:", error);
      return null;
    }
  }

  // ============================================================================
  // MÉTODOS EXISTENTES (mantidos para compatibilidade)
  // ============================================================================

  /**
   * Busca profile por ID
   * @param profileId - ID do perfil
   */
  async getProfileById(profileId: string): Promise<Profile | null> {
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .limit(1);

    if (error) {
      trackError(new Error("Error fetching profile"), {
        component: "ProfileService",
        action: "getProfileById",
        metadata: { profileId, error },
      });
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  }

  /**
   * Busca perfil ativo do usuário
   * @param userId - ID do usuário (opcional, usa usuário autenticado se não fornecido)
   */
  async getActiveProfile(userId?: string): Promise<Profile | null> {
    let targetUserId = userId;

    if (!targetUserId) {
      const {
        data: { user },
      } = await (supabase as any).auth.getUser();
      if (!user) return null;
      targetUserId = user.id;
    }

    const { data, error } = await callRPC("get_active_profile", {
      p_user_id: targetUserId,
    });

    if (error) {
      trackError(new Error("Error fetching active profile"), {
        component: "ProfileService",
        action: "getActiveProfile",
        metadata: { userId: targetUserId, error },
      });
      return null;
    }

    // RPC retorna SETOF profiles (array) — pegar o primeiro elemento
    const profile = Array.isArray(data) ? data[0] : data;
    return profile || null;
  }

  /**
   * Busca todos os perfis de um usuário
   * @param userId - ID do usuário (opcional, usa usuário autenticado se não fornecido)
   */
  async getProfilesByUserId(userId?: string): Promise<Profile[]> {
    let targetUserId = userId;

    if (!targetUserId) {
      const {
        data: { user },
      } = await (supabase as any).auth.getUser();
      if (!user) return [];
      targetUserId = user.id;
    }

    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("*")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: true });

    if (error) {
      trackError(new Error("Error fetching profiles"), {
        component: "ProfileService",
        action: "getProfilesByUserId",
        metadata: { userId: targetUserId, error },
      });
      return [];
    }

    return data || [];
  }

  /**
   * Busca perfil específico por tipo
   * @param userId - ID do usuário
   * @param profileType - Tipo do perfil (personal, driver, business, professional)
   */
  async getProfileByType(
    userId: string,
    profileType: "personal" | "driver" | "business" | "professional",
  ): Promise<Profile | null> {
    // ✅ CORREÇÃO: Buscar todos e pegar o primeiro (caso haja duplicados)
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .eq("profile_type", profileType)
      .order("created_at", { ascending: true }) // Pegar o mais antigo
      .limit(1);

    if (error) {
      trackError(new Error("Error fetching profile by type"), {
        component: "ProfileService",
        action: "getProfileByType",
        metadata: { userId, profileType, error },
      });
      return null;
    }

    // Retornar o primeiro resultado (ou null se não houver)
    return data && data.length > 0 ? data[0] : null;
  }

  /**
   * Garante que o usuário tenha um profile do tipo driver.
   * Retorna o profile existente ou cria um novo quando necessário.
   */
  async ensureDriverProfileForUser(userId: string): Promise<Profile | null> {
    try {
      const existingDriverProfile = await this.getProfileByType(userId, "driver");
      if (existingDriverProfile) {
        return existingDriverProfile;
      }

      const personalProfile = await this.getProfileByType(userId, "personal");

      const { data, error } = await (supabase as any)
        .from("profiles")
        .insert({
          user_id: userId,
          profile_type: "driver",
          name: personalProfile?.name || "Admin",
          display_name: `${personalProfile?.display_name || "Admin"} (Motorista)`,
          is_active: true,
        })
        .select("*")
        .single();

      if (error) {
        trackError(new Error("Error ensuring driver profile"), {
          component: "ProfileService",
          action: "ensureDriverProfileForUser",
          metadata: { userId, error },
        });
        return null;
      }

      return data as Profile;
    } catch (error) {
      trackError(new Error("Unexpected error ensuring driver profile"), {
        component: "ProfileService",
        action: "ensureDriverProfileForUser",
        metadata: { userId, error },
      });
      return null;
    }
  }

  /**
   * Busca perfil ativo obrigatório - lança erro se não encontrar
   * @param userId - ID do usuário (opcional, usa usuário autenticado se não fornecido)
   * @throws Error se não houver profile ativo
   */
  async getRequiredActiveProfile(userId?: string): Promise<Profile> {
    const profile = await this.getActiveProfile(userId);
    if (!profile) {
      throw new Error("No active profile found for user");
    }
    return profile;
  }

  /**
   * Busca profile por username
   * @param username - Username do perfil
   */
  async getByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await createTypedQuery('profiles')
      .select()
      .eq("username", username)
      .single();

    if (error) {
      trackError(new Error("Error fetching profile by username"), {
        component: "ProfileService",
        action: "getByUsername",
        metadata: { username, error },
      });
      return null;
    }

    return data;
  }

  /**
   * Busca profile por handle (@username) - DEPRECATED, use getByUsername
   * @deprecated Use getByUsername instead. Will be removed in v2.0.0
   */
  async getByHandle(handle: string): Promise<Profile | null> {
    if (process.env.NODE_ENV === 'development') {
      logger.warn(
        '⚠️  ProfileService.getByHandle() is deprecated.\n' +
        '   Use getByUsername() instead.\n' +
        '   This method will be removed in v2.0.0'
      );
    }
    return this.getByUsername(handle);
  }

  /**
   * Cria novo profile
   * ✅ INTEGRADO: Usa PublicIdentityService para validação de username
   * @param profile - Dados do perfil
   */
  async createProfile(profile: CreateProfileData): Promise<Profile> {
    const {
      data: { user },
    } = await (supabase as any).auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Validar campos obrigatórios da nova arquitetura
    if (!profile.profile_type) {
      throw new Error("profile_type is required");
    }
    if (!profile.name) {
      throw new Error("name is required");
    }
    if (!profile.username) {
      throw new Error("username is required");
    }
    if (!profile.city) {
      throw new Error("city is required");
    }

    // ✅ INTEGRAÇÃO: Validar username via PublicIdentityService
    const validation = PublicIdentityService.validateFormat(
      profile.username,
      'profile'
    );
    
    if (!validation.valid) {
      throw new Error(`Invalid username: ${validation.error}`);
    }

    // ✅ INTEGRAÇÃO: Verificar disponibilidade via PublicIdentityService
    const availability = await PublicIdentityService.checkAvailability({
      identifier: profile.username,
      entityType: 'profile',
    });
    
    if (availability.status !== 'available') {
      throw new Error('Username already in use');
    }

    const { data, error } = await (supabase as any)
      .from("profiles")
      .insert({
        user_id: user.id,
        profile_type: profile.profile_type,
        name: profile.name,
        display_name: profile.display_name || profile.name,
        username: profile.username,
        city: profile.city,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        is_active: true,
        ...profile,
      })
      .select()
      .single();

    if (error) {
      trackError(new Error("Error creating profile"), {
        component: "ProfileService",
        action: "createProfile",
        metadata: { userId: user.id, error },
      });
      throw error;
    }

    return data as Profile;
  }

  /**
   * Troca o perfil ativo do usuário
   * @param userId - ID do usuário
   * @param profileId - ID do perfil a ser ativado
   */
  async switchActiveProfile(
    userId: string,
    profileId: string,
  ): Promise<void> {
    const { error } = await callRPC("switch_active_profile", {
      p_user_id: userId,
      p_profile_id: profileId,
    });

    if (error) {
      trackError(new Error("Error switching profile"), {
        component: "ProfileService",
        action: "switchActiveProfile",
        metadata: { userId, profileId, error },
      });
      throw error;
    }
  }

  /**
   * Atualiza profile existente
   * ✅ INTEGRADO: Usa PublicIdentityService para validação e cooldown de username
   * 
   * REGRAS:
   * - Alterar name/display_name NÃO afeta username
   * - Username só muda se fornecido explicitamente no payload
   * - Mudança de username respeita cooldown de 30 dias
   * - Mudança de username valida disponibilidade
   */
  async updateProfile(
    profileId: string,
    updates: UpdateProfileData,
  ): Promise<Profile> {
    // Se username não está sendo alterado, update direto
    if (!updates.username) {
      return this._updateProfileDirect(profileId, updates);
    }

    // Buscar profile atual
    const currentProfile = await this.getProfileById(profileId);
    if (!currentProfile) {
      throw new Error('Profile not found');
    }

    // Se username é o mesmo, update direto (sem validação)
    if (currentProfile.username === updates.username) {
      return this._updateProfileDirect(profileId, updates);
    }

    // ✅ INTEGRAÇÃO: Validar novo username via PublicIdentityService
    const validation = PublicIdentityService.validateFormat(
      updates.username,
      'profile'
    );
    
    if (!validation.valid) {
      throw new Error(`Invalid username: ${validation.error}`);
    }

    // ✅ INTEGRAÇÃO: Verificar cooldown via PublicIdentityService
    const cooldown = await PublicIdentityService.canChangeIdentifier({
      entityType: 'profile',
      entityId: profileId,
    });
    
    if (!cooldown.canChange) {
      const daysRemaining = cooldown.daysRemaining || 0;
      throw new Error(
        `Cannot change username. You must wait ${daysRemaining} more day(s).`
      );
    }

    // ✅ INTEGRAÇÃO: Verificar disponibilidade via PublicIdentityService
    const availability = await PublicIdentityService.checkAvailability({
      identifier: updates.username,
      entityType: 'profile',
      excludeEntityId: profileId,
    });
    
    if (availability.status !== 'available') {
      throw new Error('Username already in use');
    }

    // Update com novo username (trigger registra histórico)
    return this._updateProfileDirect(profileId, updates);
  }

  /**
   * Update direto sem validação de username
   * Usado internamente quando username não muda ou já foi validado
   */
  private async _updateProfileDirect(
    profileId: string,
    updates: UpdateProfileData,
  ): Promise<Profile> {
    const { data, error } = await (supabase as any)
      .from("profiles")
      .update(updates)
      .eq("id", profileId)
      .select()
      .single();

    if (error) {
      trackError(new Error("Error updating profile"), {
        component: "ProfileService",
        action: "_updateProfileDirect",
        metadata: { profileId, error },
      });
      throw error;
    }

    return data as Profile;
  }

  /**
   * SSOT: Atualiza configuraes de privacidade do perfil
   */
  async updatePrivacySettings(
    profileId: string,
    settings: ProfilePrivacySettingsInput,
  ): Promise<Profile> {
    const { data, error } = await (supabase as any)
      .from("profiles")
      .update(settings)
      .eq("id", profileId)
      .select()
      .single();

    if (error) {
      trackError(new Error("Error updating privacy settings"), {
        component: "ProfileService",
        action: "updatePrivacySettings",
        metadata: { profileId, error },
      });
      throw error;
    }

    return data as Profile;
  }

  /**
   * SSOT: Atualiza status de ban de alertas do perfil
   * Usado por admin para bloquear/desbloquear criao de alertas
   */
  async updateAlertBanStatus(
    profileId: string,
    alertBanned: boolean,
  ): Promise<Profile> {
    const { data, error } = await (supabase as any)
      .from("profiles")
      .update({ alert_banned: alertBanned })
      .eq("id", profileId)
      .select()
      .single();

    if (error) {
      trackError(new Error("Error updating alert ban status"), {
        component: "ProfileService",
        action: "updateAlertBanStatus",
        metadata: { profileId, alertBanned, error },
      });
      throw error;
    }

    return data as Profile;
  }

  /**
   * Deleta profile
   */
  async deleteProfile(profileId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from("profiles")
      .delete()
      .eq("id", profileId);

    if (error) {
      trackError(new Error("Error deleting profile"), {
        component: "ProfileService",
        action: "deleteProfile",
        metadata: { profileId, error },
      });
      throw error;
    }
  }

  /**
   * Busca profiles por IDs com campos adicionais para admin (alert_banned, neighborhood, created_at)
   * ✅ SSOT - Único método autorizado para buscar alert_banned em batch
   */
  async getProfilesWithAlertBan(profileIds: string[]): Promise<
    Array<{
      id: string;
      alert_banned: boolean;
      neighborhood: string | null;
      created_at: string;
    }>
  > {
    if (profileIds.length === 0) return [];

    try {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, alert_banned, neighborhood, created_at")
        .in("id", profileIds);

      if (error) {
        trackError(new Error("Error fetching profiles with alert_banned"), {
          component: "ProfileService",
          action: "getProfilesWithAlertBan",
          metadata: { profileIds, error },
        });
        throw error;
      }

      return (data || []).map((p: any) => ({
        id: p.id,
        alert_banned: p.alert_banned || false,
        neighborhood: p.neighborhood || null,
        created_at: p.created_at || "",
      }));
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action: "getProfilesWithAlertBan",
        metadata: { profileIds },
      });
      throw error;
    }
  }

  private _resolveVerificationStatus(
    verification?: {
      verified?: boolean | null;
      rejection_reason?: string | null;
    } | null,
  ): {
    status: ProfileVerificationStatusValue;
    rejectionReason?: string;
  } {
    if (!verification) {
      return { status: "not_requested" };
    }

    if (verification.verified) {
      return { status: "approved" };
    }

    if (verification.rejection_reason) {
      return {
        status: "rejected",
        rejectionReason: verification.rejection_reason,
      };
    }

    return { status: "pending" };
  }

  private _mapBusinessRecords(records: any[]): Business[] {
    return records.map((business: any) => ({
      id: business.profile_id,
      name: business.business_name,
      logo: business.logo || "",
      category: business.category,
      rating: business.rating || 0,
      neighborhood: business.profiles?.neighborhood || "",
      city: business.profiles?.city || "",
      verified: business.is_verified || business.verified || false,
      slug: business.slug || "",
      geographic_path: business.geographic_path || null,
      is_premium: business.is_premium || false,
      aberto: business.aberto ?? true,
      nicho: business.category,
      description: business.description,
    }));
  }

  /**
   * Snapshot privado canônico do hub de perfil.
   *
   * Consolida o estado privado usado por `/perfil` em um único agregado
   * de service, sem espalhar orquestração por hook/página.
   */
  async getPrivateWorkspace(userId: string): Promise<ProfilePrivateWorkspace> {
    const emptyWorkspace: ProfilePrivateWorkspace = {
      profile: null,
      context: null,
      identity: null,
      account: {
        accountState: "inactive",
        isBlocked: false,
        isSuspended: false,
        verificationStatus: "not_requested",
      },
      stats: {
        posts: 0,
        likes: 0,
        favorites: 0,
        businesses: 0,
      },
      operations: {
        managedProfiles: 0,
        businesses: 0,
        services: 0,
        classifieds: 0,
        posts: 0,
        events: 0,
        alerts: 0,
        issues: 0,
        favoritesGiven: 0,
        favoritesReceived: 0,
        notificationsTotal: 0,
        notificationsUnread: 0,
        ridesTotal: 0,
        activeRides: 0,
      },
      managedAssets: [],
      notifications: {
        total: 0,
        unread: 0,
        highPriority: 0,
        urgentPriority: 0,
        recent: [],
      },
      roles: [],
      businesses: [],
      businessModules: [],
      activeRide: null,
      hasActiveRide: false,
      verificationStatus: "not_requested",
    };

    try {
      const activeProfile = await this.getActiveProfile(userId);
      if (!activeProfile) {
        return emptyWorkspace;
      }

      const { postService } = await import("@/core/posts/services");
      const { FavoritesService } = await import(
        "@/core/favorites/services/FavoritesService"
      );
      const { getActiveRide, getUserRides } = await import("@/core/mobility/services");
      const { VerificationService } = await import(
        "@/core/verification/services/VerificationService"
      );
      const { ProfessionalService } = await import(
        "@/core/professional/services/ProfessionalService"
      );
      const { getUserClassifieds } = await import("@/modules/classifieds/services");
      const { eventService } = await import("@/core/events/services/EventsService");
      const { communityAlertService } = await import("@/core/community-alerts");
      const { communityIssueService } = await import("@/core/community-issues");
      const { notificationService } = await import("@/core/notifications/services");

      const profileContextPromise = this.getProfileContext(userId);
      const profilesPromise = this.getProfilesByUserId(userId);
      const rolesPromise = this.getUserRoles(userId);
      const postsPromise = postService
        .getPostsCountByProfile(activeProfile.id)
        .catch(() => 0);
      const likesPromise = this.getUserLikesCount(activeProfile.id);
      const favoritesPromise = FavoritesService.getFavoriteStats(activeProfile.id);
      const activeRidePromise = getActiveRide(activeProfile.id).catch(() => null);
      const verificationPromise = VerificationService.getVerification(
        activeProfile.id,
        "resident",
      );
      const servicesPromise = ProfessionalService.getServicesByProfile(activeProfile.id).catch(
        () => [],
      );
      const classifiedsPromise = getUserClassifieds(activeProfile.id).catch(() => []);
      const eventsPromise = eventService
        .getEventsByOrganizerProfile(activeProfile.id, 20)
        .catch(() => []);
      const alertsCountPromise = communityAlertService
        .getCountByProfile(activeProfile.id)
        .catch(() => 0);
      const issuesCountPromise = communityIssueService
        .getCountByProfile(activeProfile.id)
        .catch(() => 0);
      const notificationStatsPromise = notificationService.getStats(userId).catch(() => null);
      const notificationFeedPromise = notificationService.fetchNotifications(userId, { limit: 5 }).catch(() => []);
      const ridesPromise = getUserRides(userId).catch(() => []);

      const [
        profileContext,
        profiles,
        roles,
        postsCount,
        likesCount,
        favoritesResult,
        activeRide,
        verification,
        services,
        classifieds,
        events,
        alertsCount,
        issuesCount,
        notificationStats,
        recentNotifications,
        rides,
      ] =
        await Promise.all([
          profileContextPromise,
          profilesPromise,
          rolesPromise,
          postsPromise,
          likesPromise,
          favoritesPromise,
          activeRidePromise,
          verificationPromise,
          servicesPromise,
          classifiedsPromise,
          eventsPromise,
          alertsCountPromise,
          issuesCountPromise,
          notificationStatsPromise,
          notificationFeedPromise,
          ridesPromise,
        ]);

      const businesses = this._mapBusinessRecords(
        await this.getUserBusinessesByProfiles(
          profiles.length ? profiles.map((profile) => profile.id) : [activeProfile.id],
        ),
      );
      const businessModules = await Promise.all(
        businesses.map(async (business) => {
          const [
            { SubscriptionService, EntitlementsService, PlanTier },
            { GastronomyProfileService },
            { getEligibleVerticals },
            { QrCodeService },
            { QrEntityType },
            { BusinessUrlService },
          ] = await Promise.all([
            import("@/core/billing"),
            import("@/core/gastronomy"),
            import("@/core/verticals/config"),
            import("@/core/qr"),
            import("@/core/qr/types"),
            import("@/core/business/services/BusinessUrlService"),
          ]);

          const [subscriptionResult, gastronomyResult, qrCodeResult] = await Promise.all([
            SubscriptionService.getByBusinessId(business.id),
            GastronomyProfileService.getByBusinessId(business.id),
            QrCodeService.getByEntity(QrEntityType.BUSINESS, business.id),
          ]);

          const subscription = subscriptionResult.data;
          const gastronomyProfile = gastronomyResult.data;
          const qrCode = qrCodeResult.data;
          const planTier = subscription?.plan_tier ?? PlanTier.FREE;
          const entitlements = EntitlementsService.getAll(planTier);
          const gastronomyEligible = Boolean(
            business.category && getEligibleVerticals(business.category as never).length > 0,
          );
          const publicUrl =
            business.slug && business.geographic_path
              ? BusinessUrlService.getCanonicalUrl({
                  id: business.id,
                  slug: business.slug,
                  is_premium: business.is_premium,
                  geographic_path: business.geographic_path,
                })
              : undefined;
          const shareUrl =
            business.slug && business.geographic_path
              ? BusinessUrlService.getShareUrl({
                  id: business.id,
                  slug: business.slug,
                  is_premium: business.is_premium,
                  geographic_path: business.geographic_path,
                })
              : undefined;
          const dashboardUrl = `/dashboard/business/${business.id}`;

          return {
            businessId: business.id,
            name: business.name || "Empresa",
            category: business.category,
            neighborhood: business.neighborhood,
            city: business.city,
            verified: Boolean(business.verified || business.verificado),
            isPremium: Boolean(business.is_premium),
            publicUrl,
            shareUrl,
            dashboardUrl,
            editUrl: `/edit-business/${business.id}`,
            subscription: {
              planTier,
              status: subscription?.status ?? "active",
              currentPeriodEnd: subscription?.current_period_end ?? null,
              canUsePremiumPublicPage: entitlements.canUsePremiumPublicPage,
              canUseShortPremiumLink: entitlements.canUseShortPremiumLink,
              canUseCustomQRCode: entitlements.canUseCustomQRCode,
              canReceiveInternalOrders: entitlements.canReceiveInternalOrders,
              canUseOrdersPanel: entitlements.canUseOrdersPanel,
              canUseMotoboyNetwork: entitlements.canUseMotoboyNetwork,
              canRequestDelivery: entitlements.canRequestDelivery,
              canTrackDelivery: entitlements.canTrackDelivery,
              canConfigureDeliveryArea: entitlements.canConfigureDeliveryArea,
              canSetDeliveryFees: entitlements.canSetDeliveryFees,
              canUseOwnDelivery: entitlements.canUseOwnDelivery,
            },
            gastronomy: {
              eligible: gastronomyEligible,
              active: Boolean(gastronomyProfile),
              status: gastronomyEligible
                ? gastronomyProfile
                  ? "active"
                  : "setup_required"
                : "not_applicable",
              cuisineType: gastronomyProfile?.cuisine_type ?? null,
              deliveryEnabled: Boolean(gastronomyProfile?.delivery_enabled),
              dineInEnabled: Boolean(gastronomyProfile?.dine_in_enabled),
              takeoutEnabled: Boolean(gastronomyProfile?.takeout_enabled),
              setupUrl: gastronomyEligible
                ? `/dashboard/business/${business.id}/gastronomy/setup`
                : undefined,
              dashboardUrl: gastronomyProfile
                ? `/dashboard/business/${business.id}/gastronomy/dashboard`
                : undefined,
              operationalUrl: gastronomyProfile
                ? `/dashboard/business/${business.id}/gastronomy/operational`
                : undefined,
              menuUrl: gastronomyProfile
                ? `/dashboard/business/${business.id}/gastronomy/menu`
                : undefined,
              ordersUrl: gastronomyProfile
                ? `/dashboard/business/${business.id}/gastronomy/orders`
                : undefined,
              deliveriesUrl: gastronomyProfile
                ? `/dashboard/business/${business.id}/gastronomy/deliveries`
                : undefined,
              deliveryAreaUrl: gastronomyProfile
                ? `/dashboard/business/${business.id}/gastronomy/delivery-area`
                : undefined,
              analyticsUrl: gastronomyProfile
                ? `/dashboard/business/${business.id}/gastronomy/analytics`
                : undefined,
              billingUrl: gastronomyProfile
                ? `/dashboard/business/${business.id}/gastronomy/billing`
                : undefined,
              hoursUrl: gastronomyProfile
                ? `/dashboard/business/${business.id}/gastronomy/hours`
                : undefined,
              plansUrl: gastronomyEligible
                ? `/dashboard/business/${business.id}/gastronomy/plans`
                : undefined,
            },
            qrCode: {
              hasActive: Boolean(qrCode?.is_active),
              styleVariant: qrCode?.style_variant ?? null,
              destinationVariant: qrCode?.destination_variant ?? null,
              managementUrl: dashboardUrl,
            },
          };
        }),
      );

      const activeRideStatuses = new Set([
        "pending",
        "requested",
        "searching_driver",
        "driver_assigned",
        "driver_accepted",
        "driver_on_the_way",
        "driver_arrived",
        "passenger_on_board",
        "in_progress",
      ]);

      const ridesList = Array.isArray(rides) ? rides : [];
      const activeRidesFromHistory = ridesList.filter((ride) => {
        const status =
          typeof ride === "object" && ride !== null && "status" in ride
            ? String((ride as { status?: unknown }).status ?? "")
            : "";
        return activeRideStatuses.has(status);
      }).length;

      const notificationPayload = notificationStats || {
        total: 0,
        unread: 0,
        by_type: {},
        by_priority: { low: 0, medium: 0, high: 0, urgent: 0 },
      };

      const profileStatus = profileContext?.status || {
        isActive: Boolean(activeProfile.is_active),
        isBlocked: false,
        isSuspended: Boolean(activeProfile.is_suspended),
        suspendedAt: activeProfile.suspended_at,
        suspensionReason: activeProfile.suspension_reason,
        suspendedUntil: activeProfile.suspended_until,
      };

      const profilePlan = profileContext?.plan || {
        type: "basic",
        isPremium: false,
      };

      const profileReputation = profileContext?.reputation || {
        level: Math.floor((activeProfile.reputation || 0) / 100) + 1,
        score: activeProfile.reputation || 0,
      };

      const permissions = profileContext?.permissions || {
        canPost: false,
        canComment: false,
        canMessage: false,
        canCreateBusiness: false,
        canModerate: false,
      };

      // eslint-disable-next-line session-context/require-authorization-engine -- Read-only para exibição em UI, não para decisão de autorização
      const permissionMatrix = [
        { key: "canPost" as const, label: "Publicar conteudo", allowed: permissions.canPost },
        {
          key: "canComment" as const,
          label: "Comentar e interagir",
          allowed: permissions.canComment,
        },
        { key: "canMessage" as const, label: "Enviar mensagens", allowed: permissions.canMessage },
        {
          key: "canCreateBusiness" as const,
          label: "Criar e gerir empresa",
          allowed: permissions.canCreateBusiness,
        },
        {
          key: "canModerate" as const,
          label: "Moderar conteudo",
          allowed: permissions.canModerate,
        },
      ];

      const territoryLabel =
        [activeProfile.neighborhood, activeProfile.city, activeProfile.state]
          .filter(Boolean)
          .join(", ") || null;

      const verificationSummary = this._resolveVerificationStatus(verification);
      const stats: ProfileStats = {
        posts: postsCount || 0,
        likes: likesCount || 0,
        favorites: favoritesResult.total_favorites_given || 0,
        businesses: businesses.length,
      };

      const managedAssets = [
        ...businesses.slice(0, 4).map((business) => ({
          id: business.id,
          kind: "business" as const,
          title: business.name || "Empresa",
          status: business.aberto === false ? "inativa" : "ativa",
          updatedAt: undefined,
        })),
        ...(services as Array<{ id: string; name?: string; updated_at?: string; is_accepting_clients?: boolean }>)
          .slice(0, 3)
          .map((service) => ({
            id: service.id,
            kind: "service" as const,
            title: service.name || "Servico profissional",
            status: service.is_accepting_clients === false ? "pausado" : "ativo",
            updatedAt: service.updated_at,
          })),
        ...(classifieds as Array<{ id: string; title?: string; updated_at?: string; is_active?: boolean }>)
          .slice(0, 3)
          .map((classified) => ({
            id: classified.id,
            kind: "classified" as const,
            title: classified.title || "Classificado",
            status: classified.is_active === false ? "inativo" : "ativo",
            updatedAt: classified.updated_at,
          })),
        ...(events as Array<{ id: string; title?: string; status?: string; updated_at?: string }>)
          .slice(0, 3)
          .map((event) => ({
            id: event.id,
            kind: "event" as const,
            title: event.title || "Evento",
            status: event.status || "upcoming",
            updatedAt: event.updated_at,
          })),
      ].sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });

      const operations = {
        managedProfiles: profiles.length,
        businesses: businesses.length,
        services: Array.isArray(services) ? services.length : 0,
        classifieds: Array.isArray(classifieds) ? classifieds.length : 0,
        posts: postsCount || 0,
        events: Array.isArray(events) ? events.length : 0,
        alerts: alertsCount,
        issues: issuesCount,
        favoritesGiven: favoritesResult.total_favorites_given || 0,
        favoritesReceived: favoritesResult.total_favorites_received || 0,
        notificationsTotal: notificationPayload.total || 0,
        notificationsUnread: notificationPayload.unread || 0,
        ridesTotal: ridesList.length,
        activeRides: Math.max(activeRidesFromHistory, activeRide ? 1 : 0),
      };

      return {
        profile: activeProfile,
        context: profileContext,
        identity: {
          profileId: activeProfile.id,
          profileType: activeProfile.profile_type,
          displayName: activeProfile.display_name || activeProfile.name,
          username: activeProfile.username || "",
          isPublic: activeProfile.is_public !== false,
          verified: profileContext?.verified || Boolean(activeProfile.verified),
          territoryLabel,
          locationId: activeProfile.location_id,
          city: activeProfile.city,
          neighborhood: activeProfile.neighborhood,
          state: activeProfile.state,
          status: profileStatus,
          plan: profilePlan,
          reputation: profileReputation,
          permissions: permissionMatrix,
        },
        account: {
          accountState: profileStatus.isBlocked
            ? "blocked"
            : profileStatus.isSuspended
              ? "suspended"
              : profileStatus.isActive
                ? "active"
                : "inactive",
          isBlocked: profileStatus.isBlocked,
          isSuspended: profileStatus.isSuspended,
          suspendedAt: profileStatus.suspendedAt,
          suspendedUntil: profileStatus.suspendedUntil,
          suspensionReason: profileStatus.suspensionReason,
          verificationStatus: verificationSummary.status,
          verificationRejectionReason: verificationSummary.rejectionReason,
        },
        stats,
        operations,
        managedAssets,
        notifications: {
          total: notificationPayload.total || 0,
          unread: notificationPayload.unread || 0,
          highPriority: notificationPayload.by_priority?.high || 0,
          urgentPriority: notificationPayload.by_priority?.urgent || 0,
          recent: (recentNotifications as Array<{
            id: string;
            type?: string;
            title?: string;
            priority?: "low" | "medium" | "high" | "urgent";
            read?: boolean;
            created_at?: string;
          }>).map((item) => ({
            id: item.id,
            type: item.type || "general",
            title: item.title || "Notificacao",
            priority: item.priority || "medium",
            read: Boolean(item.read),
            createdAt: item.created_at || new Date().toISOString(),
          })),
        },
        roles,
        businesses,
        businessModules,
        activeRide: activeRide || null,
        hasActiveRide: Boolean(activeRide),
        verificationStatus: verificationSummary.status,
        verificationRejectionReason: verificationSummary.rejectionReason,
      };
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action: "getPrivateWorkspace",
        metadata: { userId },
      });
      return emptyWorkspace;
    }
  }

  /**
   * Busca estatísticas do profile
   */
  async getStats(userId: string) {
    // ✅ SSOT COMPLIANT - Usa métodos internos do ProfileService
    const activeProfile = await this.getActiveProfile(userId);

    if (!activeProfile) {
      return {
        posts: 0,
        likes: 0,
        favorites: 0,
      };
    }

    // ✅ SSOT - Usar PostService para contagem de posts
    const { postService } = await import("@/core/posts/services");

    const [postsCount, likesCount, favoritesResult] = await Promise.all([
      postService.getPostsCountByUser(userId),
      // ✅ SSOT - Usar método interno getUserLikesCount
      this.getUserLikesCount(activeProfile.id),
      // ✅ SSOT - Usar FavoritesService
      import("@/core/favorites/services/FavoritesService").then(
        ({ FavoritesService }) =>
          FavoritesService.getFavoriteStats(activeProfile.id),
      ),
    ]);

    return {
      posts: postsCount || 0,
      likes: likesCount || 0,
      favorites: favoritesResult.total_favorites_given || 0,
    };
  }

  // ============================================================================
  // 📊 ESTATÍSTICAS ADMINISTRATIVAS
  // ============================================================================

  /**
   * 📊 OBTER CONTAGEM TOTAL DE USUÁRIOS
   * ✅ SSOT para contagem de usuários no dashboard admin
   *
   * @returns Número total de usuários cadastrados
   */
  async getTotalProfilesCount(): Promise<number> {
    try {
      const { count, error } = await (supabase as any)
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (error) {
        logger.error("Error getting profiles count", error, {
          service: "ProfileService",
          method: "getTotalProfilesCount",
        });
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.error("Error getting profiles count", error as Error, {
        service: "ProfileService",
        method: "getTotalProfilesCount",
      });
      return 0;
    }
  }

  /**
   * 📋 OBTER USUÁRIOS RECENTES
   * ✅ SSOT para atividade recente de usuários
   *
   * @param limit - Número máximo de resultados (padrão: 10)
   * @returns Lista de usuários recentes
   */
  async getRecentProfiles(limit = 10): Promise<any[]> {
    try {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, name, username, avatar_url, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        logger.error("Error getting recent profiles", error, {
          service: "ProfileService",
          method: "getRecentProfiles",
          limit,
        });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error("Error getting recent profiles", error as Error, {
        service: "ProfileService",
        method: "getRecentProfiles",
      });
      return [];
    }
  }

  /**
   * 📅 OBTER USUÁRIOS CRIADOS EM UM PERÍODO
   * ✅ SSOT para atividade de usuários por período
   *
   * @param startDate - Data inicial do período
   * @param endDate - Data final do período
   * @returns Número de usuários criados no período
   */
  async getProfilesCreatedInPeriod(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    try {
      const { count, error } = await (supabase as any)
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (error) {
        logger.error("Error getting profiles in period", error, {
          service: "ProfileService",
          method: "getProfilesCreatedInPeriod",
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.error("Error getting profiles in period", error as Error, {
        service: "ProfileService",
        method: "getProfilesCreatedInPeriod",
      });
      return 0;
    }
  }

  /**
   * Upload de avatar
   */
  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await (supabase as any).storage
      .from("profile-images")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      trackError(new Error("Error uploading avatar"), {
        component: "ProfileService",
        action: "uploadAvatar",
        metadata: { userId, fileName, error: uploadError },
      });
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("profile-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Verifica se username está disponível
   * ✅ INTEGRADO: Delega para PublicIdentityService (SSOT)
   * @param username - Username para verificar
   * @param excludeProfileId - ID do perfil a excluir da verificação (para updates)
   */
  async isUsernameAvailable(
    username: string,
    excludeProfileId?: string,
  ): Promise<boolean> {
    try {
      const availability = await PublicIdentityService.checkAvailability({
        identifier: username,
        entityType: 'profile',
        excludeEntityId: excludeProfileId,
      });
      return availability.status === 'available';
    } catch (error) {
      trackError(new Error("Error verifying username"), {
        component: "ProfileService",
        action: "isUsernameAvailable",
        metadata: { username, error },
      });
      return false;
    }
  }

  /**
   * Verifica se handle está disponível - DEPRECATED, use isUsernameAvailable
   * @deprecated Use isUsernameAvailable instead. Will be removed in v2.0.0
   */
  async isHandleAvailable(
    handle: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    if (process.env.NODE_ENV === 'development') {
      logger.warn(
        '⚠️  ProfileService.isHandleAvailable() is deprecated.\n' +
        '   Use isUsernameAvailable() instead.\n' +
        '   This method will be removed in v2.0.0'
      );
    }
    return this.isUsernameAvailable(handle, excludeUserId);
  }

  // ============================================================================
  // READ MODELS TIPADOS - GATE 2
  // ============================================================================

  /**
   * Read model para feeds, listas e comentários
   * Evita N+1 queries e não expõe shape do banco
   */
  async getProfilesByIds(ids: string[]): Promise<Profile[]> {
    if (ids.length === 0) return [];

    const uniqueIds = [...new Set(ids)];

    const { data, error } = await createTypedQuery('profiles')
      .select()
      .in("id", uniqueIds);

    if (error) {
      trackError(new Error("Error fetching profiles by ids"), {
        component: "ProfileService",
        action: "getProfilesByIds",
        metadata: { ids: uniqueIds, error },
      });
      return [];
    }

    return data || [];
  }

  async getProfilesSummary(ids: string[]): Promise<ProfileSummary[]> {
    if (ids.length === 0) return [];

    const uniqueIds = [...new Set(ids)];

    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("id, user_id, name, avatar_url, verified")
      .in("id", uniqueIds);

    if (error) {
      trackError(new Error("Error fetching profiles summary"), {
        component: "ProfileService",
        action: "getProfilesSummary",
        metadata: { ids: uniqueIds, error },
      });
      return [];
    }

    // Mapear para shape de domínio (camelCase)
    return (data || []).map((profile) => ({
      id: profile.id,
      userId: profile.user_id,
      name: profile.name,
      avatarUrl: profile.avatar_url,
      verified: profile.verified || false,
    }));
  }

  /**
   * GATE 2 - Read model estendido para casos específicos
   * Usado quando ProfileSummary não tem campos suficientes
   */
  async getProfilesSummaryExtended(
    ids: string[],
  ): Promise<ProfileSummaryExtended[]> {
    if (ids.length === 0) return [];

    const uniqueIds = [...new Set(ids)];

    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("id, name, avatar_url, verified, neighborhood, whatsapp")
      .in("id", uniqueIds);

    if (error) {
      trackError(new Error("Error fetching profiles summary extended"), {
        component: "ProfileService",
        action: "getProfilesSummaryExtended",
        metadata: { ids: uniqueIds, error },
      });
      return [];
    }

    // Mapear para shape de domínio (camelCase)
    return (data || []).map((profile) => ({
      id: profile.id,
      name: profile.name,
      avatarUrl: profile.avatar_url,
      verified: profile.verified || false,
      neighborhood: profile.neighborhood,
      whatsapp: profile.whatsapp,
    }));
  }

  /**
   * Read model para painéis administrativos
   * Campos específicos para administração
   */
  async getAdminProfilesList(
    filters?: AdminFilters,
  ): Promise<AdminProfileListItem[]> {
    let query = (supabase as any)
      .from("profiles")
      .select(
        "id, name, username, avatar_url, verified, is_suspended, created_at, profile_type",
      );

    if (filters?.suspended !== undefined) {
      query = query.eq("is_suspended", filters.suspended);
    }

    if (filters?.verified !== undefined) {
      query = query.eq("verified", filters.verified);
    }

    if (filters?.profileType) {
      query = query.eq("profile_type", filters.profileType);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      trackError(new Error("Error fetching admin profiles list"), {
        component: "ProfileService",
        action: "getAdminProfilesList",
        metadata: { filters, error },
      });
      return [];
    }

    // Mapear para shape de domínio (camelCase)
    return (data || []).map((profile) => ({
      id: profile.id,
      name: profile.name,
      username: profile.username,
      avatarUrl: profile.avatar_url,
      verified: profile.verified || false,
      suspended: profile.is_suspended || false,
      createdAt: profile.created_at,
      profileType: profile.profile_type,
    }));
  }

  /**
   * Busca profiles com filtros avançados e paginação para uso administrativo.
   * Suporta filtro por tipo, visibilidade, busca textual e paginação com count total.
   */
  async getProfilesFiltered(filters: {
    search?: string;
    profileType?: string;
    visibility?: "all" | "public" | "private";
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    const { search, profileType, visibility = "all", page = 1, limit = 20 } = filters;

    let query = (supabase as any)
      .from("profiles")
      .select(
        "id, user_id, created_at, profile_type, is_public, username, name, display_name",
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    if (profileType) {
      query = query.eq("profile_type", profileType);
    }

    if (visibility === "public") {
      query = query.eq("is_public", true);
    } else if (visibility === "private") {
      query = query.eq("is_public", false);
    }

    if (search?.trim()) {
      const term = search.trim().replace(/[%(),]/g, " ").trim();
      query = query.or(
        `name.ilike.%${term}%,display_name.ilike.%${term}%,username.ilike.%${term}%,user_id.ilike.%${term}%`,
      );
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      trackError(new Error("Error fetching profiles filtered"), {
        component: "ProfileService",
        action: "getProfilesFiltered",
        metadata: { filters, error },
      });
      return { data: [], total: 0 };
    }

    return { data: data ?? [], total: count ?? 0 };
  }

  /**
   * Busca todos os IDs de profiles para uso administrativo.
   */
  async getAllProfileIds(): Promise<string[]> {
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("id");

    if (error) {
      trackError(new Error("Error fetching all profile ids"), {
        component: "ProfileService",
        action: "getAllProfileIds",
        metadata: { error },
      });
      return [];
    }

    return (data ?? []).map((p: { id: string }) => p.id);
  }

  /**
   * Permissões-base tipadas (não motor genérico)
   * Apenas identidade básica, regras de domínio ficam no domínio
   */
  async getBasePermissions(userId: string): Promise<BasePermissions> {
    const context = await this.getProfileContext(userId);
    if (!context) {
      return {
        canPost: false,
        canComment: false,
        canMessage: false,
      };
    }

    return {
      canPost: context.permissions.canPost,
      canComment: context.permissions.canComment,
      canMessage: context.permissions.canMessage,
    };
  }

  // ============================================================================
  // MÉTODOS TEMPORÁRIOS PARA MOBILIDADE - GATE 2 CLOSURE
  // TODO: Mover para MobilityService quando refatorar arquitetura
  // ============================================================================

  /**
   * Obtém active_ride_id de um perfil
   * TEMPORÁRIO: Este campo deveria estar em tabela separada de estado de mobilidade
   */
  async getActiveRideId(profileId: string): Promise<string | null> {
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("active_ride_id")
      .eq("id", profileId)
      .single();

    if (error) return null;
    return data?.active_ride_id || null;
  }

  /**
   * Define active_ride_id de um perfil
   * TEMPORÁRIO: Este campo deveria estar em tabela separada de estado de mobilidade
   */
  async setActiveRideId(
    profileId: string,
    rideId: string | null,
  ): Promise<void> {
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ active_ride_id: rideId })
      .eq("id", profileId);

    if (error) {
      trackError(new Error("Error setting active_ride_id"), {
        component: "ProfileService",
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
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ active_ride_id: null })
      .eq("id", profileId)
      .eq("active_ride_id", rideId);

    if (error) {
      trackError(new Error("Error clearing active_ride_id"), {
        component: "ProfileService",
        action: "clearActiveRideId",
        metadata: { profileId, rideId, error },
      });
      throw error;
    }
  }

  /**
   * Busca dados básicos de perfis para mobilidade (passageiro/motorista)
   * TEMPORÁRIO: Retorna campos específicos de mobilidade
   */
  async getProfilesForRides(
    ids: string[],
    type: "passenger" | "driver",
  ): Promise<ProfileLikeActivityRecord[]> {
    if (ids.length === 0) return [];

    const selectFields =
      type === "passenger"
        ? "id, name, avatar_url, city, neighborhood, street, pontos, telefone"
        : "id, name, avatar_url";

    const { data, error } = await (supabase as any)
      .from("profiles")
      .select(selectFields)
      .in("id", ids);

    if (error) {
      trackError(new Error("Error fetching profiles for rides"), {
        component: "ProfileService",
        action: "getProfilesForRides",
        metadata: { ids, type, error },
      });
      return [];
    }

    return data || [];
  }
  /**
   * Remove suspensão de um usuário
   */
  async unsuspendUser(userId: string): Promise<void> {
    await this.updateProfile(userId, {
      is_suspended: false,
      suspended: false,
      suspended_until: null,
      suspension_reason: undefined,
    });
  }

  /**
   * Verifica um usuário (marca como verificado)
   */
  async verifyUser(userId: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from("profiles")
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;
    } catch (error) {
      trackError(new Error("Error verifying user"), {
        component: "ProfileService",
        action: "verifyUser",
        metadata: { userId, error },
      });
      throw error;
    }
  }

  /**
   * Busca perfis por status de verificação
   * Usado por VerificationService para listar perfis pendentes/verificados/rejeitados
   */
  async getProfilesByVerificationStatus(
    status: 'pending' | 'verified' | 'rejected' | 'none',
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: 'created_at' | 'updated_at';
    }
  ): Promise<Profile[]> {
    try {
      let query = (supabase as any)
        .from('profiles')
        .select('*')
        .eq('verification_status', status);

      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: false });
      } else {
        query = query.order('updated_at', { ascending: false });
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching profiles by verification status:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      trackError(new Error('Error getting profiles by verification status'), {
        component: 'ProfileService',
        action: 'getProfilesByVerificationStatus',
        metadata: { status, options, error },
      });
      throw error;
    }
  }

  /**
   * Busca estatísticas de verificação
   * Retorna contagem de perfis por status de verificação
   */
  async getVerificationStats(): Promise<{
    total_pending: number;
    total_verified: number;
    total_rejected: number;
  }> {
    try {
      const [pending, verified, rejected] = await Promise.all([
        (supabase as any)
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('verification_status', 'pending'),
        (supabase as any)
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('verification_status', 'verified'),
        (supabase as any)
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('verification_status', 'rejected'),
      ]);

      return {
        total_pending: pending.count ?? 0,
        total_verified: verified.count ?? 0,
        total_rejected: rejected.count ?? 0,
      };
    } catch (error) {
      trackError(new Error('Error getting verification stats'), {
        component: 'ProfileService',
        action: 'getVerificationStats',
        metadata: { error },
      });
      throw error;
    }
  }

  /**
   * Atualiza status de verificação de um perfil
   * Método genérico usado pelos métodos específicos abaixo
   */
  async updateVerificationStatus(
    profileId: string,
    status: 'pending' | 'verified' | 'rejected' | 'none',
    reason?: string
  ): Promise<void> {
    try {
      const updates: any = {
        verification_status: status,
      };

      if (status === 'verified') {
        updates.is_verified = true;
        updates.verified_at = new Date().toISOString();
      } else if (status === 'rejected' && reason) {
        updates.verification_rejection_reason = reason;
      }

      const { error } = await (supabase as any)
        .from('profiles')
        .update(updates)
        .eq('id', profileId);

      if (error) {
        logger.error('Error updating verification status:', error);
        throw error;
      }
    } catch (error) {
      trackError(new Error('Error updating verification status'), {
        component: 'ProfileService',
        action: 'updateVerificationStatus',
        metadata: { profileId, status, reason, error },
      });
      throw error;
    }
  }

  /**
   * Aprova verificação de um perfil
   */
  async approveVerification(profileId: string): Promise<void> {
    await this.updateVerificationStatus(profileId, 'verified');
  }

  /**
   * Rejeita verificação de um perfil
   */
  async rejectVerification(profileId: string, reason?: string): Promise<void> {
    await this.updateVerificationStatus(profileId, 'rejected', reason);
  }

  /**
   * Revoga verificação de um perfil
   */
  async revokeVerification(profileId: string): Promise<void> {
    await this.updateVerificationStatus(profileId, 'none');
  }

  /**
   * Suspende um usuário
   */
  async suspendUser(
    userId: string,
    duration: string,
    reason: string,
  ): Promise<void> {
    try {
      const suspendedUntil = this._calculateSuspensionEnd(duration);

      const { error } = await (supabase as any)
        .from("profiles")
        .update({
          is_suspended: true,
          suspended: true,
          suspended_at: new Date().toISOString(),
          suspended_until: suspendedUntil,
          suspension_reason: reason,
        })
        .eq("id", userId);

      if (error) throw error;
    } catch (error) {
      trackError(new Error("Error suspending user"), {
        component: "ProfileService",
        action: "suspendUser",
        metadata: { userId, duration, reason, error },
      });
      throw error;
    }
  }

  /**
   * Calcula data de fim da suspensão
   */
  private _calculateSuspensionEnd(duration: string): string {
    const now = new Date();

    if (duration === "1 day") {
      now.setDate(now.getDate() + 1);
    } else if (duration === "7 days") {
      now.setDate(now.getDate() + 7);
    } else if (duration === "30 days") {
      now.setDate(now.getDate() + 30);
    } else if (duration === "permanent") {
      now.setFullYear(now.getFullYear() + 100); // 100 anos no futuro
    }

    return now.toISOString();
  }

  /**
   * Busca todos os usuários com contexto de status
   */
  async getAllUsers(): Promise<
    Array<{
      id: string;
      name: string;
      status: ProfileStatus;
      avatar_url?: string;
      verified: boolean;
      permissions: ProfilePermissions;
      reputation: number;
    }>
  > {
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select(
        "id, name, avatar_url, is_active, is_suspended, suspended_at, suspension_reason, suspended_until, verified, reputation",
      )
      .order("created_at", { ascending: false });

    if (error) {
      trackError(new Error("Error fetching all users"), {
        component: "ProfileService",
        action: "getAllUsers",
        metadata: { error },
      });
      return [];
    }

    return (data || []).map((p) => ({
      id: p.id,
      name: p.name,
      avatar_url: p.avatar_url,
      verified: p.verified || false,
      reputation: p.reputation || 0,
      status: {
        isActive: p.is_active && !p.is_suspended,
        isBlocked: false,
        isSuspended: p.is_suspended || false,
        suspendedAt: p.suspended_at,
        suspensionReason: p.suspension_reason,
        suspendedUntil: p.suspended_until,
      },
      permissions: {
        canPost: true,
        canComment: true,
        canMessage: true,
        canCreateBusiness: true,
        canModerate: false,
      },
    }));
  }

  // ============================================================================
  // SSOT: Métodos auxiliares para dados complementares de perfil
  // ============================================================================

  /**
   * Busca roles de um usuário
   * ✅ LOTE 6 - Refatorado para usar AdminRolesService
   */
  async getUserRoles(userId: string): Promise<string[]> {
    try {
      const { adminRolesService } =
        await import("@/core/admin/services/AdminRolesService");
      const roles = await adminRolesService.getUserRoles(userId);
      return roles.map((r) => r.role);
    } catch (error) {
      trackError(new Error("Error fetching user roles"), {
        component: "ProfileService",
        action: "getUserRoles",
        metadata: { userId, error },
      });
      return [];
    }
  }

  /**
   * Conta likes dados por um perfil (usando SocialInteractionsService)
   */
  async getUserLikesCount(profileId: string): Promise<number> {
    try {
      // Usar SocialInteractionsService para obter estatísticas
      const stats =
        await SocialInteractionsService.getInteractionStats(profileId);
      return stats.likesGiven || 0;
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action: "getUserLikesCount",
        metadata: { profileId },
      });
      return 0;
    }
  }

  /**
   * Conta favoritos de um usuário
   */
  async getUserFavoritesCount(userId: string): Promise<number> {
    const { count, error } = await (supabase as any)
      .from("profile_favorites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) return 0;
    return count || 0;
  }

  /**
   * Busca businesses de múltiplos perfis (para useProfile)
   */
  async getUserBusinessesByProfiles(profileIds: string[]): Promise<any[]> {
    if (!profileIds.length) return [];

    const { data, error } = await (supabase as any)
      .from("business_data")
      .select(
        `
        profile_id,
        business_name,
        category,
        is_premium,
        is_verified,
        created_at
      `,
      )
      .in("profile_id", profileIds)
      .order("created_at", { ascending: false });

    if (error) {
      trackError(new Error("Error fetching user businesses"), {
        component: "ProfileService",
        action: "getUserBusinessesByProfiles",
        metadata: { profileIds, error },
      });
      return [];
    }

    return data || [];
  }

  /**
   * Busca businesses de um perfil
   */
  async getUserBusinesses(profileId: string): Promise<any[]> {
    const { data, error } = await (supabase as any)
      .from("business_data")
      .select(
        `
        profile_id,
        category,
        logo,
        slug,
        verified,
        is_premium,
        created_at,
        profiles(name, neighborhood, city)
      `,
      )
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });

    if (error) {
      trackError(new Error("Error fetching user businesses"), {
        component: "ProfileService",
        action: "getUserBusinesses",
        metadata: { profileId, error },
      });
      return [];
    }

    return data || [];
  }

  /**
   * Busca favoritos de negócios de um usuário
   */
  async getUserFavoriteBusinesses(userId: string): Promise<any[]> {
    const { data: favs, error } = await (supabase as any)
      .from("profile_favorites")
      .select("profile_id")
      .eq("user_id", userId);

    if (error || !favs?.length) return [];

    const ids = favs.map((f: any) => f.profile_id);
    const { data: businesses, error: bizError } = await (supabase as any)
      .from("business_data")
      .select(
        `
        profile_id,
        category,
        logo,
        slug,
        verified,
        is_premium,
        profiles(name, neighborhood, city)
      `,
      )
      .in("profile_id", ids)
      .eq("status", "active");

    if (bizError) return [];
    return businesses || [];
  }

  /**
   * Busca ranking de usuários por pontos
   */
  async getRanking(
    limit: number = 50,
  ): Promise<
    Array<{ id: string; name: string; avatar_url: string; pontos: number }>
  > {
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("id, name, avatar_url, pontos")
      .order("pontos", { ascending: false })
      .limit(limit);

    if (error) {
      trackError(new Error("Error fetching ranking"), {
        component: "ProfileService",
        action: "getRanking",
        metadata: { error },
      });
      return [];
    }

    return (data || []).map((p) => ({
      id: p.id,
      name: p.name || "Usuário",
      avatar_url: p.avatar_url || "",
      pontos: p.pontos || 0,
    }));
  }

  /**
   * Busca dados de motorista de um perfil (admin)
   * ✅ LOTE 9A - Delegado para MobilityService (SSOT para driver_data)
   */
  async getDriverData(profileId: string): Promise<any | null> {
    try {
      const { mobilityService } =
        await import("@/modules/mobility/services/MobilityService.impl");
      return await mobilityService.getDriverData(profileId);
    } catch (error) {
      logger.error("Error in getDriverData:", error);
      return null;
    }
  }

  /**
   * Busca confirmações de alertas (admin)
   */
  /**
   * Busca menções de um usuário em posts
   */
  async getUserMentions(
    userId: string,
    from: number,
    to: number,
  ): Promise<ProfileLikeActivityRecord[]> {
    const { data, error } = await (supabase as any)
      .from("community_post_mentions")
      .select(
        `
        id, rank, created_at,
        post:posts!inner (
          id, type, content, created_at, likes_count, comments_count,
          author:profiles!posts_author_id_fkey (id, name, avatar_url)
        )
      `,
      )
      .eq("mentioned_profile_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) return [];
    return (data || []).map((mention: any) => ({
      id: mention.id,
      rank: mention.rank,
      created_at: mention.created_at,
      post: {
        id: mention.post.id,
        type: mention.post.type,
        content: mention.post.content,
        created_at: mention.post.created_at,
        likes_count: mention.post.likes_count,
        comments_count: mention.post.comments_count,
        author: mention.post.author,
      },
    }));
  }

  /**
   * Busca atividade de likes de um usuário
   */
  async getUserLikeActivity(
    userId: string,
    from: number,
    to: number,
  ): Promise<ProfileLikeActivityRecord[]> {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profileData) return [];

    const { data, error } = await supabase
      .from("post_likes_new")
      .select(
        `id, created_at,
        post:posts!post_likes_new_post_id_fkey(
          id, type, content,
          author:profiles!posts_author_profile_id_fkey(id, name, avatar_url)
        )`,
      )
      .eq("liker_profile_id", profileData.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) return [];
    return data || [];
  }

  /**
   * Busca atividade de saves de um usuário
   */
  async getUserSaveActivity(
    userId: string,
    from: number,
    to: number,
  ): Promise<ProfileSaveActivityRecord[]> {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profileData) return [];

    const { data, error } = await supabase
      .from("saved_posts_new")
      .select(
        `id, created_at,
        post:posts!saved_posts_new_post_id_fkey(
          id, type, content,
          author:profiles!posts_author_profile_id_fkey(id, name, avatar_url)
        )`,
      )
      .eq("saver_profile_id", profileData.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) return [];
    return data || [];
  }

  /**
   * Busca atividade de votos em enquetes de um usuário
   */
  async getUserPollVoteActivity(
    userId: string,
    from: number,
    to: number,
  ): Promise<ProfilePollVoteActivityRecord[]> {
    // community_polls.post_id agora referencia posts.id (Sprint Q&A Fase 1)
    const { data, error } = await (supabase as any)
      .from("community_poll_votes")
      .select(
        `
        id, option_id, created_at,
        poll:community_polls!inner(id, question, options, post_id)
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) return [];
    return data || [];
  }

  /**
   * Busca usuários com baixo rating (admin)
   */
  async getLowRatedUsers(params: {
    maxRating: number;
    minRides: number;
    limit: number;
  }): Promise<any[]> {
    try {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select(
          "id, name, avatar_url, passenger_rating, passenger_trust_level, passenger_completed_rides",
        )
        .lte("passenger_rating", params.maxRating)
        .gte("passenger_completed_rides", params.minRides)
        .order("passenger_rating", { ascending: true })
        .limit(params.limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching low rated users:", error);
      return [];
    }
  }

  /**
   * Busca top passageiros por rating (admin)
   */
  async getTopPassengers(params: {
    minRides: number;
    limit: number;
  }): Promise<any[]> {
    try {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select(
          "id, name, avatar_url, passenger_rating, passenger_trust_level, passenger_completed_rides",
        )
        .gte("passenger_completed_rides", params.minRides)
        .order("passenger_rating", { ascending: false })
        .limit(params.limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching top passengers:", error);
      return [];
    }
  }

  /**
   * Busca perfis por nome (para MentionInput)
   */
  async searchProfilesByName(
    searchQuery: string,
    maxResults: number = 10,
  ): Promise<Profile[]> {
    try {
      const { data, error } = await (supabase as any).rpc(
        "search_profiles_by_name",
        {
          search_query: searchQuery,
          max_results: maxResults,
        },
      );

      if (error) throw error;
      return data || [];
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action: "searchProfilesByName",
        metadata: { searchQuery, maxResults },
      });
      return [];
    }
  }

  /**
   * Busca membros de um perfil/business (para useDashboardAccess)
   */
  async getProfileMembers(
    profileId: string,
  ): Promise<Array<{ user_id: string; role: string }>> {
    try {
      const { data, error } = await (supabase as any)
        .from("profile_members")
        .select("user_id, role")
        .eq("profile_id", profileId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action: "getProfileMembers",
        metadata: { profileId },
      });
      return [];
    }
  }

  async isProfileOwner(profileId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await (supabase as any)
        .from("profile_members")
        .select("id")
        .eq("profile_id", profileId)
        .eq("user_id", userId)
        .eq("role", "owner")
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action: "isProfileOwner",
        metadata: { profileId, userId },
      });
      return false;
    }
  }

  /**
   * Adiciona um membro a um perfil
   * ✅ SSOT: Único ponto de entrada para inserção em profile_members
   */
  async addMember(
    profileId: string,
    userId: string,
    role: "owner" | "admin" | "member" = "member",
  ): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from("profile_members")
        .insert({ profile_id: profileId, user_id: userId, role });

      if (error) throw error;
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action: "addMember",
        metadata: { profileId, userId, role },
      });
      throw error;
    }
  }

  // ============================================================================
  // ✅ SSOT: USERNAME MANAGEMENT (para ProfileIdentityAdapter)
  // ============================================================================

  /**
   * ✅ SSOT: Verifica se username existe
   * Usado por ProfileIdentityAdapter.identifierExists()
   * 
   * @param username - Username normalizado para verificar
   * @param excludeId - ID do perfil a excluir da verificação (para updates)
   * @returns true se username existe, false caso contrário
   */
  static async checkUsernameExists(
    username: string,
    excludeId?: string
  ): Promise<boolean> {
    try {
      let query = (supabase as any)
        .from('profiles')
        .select('id')
        .eq('username', username)
        .limit(1);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        logger.error('[ProfileService] checkUsernameExists error:', error);
        throw new Error(`Failed to check username existence: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Failed to check')) {
        throw error;
      }
      logger.error('[ProfileService] checkUsernameExists unexpected error:', error);
      throw new Error('Infrastructure error checking username');
    }
  }

  /**
   * ✅ SSOT: Busca usernames similares
   * Usado por ProfileIdentityAdapter.getExistingSimilar()
   * 
   * @param username - Username base para buscar similares
   * @param limit - Número máximo de resultados (padrão: 20)
   * @returns Array de usernames similares
   */
  static async getSimilarUsernames(
    username: string,
    limit = 20
  ): Promise<string[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('username')
        .ilike('username', `${username}%`)
        .limit(limit);

      if (error) {
        logger.error('[ProfileService] getSimilarUsernames error:', error);
        throw new Error(`Failed to get similar usernames: ${error.message}`);
      }

      return (data || [])
        .map((d: { username: string | null }) => d.username)
        .filter((u): u is string => !!u);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Failed to get')) {
        throw error;
      }
      logger.error('[ProfileService] getSimilarUsernames unexpected error:', error);
      throw new Error('Infrastructure error getting similar usernames');
    }
  }

  /**
   * ✅ SSOT: Obtém histórico de mudanças de username
   * Usado por ProfileIdentityAdapter.getHistory()
   * 
   * @param profileId - ID do perfil
   * @returns Array de mudanças de username ordenado por data (mais recente primeiro)
   */
  static async getUsernameHistory(profileId: string): Promise<Array<{
    id: string;
    profile_id: string;
    old_username: string;
    new_username: string;
    change_reason: string;
    changed_at: string;
  }>> {
    try {
      const { data, error } = await (supabase as any)
        .from('profile_username_history')
        .select('*')
        .eq('profile_id', profileId)
        .order('changed_at', { ascending: false });

      if (error) {
        logger.error('[ProfileService] getUsernameHistory error:', error);
        throw new Error(`Failed to get username history: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Failed to get')) {
        throw error;
      }
      logger.error('[ProfileService] getUsernameHistory unexpected error:', error);
      throw new Error('Infrastructure error getting username history');
    }
  }
}

// ============================================================
// 🏛️ PROFILE FACADE - Interface unificada SSOT v2.0
// ============================================================

import * as profileQueries from "./profile.queries";
import * as profileMutations from "./profile.mutations";

/**
 * ProfileFacade - Interface unificada para operações de Profile
 *
 * Organização SSOT:
 * - queries: Todas as operações de leitura
 * - mutations: Todas as operações de escrita
 *
 * @example
 * ```typescript
 * // Queries
 * const profile = await ProfileFacade.queries.getProfileById(id);
 * const active = await ProfileFacade.queries.getActiveProfile(userId);
 *
 * // Mutations
 * const newProfile = await ProfileFacade.mutations.createProfile(data);
 * await ProfileFacade.mutations.updateProfile(id, updates);
 * ```
 */
export const ProfileFacade = {
  queries: {
    getProfileById: profileQueries.getProfileById,
    getActiveProfile: profileQueries.getActiveProfile,
    getProfilesByUserId: profileQueries.getProfilesByUserId,
    getProfileByType: profileQueries.getProfileByType,
    getByUsername: profileQueries.getByUsername,
    getProfilesByIds: profileQueries.getProfilesByIds,
    getProfilesSummary: profileQueries.getProfilesSummary,
    getProfilesSummaryExtended: profileQueries.getProfilesSummaryExtended,
    getAdminProfilesList: profileQueries.getAdminProfilesList,
    getStats: profileQueries.getStats,
    getTotalProfilesCount: profileQueries.getTotalProfilesCount,
    getRecentProfiles: profileQueries.getRecentProfiles,
    getProfilesCreatedInPeriod: profileQueries.getProfilesCreatedInPeriod,
    isUsernameAvailable: profileQueries.isUsernameAvailable,
    getSimilarUsernames: profileQueries.getSimilarUsernames,
    getUsernameHistory: profileQueries.getUsernameHistory,
  },
  mutations: {
    createProfile: profileMutations.createProfile,
    updateProfile: profileMutations.updateProfile,
    updatePrivacySettings: profileMutations.updatePrivacySettings,
    switchActiveProfile: profileMutations.switchActiveProfile,
    deleteProfile: profileMutations.deleteProfile,
    uploadAvatar: profileMutations.uploadAvatar,
    ensureDriverProfileForUser: profileMutations.ensureDriverProfileForUser,
    checkUsernameAvailability: profileMutations.checkUsernameAvailability,
  },
};

// ============================================================
// 🔧 LEGACY - Compatibilidade com código existente
// ============================================================

/**
 * @deprecated Use ProfileFacade ou os exports diretos
 * Instância singleton do ProfileServiceLegacy
 */
export const profileService = new ProfileServiceLegacy();

/**
 * @deprecated Use ProfileFacade ou os exports diretos
 * Alias para ProfileServiceLegacy mantido para compatibilidade
 */
export { ProfileServiceLegacy as ProfileService };
