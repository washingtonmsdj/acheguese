import { TryOnCategory } from './types';

/**
 * Guardrails básicos de conteúdo. Modelo deve gerar imagens de moda,
 * sempre vestidas (exceto contexto válido como swimwear).
 */
export function buildNegativePrompt(): string {
  return [
    'nudity', 'nsfw', 'explicit content', 'sexual', 'suggestive pose',
    'underage', 'child', 'minor',
    'low quality', 'blurry', 'distorted anatomy', 'extra limbs',
    'watermark', 'text overlay', 'logo overlay',
    'product mismatch', 'wrong color', 'wrong texture',
  ].join(', ');
}

export function isContextSafe(category: TryOnCategory): boolean {
  // Todas as categorias atuais são seguras; swimwear permitida apenas no contexto correto.
  return Object.values(TryOnCategory).includes(category);
}
