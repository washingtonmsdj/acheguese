/**
 * useSessions Hook
 * 
 * Hook para gerenciar sessões de usuários
 */
import { logger } from '@/shared/utils/logger';
import { useState, useEffect } from 'react';
import { 
  sessionService, 
  type UserSession, 
  type SessionAnomaly,
  type SessionStats 
} from '../services/SessionService';

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

  // Revogação individual não é suportada pela autoridade atual do Supabase Auth.
  // O service falha fechado em vez de fingir sucesso no tracker legado.
  const revokeSession = async (sessionId: string, reason?: string) => {
    try {
      setLoading(true);
      setError(null);

      const success = await sessionService.revokeSession(sessionId, reason);
      
      if (!success) {
        throw new Error('Revogação individual de sessão não suportada');
      }

      await loadData();
      return true;
    } catch (err) {
      logger.error('useSessions.revokeSession', err);
      setError('Revogação individual de sessão indisponível');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Revogar todas as outras sessões, ou todas incluindo a atual.
  const revokeAllSessions = async (exceptCurrent: boolean = true) => {
    try {
      setLoading(true);
      setError(null);

      const success = await sessionService.revokeAllSessions(exceptCurrent);
      
      if (!success) {
        throw new Error('Nenhuma sessão foi revogada');
      }

      await loadData();
      return true;
    } catch (err) {
      logger.error('useSessions.revokeAllSessions', err);
      setError('Erro ao revogar sessões');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Marcar sessão como confiável no tracker legado.
  const trustSession = async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const success = await sessionService.trustSession(sessionId);
      
      if (!success) {
        throw new Error('Falha ao marcar sessão como confiável');
      }

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
