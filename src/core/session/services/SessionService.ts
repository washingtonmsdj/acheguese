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
    if (SessionService.debugLogs) {
      logger.debug(...args);
    }
  }

  private static initialized = false;
  private static loadVersion = 0;
  private static loadPromise: Promise<void> | null = null;
  private static authSubscription: { unsubscribe: () => void } | null = null;
  private static currentSession: Session | null = null;

  // initPromise resolve após o INITIAL_SESSION ser processado
  private static initResolve: (() => void) | null = null;
  private static initPromise: Promise<void> = new Promise(
    (resolve) => { SessionService.initResolve = resolve; }
  );
  private static initFallbackStarted = false;

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
          // Fire-and-forget: não bloqueia o SDK com await
          SessionService.loadFromSession(session, true).then(() => {
            if (isInitEvent) {
              SessionService.resolveInit();
            }
          }).catch(() => {
            if (isInitEvent) {
              SessionService.resolveInit();
            }
          });
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

    void SessionService.ensureInitialSessionFallback();
  }

  private static async ensureInitialSessionFallback(): Promise<void> {
    if (SessionService.initFallbackStarted) return;
    SessionService.initFallbackStarted = true;

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        SessionService.debug("[SessionService] getSession fallback failed", error);
        SessionService.resolveInit();
        return;
      }

      const session = data.session;
      SessionService.currentSession = session;

      if (session) {
        await SessionService.loadFromSession(session, true);
      } else {
        SessionState.setState({ user: null, activeProfile: null, profiles: [] });
      }
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

    // Valida se o usuário ainda existe no servidor antes de prosseguir.
    // Um 403 indica token órfão (usuário deletado) — faz logout automático.
    const { error: userError } = await supabase.auth.getUser();
    if (userError) {
      // Type assertion necessária pois AuthError não expõe status diretamente
      const errorWithStatus = userError as { status?: number; message?: string };
      const status = errorWithStatus.status ?? 0;
      if (status === 403 || status === 401 || userError.message?.includes('User from sub claim in JWT does not exist')) {
        logger.warn('⚠️ SessionService: token órfão detectado, fazendo logout automático.');
        await supabase.auth.signOut();
        return;
      }
    }

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

  // ── getCurrentUser ─────────────────────────────────────────────────────────
  /**
   * Lê o usuário da sessão local (localStorage).
   * Usado por switchProfile e AuthService. Não bloqueia.
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const cachedUser = SessionState.getState().user;
      if (cachedUser) return cachedUser;

      const session = SessionService.currentSession ?? (await supabase.auth.getSession()).data.session;
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error || !data) {
        logger.error('SessionService.getUserProfiles failed:', error);
        return [];
      }

      return data.map((row) => SessionService.mapProfileFromDb(row as DbProfileRow));
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
    const session = SessionService.currentSession ?? (await supabase.auth.getSession()).data.session;
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
    const session = SessionService.currentSession ?? (await supabase.auth.getSession()).data.session;
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
      displayName: dbProfile.display_name,
      username: dbProfile.username,
      avatarUrl: dbProfile.avatar_url,
      bio: dbProfile.bio,
      profileType: dbProfile.profile_type,
      city: dbProfile.city,
      neighborhood: dbProfile.neighborhood,
      state: dbProfile.state ?? null,
      telefone: dbProfile.telefone ?? null,
      whatsapp: dbProfile.whatsapp ?? null,
      locationId: dbProfile.location_id ?? null,
      isActive: dbProfile.is_active,
      verified: dbProfile.verified ?? false,
      createdAt: dbProfile.created_at,
    };
  }
}
