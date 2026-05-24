/**
 * MOBILITY DISPATCH CONFIG SERVICE
 * 
 * SSOT para configurações de dispatch
 * Centraliza todas as regras de negócio e configurações
 */
import { logger } from '@/shared/utils/logger';
import type {
  DispatchStrategy,
  DispatchContext,
  DispatchConfig,
  DispatchGlobalConfig,
} from '../types/dispatch.types';
import { RIDE_MODE, SOURCE_TYPE } from '../constants';

// ============================================
// CONFIGURAÇÃO GLOBAL (SSOT)
// ============================================

const DISPATCH_GLOBAL_CONFIG: DispatchGlobalConfig = {
  // Exclusive Offer (Corrida imediata de passageiro)
  exclusiveOffer: {
    enabled: true,
    offerTimeoutSeconds: 30,        // 30s por motorista
    maxRetryAttempts: 5,             // Máximo 5 motoristas
    searchRadiusKm: 10,              // Raio de 10km
    requiresVerification: true,      // Motorista verificado obrigatório
    requiresSubscription: false,     // Assinatura NÃO obrigatória (modelo freemium)
  },
  
  // Open Board (Entrega/motoboy)
  openBoard: {
    enabled: true,
    maxOffersPerDriver: 10,          // Máximo 10 ofertas por motorista
    offerExpirationMinutes: 30,      // Ofertas expiram em 30min
    searchRadiusKm: 15,              // Raio maior para entregas
    requiresVerification: true,      // Motorista verificado obrigatório
    requiresSubscription: false,     // Assinatura NÃO obrigatória
  },
  
  // Reservation Board (Corridas agendadas)
  reservationBoard: {
    enabled: true,
    minAdvanceHours: 2,              // Mínimo 2h de antecedência
    maxAdvanceDays: 7,               // Máximo 7 dias de antecedência
    requiresVerification: true,      // Motorista verificado obrigatório
    requiresSubscription: false,     // Assinatura NÃO obrigatória
  },
  
  // Scoring (para ordenação de motoristas)
  scoring: {
    distanceWeight: 0.40,            // 40% - proximidade
    ratingWeight: 0.25,              // 25% - avaliação
    acceptanceRateWeight: 0.15,      // 15% - taxa de aceitação
    totalRidesWeight: 0.10,          // 10% - experiência
    responseTimeWeight: 0.10,        // 10% - tempo de resposta
  },
};

// ============================================
// MOBILITY DISPATCH CONFIG SERVICE
// ============================================

export class MobilityDispatchConfigService {
  /**
   * Determina estratégia de dispatch baseada no contexto
   */
  static determineStrategy(context: DispatchContext): DispatchStrategy {
    // 1. Corridas agendadas → Reservation Board
    if (context.isScheduled) {
      logger.info('DispatchConfig: Strategy = reservation_board', { context });
      return 'reservation_board';
    }
    
    // 2. Entrega/motoboy imediata → Open Board
    if (context.rideMode === RIDE_MODE.MOTOBOY) {
      logger.info('DispatchConfig: Strategy = open_board (motoboy)', { context });
      return 'open_board';
    }
    
    // 3. Corrida de passageiro imediata → Exclusive Offer
    if (context.rideMode === RIDE_MODE.RIDE && context.isImmediate) {
      logger.info('DispatchConfig: Strategy = exclusive_offer (passenger)', { context });
      return 'exclusive_offer';
    }
    
    // 4. Fallback para exclusive offer
    logger.warn('DispatchConfig: Fallback to exclusive_offer', { context });
    return 'exclusive_offer';
  }
  
  /**
   * Retorna configuração para estratégia específica
   */
  static getConfig(strategy: DispatchStrategy): DispatchConfig {
    switch (strategy) {
      case 'exclusive_offer':
        return {
          strategy: 'exclusive_offer',
          offerTimeoutSeconds: DISPATCH_GLOBAL_CONFIG.exclusiveOffer.offerTimeoutSeconds,
          maxRetryAttempts: DISPATCH_GLOBAL_CONFIG.exclusiveOffer.maxRetryAttempts,
          searchRadiusKm: DISPATCH_GLOBAL_CONFIG.exclusiveOffer.searchRadiusKm,
          requiresVerification: DISPATCH_GLOBAL_CONFIG.exclusiveOffer.requiresVerification,
          requiresSubscription: DISPATCH_GLOBAL_CONFIG.exclusiveOffer.requiresSubscription,
          allowsConcurrentOffers: false, // Apenas 1 motorista por vez
          showFullDetails: false,        // Protege origem/destino até aceite
        };
      
      case 'open_board':
        return {
          strategy: 'open_board',
          offerTimeoutSeconds: DISPATCH_GLOBAL_CONFIG.openBoard.offerExpirationMinutes * 60,
          maxRetryAttempts: 999,         // Sem limite (lista aberta)
          searchRadiusKm: DISPATCH_GLOBAL_CONFIG.openBoard.searchRadiusKm,
          requiresVerification: DISPATCH_GLOBAL_CONFIG.openBoard.requiresVerification,
          requiresSubscription: DISPATCH_GLOBAL_CONFIG.openBoard.requiresSubscription,
          allowsConcurrentOffers: true,  // Múltiplos motoristas veem
          showFullDetails: true,         // Mostra tudo antes do aceite
        };
      
      case 'reservation_board':
        return {
          strategy: 'reservation_board',
          offerTimeoutSeconds: 24 * 60 * 60, // 24h (agendamento)
          maxRetryAttempts: 999,         // Sem limite (reserva)
          searchRadiusKm: 50,            // Raio maior para agendadas
          requiresVerification: DISPATCH_GLOBAL_CONFIG.reservationBoard.requiresVerification,
          requiresSubscription: DISPATCH_GLOBAL_CONFIG.reservationBoard.requiresSubscription,
          allowsConcurrentOffers: true,  // Múltiplos motoristas podem ver
          showFullDetails: true,         // Mostra tudo (agendamento permite)
        };
      
      default:
        logger.error('DispatchConfig: Unknown strategy', { strategy });
        throw new Error(`Unknown dispatch strategy: ${strategy}`);
    }
  }
  
  /**
   * Retorna configuração completa baseada no contexto
   */
  static getConfigForContext(context: DispatchContext): DispatchConfig {
    const strategy = this.determineStrategy(context);
    return this.getConfig(strategy);
  }
  
  /**
   * Valida se estratégia está habilitada
   */
  static isStrategyEnabled(strategy: DispatchStrategy): boolean {
    switch (strategy) {
      case 'exclusive_offer':
        return DISPATCH_GLOBAL_CONFIG.exclusiveOffer.enabled;
      case 'open_board':
        return DISPATCH_GLOBAL_CONFIG.openBoard.enabled;
      case 'reservation_board':
        return DISPATCH_GLOBAL_CONFIG.reservationBoard.enabled;
      default:
        return false;
    }
  }
  
  /**
   * Retorna configuração global completa
   */
  static getGlobalConfig(): DispatchGlobalConfig {
    return { ...DISPATCH_GLOBAL_CONFIG };
  }
  
  /**
   * Retorna pesos de scoring
   */
  static getScoringWeights() {
    return { ...DISPATCH_GLOBAL_CONFIG.scoring };
  }
  
  /**
   * Valida contexto de dispatch
   */
  static validateContext(context: DispatchContext): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validar ride_mode
    if (!Object.values(RIDE_MODE).includes(context.rideMode)) {
      errors.push(`Invalid ride_mode: ${context.rideMode}`);
    }
    
    // Validar source_type
    if (!Object.values(SOURCE_TYPE).includes(context.sourceType)) {
      errors.push(`Invalid source_type: ${context.sourceType}`);
    }
    
    // Validar agendamento
    if (context.isScheduled) {
      if (!context.scheduledFor) {
        errors.push('scheduled_for is required for scheduled rides');
      } else {
        const scheduledDate = new Date(context.scheduledFor);
        const now = new Date();
        const minDate = new Date(now.getTime() + DISPATCH_GLOBAL_CONFIG.reservationBoard.minAdvanceHours * 60 * 60 * 1000);
        const maxDate = new Date(now.getTime() + DISPATCH_GLOBAL_CONFIG.reservationBoard.maxAdvanceDays * 24 * 60 * 60 * 1000);
        
        if (scheduledDate < minDate) {
          errors.push(`Scheduled time must be at least ${DISPATCH_GLOBAL_CONFIG.reservationBoard.minAdvanceHours}h in advance`);
        }
        
        if (scheduledDate > maxDate) {
          errors.push(`Scheduled time cannot be more than ${DISPATCH_GLOBAL_CONFIG.reservationBoard.maxAdvanceDays} days in advance`);
        }
      }
    }
    
    // Validar imediato vs agendado
    if (context.isImmediate && context.isScheduled) {
      errors.push('Ride cannot be both immediate and scheduled');
    }
    
    if (!context.isImmediate && !context.isScheduled) {
      errors.push('Ride must be either immediate or scheduled');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Cria contexto de dispatch a partir de dados da corrida
   */
  static createContext(rideData: {
    ride_mode?: string;
    source_type?: string;
    is_scheduled?: boolean;
    scheduled_for?: string;
  }): DispatchContext {
    const rideMode = rideData.ride_mode || RIDE_MODE.RIDE;
    const sourceType = rideData.source_type || SOURCE_TYPE.PASSENGER;
    const isScheduled = rideData.is_scheduled || false;
    const scheduledFor = rideData.scheduled_for;
    
    return {
      rideMode: rideMode as typeof RIDE_MODE[keyof typeof RIDE_MODE],
      sourceType: sourceType as typeof SOURCE_TYPE[keyof typeof SOURCE_TYPE],
      isScheduled,
      isImmediate: !isScheduled,
      scheduledFor,
    };
  }
  
  /**
   * Retorna limite de ofertas para motorista
   */
  static getMaxOffersPerDriver(strategy: DispatchStrategy): number {
    switch (strategy) {
      case 'exclusive_offer':
        return 1; // Apenas 1 oferta por vez
      case 'open_board':
        return DISPATCH_GLOBAL_CONFIG.openBoard.maxOffersPerDriver;
      case 'reservation_board':
        return 999; // Sem limite para agendadas
      default:
        return 1;
    }
  }
  
  /**
   * Retorna se deve mostrar detalhes completos antes do aceite
   */
  static shouldShowFullDetails(strategy: DispatchStrategy): boolean {
    const config = this.getConfig(strategy);
    return config.showFullDetails;
  }
  
  /**
   * Retorna se permite ofertas concorrentes
   */
  static allowsConcurrentOffers(strategy: DispatchStrategy): boolean {
    const config = this.getConfig(strategy);
    return config.allowsConcurrentOffers;
  }
}
