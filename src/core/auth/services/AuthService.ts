/**
 * AUTH SERVICE
 *
 * Fronteira canônica para operações de autenticação. Estado de sessão pertence
 * a core/session; identidade pública pertence a core/public-identity/profiles.
 */

import { supabase } from "@/integrations/supabase";
import { createBrowserAuthStorage } from "@/integrations/supabase/cookieStorage";
import {
  AUTH_PATHS,
  buildEmailConfirmationLoginPath,
  buildPasswordRecoveryPath,
} from "@/core/auth/constants/authFlow";
import { SessionService } from "@/core/session/services/SessionService";
import { logger } from "@/shared/utils/logger";
import { RoleService } from "@/core/authorization/services/RoleService";
import { parseAuthIdentifier } from "@/core/auth/utils/authIdentifier";
import { isCurrentTermsAcceptance } from "@/core/legal/termsOfService";
import { AUTH_STORAGE_KEY } from "@/shared/config/security.config";
import { buildPublicAbsoluteUrl } from "@/shared/config/publicAppOrigin";
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

const SIGN_OUT_TIMEOUT_MS = 8_000;
const ADMIN_CACHE_DURATION_MS = 5 * 60 * 1000;

type SignOutAttemptResult =
  | { kind: "completed"; error: unknown | null }
  | { kind: "failed"; error: unknown }
  | { kind: "timeout" };

export class AuthService {
  private static adminCache = new Map<string, boolean>();
  private static cacheExpiry = new Map<string, number>();

  static getEmailConfirmationRedirectUrl(): string {
    return buildPublicAbsoluteUrl(buildEmailConfirmationLoginPath());
  }

  static getPasswordResetRedirectUrl(): string {
    return buildPublicAbsoluteUrl(buildPasswordRecoveryPath());
  }

  static getTermsAcceptanceRedirectUrl(): string {
    return buildPublicAbsoluteUrl(AUTH_PATHS.termsAcceptance);
  }

  static isGoogleAuthEnabled(): boolean {
    // Google faz parte do fluxo oficial de conta/acesso. Ambientes que não têm
    // o provider configurado precisam desabilitá-lo explicitamente com `false`.
    return import.meta.env.VITE_AUTH_GOOGLE_ENABLED !== "false";
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

  /** Verifica autorização administrativa. */
  static async isAdmin(userId: string): Promise<boolean> {
    if (!userId) return false;

    const cached = this.adminCache.get(userId);
    const expiry = this.cacheExpiry.get(userId);
    if (cached !== undefined && expiry && Date.now() < expiry) {
      return cached;
    }

    try {
      const isAdmin = await RoleService.isAdmin(userId);
      this.adminCache.set(userId, isAdmin);
      this.cacheExpiry.set(userId, Date.now() + ADMIN_CACHE_DURATION_MS);
      return isAdmin;
    } catch {
      logger.warn("AuthService.isAdmin failed", { userId });
      return false;
    }
  }

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
   * Obtém user.id somente para contexto administrativo/moderação.
   * Para contexto social, use o ProfileService canônico.
   */
  static async getAdminUserId(): Promise<string> {
    const user = await SessionService.getCurrentUser();
    if (!user) throw new Error("Not authenticated");
    return user.id;
  }

  static async getCurrentUser(): Promise<import("./types").AuthUser | null> {
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
          display_name: data.name,
          handle: data.handle || undefined,
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
      if (import.meta.env.DEV) {
        logger.error("Erro no login", {
          message: error.message,
          status: error.status,
          code: error.code,
        });
      }
      throw error;
    }
  }

  static async signInWithUsername(
    data: import("./types").SignInWithUsernameData,
  ): Promise<void> {
    const username = AuthService.normalizeUsername(data.username);
    if (!username) {
      throw new Error("E-mail, usuário ou senha incorretos.");
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
      throw new Error("Resposta de login inválida.");
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
      throw new Error("Login com Google não está disponível neste ambiente.");
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: AuthService.getTermsAcceptanceRedirectUrl(),
      },
    });
    if (error) throw error;
  }

  private static async clearLocalAuthStorage(): Promise<void> {
    const storage = createBrowserAuthStorage();
    await storage.removeItem(AUTH_STORAGE_KEY);
    await storage.removeItem(`${AUTH_STORAGE_KEY}-code-verifier`);

    const remainingSession = await storage.getItem(AUTH_STORAGE_KEY);
    if (remainingSession !== null) {
      throw new Error("Não foi possível encerrar a sessão local com segurança.");
    }
  }

  static async signOut(): Promise<void> {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<SignOutAttemptResult>((resolve) => {
      timeoutHandle = setTimeout(
        () => resolve({ kind: "timeout" }),
        SIGN_OUT_TIMEOUT_MS,
      );
    });

    const signOutPromise: Promise<SignOutAttemptResult> = supabase.auth
      .signOut({ scope: "local" })
      .then(({ error }) => ({ kind: "completed" as const, error }))
      .catch((error: unknown) => ({ kind: "failed" as const, error }));

    const result = await Promise.race([signOutPromise, timeoutPromise]);
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);

    if (result.kind === "completed" && !result.error) return;

    await AuthService.clearLocalAuthStorage();
    logger.warn("AuthService.signOut recovered with local auth cleanup", {
      reason: result.kind,
    });
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
}
