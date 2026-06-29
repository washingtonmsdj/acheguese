/**
 * Core Pricing Types
 *
 * Tipos canônicos para precificação e estimativas.
 * Única fonte de verdade para pricing no sistema.
 */

// ============================================
// PRICING MODE
// ============================================

/**
 * Modo de precificação
 */
export type PricingMode = 
  | 'ride'        // Corrida de passageiro
  | 'delivery'    // Entrega
  | 'mototaxi'    // Mototáxi
  | 'motoboy'     // Motoboy
  | 'custom';     // Customizado

// ============================================
// PRICING CONTEXT
// ============================================

/**
 * Contexto para cálculo de preço
 */
export interface PricingContext {
  mode: PricingMode;
  distanceKm: number;
  durationMinutes: number;
  origin: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

// ============================================
// PRICE ESTIMATE
// ============================================

/**
 * Request para estimativa de preço
 */
export interface PriceEstimateRequest {
  mode: PricingMode;
  origin: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
  timestamp?: Date;
  options?: {
    includeBreakdown?: boolean;
    applyPeakHours?: boolean;
    customMultiplier?: number;
  };
}

/**
 * Response de estimativa de preço
 */
export interface PriceEstimateResponse {
  estimatedPrice: number;
  minimumPrice: number;
  maximumPrice?: number;
  currency: string;
  breakdown?: PricingBreakdown;
  metadata: {
    distanceKm: number;
    durationMinutes: number;
    peakHourMultiplier?: number;
    mode: PricingMode;
  };
}

// ============================================
// PRICING BREAKDOWN
// ============================================

/**
 * Detalhamento de preço
 */
export interface PricingBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  subtotal: number;
  additionalFees: AdditionalFee[];
  totalFees: number;
  total: number;
  items: PricingBreakdownItem[];
}

/**
 * Item do detalhamento
 */
export interface PricingBreakdownItem {
  label: string;
  value: number;
  type: 'base' | 'distance' | 'time' | 'fee' | 'multiplier';
}

// ============================================
// ADDITIONAL FEES
// ============================================

/**
 * Taxa adicional
 */
export interface AdditionalFee {
  id: string;
  label: string;
  amount: number;
  type: 'fixed' | 'percentage';
  reason?: string;
}

// ============================================
// PRICING RULE
// ============================================

/**
 * Regra de precificação
 */
export interface PricingRule {
  id: string;
  mode: PricingMode;
  name: string;
  baseFare: number;
  pricePerKm: number;
  pricePerMinute: number;
  minimumFare: number;
  maximumFare?: number;
  peakHourMultipliers?: {
    morning?: number;    // 7h-9h
    afternoon?: number;  // 17h-19h
    night?: number;      // 22h-2h
  };
  additionalFees?: AdditionalFee[];
  isActive: boolean;
  validFrom?: Date;
  validUntil?: Date;
  metadata?: Record<string, unknown>;
}

// ============================================
// PRICING PROVIDER
// ============================================

/**
 * Contrato para providers de pricing
 */
export interface PricingProvider {
  readonly id: string;
  readonly supportedModes: PricingMode[];
  
  /**
   * Calcula estimativa de preço
   */
  calculateEstimate(request: PriceEstimateRequest): Promise<PriceEstimateResponse>;
  
  /**
   * Obtém regra de precificação para um modo
   */
  getRule(mode: PricingMode): Promise<PricingRule | null>;
  
  /**
   * Valida se provider está disponível
   */
  isAvailable(): boolean;
}

// ============================================
// SERVICE TYPES
// ============================================

/**
 * Configuração do PricingService
 */
export interface PricingServiceConfig {
  defaultMode: PricingMode;
  currency: string;
  enablePeakHours: boolean;
  enableDynamicPricing: boolean;
  cacheEstimates: boolean;
  cacheTtlSeconds: number;
}

/**
 * Resultado de operação de pricing
 */
export interface PricingResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Constantes de pricing
 */
export const PRICING_CONSTANTS = {
  DEFAULT_CURRENCY: 'BRL',
  DEFAULT_BASE_FARE: 5.0,
  DEFAULT_PRICE_PER_KM: 2.5,
  DEFAULT_PRICE_PER_MINUTE: 0.5,
  DEFAULT_MINIMUM_FARE: 8.0,
  DEFAULT_AVERAGE_SPEED_KMH: 40,
  
  PEAK_HOUR_MULTIPLIERS: {
    MORNING: 1.3,    // 7h-9h
    AFTERNOON: 1.5,  // 17h-19h
    NIGHT: 1.2,      // 22h-2h
    WEEKEND: 1.0,    // Fim de semana
  },
} as const;

// ============================================
// ERRORS
// ============================================

/**
 * Tipos de erro de pricing
 */
export enum PricingErrorType {
  CONFLICT = 'PRICING_CONFLICT',
  NOT_FOUND = 'PRICING_NOT_FOUND',
  VALIDATION = 'PRICING_VALIDATION',
  UNKNOWN = 'PRICING_UNKNOWN',
}

/**
 * Erro customizado de pricing
 */
export class PricingError extends Error {
  constructor(
    public type: PricingErrorType,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'PricingError';
  }

  static conflict(message: string, details?: unknown): PricingError {
    return new PricingError(PricingErrorType.CONFLICT, message, details);
  }

  static notFound(message: string, details?: unknown): PricingError {
    return new PricingError(PricingErrorType.NOT_FOUND, message, details);
  }

  static validation(message: string, details?: unknown): PricingError {
    return new PricingError(PricingErrorType.VALIDATION, message, details);
  }

  isConflict(): boolean {
    return this.type === PricingErrorType.CONFLICT;
  }

  isNotFound(): boolean {
    return this.type === PricingErrorType.NOT_FOUND;
  }

  isValidation(): boolean {
    return this.type === PricingErrorType.VALIDATION;
  }
}
