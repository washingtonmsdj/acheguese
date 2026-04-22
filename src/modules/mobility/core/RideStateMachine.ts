/**
 * RIDE STATE MACHINE - Motor Operacional da Corrida
 * 
 * Centraliza toda a lógica de transições de estado da corrida.
 * Garante consistência transacional e previne race conditions.
 */

import { logger } from "@/shared/utils/logger";

// ============================================
// ESTADOS DA CORRIDA
// ============================================

export const RIDE_STATE = {
  // Inicial
  REQUESTED: 'requested',
  
  // Busca de motorista
  SEARCHING_DRIVER: 'searching_driver',
  
  // Motorista atribuído
  DRIVER_ASSIGNED: 'driver_assigned',
  DRIVER_ACCEPTED: 'driver_accepted',
  DRIVER_ARRIVING: 'driver_arriving',
  
  // Em andamento — corrida de passageiro
  PASSENGER_BOARDED: 'passenger_boarded',
  IN_PROGRESS: 'in_progress',

  // Em andamento — motoboy/entrega
  PICKUP_CONFIRMED: 'pickup_confirmed', // Motoboy coletou o pacote
  IN_DELIVERY: 'in_delivery',           // Em rota de entrega
  DELIVERED: 'delivered',               // Entregue com sucesso
  FAILED_DELIVERY: 'failed_delivery',   // Falha na entrega
  
  // Finais
  COMPLETED: 'completed',
  CANCELLED_BY_PASSENGER: 'cancelled_by_passenger',
  CANCELLED_BY_DRIVER: 'cancelled_by_driver',
  EXPIRED: 'expired',
  FAILED: 'failed',
} as const;

export type RideState = typeof RIDE_STATE[keyof typeof RIDE_STATE];

// ============================================
// TRANSIÇÕES PERMITIDAS
// ============================================

const ALLOWED_TRANSITIONS: Record<RideState, RideState[]> = {
  // Inicial
  [RIDE_STATE.REQUESTED]: [
    RIDE_STATE.SEARCHING_DRIVER,
    RIDE_STATE.CANCELLED_BY_PASSENGER,
    RIDE_STATE.EXPIRED,
  ],
  
  // Busca
  [RIDE_STATE.SEARCHING_DRIVER]: [
    RIDE_STATE.DRIVER_ASSIGNED,
    RIDE_STATE.CANCELLED_BY_PASSENGER,
    RIDE_STATE.EXPIRED,
  ],
  
  // Atribuição (compartilhado ride + motoboy)
  [RIDE_STATE.DRIVER_ASSIGNED]: [
    RIDE_STATE.DRIVER_ACCEPTED,
    RIDE_STATE.CANCELLED_BY_DRIVER,
    RIDE_STATE.CANCELLED_BY_PASSENGER,
    RIDE_STATE.EXPIRED,
  ],
  
  [RIDE_STATE.DRIVER_ACCEPTED]: [
    RIDE_STATE.DRIVER_ARRIVING,
    RIDE_STATE.CANCELLED_BY_DRIVER,
    RIDE_STATE.CANCELLED_BY_PASSENGER,
  ],
  
  [RIDE_STATE.DRIVER_ARRIVING]: [
    RIDE_STATE.PASSENGER_BOARDED,   // ride: passageiro embarcou
    RIDE_STATE.PICKUP_CONFIRMED,    // motoboy: coletou o pacote
    RIDE_STATE.CANCELLED_BY_DRIVER,
    RIDE_STATE.CANCELLED_BY_PASSENGER,
  ],
  
  // Fluxo de passageiro
  [RIDE_STATE.PASSENGER_BOARDED]: [
    RIDE_STATE.IN_PROGRESS,
    RIDE_STATE.CANCELLED_BY_DRIVER,
  ],
  
  [RIDE_STATE.IN_PROGRESS]: [
    RIDE_STATE.COMPLETED,
    RIDE_STATE.FAILED,
  ],

  // Fluxo de motoboy/entrega
  [RIDE_STATE.PICKUP_CONFIRMED]: [
    RIDE_STATE.IN_DELIVERY,
    RIDE_STATE.CANCELLED_BY_DRIVER,
    RIDE_STATE.CANCELLED_BY_PASSENGER,
  ],

  [RIDE_STATE.IN_DELIVERY]: [
    RIDE_STATE.DELIVERED,
    RIDE_STATE.FAILED_DELIVERY,
    RIDE_STATE.CANCELLED_BY_DRIVER,
  ],

  [RIDE_STATE.DELIVERED]: [
    RIDE_STATE.COMPLETED,
  ],

  [RIDE_STATE.FAILED_DELIVERY]: [
    RIDE_STATE.CANCELLED_BY_DRIVER,
    RIDE_STATE.FAILED,
  ],
  
  // Finais (não podem transicionar)
  [RIDE_STATE.COMPLETED]: [],
  [RIDE_STATE.CANCELLED_BY_PASSENGER]: [],
  [RIDE_STATE.CANCELLED_BY_DRIVER]: [],
  [RIDE_STATE.EXPIRED]: [],
  [RIDE_STATE.FAILED]: [],
};

// ============================================
// ESTADOS FINAIS
// ============================================

const FINAL_STATES: RideState[] = [
  RIDE_STATE.COMPLETED,
  RIDE_STATE.CANCELLED_BY_PASSENGER,
  RIDE_STATE.CANCELLED_BY_DRIVER,
  RIDE_STATE.EXPIRED,
  RIDE_STATE.FAILED,
];

// ============================================
// ESTADOS ATIVOS (corrida em andamento)
// ============================================

const ACTIVE_STATES: RideState[] = [
  RIDE_STATE.DRIVER_ACCEPTED,
  RIDE_STATE.DRIVER_ARRIVING,
  RIDE_STATE.PASSENGER_BOARDED,
  RIDE_STATE.IN_PROGRESS,
  // Motoboy
  RIDE_STATE.PICKUP_CONFIRMED,
  RIDE_STATE.IN_DELIVERY,
  RIDE_STATE.DELIVERED,
];

// ============================================
// ESTADOS CANCELÁVEIS
// ============================================

const CANCELLABLE_STATES: RideState[] = [
  RIDE_STATE.REQUESTED,
  RIDE_STATE.SEARCHING_DRIVER,
  RIDE_STATE.DRIVER_ASSIGNED,
  RIDE_STATE.DRIVER_ACCEPTED,
  RIDE_STATE.DRIVER_ARRIVING,
  RIDE_STATE.PASSENGER_BOARDED,
  RIDE_STATE.PICKUP_CONFIRMED, // Motoboy: pode cancelar após coleta (apenas motorista)
  // IN_DELIVERY removido: deve usar failDelivery() ao invés de cancelar
];

// ============================================
// STATE MACHINE
// ============================================

export class RideStateMachine {
  /**
   * Valida se uma transição é permitida
   */
  static canTransition(from: RideState, to: RideState): boolean {
    const allowed = ALLOWED_TRANSITIONS[from] || [];
    return allowed.includes(to);
  }

  /**
   * Valida transição e lança erro se inválida
   */
  static assertCanTransition(from: RideState, to: RideState): void {
    if (!this.canTransition(from, to)) {
      throw new Error(
        `Invalid transition: ${from} -> ${to}. Allowed: ${ALLOWED_TRANSITIONS[from]?.join(', ') || 'none'}`
      );
    }
  }

  /**
   * Verifica se estado é final
   */
  static isFinalState(state: RideState): boolean {
    return FINAL_STATES.includes(state);
  }

  /**
   * Verifica se estado é ativo (corrida em andamento)
   */
  static isActiveState(state: RideState): boolean {
    return ACTIVE_STATES.includes(state);
  }

  /**
   * Verifica se corrida pode ser cancelada
   */
  static isCancellable(state: RideState): boolean {
    return CANCELLABLE_STATES.includes(state);
  }

  /**
   * Obtém próximos estados possíveis
   */
  static getNextStates(from: RideState): RideState[] {
    return ALLOWED_TRANSITIONS[from] || [];
  }

  /**
   * Valida se motorista pode aceitar corrida
   */
  static canDriverAccept(state: RideState): boolean {
    return state === RIDE_STATE.DRIVER_ASSIGNED;
  }

  /**
   * Verifica se é estado de entrega (motoboy)
   */
  static isDeliveryState(state: RideState): boolean {
    return [
      RIDE_STATE.PICKUP_CONFIRMED,
      RIDE_STATE.IN_DELIVERY,
      RIDE_STATE.DELIVERED,
      RIDE_STATE.FAILED_DELIVERY,
    ].includes(state);
  }

  /**
   * Valida se passageiro pode cancelar
   * GATE 3: Regra rigorosa por estado
   */
  static canPassengerCancel(state: RideState): boolean {
    // Passageiro NÃO pode cancelar após embarcar ou após coleta (motoboy)
    const blockedStates = [
      RIDE_STATE.PASSENGER_BOARDED,
      RIDE_STATE.IN_PROGRESS,
      RIDE_STATE.PICKUP_CONFIRMED,  // Motoboy: após coleta, apenas motorista pode cancelar
      RIDE_STATE.IN_DELIVERY,       // Motoboy: durante entrega, usar failDelivery()
    ];
    
    return CANCELLABLE_STATES.includes(state) && !blockedStates.includes(state);
  }

  /**
   * Valida se motorista pode cancelar
   * GATE 3: Motorista pode cancelar até PICKUP_CONFIRMED
   * Durante IN_DELIVERY, deve usar failDelivery() ao invés de cancelar
   */
  static canDriverCancel(state: RideState): boolean {
    // Motorista NÃO pode cancelar durante corrida ativa ou entrega em andamento
    const blockedStates = [
      RIDE_STATE.IN_PROGRESS,  // Corrida em andamento físico
      RIDE_STATE.IN_DELIVERY,  // Entrega em andamento - usar failDelivery()
    ];
    
    return CANCELLABLE_STATES.includes(state) && 
           !blockedStates.includes(state) &&
           !FINAL_STATES.includes(state);
  }

  /**
   * Log de transição
   */
  static logTransition(
    rideId: string,
    from: RideState,
    to: RideState,
    actor: string,
    reason?: string
  ): void {
    logger.info('Ride state transition', {
      rideId,
      from,
      to,
      actor,
      reason,
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================
// HELPERS
// ============================================

export function isValidRideState(state: string): state is RideState {
  return Object.values(RIDE_STATE).includes(state as RideState);
}

export function assertValidRideState(state: string): asserts state is RideState {
  if (!isValidRideState(state)) {
    throw new Error(
      `Invalid ride state: ${state}. Expected: ${Object.values(RIDE_STATE).join(', ')}`
    );
  }
}
