import { logger } from '@/shared/utils/logger';
import { supabase } from "@/integrations/supabase";
import { SessionState } from "../state/SessionState";
import { CacheManager } from "../cache/CacheManager";
import type { User, Profile, SessionData } from "../types";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
/**
 * Tipo para dados de perfil vindos do banco de dados
 * Usado para mapear resultados de queries e RPCs
 */
interface DbProfileRow {
  id: string;
  user_id: string;
  name: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  profile_type: string;
  city: string | null;
  neighborhood: string | null;
  state: string | null;
  street: string | null;
  telefone: string | null;
  whatsapp: string | null;
  location_id: string | null;
  is_active: boolean;
  verified: boolean | null;
  created_at: string;
}

export class SessionService {
  private static readonly debugLogs =
    import.meta.env.DEV && import.meta.env.VITE_DEBUG_SESSION === "true";
  private static debug(...args: unknown[]): void {
    if (!SessionService.debugLogs || args.length === 0) return;
    const [message, ...context] = args;
    if (typeof message === "string") {
      logger.debug(message, context.length <= 1 ? context[0] : context);
      return;
    }
    logger.debug(String(message), context.length <= 1 ? context[0] : context);
  }

  private static initialized = false;
  private static loadVersion = 0;
  private static loadPromise: Promise<void> | null = null;
  private static authSubscription: { unsubscribe: () => void } | null = null;
  private static currentSession: Session | null = null;
  private static currentSessionPromise: Promise<Session | null> | null = null;

  // initPromise resolve após o INITIAL_SESSION ser processado
  private static initResolve: (() => void) | null = null;
  private static initPromise: Promise<void> = new Promise(
    (resolve) => { SessionService.initResolve = resolve; }
  );
  private static initFallbackStarted = false;
  private static authEventQueue: Promise<void> = Promise.resolve();

  // ── cancelPendingLoads ─────────────────────────────────────────────────────
  private static cancelPendingLoads(): void {
    SessionService.loadVersion++;
  }

  private static resetInitPromise(): void {
    SessionService.initFallbackStarted = false;
    SessionService.initPromise = new Promise((resolve) => {
      SessionService.initResolve = resolve;
    });
  }

  private static resolveInit(): void {
    SessionService.initResolve?.();
    SessionService.initResolve = null;
  }

  // ── cleanup ────────────────────────────────────────────────────────────────
  /**
   * Limpa a subscription do auth listener.
   * Deve ser chamado quando o componente é desmontado.
   */
  static cleanup(): void {
    if (SessionService.authSubscription) {
      SessionService.authSubscription.unsubscribe();
      SessionService.authSubscription = null;
    }
    SessionService.currentSession = null;
    SessionService.currentSessionPromise = null;
    SessionService.initialized = false;
    SessionService.resetInitPromise();
  }

  // ── initialize ─────────────────────────────────────────────────────────────
  /**
   * Registra onAuthStateChange — única fonte de verdade para estado de auth.
   *
   * Ordem de eventos do Supabase SDK na inicialização com sessão existente:
   *   1. SIGNED_IN  (token refresh, se o token estava expirado)
   *   2. INITIAL_SESSION (sessão atual após inicialização completa)
   *
   * Estratégia:
   *   - SIGNED_IN / TOKEN_REFRESHED / USER_UPDATED: carrega perfis, mas NÃO
   *     resolve o initPromise (pode ser um evento intermediário).
   *   - INITIAL_SESSION: carrega perfis E resolve o initPromise.
   *   - SIGNED_OUT: limpa estado e resolve o initPromise.
   */
  static initialize(): void {
    if (SessionService.initialized) return;
    SessionService.resetInitPromise();
    SessionService.initialized = true;

    // Armazena a subscription para cleanup
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      SessionService.currentSession = session;
      SessionService.debug(
        `[SessionService] onAuthStateChange: ${event}`,
        session ? `user=${session.user.id}` : "no session",
      );

      if (event === "SIGNED_OUT") {
        SessionService.cancelPendingLoads();
        SessionService.currentSessionPromise = null;
        SessionState.clear();
        CacheManager.clearAll();
        SessionService.resolveInit();
        return;
      }

      const isInitEvent = event === "INITIAL_SESSION";

      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        if (session) {
          // Nunca executar carga de sessão dentro do callback do Supabase.
          // Encadeamos em fila assíncrona para sair do ciclo do lock interno do GoTrue.
          SessionService.authEventQueue = SessionService.authEventQueue
            .catch(() => undefined)
            .then(
              () =>
                new Promise<void>((resolve) => {
                  window.setTimeout(() => {
                    SessionService.loadFromSession(session, true)
                      .then(() => {
                        if (isInitEvent) SessionService.resolveInit();
                      })
                      .catch(() => {
                        if (isInitEvent) SessionService.resolveInit();
                      })
                      .finally(resolve);
                  }, 0);
                }),
            );
        } else {
          SessionState.setState({ user: null, activeProfile: null, profiles: [] });
          // INITIAL_SESSION sem sessão = não logado, libera o init
          if (isInitEvent) {
            SessionService.resolveInit();
          }
        }
      }
    });

    // Armazena subscription para cleanup futuro se necessário
    SessionService.authSubscription = subscription;

    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        if (SessionService.initResolve) {
          void SessionService.ensureInitialSessionFallback();
        }
      }, 2500);
    } else {
      void SessionService.ensureInitialSessionFallback();
    }
  }

  private static async ensureInitialSessionFallback(): Promise<void> {
    if (SessionService.initFallbackStarted) return;
    SessionService.initFallbackStarted = true;

    try {
      // Evita lock contention no bootstrap: não chamar getSession aqui.
      // O caminho canônico é o evento INITIAL_SESSION do onAuthStateChange.
      // Este fallback existe apenas para não bloquear a UI em casos extremos.
      SessionService.debug("[SessionService] init fallback: resolving without getSession");
    } catch (error) {
      SessionService.debug("[SessionService] getSession fallback threw", error);
    } finally {
      SessionService.resolveInit();
    }
  }

  // ── loadFromSession ────────────────────────────────────────────────────────
  /**
   * Carrega perfis a partir de uma sessão já conhecida.
   * O user vem direto da sessão — sem chamada de rede para auth.
   *
   * forceFresh=true: ignora cache e busca do banco.
   * forceFresh=false: usa cache se disponível.
   *
   * Se já há um load em andamento, aguarda ele terminar antes de iniciar
   * um novo (evita race conditions sem descartar loads necessários).
   */
  private static async loadFromSession(
    session: Session,
    forceFresh: boolean = false,
  ): Promise<void> {
    // Se já há um load em andamento para o mesmo usuário, apenas aguarda o resultado
    // sem disparar um novo load (evita double-fetch no padrão TOKEN_REFRESHED + INITIAL_SESSION)
    if (SessionService.loadPromise) {
      await SessionService.loadPromise;
      const current = SessionState.getState();
      if (current.user?.id === session.user.id) return;
    }

    SessionService.loadPromise = SessionService.doLoad(session, forceFresh)
      .finally(() => { SessionService.loadPromise = null; });

    return SessionService.loadPromise;
  }

  private static async doLoad(session: Session, forceFresh: boolean): Promise<void> {
    const version = ++SessionService.loadVersion;

    if (!forceFresh) {
      const cached = CacheManager.getSession();
      if (cached) {
        SessionState.setState(cached);
        return;
      }
    }

    const u = session.user;

    const user: User = {
      id: u.id,
      email: u.email!,
      emailConfirmed: !!u.email_confirmed_at,
      createdAt: u.created_at,
    };

    // Publica o user imediatamente — UI pode renderizar enquanto perfis carregam
    SessionState.setState({ user, activeProfile: null, profiles: [] });

    SessionService.debug(`[SessionService] doLoad: fetching profiles user=${user.id}`);

    const [activeProfile, profiles] = await Promise.all([
      SessionService.getActiveProfile(user.id),
      SessionService.getUserProfiles(user.id),
    ]);

    // Descarta resultado se um load mais recente foi iniciado
    if (version !== SessionService.loadVersion) {
      SessionService.debug(
        `[SessionService] doLoad: discarding stale result (version ${version})`,
      );
      return;
    }

    const sessionData: SessionData = { user, activeProfile, profiles };
    SessionState.setState(sessionData);
    CacheManager.setSession(sessionData);
    SessionService.debug(
      `[SessionService] doLoad: done user=${user.id} profiles=${profiles.length}`,
    );
  }

  private static async getCurrentSession(): Promise<Session | null> {
    if (SessionService.currentSession) return SessionService.currentSession;
    if (SessionService.currentSessionPromise) return SessionService.currentSessionPromise;

    SessionService.currentSessionPromise = (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        SessionService.currentSession = data.session ?? null;
        return SessionService.currentSession;
      } catch (error) {
        // Em dev (StrictMode/múltiplos listeners), o GoTrue pode disputar o lock
        // e lançar AbortError "Lock broken by another request with the 'steal' option."
        // Tratamos como condição transitória para evitar unhandled rejection.
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("Lock broken by another request")) {
          SessionService.debug("[SessionService] getCurrentSession lock contention recovered");
          return SessionService.currentSession ?? null;
        }
        throw error;
      }
    })();

    try {
      return await SessionService.currentSessionPromise;
    } finally {
      SessionService.currentSessionPromise = null;
    }
  }

  // ── getCurrentUser ─────────────────────────────────────────────────────────
  /**
   * Lê o usuário da sessão local (localStorage).
   * Usado por switchProfile e AuthService. Não bloqueia.
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const cachedUser = SessionState.getState().user;
      if (cachedUser) return cachedUser;

      const session = await SessionService.getCurrentSession();
      if (!session?.user) return null;
      const u = session.user;
      return {
        id: u.id,
        email: u.email!,
        emailConfirmed: !!u.email_confirmed_at,
        createdAt: u.created_at,
      };
    } catch {
      return null;
    }
  }

  // ── getActiveProfile ───────────────────────────────────────────────────────
  static async getActiveProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase.rpc("get_active_profile", {
      p_user_id: userId,
    });
    if (error || !data) return null;
    // RPC retorna SETOF profiles (array)
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return SessionService.mapProfileFromDb(row);
  }

  // ── getUserProfiles ────────────────────────────────────────────────────────
  /**
   * ✅ SSOT: Usa ProfileService
   */
  static async getUserProfiles(userId: string): Promise<Profile[]> {
    try {
      const { profileService } = await import("@/core/profiles/services/ProfileService");
      const profiles = await profileService.getProfilesByUserId(userId);

      return profiles
        .filter((row) => row.is_active)
        .map((row) => SessionService.mapProfileFromDb(row as unknown as DbProfileRow));
    } catch (error) {
      logger.error('SessionService.getUserProfiles failed:', error);
      return [];
    }
  }

  // ── switchProfile ──────────────────────────────────────────────────────────
  static async switchProfile(profileId: string): Promise<void> {
    const user = await SessionService.getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase.rpc("switch_active_profile", {
      p_user_id: user.id,
      p_profile_id: profileId,
    });
    if (error) throw error;

    CacheManager.invalidateSession();
    const session = await SessionService.getCurrentSession();
    if (session) await SessionService.loadFromSession(session, true);
  }

  // ── initializeSession ──────────────────────────────────────────────────────
  /**
   * Aguarda o INITIAL_SESSION ser processado.
   * Chamado pelo SessionProvider — não faz chamadas de rede.
   */
  static async initializeSession(): Promise<void> {
    if (!SessionService.initialized) {
      SessionService.initialize();
    }
    await SessionService.initPromise;
  }

  // ── refreshSession ─────────────────────────────────────────────────────────
  static async refreshSession(): Promise<void> {
    CacheManager.invalidateSession();
    const session = await SessionService.getCurrentSession();
    if (session) await SessionService.loadFromSession(session, true);
  }

  static getAccessToken(): string | null {
    return SessionService.currentSession?.access_token ?? null;
  }

  // ── mapProfileFromDb ───────────────────────────────────────────────────────
  /**
   * Mapeia dados do banco para o tipo Profile do domínio
   * @param dbProfile - Dados brutos do banco (RPC ou query)
   * @returns Profile tipado para uso no domínio
   */
  private static mapProfileFromDb(dbProfile: DbProfileRow): Profile {
    return {
      id: dbProfile.id,
      userId: dbProfile.user_id,
      name: dbProfile.name,
      displayName: dbProfile.display_name ?? dbProfile.name,
      username: dbProfile.username,
      avatarUrl: dbProfile.avatar_url,
      bio: dbProfile.bio,
      profileType: dbProfile.profile_type,
      city: dbProfile.city,
      neighborhood: dbProfile.neighborhood,
      state: dbProfile.state ?? null,
      street: dbProfile.street ?? null,
      phone: dbProfile.telefone ?? null,
      whatsapp: dbProfile.whatsapp ?? null,
      locationId: dbProfile.location_id ?? null,
      isActive: dbProfile.is_active,
      verified: dbProfile.verified ?? false,
      createdAt: dbProfile.created_at,
    };
  }
}
