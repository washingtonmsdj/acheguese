/**
 * Virtual Try-On — Domain Types (SSOT)
 * Contratos canônicos do módulo. Não importam infra.
 */

export const TryOnCategory = {
  CLOTHING_UPPER: 'clothing_upper',
  CLOTHING_LOWER: 'clothing_lower',
  CLOTHING_FULL: 'clothing_full',
  FOOTWEAR: 'footwear',
  ACCESSORY_EYEWEAR: 'accessory_eyewear',
  ACCESSORY_HEADWEAR: 'accessory_headwear',
  ACCESSORY_OTHER: 'accessory_other',
  SWIMWEAR: 'swimwear',
} as const;
export type TryOnCategory = typeof TryOnCategory[keyof typeof TryOnCategory];

export const TryOnGender = {
  MALE: 'male',
  FEMALE: 'female',
  NEUTRAL: 'neutral',
} as const;
export type TryOnGender = typeof TryOnGender[keyof typeof TryOnGender];

export const TryOnStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
export type TryOnStatus = typeof TryOnStatus[keyof typeof TryOnStatus];

export type TryOnStyle = 'casual' | 'sport' | 'beach' | 'formal' | 'streetwear' | 'elegant';

/** Detecção semântica do alvo do produto no corpo. */
export const BodyTarget = {
  UPPER_BODY: 'upper_body',
  LOWER_BODY: 'lower_body',
  FULL_BODY: 'full_body',
  FEET: 'feet',
  HEAD: 'head',
  EYES: 'eyes',
  HAND: 'hand',
} as const;
export type BodyTarget = typeof BodyTarget[keyof typeof BodyTarget];

export interface TryOnGeneration {
  id: string;
  user_id: string;
  product_image_url: string;
  category: TryOnCategory;
  target_gender: TryOnGender;
  style: TryOnStyle;
  status: TryOnStatus;
  provider: string;
  generated_urls: string[];
  selected_url: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateTryOnInput {
  productImageUrl: string;
  category: TryOnCategory;
  targetGender?: TryOnGender;
  style?: TryOnStyle;
  variations?: number; // 3..5
}

export interface TryOnProviderRequest {
  productImageUrl: string;
  category: TryOnCategory;
  bodyTarget: BodyTarget;
  targetGender: TryOnGender;
  style: TryOnStyle;
  variations: number;
  /** Prompt construído pela camada de serviço (já com guardrails). */
  prompt: string;
  negativePrompt?: string;
}

export interface TryOnProviderResult {
  /** URLs já hospedadas (storage público) ou data URLs base64. O serviço normaliza. */
  images: Array<{ url?: string; base64?: string; mimeType?: string }>;
  providerMetadata?: Record<string, unknown>;
}

export interface TryOnProvider {
  readonly id: string;
  generate(req: TryOnProviderRequest): Promise<TryOnProviderResult>;
}
