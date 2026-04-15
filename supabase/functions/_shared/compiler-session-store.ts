/**
 * Compiler Session Store
 * Persistência de sessões do compilador usando Supabase
 */

import type { GamePlan } from "./game-plan-validator.ts";
import type { ValidationResult } from "./constitutional-validator.ts";

// Constantes
const TABLE_NAME = "compiler_sessions" as const;
const DEFAULT_PHASE: CompilerPhase = "interpretation" as const;
const VALID_PHASES: readonly CompilerPhase[] = ["interpretation", "plan", "validation", "confirmation", "compilation"] as const;
const VALIDATION_DELAY_MS = 100 as const;
const MAX_RETRIES = 3 as const;
const RETRY_DELAY_MS = 1000 as const;

// Logger simples para Deno
interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

function createLogger(name: string): Logger {
  const formatMessage = (level: string, message: string, meta?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] [${name}] ${message}${metaStr}`;
  };

  return {
    info: (message, meta) => console.log(formatMessage('INFO', message, meta)),
    warn: (message, meta) => console.warn(formatMessage('WARN', message, meta)),
    error: (message, meta) => console.error(formatMessage('ERROR', message, meta)),
    debug: (message, meta) => {
      // Debug apenas em desenvolvimento
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log(formatMessage('DEBUG', message, meta));
      }
    }
  };
}

export type CompilerPhase = "interpretation" | "plan" | "validation" | "confirmation" | "compilation";

export interface CompilerSessionState {
  sessionId: string;
  userId?: string;
  gameId?: string;
  phase: CompilerPhase;
  interpretationResult?: {
    gameType: string;
    mechanics: string[];
    restrictions: string[];
    objective: string;
  };
  gamePlan?: GamePlan;
  validationReport?: ValidationResult;
  approvedByUser: boolean;
  createdAt: number;
  updatedAt: number;
}

export class CompilerSessionStore {
  private supabaseUrl: string;
  private supabaseKey: string;
  private logger: Logger;

  constructor(supabaseUrl: string, supabaseKey: string) {
    // Inicializar logger primeiro
    this.logger = createLogger('CompilerSessionStore');
    
    // Validação de entrada com trim
    if (!supabaseUrl || typeof supabaseUrl !== 'string' || supabaseUrl.trim().length === 0) {
      throw new Error("supabaseUrl must be a non-empty string");
    }
    if (!supabaseKey || typeof supabaseKey !== 'string' || supabaseKey.trim().length === 0) {
      throw new Error("supabaseKey must be a non-empty string");
    }
    
    this.supabaseUrl = supabaseUrl.trim();
    this.supabaseKey = supabaseKey.trim();
    
    this.logger.info("CompilerSessionStore initialized");
  }

  /**
   * Obtém headers padrão para requisições Supabase
   */
  private getHeaders(contentType?: string): Record<string, string> {
    // Validar que supabaseKey ainda está definida
    if (!this.supabaseKey) {
      throw new Error("supabaseKey is not defined");
    }
    
    const headers: Record<string, string> = {
      apikey: this.supabaseKey,
      Authorization: `Bearer ${this.supabaseKey}`,
    };

    if (contentType) {
      headers["Content-Type"] = contentType;
    }

    return headers;
  }

  /**
   * Carrega sessão do banco com retry
   */
  async loadSession(sessionId: string): Promise<CompilerSessionState | null> {
    // Validação de entrada
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      this.logger.error('Invalid sessionId', { sessionId: typeof sessionId });
      return null;
    }
    
    const sanitizedSessionId = sessionId.trim();
    
    // Retry com backoff exponencial
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        this.logger.debug('Loading session', { 
          sessionId: sanitizedSessionId.substring(0, 20) + '...',
          attempt,
          maxRetries: MAX_RETRIES
        });
        
        const url = `${this.supabaseUrl}/rest/v1/${TABLE_NAME}?session_id=eq.${sanitizedSessionId}`;
        const headers = this.getHeaders();
        
        const response = await fetch(url, { headers });

        if (!response.ok) {
          const errorText = await response.text();
          
          // Se é erro 4xx, não fazer retry (erro do cliente)
          if (response.status >= 400 && response.status < 500) {
            this.logger.error("Client error loading session", {
              status: response.status,
              error: errorText.substring(0, 200),
              sessionId: sanitizedSessionId.substring(0, 20) + '...'
            });
            return null;
          }
          
          // Se é erro 5xx e ainda tem tentativas, fazer retry
          if (attempt < MAX_RETRIES) {
            const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
            this.logger.warn("Server error, retrying", {
              status: response.status,
              attempt,
              nextRetryIn: `${delay}ms`
            });
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          // Última tentativa falhou
          this.logger.error("Failed to load session after retries", {
            status: response.status,
            attempts: MAX_RETRIES
          });
          return null;
        }

        const data = await response.json();
        
        if (!data || data.length === 0) {
          this.logger.debug('Session not found', { 
            sessionId: sanitizedSessionId.substring(0, 20) + '...'
          });
          return null;
        }

        const row = data[0];
        
        // Validação de tipo para phase com fallback
        let phase = this.validateCompilerPhase(row.phase);
        if (!phase) {
          this.logger.warn('Invalid phase in database, using default', { 
            invalidPhase: row.phase,
            defaultPhase: DEFAULT_PHASE
          });
          phase = DEFAULT_PHASE;
        }
        
        const sessionState: CompilerSessionState = {
          sessionId: row.session_id,
          userId: row.user_id,
          gameId: row.game_id,
          phase,
          interpretationResult: row.interpretation_result,
          gamePlan: row.game_plan,
          validationReport: row.validation_report,
          approvedByUser: row.approved_by_user,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
        
        this.logger.info('Session loaded successfully', {
          sessionId: sanitizedSessionId.substring(0, 20) + '...',
          phase: sessionState.phase
        });
        
        return sessionState;
      } catch (error: unknown) {
        // Se ainda tem tentativas, fazer retry
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          this.logger.warn("Error loading session, retrying", {
            error: error instanceof Error ? error.message : String(error),
            attempt,
            nextRetryIn: `${delay}ms`
          });
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Última tentativa falhou
        this.logger.error("Error loading session after retries", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          attempts: MAX_RETRIES
        });
        return null;
      }
    }
    
    return null;
  }

  /**
   * Salva sessão no banco
   */
  async saveSession(session: CompilerSessionState): Promise<boolean> {
    try {
      // Validar phase antes de salvar
      if (!this.validateCompilerPhase(session.phase)) {
        this.logger.error('Invalid phase, cannot save session', { phase: session.phase });
        return false;
      }
      
      const now = Date.now();
      const payload = {
        session_id: session.sessionId,
        user_id: session.userId,
        game_id: session.gameId,
        phase: session.phase,
        interpretation_result: session.interpretationResult,
        game_plan: session.gamePlan,
        validation_report: session.validationReport,
        approved_by_user: session.approvedByUser,
        created_at: session.createdAt || now,
        updated_at: now,
      };

      this.logger.debug('Saving session', { 
        sessionId: session.sessionId.substring(0, 20) + '...',
        phase: session.phase 
      });

      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/${TABLE_NAME}`,
        {
          method: "POST",
          headers: {
            ...this.getHeaders("application/json"),
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error("Failed to save session", {
          status: response.status,
          error: errorText.substring(0, 200)
        });
        return false;
      }

      this.logger.info('Session saved successfully', { 
        sessionId: session.sessionId.substring(0, 20) + '...',
        phase: session.phase 
      });
      return true;
    } catch (error: unknown) {
      this.logger.error("Error saving session", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }

  /**
   * Atualiza sessão existente
   */
  async updateSession(
    sessionId: string,
    updates: Partial<CompilerSessionState>
  ): Promise<boolean> {
    try {
      const startTime = Date.now();
      
      this.logger.debug('Updating session', { 
        sessionId: sessionId.substring(0, 20) + '...',
        updates: Object.keys(updates),
        phase: updates.phase
      });
      
      // Validar phase se fornecida
      if (updates.phase !== undefined && !this.validateCompilerPhase(updates.phase)) {
        this.logger.error('Invalid phase in updates', { phase: updates.phase });
        return false;
      }
      
      const now = Date.now();
      const payload: Record<string, unknown> = {
        updated_at: now,
      };

      // Adicionar campos ao payload apenas se definidos e válidos
      if (updates.phase !== undefined) payload.phase = updates.phase;
      if (updates.interpretationResult !== undefined)
        payload.interpretation_result = updates.interpretationResult;
      if (updates.gamePlan !== undefined) payload.game_plan = updates.gamePlan;
      if (updates.validationReport !== undefined)
        payload.validation_report = updates.validationReport;
      if (updates.approvedByUser !== undefined)
        payload.approved_by_user = updates.approvedByUser;
      if (updates.userId !== undefined) payload.user_id = updates.userId;
      if (updates.gameId !== undefined) payload.game_id = updates.gameId;

      const url = `${this.supabaseUrl}/rest/v1/${TABLE_NAME}?session_id=eq.${sessionId}`;
      
      const response = await fetch(url, {
        method: "PATCH",
        headers: this.getHeaders("application/json"),
        body: JSON.stringify(payload),
      });

      const elapsed = Date.now() - startTime;
      
      if (!response.ok) {
        const text = await response.text();
        this.logger.error("Failed to update session", {
          status: response.status,
          error: text.substring(0, 200),
          elapsed: `${elapsed}ms`
        });
        return false;
      }

      this.logger.info('Session updated successfully', { 
        sessionId: sessionId.substring(0, 20) + '...',
        phase: payload.phase,
        elapsed: `${elapsed}ms`
      });
      
      return true;
    } catch (error: unknown) {
      this.logger.error("Error updating session", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }

  /**
   * Deleta sessão
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      this.logger.debug('Deleting session', { 
        sessionId: sessionId.substring(0, 20) + '...'
      });
      
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/${TABLE_NAME}?session_id=eq.${sessionId}`,
        {
          method: "DELETE",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        this.logger.error('Failed to delete session', { status: response.status });
        return false;
      }
      
      this.logger.info('Session deleted successfully', { 
        sessionId: sessionId.substring(0, 20) + '...'
      });
      return true;
    } catch (error: unknown) {
      this.logger.error("Error deleting session", {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Cria nova sessão
   */
  async createSession(
    sessionId: string,
    userId?: string,
    gameId?: string
  ): Promise<CompilerSessionState> {
    // Validar sessionId
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      throw new Error("sessionId must be a non-empty string");
    }
    
    const now = Date.now();
    const session: CompilerSessionState = {
      sessionId: sessionId.trim(),
      userId,
      gameId,
      phase: DEFAULT_PHASE,
      approvedByUser: false,
      createdAt: now,
      updatedAt: now,
    };

    this.logger.info('Creating new session', { 
      sessionId: session.sessionId.substring(0, 20) + '...',
      phase: session.phase
    });
    
    await this.saveSession(session);
    return session;
  }

  /**
   * Obtém ou cria sessão
   */
  async getOrCreateSession(
    sessionId: string,
    isNewGame: boolean,
    userId?: string,
    gameId?: string
  ): Promise<CompilerSessionState> {
    const existing = await this.loadSession(sessionId);

    // Se sessão já existe, retornar (independente de isNewGame)
    if (existing) {
      this.logger.debug('Session already exists', { 
        sessionId: sessionId.substring(0, 20) + '...',
        phase: existing.phase
      });
      return existing;
    }

    // Se não existe, criar nova sessão
    this.logger.info('Session not found, creating new', { 
      sessionId: sessionId.substring(0, 20) + '...'
    });
    return await this.createSession(sessionId, userId, gameId);
  }

  /**
   * @deprecated Use loadSession + createSession directly
   * This method will be removed in version 2.0.0 (target: 2026-03-01)
   * Migration guide: Replace getOrCreateSessionDeprecated with loadSession + createSession
   */
  async getOrCreateSessionDeprecated(
    sessionId: string,
    isNewGame: boolean,
    userId?: string,
    gameId?: string
  ): Promise<CompilerSessionState> {
    this.logger.warn('DEPRECATED: getOrCreateSessionDeprecated called, use loadSession + createSession instead');
    return this.getOrCreateSession(sessionId, isNewGame, userId, gameId);
  }

  /**
   * Valida se uma string é um CompilerPhase válido
   */
  private validateCompilerPhase(phase: unknown): CompilerPhase | null {
    if (typeof phase !== 'string') {
      return null;
    }
    
    if (VALID_PHASES.includes(phase as CompilerPhase)) {
      return phase as CompilerPhase;
    }
    
    return null;
  }
}
