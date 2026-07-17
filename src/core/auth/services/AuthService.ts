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
import { mediaService } from "@/core/media/services/MediaService";
import {
  isPublicImageUploadBucket,
  type PublicMediaBucket,
} from "@/core/media/config/storageBuckets";
import { RoleService } from "@/core/authorization/services/RoleService";
import { parseAuthIdentifier } from "@/core/auth/utils/authIdentifier";
import { isCurrentTermsAcceptance } from "@/core/legal/termsOfService";
import { AuthError } from "./types";
import {
  buildSupabaseFunctionUrl,
  PUBLIC_SUPABASE_CONFIG,
} from "@/shared/config/publicSupabase";

interface UsernameLoginResponse {
  session?: {
    access_token?: string;
    refresh_token?: string;
  };
  error?: string;
}

function isPublicMediaBucket(bucket: string): bucket is PublicMediaBucket {
  return bucket === "avatars" || bucket === "post-images";
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

  static getTermsAcceptanceRedirectUrl(): string {
    return `${AuthService.getOrigin()}/aceitar-termos`;
  }

  static isGoogleAuthEnabled(): boolean {
    return import.meta.env.VITE_AUTH_GOOGLE_ENABLED === "true";
  }

  static isRecoveryRedirect(): boolean {
    const searchParams = new URLSearchParams(window.location.search);

    return (
      searchParams.get("mode") === "recovery" ||
      searchParams.get("type") === "recovery" ||
      (searchParams.get("code") !== null &&
        searchParams.get("mode") === "recovery")
    );
  }

  /**
   * Captura os parâmetros do hash de auth do Supabase.
   * Deve ser chamado o mais cedo possível — o SDK pode limpar o hash após processar.
   */
  static captureAuthHash(): URLSearchParams {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.hash.replace(/^#/, ""));
  }

  /**
   * Detecta se a URL atual contém um erro de auth do Supabase (ex: link expirado).
   */
  static getAuthHashError(): { error: string; errorCode: string } | null {
    const params = AuthService.captureAuthHash();
    const error = params.get("error");
    const errorCode = params.get("error_code");
    if (error || errorCode)
      return { error: error ?? "", errorCode: errorCode ?? "" };
    return null;
  }

  static onPasswordRecovery(callback: () => void): () => void {
    return SessionService.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        callback();
      }
    });
  }

  private static normalizeUsername(username: string): string {
    return username.replace(/^@/, "").toLowerCase().trim();
  }

  private static async readAuthFunctionResponse(
    response: Response,
  ): Promise<UsernameLoginResponse> {
    const text = await response.text();
    if (!text) return {};

    try {
      return JSON.parse(text) as UsernameLoginResponse;
    } catch {
      return {};
    }
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
    if (!isCurrentTermsAcceptance(data.termsAcceptance)) {
      throw new AuthError(
        "O aceite da versão atual dos Termos de Uso é obrigatório.",
        "TERMS_ACCEPTANCE_REQUIRED",
      );
    }

    const { error } = await supabase.auth.signUp({
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
          terms_accepted: data.termsAcceptance.accepted,
          terms_version: data.termsAcceptance.version,
        },
        emailRedirectTo: AuthService.getEmailConfirmationRedirectUrl(),
      },
    });
    if (error) throw error;
  }

  static async signIn(data: import("./types").SignInData): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      // Log apenas em desenvolvimento
      if (import.meta.env.DEV) {
        logger.error(" Erro no login:", {
          message: error.message,
          status: error.status,
          code: error.code,
        });
      }
      throw error;
    }
  }

  /**
   * LOGIN POR USERNAME
   * Usa Edge Function publica com rate limit. O lookup privilegiado do e-mail
   * fica server-side e o browser recebe apenas tokens de sessao autenticada.
   */
  static async signInWithUsername(
    data: import("./types").SignInWithUsernameData,
  ): Promise<void> {
    const username = AuthService.normalizeUsername(data.username);
    if (!username) {
      throw new Error("E-mail, usuario ou senha incorretos.");
    }

    const response = await fetch(
      buildSupabaseFunctionUrl("auth-username-login"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: PUBLIC_SUPABASE_CONFIG.publishableKey,
        },
        body: JSON.stringify({ username, password: data.password }),
      },
    );

    const payload = await AuthService.readAuthFunctionResponse(response);

    if (!response.ok) {
      throw new Error(payload.error || "Invalid login credentials");
    }

    const accessToken = payload.session?.access_token;
    const refreshToken = payload.session?.refresh_token;
    if (!accessToken || !refreshToken) {
      throw new Error("Resposta de login invalida.");
    }

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) throw error;
    await SessionService.refreshSession();
  }
  static async signInWithGoogle(): Promise<void> {
    if (!AuthService.isGoogleAuthEnabled()) {
      throw new Error("Login com Google nao esta disponivel neste ambiente.");
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: AuthService.getTermsAcceptanceRedirectUrl(),
      },
    });
    if (error) throw error;
  }
  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: AuthService.getPasswordResetRedirectUrl(),
    });
    if (error) throw error;
  }
  static async resetPasswordByIdentifier(identifier: string): Promise<void> {
    const parsedIdentifier = parseAuthIdentifier(identifier);

    if (!parsedIdentifier) {
      throw new Error("Informe seu e-mail cadastrado.");
    }

    if (parsedIdentifier.kind === "email") {
      await AuthService.resetPassword(parsedIdentifier.value);
      return;
    }

    throw new Error("Para recuperar senha, informe o e-mail cadastrado.");
  }
  static async resendConfirmationEmail(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: AuthService.getEmailConfirmationRedirectUrl(),
      },
    });
    if (error) throw error;
  }
  static async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
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

      const filePath = urlParts[1]?.split("?")[0] ?? "";
      if (!filePath) return false;

      if (isPublicImageUploadBucket(bucket)) {
        await mediaService.deleteFromBucket(bucket, [filePath]);
        return true;
      }

      if (isPublicMediaBucket(bucket)) {
        return await mediaService.deleteFile(bucket, filePath);
      }

      return false;
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

    if (!isPublicImageUploadBucket(bucket)) {
      throw new Error("Bucket nao permitido para upload.");
    }

    const upload = await mediaService.uploadToBucket(file, {
      bucket,
      pathPrefix: userId,
      preset: "site_asset",
      upsert: false,
    });
    return upload.url;
  }
}
