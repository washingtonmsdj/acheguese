/**
 * MOBILITY DISPATCH CONFIG SERVICE
 * 
 * SSOT para configurações de dispatch
 * Centraliza todas as regras de negócio e configurações
 */
import { MOBILITY_DISPATCH_POLICY } from '@/shared/contracts/mobilityDispatchPolicy';
import { logger } from '@/shared/utils/logger';
import type {
  DispatchStrategy,
  DispatchContext,
  DispatchConfig,
  DispatchGlobalConfig,
} from '../types/dispatch.types';
import { RIDE_MODE, SOURCE_TYPE } from '../constants';

// ============================================
// CONFIGURAÇÃO GLOBAL (SSOT compartilhado app + Edge)
// ============================================

const DISPATCH_GLOBAL_CONFIG = MOBILITY_DISPATCH_POLICY;

// ============================================
// MOBILITY DISPATCH CONFIG SERVICE
// ============================================

export class MobilityDispatchConfigService {
  /**
   * Determina estratégia de dispatch baseada no contexto
   */
  static determineStrategy(context: DispatchContext): DispatchStrategy {
    if (context.isScheduled) {
      logger.info('DispatchConfig: Strategy = reservation_board', { context });
      return 'reservation_board';
    }
    
    if (context.rideMode === RIDE_MODE.MOTOBOY) {
      logger.info('DispatchConfig: Strategy = open_board (motoboy)', { context });
      return 'open_board';
    }
    
    if (context.rideMode === RIDE_MODE.RIDE && context.isImmediate) {
      logger.info('DispatchConfig: Strategy = exclusive_offer (passenger)', { context });
      return 'exclusive_offer';
    }
    
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
          allowsConcurrentOffers: false,
          showFullDetails: false,
        };
      
      case 'open_board':
        return {
          strategy: 'open_board',
          offerTimeoutSeconds: DISPATCH_GLOBAL_CONFIG.openBoard.offerExpirationMinutes * 60,
          maxRetryAttempts: DISPATCH_GLOBAL_CONFIG.openBoard.maxRetryAttempts,
          searchRadiusKm: DISPATCH_GLOBAL_CONFIG.openBoard.searchRadiusKm,
          requiresVerification: DISPATCH_GLOBAL_CONFIG.openBoard.requiresVerification,
          requiresSubscription: DISPATCH_GLOBAL_CONFIG.openBoard.requiresSubscription,
          allowsConcurrentOffers: true,
          showFullDetails: false,
        };
      
      case 'reservation_board':
        return {
          strategy: 'reservation_board',
          offerTimeoutSeconds: DISPATCH_GLOBAL_CONFIG.reservationBoard.offerTimeoutSeconds,
          maxRetryAttempts: DISPATCH_GLOBAL_CONFIG.reservationBoard.maxRetryAttempts,
          searchRadiusKm: DISPATCH_GLOBAL_CONFIG.reservationBoard.searchRadiusKm,
          requiresVerification: DISPATCH_GLOBAL_CONFIG.reservationBoard.requiresVerification,
          requiresSubscription: DISPATCH_GLOBAL_CONFIG.reservationBoard.requiresSubscription,
          allowsConcurrentOffers: true,
          showFullDetails: false,
        };
      
      default:
        logger.error('DispatchConfig: Unknown strategy', { strategy });
        throw new Error(`Unknown dispatch strategy: ${strategy}`);
    }
  }
  
  static getConfigForContext(context: DispatchContext): DispatchConfig {
    const strategy = this.determineStrategy(context);
    return this.getConfig(strategy);
  }
  
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
  
  static getGlobalConfig(): DispatchGlobalConfig {
    return { ...DISPATCH_GLOBAL_CONFIG };
  }
  
  static getScoringWeights() {
    return { ...DISPATCH_GLOBAL_CONFIG.scoring };
  }
  
  static validateContext(context: DispatchContext): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!Object.values(RIDE_MODE).includes(context.rideMode)) {
      errors.push(`Invalid ride_mode: ${context.rideMode}`);
    }
    
    if (!Object.values(SOURCE_TYPE).includes(context.sourceType)) {
      errors.push(`Invalid source_type: ${context.sourceType}`);
    }
    
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
  
  static getMaxOffersPerDriver(strategy: DispatchStrategy): number {
    switch (strategy) {
      case 'exclusive_offer':
        return DISPATCH_GLOBAL_CONFIG.exclusiveOffer.maxOffersPerDriver;
      case 'open_board':
        return DISPATCH_GLOBAL_CONFIG.openBoard.maxOffersPerDriver;
      case 'reservation_board':
        return DISPATCH_GLOBAL_CONFIG.reservationBoard.maxOffersPerDriver;
      default:
        return DISPATCH_GLOBAL_CONFIG.exclusiveOffer.maxOffersPerDriver;
    }
  }
  
  static shouldShowFullDetails(strategy: DispatchStrategy): boolean {
    const config = this.getConfig(strategy);
    return config.showFullDetails;
  }
  
  static allowsConcurrentOffers(strategy: DispatchStrategy): boolean {
    const config = this.getConfig(strategy);
    return config.allowsConcurrentOffers;
  }
}
