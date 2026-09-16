/**
 * Core Pricing Types
 *
 * Tipos canônicos para precificação e estimativas.
 * Única fonte de verdade para pricing no sistema.
 */

export type PricingMode =
  | 'ride'
  | 'delivery'
  | 'mototaxi'
  | 'motoboy'
  | 'custom';

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

export interface PricingBreakdownItem {
  label: string;
  value: number;
  type: 'base' | 'distance' | 'time' | 'fee' | 'multiplier';
}

export interface AdditionalFee {
  id: string;
  label: string;
  amount: number;
  type: 'fixed' | 'percentage';
  reason?: string;
}

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
    morning?: number;
    afternoon?: number;
    night?: number;
  };
  additionalFees?: AdditionalFee[];
  isActive: boolean;
  validFrom?: Date;
  validUntil?: Date;
  metadata?: Record<string, unknown>;
}

export interface PricingProvider {
  readonly id: string;
  readonly supportedModes: PricingMode[];
  calculateEstimate(request: PriceEstimateRequest): Promise<PriceEstimateResponse>;
  getRule(mode: PricingMode): Promise<PricingRule | null>;
  isAvailable(): boolean;
}

export interface PricingServiceConfig {
  defaultMode: PricingMode;
  currency: string;
  enablePeakHours: boolean;
  enableDynamicPricing: boolean;
  cacheEstimates: boolean;
  cacheTtlSeconds: number;
}

export interface PricingResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Non-commercial pricing constants only.
 * Monetary values and commercial multipliers belong to persisted pricing rules.
 */
export const PRICING_CONSTANTS = {
  DEFAULT_CURRENCY: 'BRL',
} as const;

export enum PricingErrorType {
  CONFLICT = 'PRICING_CONFLICT',
  NOT_FOUND = 'PRICING_NOT_FOUND',
  VALIDATION = 'PRICING_VALIDATION',
  UNKNOWN = 'PRICING_UNKNOWN',
}

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
