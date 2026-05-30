/**
 *  AUTH SERVICE - Verificações de Autenticação Centralizadas
 *
 * Verificação de admin centralizada
 * Cache de permissões
 * Fonte única para autorizações
 */

import { supabase } from "@/integrations/supabase";
import { SessionService } from "@/core/session/services/SessionService";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";
import { mediaService } from "@/core/media/services/MediaService";
import { RoleService } from "@/core/authorization/services/RoleService";
import type { User, Session, AuthChangeEvent, Subscription } from "@supabase/supabase-js";

function parseAuthIdentifier(input: string): { kind: "email" | "username"; value: string } | null {
  const value = input.trim();
  if (!value) return null;
  if (value.includes("@")) return { kind: "email", value };
  return { kind: "username", value: value.replace(/^@/, "") };
}

export class AuthService {
  private static adminCache = new Map<string, boolean>();
  private static cacheExpiry = new Map<string, number>();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  private static getOrigin(): string {
    return window.location.origin;
  }

  static getEmailConfirmationRedirectUrl(): string {
    return `${AuthService.getOrigin()}/login?confirmed=1`;
  }

  static getPasswordResetRedirectUrl(): string {
    return `${AuthService.getOrigin()}/reset-password?mode=recovery`;
  }

  static isGoogleAuthEnabled(): boolean {
    return import.meta.env.VITE_AUTH_GOOGLE_ENABLED === "true";
  }

  static isRecoveryRedirect(): boolean {
    const searchParams = new URLSearchParams(window.location.search);

    return (
      searchParams.get("mode") === "recovery" ||
      searchParams.get("type") === "recovery" ||
      (searchParams.get("code") !== null && searchParams.get("mode") === "recovery")
    );
  }

  /**
   * Captura os parâmetros do hash de auth do Supabase.
   * Deve ser chamado o mais cedo possível — o SDK pode limpar o hash após processar.
   */
  static captureAuthHash(): URLSearchParams {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.hash.replace(/^#/, ''));
  }

  /**
   * Detecta se a URL atual contém um erro de auth do Supabase (ex: link expirado).
   */
  static getAuthHashError(): { error: string; errorCode: string } | null {
    const params = AuthService.captureAuthHash();
    const error = params.get('error');
    const errorCode = params.get('error_code');
    if (error || errorCode) return { error: error ?? '', errorCode: errorCode ?? '' };
    return null;
  }

  static onPasswordRecovery(callback: () => void): () => void {
    const { data: { subscription } } = (supabase as any).auth.onAuthStateChange(
      (event: AuthChangeEvent) => {
        if (event === "PASSWORD_RECOVERY") {
          callback();
        }
      },
    ) as { data: { subscription: Subscription } };

    return () => subscription.unsubscribe();
  }

  private static async resolveEmailByUsername(username: string): Promise<string> {
    const normalizedUsername = username.replace(/^@/, "").toLowerCase().trim();

    const { data: email, error: rpcError } = await (supabase as any)
      .rpc("get_email_by_username", { p_username: normalizedUsername });

    if (rpcError || !email) {
      throw new Error("Usuario nao encontrado. Verifique o nome de usuario.");
    }

    return email;
  }

  /**
   *  VERIFICAR SE USUÁRIO É ADMIN
   */
  static async isAdmin(userId: string): Promise<boolean> {
    if (!userId) return false;

    // Check cache
    const cached = this.adminCache.get(userId);
    const expiry = this.cacheExpiry.get(userId);
    if (cached !== undefined && expiry && Date.now() < expiry) {
      return cached;
    }

    try {
      const isAdmin = await RoleService.isAdmin(userId);

      this.adminCache.set(userId, isAdmin);
      this.cacheExpiry.set(userId, Date.now() + this.CACHE_DURATION);

      return isAdmin;
    } catch (err) {
      logger.warn("AuthService.isAdmin failed", { userId });
      return false;
    }
  }

  /**
   *  LIMPAR CACHE DE ADMIN
   */
  static clearAdminCache(userId?: string): void {
    if (userId) {
      this.adminCache.delete(userId);
      this.cacheExpiry.delete(userId);
    } else {
      this.adminCache.clear();
      this.cacheExpiry.clear();
    }
  }

  /**
   *  OBTER USER.ID PARA CONTEXTO ADMINISTRATIVO
   * USO RESTRITO: Apenas para ações de moderação/admin
   * Para contexto social, use ProfileService.getRequiredActiveProfile()
   */
  static async getAdminUserId(): Promise<string> {
    const user = await SessionService.getCurrentUser();
    if (!user) throw new Error("Not authenticated");
    return user.id;
  }

  // ── FASE 3: Helpers de Permissões Administrativas ──

  /**
   * Verifica se usuário pode verificar outros usuários
   */
  static async canVerifyUsers(profileId: string): Promise<boolean> {
    const { AuthorizationEngine } =
      await import("@/core/authorization/services/AuthorizationEngine");
    return AuthorizationEngine.canProfilePerformAction(
      profileId,
      "verifyUser",
      {},
    );
  }

  /**
   * Verifica se usuário pode banir outros usuários
   */
  static async canBanUsers(profileId: string): Promise<boolean> {
    const { AuthorizationEngine } =
      await import("@/core/authorization/services/AuthorizationEngine");
    return AuthorizationEngine.canProfilePerformAction(
      profileId,
      "banUser",
      {},
    );
  }

  /**
   * Verifica se usuário pode suspender outros usuários
   */
  static async canSuspendUsers(profileId: string): Promise<boolean> {
    const { AuthorizationEngine } =
      await import("@/core/authorization/services/AuthorizationEngine");
    return AuthorizationEngine.canProfilePerformAction(
      profileId,
      "suspendUser",
      {},
    );
  }

  /**
   *  VERIFICAR SE USUÁRIO É PROPRIETÁRIO
   */
  static isOwner(userId: string, resourceOwnerId: string): boolean {
    return userId === resourceOwnerId;
  }

  /**
   *  VERIFICAR PERMISSÕES COMBINADAS
   */
  static async canManageResource(
    userId: string,
    resourceOwnerId: string,
  ): Promise<boolean> {
    if (!userId) return false;

    // Proprietário sempre pode gerenciar
    if (this.isOwner(userId, resourceOwnerId)) {
      return true;
    }

    // Admin pode gerenciar qualquer recurso
    return await this.isAdmin(userId);
  }

  // ── Canonical auth facade used by useAuth hook ──

  static async getCurrentUser(): Promise<import("./types").AuthUser | null> {
    // Delegate to SessionService — the only place allowed to call supabase.auth.getUser()
    const user = await SessionService.getCurrentUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      emailConfirmed: user.emailConfirmed,
    };
  }

  static async signUp(data: import("./types").SignUpData): Promise<void> {
    const { error } = await (supabase as any).auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          display_name: data.display_name || data.name,
          handle: data.handle || data.username || undefined,
          city: data.city || undefined,
          neighborhood: data.neighborhood || undefined,
          state: data.state || undefined,
          street: data.street || undefined,
          // UUID canônico — vínculo territorial imutável
          neighborhood_id: data.neighborhood_id || undefined,
        },
        emailRedirectTo: AuthService.getEmailConfirmationRedirectUrl(),
      },
    });
    if (error) throw error;
  }

  static async signIn(data: import("./types").SignInData): Promise<void> {
    const { error } = await (supabase as any).auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    
    if (error) {
      // Log apenas em desenvolvimento
      if (import.meta.env.DEV) {
        logger.error(' Erro no login:', {
          message: error.message,
          status: error.status,
          code: error.code,
        });
      }
      throw error;
    }
  }

  /**
   *  LOGIN POR USERNAME
   * Resolve o email via RPC SECURITY DEFINER (acessa auth.users server-side).
   * O email nunca trafega como dado visível — é usado apenas pelo SDK internamente.
   */
  static async signInWithUsername(data: import("./types").SignInWithUsernameData): Promise<void> {
    const email = await AuthService.resolveEmailByUsername(data.username);
    await AuthService.signIn({ email, password: data.password });
  }
  static async signInWithGoogle(): Promise<void> {
    if (!AuthService.isGoogleAuthEnabled()) {
      throw new Error("Login com Google nao esta disponivel neste ambiente.");
    }
    const { error } = await (supabase as any).auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: AuthService.getOrigin(),
      },
    });
    if (error) throw error;
  }
  static async signOut(): Promise<void> {
    const { error } = await (supabase as any).auth.signOut();
    if (error) throw error;
  }

  static async resetPassword(email: string): Promise<void> {
    const { error } = await (supabase as any).auth.resetPasswordForEmail(
      email,
      {
        redirectTo: AuthService.getPasswordResetRedirectUrl(),
      },
    );
    if (error) throw error;
  }
  static async resetPasswordByIdentifier(identifier: string): Promise<void> {
    const parsedIdentifier = parseAuthIdentifier(identifier);

    if (!parsedIdentifier) {
      throw new Error("Informe seu e-mail ou nome de usuario.");
    }

    if (parsedIdentifier.kind === "email") {
      await AuthService.resetPassword(parsedIdentifier.value);
      return;
    }

    const email = await AuthService.resolveEmailByUsername(parsedIdentifier.value);
    await AuthService.resetPassword(email);
  }
  static async resendConfirmationEmail(email: string): Promise<void> {
    const { error } = await (supabase as any).auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: AuthService.getEmailConfirmationRedirectUrl(),
      },
    });
    if (error) throw error;
  }
  static async updatePassword(newPassword: string): Promise<void> {
    const { error } = await (supabase as any).auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }

  /**
   *  UPLOAD DE AVATAR
   * Faz upload da imagem para o storage e atualiza o perfil
   */
  static async uploadAvatar(userId: string, file: File): Promise<string> {
    const upload = await mediaService.uploadAvatar(userId, file);
    const avatarUrl = upload.url;

    // Atualizar profile usando ProfileService
    await profileService.updateProfile(userId, { avatar_url: avatarUrl });

    return avatarUrl;
  }

  /**
   *  DELETAR IMAGEM DO STORAGE
   * Remove uma imagem do storage community-posts
   */
  static async deleteStorageImage(
    bucket: string,
    imageUrl: string,
  ): Promise<boolean> {
    try {
      // Extrair o path do arquivo da URL
      const urlParts = imageUrl.split(`/${bucket}/`);
      if (urlParts.length < 2) return false;

      const filePath = urlParts[1];

      const { error } = await (supabase as any).storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error deleting image:", error);
      return false;
    }
  }

  /**
   *  UPLOAD DE IMAGEM PARA STORAGE
   * Upload genérico de imagem para um bucket específico
   */
  static async uploadImage(
    bucket: string,
    userId: string,
    file: File,
  ): Promise<string> {
    // Validar tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Tipo de arquivo não suportado. Use JPEG, PNG, GIF ou WebP.",
      );
    }

    // Validar tamanho (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error("Imagem muito grande. Tamanho máximo: 5MB");
    }

    const allowedBuckets = new Set([
      "community-posts",
      "tryon",
      "classified-images",
      "banners",
      "business-images",
      "posts",
      "safety-evidence",
    ]);
    if (!allowedBuckets.has(bucket)) {
      throw new Error("Bucket nao permitido para upload.");
    }

    const upload = await mediaService.uploadToBucket(file, {
      bucket: bucket as
        | "community-posts"
        | "tryon"
        | "classified-images"
        | "banners"
        | "business-images"
        | "posts"
        | "safety-evidence",
      pathPrefix: userId,
      preset: "site_asset",
      upsert: false,
    });
    return upload.url;
  }
}
