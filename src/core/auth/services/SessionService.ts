/**
 * SessionService
 * 
 * Serviço para gerenciar sessões de usuários
 * Rastreamento, detecção de anomalias e revogação
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';

export interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  deviceType: string | null;
  deviceName: string | null;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  isTrusted: boolean;
  isSuspicious: boolean;
  suspicionReason: string | null;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  revokedAt: string | null;
  revokedBy: string | null;
  revokedReason: string | null;
}

export interface SessionAnomaly {
  id: string;
  sessionId: string;
  userId: string;
  anomalyType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: Record<string, any>;
  actionTaken: string | null;
  autoResolved: boolean;
  resolvedAt: string | null;
  resolvedBy: string | null;
  detectedAt: string;
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  suspiciousSessions: number;
  trustedSessions: number;
  recentAnomalies: number;
}

class SessionService {
  /**
   * Listar sessões ativas do usuário atual
   */
  async getActiveSessions(): Promise<UserSession[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_activity_at', { ascending: false });

      if (error) {
        logger.error('SessionService.getActiveSessions', error);
        return [];
      }

      return (data || []).map(this.mapSession);
    } catch (error) {
      logger.error('SessionService.getActiveSessions', error);
      return [];
    }
  }

  /**
   * Listar todas as sessões do usuário (ativas e revogadas)
   */
  async getAllSessions(limit: number = 50): Promise<UserSession[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('SessionService.getAllSessions', error);
        return [];
      }

      return (data || []).map(this.mapSession);
    } catch (error) {
      logger.error('SessionService.getAllSessions', error);
      return [];
    }
  }

  /**
   * Revogar uma sessão específica
   */
  async revokeSession(sessionId: string, reason?: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('revoke_user_session', {
        p_session_id: sessionId,
        p_reason: reason || 'Revogado pelo usuário',
      });

      if (error) {
        logger.error('SessionService.revokeSession', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('SessionService.revokeSession', error);
      return false;
    }
  }

  /**
   * Revogar todas as sessões (exceto a atual)
   */
  async revokeAllSessions(exceptCurrent: boolean = true): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('revoke_all_user_sessions', {
        p_user_id: null, // null = usuário atual
        p_except_current: exceptCurrent,
        p_reason: 'Logout em todos os dispositivos',
      });

      if (error) {
        logger.error('SessionService.revokeAllSessions', error);
        return 0;
      }

      return data as number;
    } catch (error) {
      logger.error('SessionService.revokeAllSessions', error);
      return 0;
    }
  }

  /**
   * Buscar anomalias da sessão
   */
  async getSessionAnomalies(sessionId?: string): Promise<SessionAnomaly[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      let query = supabase
        .from('session_anomalies')
        .select('*')
        .eq('user_id', user.id)
        .order('detected_at', { ascending: false });

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query.limit(50);

      if (error) {
        logger.error('SessionService.getSessionAnomalies', error);
        return [];
      }

      return (data || []).map(this.mapAnomaly);
    } catch (error) {
      logger.error('SessionService.getSessionAnomalies', error);
      return [];
    }
  }

  /**
   * Buscar estatísticas de sessões
   */
  async getSessionStats(): Promise<SessionStats> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          totalSessions: 0,
          activeSessions: 0,
          suspiciousSessions: 0,
          trustedSessions: 0,
          recentAnomalies: 0,
        };
      }

      const [sessionsResult, anomaliesResult] = await Promise.all([
        supabase
          .from('user_sessions')
          .select('is_active, is_suspicious, is_trusted')
          .eq('user_id', user.id),
        supabase
          .from('session_anomalies')
          .select('id')
          .eq('user_id', user.id)
          .gte('detected_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      const sessions = sessionsResult.data || [];
      const anomalies = anomaliesResult.data || [];

      return {
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.is_active).length,
        suspiciousSessions: sessions.filter(s => s.is_suspicious).length,
        trustedSessions: sessions.filter(s => s.is_trusted).length,
        recentAnomalies: anomalies.length,
      };
    } catch (error) {
      logger.error('SessionService.getSessionStats', error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        suspiciousSessions: 0,
        trustedSessions: 0,
        recentAnomalies: 0,
      };
    }
  }

  /**
   * Marcar sessão como confiável
   */
  async trustSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_trusted: true })
        .eq('id', sessionId);

      if (error) {
        logger.error('SessionService.trustSession', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('SessionService.trustSession', error);
      return false;
    }
  }

  /**
   * Atualizar atividade da sessão
   */
  async updateActivity(sessionToken: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('update_session_activity', {
        p_session_token: sessionToken,
      });

      if (error) {
        logger.error('SessionService.updateActivity', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('SessionService.updateActivity', error);
      return false;
    }
  }

  /**
   * Buscar sessão atual
   */
  async getCurrentSession(): Promise<UserSession | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return null;
      }

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_token', session.access_token)
        .eq('is_active', true)
        .single();

      if (error) {
        logger.error('SessionService.getCurrentSession', error);
        return null;
      }

      return this.mapSession(data);
    } catch (error) {
      logger.error('SessionService.getCurrentSession', error);
      return null;
    }
  }

  /**
   * Mapear sessão do banco para o tipo UserSession
   */
  private mapSession(data: any): UserSession {
    return {
      id: data.id,
      userId: data.user_id,
      sessionToken: data.session_token,
      deviceType: data.device_type,
      deviceName: data.device_name,
      browser: data.browser,
      browserVersion: data.browser_version,
      os: data.os,
      osVersion: data.os_version,
      userAgent: data.user_agent,
      ipAddress: data.ip_address,
      country: data.country,
      region: data.region,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      isActive: data.is_active,
      isTrusted: data.is_trusted,
      isSuspicious: data.is_suspicious,
      suspicionReason: data.suspicion_reason,
      createdAt: data.created_at,
      lastActivityAt: data.last_activity_at,
      expiresAt: data.expires_at,
      revokedAt: data.revoked_at,
      revokedBy: data.revoked_by,
      revokedReason: data.revoked_reason,
    };
  }

  /**
   * Mapear anomalia do banco para o tipo SessionAnomaly
   */
  private mapAnomaly(data: any): SessionAnomaly {
    return {
      id: data.id,
      sessionId: data.session_id,
      userId: data.user_id,
      anomalyType: data.anomaly_type,
      severity: data.severity,
      description: data.description,
      details: data.details || {},
      actionTaken: data.action_taken,
      autoResolved: data.auto_resolved,
      resolvedAt: data.resolved_at,
      resolvedBy: data.resolved_by,
      detectedAt: data.detected_at,
    };
  }
}

export const sessionService = new SessionService();
