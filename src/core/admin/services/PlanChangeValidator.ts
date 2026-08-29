/**
 * PlanChangeValidator - Validacao de impacto em mudancas de plano.
 *
 * Regras arquiteturais:
 *   - Validar impacto antes de permitir alteracao de plano.
 *   - Bloquear alteracoes destrutivas sem estrategia.
 *   - Exibir impacto claro para admin.
 *
 * Fase: 3 - Services e Contratos.
 * Referencia: F3_MIGRACAO_GATES_FRONTEND.md
 *
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';

// Tipos

export interface PlanChangeImpact {
  canChange: boolean;
  reason?: string;
  affectedContracts: number;
  affectedUsers: number;
  willLoseFeatures: string[];
  willGainFeatures: string[];
  requiresMigration: boolean;
  migrationStrategy?: string;
}

// Service

export class PlanChangeValidator {
  /**
   * Valida se mudanca de plano e permitida e retorna impacto.
   */
  static async validateChange(
    businessId: string,
    currentPlanTier: string,
    newPlanTier: string
  ): Promise<PlanChangeImpact> {
    try {
      // Buscar assinaturas ativas do business
      const { data: subscriptions, error } = await supabase
        .from('user_subscriptions')
        .select('id, user_id, status_v2, plan_code')
        .eq('business_id', businessId)
        .in('status_v2', ['active', 'trialing']);

      if (error) {
        logger.error('[PlanChangeValidator] Erro ao buscar assinaturas:', error);
        return {
          canChange: false,
          reason: 'Erro ao validar impacto. Tente novamente.',
          affectedContracts: 0,
          affectedUsers: 0,
          willLoseFeatures: [],
          willGainFeatures: [],
          requiresMigration: false,
        };
      }

      const affectedContracts = subscriptions?.length || 0;
      const affectedUsers = new Set(subscriptions?.map(s => s.user_id) || []).size;

      // Determinar features perdidas/ganhas
      const { willLose, willGain } = this.compareFeatures(currentPlanTier, newPlanTier);

      // Determinar se e downgrade (perde features)
      const isDowngrade = willLose.length > 0;

      // Determinar se requer migracao
      const requiresMigration = isDowngrade && affectedContracts > 0;

      // Bloquear downgrade destrutivo sem estrategia
      if (requiresMigration) {
        return {
          canChange: false,
          reason: `Downgrade bloqueado: ${affectedContracts} contrato(s) ativo(s) perderao acesso a recursos criticos. Defina estrategia de migracao antes de prosseguir.`,
          affectedContracts,
          affectedUsers,
          willLoseFeatures: willLose,
          willGainFeatures: willGain,
          requiresMigration: true,
          migrationStrategy: 'Sugestao: Notifique usuarios afetados e ofereca periodo de transicao de 30 dias.',
        };
      }

      // Permitir upgrade ou mudanca sem impacto
      return {
        canChange: true,
        affectedContracts,
        affectedUsers,
        willLoseFeatures: willLose,
        willGainFeatures: willGain,
        requiresMigration: false,
      };

    } catch (error) {
      logger.error('[PlanChangeValidator] Erro ao validar mudanca:', error);
      return {
        canChange: false,
        reason: 'Erro inesperado ao validar impacto.',
        affectedContracts: 0,
        affectedUsers: 0,
        willLoseFeatures: [],
        willGainFeatures: [],
        requiresMigration: false,
      };
    }
  }

  /**
   * Compara features entre planos.
   */
  private static compareFeatures(
    currentTier: string,
    newTier: string
  ): { willLose: string[]; willGain: string[] } {
    // Mapa de features por tier
    const featuresByTier: Record<string, string[]> = {
      free: [
        'Pagina publica basica',
        'Cardapio limitado (20 itens)',
      ],
      pro: [
        'Pagina publica basica',
        'Pagina premium',
        'Link curto (/p/slug)',
        'QR Code personalizado',
        'Cardapio ilimitado',
        'Promocoes',
        'Analytics basico',
      ],
      delivery: [
        'Pagina publica basica',
        'Pagina premium',
        'Link curto (/p/slug)',
        'QR Code personalizado',
        'Cardapio ilimitado',
        'Promocoes',
        'Analytics basico',
        'Pedidos internos',
        'Rede de motoboys',
        'Analytics avancado',
      ],
    };

    const currentFeatures = Object.entries(featuresByTier).find(
      ([tier]) => tier === currentTier,
    )?.[1] ?? [];
    const newFeatures = Object.entries(featuresByTier).find(
      ([tier]) => tier === newTier,
    )?.[1] ?? [];

    const willLose = currentFeatures.filter(f => !newFeatures.includes(f));
    const willGain = newFeatures.filter(f => !currentFeatures.includes(f));

    return { willLose, willGain };
  }
}

export const planChangeValidator = PlanChangeValidator;
