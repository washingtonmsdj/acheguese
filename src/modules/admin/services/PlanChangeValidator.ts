/**
 * PlanChangeValidator â€” ValidaÃ§Ã£o de impacto em mudanÃ§as de plano
 *
 * REGRAS ARQUITETURAIS:
 *   - Validar impacto antes de permitir alteraÃ§Ã£o de plano
 *   - Bloquear alteraÃ§Ãµes destrutivas sem estratÃ©gia
 *   - Exibir impacto claro para admin
 *
 * FASE: 3 - Services e Contratos
 * REFERÃŠNCIA: F3_MIGRACAO_GATES_FRONTEND.md
 *
 * @version 1.0.0
 */

import { supabase } from '@/core/infrastructure/supabase';
import { logger } from '@/shared/utils/logger';

// â”€â”€â”€ Tipos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class PlanChangeValidator {
  /**
   * Valida se mudanÃ§a de plano Ã© permitida e retorna impacto.
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
      
      // Determinar se Ã© downgrade (perde features)
      const isDowngrade = willLose.length > 0;
      
      // Determinar se requer migraÃ§Ã£o
      const requiresMigration = isDowngrade && affectedContracts > 0;
      
      // Bloquear downgrade destrutivo sem estratÃ©gia
      if (requiresMigration) {
        return {
          canChange: false,
          reason: `Downgrade bloqueado: ${affectedContracts} contrato(s) ativo(s) perderÃ£o acesso a recursos crÃ­ticos. Defina estratÃ©gia de migraÃ§Ã£o antes de prosseguir.`,
          affectedContracts,
          affectedUsers,
          willLoseFeatures: willLose,
          willGainFeatures: willGain,
          requiresMigration: true,
          migrationStrategy: 'SugestÃ£o: Notifique usuÃ¡rios afetados e ofereÃ§a perÃ­odo de transiÃ§Ã£o de 30 dias.',
        };
      }
      
      // Permitir upgrade ou mudanÃ§a sem impacto
      return {
        canChange: true,
        affectedContracts,
        affectedUsers,
        willLoseFeatures: willLose,
        willGainFeatures: willGain,
        requiresMigration: false,
      };
      
    } catch (error) {
      logger.error('[PlanChangeValidator] Erro ao validar mudanÃ§a:', error);
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
        'PÃ¡gina pÃºblica bÃ¡sica',
        'CardÃ¡pio limitado (20 itens)',
      ],
      pro: [
        'PÃ¡gina pÃºblica bÃ¡sica',
        'PÃ¡gina premium',
        'Link curto (/p/slug)',
        'QR Code personalizado',
        'CardÃ¡pio ilimitado',
        'PromoÃ§Ãµes',
        'Analytics bÃ¡sico',
      ],
      delivery: [
        'PÃ¡gina pÃºblica bÃ¡sica',
        'PÃ¡gina premium',
        'Link curto (/p/slug)',
        'QR Code personalizado',
        'CardÃ¡pio ilimitado',
        'PromoÃ§Ãµes',
        'Analytics bÃ¡sico',
        'Pedidos internos',
        'Rede de motoboys',
        'Analytics avanÃ§ado',
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


