/**
 * PlanChangeValidator — Validação de impacto em mudanças de plano
 *
 * REGRAS ARQUITETURAIS:
 *   - Validar impacto antes de permitir alteração de plano
 *   - Bloquear alterações destrutivas sem estratégia
 *   - Exibir impacto claro para admin
 *
 * FASE: 3 - Services e Contratos
 * REFERÊNCIA: F3_MIGRACAO_GATES_FRONTEND.md
 *
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase/supabase';
import { logger } from '@/shared/utils/logger';

// ─── Tipos ────────────────────────────────────────────────────────────────────

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

// ─── Service ──────────────────────────────────────────────────────────────────

export class PlanChangeValidator {
  /**
   * Valida se mudança de plano é permitida e retorna impacto.
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
      
      // Determinar se é downgrade (perde features)
      const isDowngrade = willLose.length > 0;
      
      // Determinar se requer migração
      const requiresMigration = isDowngrade && affectedContracts > 0;
      
      // Bloquear downgrade destrutivo sem estratégia
      if (requiresMigration) {
        return {
          canChange: false,
          reason: `Downgrade bloqueado: ${affectedContracts} contrato(s) ativo(s) perderão acesso a recursos críticos. Defina estratégia de migração antes de prosseguir.`,
          affectedContracts,
          affectedUsers,
          willLoseFeatures: willLose,
          willGainFeatures: willGain,
          requiresMigration: true,
          migrationStrategy: 'Sugestão: Notifique usuários afetados e ofereça período de transição de 30 dias.',
        };
      }
      
      // Permitir upgrade ou mudança sem impacto
      return {
        canChange: true,
        affectedContracts,
        affectedUsers,
        willLoseFeatures: willLose,
        willGainFeatures: willGain,
        requiresMigration: false,
      };
      
    } catch (error) {
      logger.error('[PlanChangeValidator] Erro ao validar mudança:', error);
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
        'Página pública básica',
        'Cardápio limitado (20 itens)',
      ],
      pro: [
        'Página pública básica',
        'Página premium',
        'Link curto (/p/slug)',
        'QR Code personalizado',
        'Cardápio ilimitado',
        'Promoções',
        'Analytics básico',
      ],
      delivery: [
        'Página pública básica',
        'Página premium',
        'Link curto (/p/slug)',
        'QR Code personalizado',
        'Cardápio ilimitado',
        'Promoções',
        'Analytics básico',
        'Pedidos internos',
        'Rede de motoboys',
        'Analytics avançado',
      ],
    };
    
    const currentFeatures = featuresByTier[currentTier] || [];
    const newFeatures = featuresByTier[newTier] || [];
    
    const willLose = currentFeatures.filter(f => !newFeatures.includes(f));
    const willGain = newFeatures.filter(f => !currentFeatures.includes(f));
    
    return { willLose, willGain };
  }
}

export const planChangeValidator = PlanChangeValidator;
