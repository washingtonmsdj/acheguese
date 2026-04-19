/**
 * useSessions Hook
 * 
 * Hook para gerenciar sessões de usuários
 */

import { useState, useEffect } from 'react';
import { 
  sessionService, 
  type UserSession, 
  type SessionAnomaly,
  type SessionStats 
} from '../services/SessionService';
import { logger } from '@/shared/utils/logger';

export function useSessions() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);
  const [anomalies, setAnomalies] = useState<SessionAnomaly[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sessionsData, currentData, anomaliesData, statsData] = await Promise.all([
        sessionService.getActiveSessions(),
        sessionService.getCurrentSession(),
        sessionService.getSessionAnomalies(),
        sessionService.getSessionStats(),
      ]);

      setSessions(sessionsData);
      setCurrentSession(currentData);
      setAnomalies(anomaliesData);
      setStats(statsData);
    } catch (err) {
      logger.error('useSessions.loadData', err);
      setError('Erro ao carregar sessões');
    } finally {
      setLoading(false);
    }
  };

  // Carregar ao montar
  useEffect(() => {
    loadData();
  }, []);

  // Revogar sessão
  const revokeSession = async (sessionId: string, reason?: string) => {
    try {
      setLoading(true);
      setError(null);

      const success = await sessionService.revokeSession(sessionId, reason);
      
      if (!success) {
        throw new Error('Falha ao revogar sessão');
      }

      // Recarregar dados
      await loadData();

      return true;
    } catch (err) {
      logger.error('useSessions.revokeSession', err);
      setError('Erro ao revogar sessão');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Revogar todas as sessões
  const revokeAllSessions = async (exceptCurrent: boolean = true) => {
    try {
      setLoading(true);
      setError(null);

      const count = await sessionService.revokeAllSessions(exceptCurrent);
      
      if (count === 0) {
        throw new Error('Nenhuma sessão foi revogada');
      }

      // Recarregar dados
      await loadData();

      return count;
    } catch (err) {
      logger.error('useSessions.revokeAllSessions', err);
      setError('Erro ao revogar sessões');
      return 0;
    } finally {
      setLoading(false);
    }
  };

  // Marcar sessão como confiável
  const trustSession = async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const success = await sessionService.trustSession(sessionId);
      
      if (!success) {
        throw new Error('Falha ao marcar sessão como confiável');
      }

      // Recarregar dados
      await loadData();

      return true;
    } catch (err) {
      logger.error('useSessions.trustSession', err);
      setError('Erro ao marcar sessão como confiável');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Buscar anomalias de uma sessão específica
  const getSessionAnomalies = async (sessionId: string) => {
    try {
      return await sessionService.getSessionAnomalies(sessionId);
    } catch (err) {
      logger.error('useSessions.getSessionAnomalies', err);
      return [];
    }
  };

  return {
    sessions,
    currentSession,
    anomalies,
    stats,
    loading,
    error,
    loadData,
    revokeSession,
    revokeAllSessions,
    trustSession,
    getSessionAnomalies,
    // Computed properties
    hasMultipleSessions: sessions.length > 1,
    hasSuspiciousSessions: sessions.some(s => s.isSuspicious),
    hasRecentAnomalies: anomalies.length > 0,
    activeSessions: sessions.filter(s => s.isActive),
    suspiciousSessions: sessions.filter(s => s.isSuspicious),
    trustedSessions: sessions.filter(s => s.isTrusted),
  };
}
