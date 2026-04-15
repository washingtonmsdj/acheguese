/**
 * Schemas de validação Zod para o sistema de constantes
 * 
 * Validação em runtime com mensagens de erro descritivas e fallbacks seguros.
 */

import { z } from 'zod';

/**
 * Schema de validação para física
 */
export const PhysicsConfigSchema = z.object({
  gravity: z.number().min(0).max(10000).describe('Gravidade deve ser entre 0 e 10000 pixels/s²'),
  maxVelocity: z.number().min(0).max(10000).describe('Velocidade máxima deve ser entre 0 e 10000 pixels/s'),
  friction: z.number().min(0).max(1).describe('Fricção deve ser entre 0 e 1'),
  airDensity: z.number().min(0).max(1).describe('Densidade do ar deve ser entre 0 e 1'),
}).strict();

/**
 * Schema de validação para gameplay
 */
export const GameplayConfigSchema = z.object({
  playerSpeed: z.number().min(0).max(10000).describe('Velocidade do jogador deve ser entre 0 e 10000 pixels/s'),
  jumpSpeed: z.number().min(0).max(10000).describe('Velocidade de pulo deve ser entre 0 e 10000 pixels/s'),
  initialHealth: z.number().int().min(1).max(1000).describe('Vida inicial deve ser entre 1 e 1000'),
  initialScore: z.number().int().min(0).describe('Pontuação inicial deve ser >= 0'),
}).strict();

/**
 * Schema de validação para colisão
 */
export const CollisionConfigSchema = z.object({
  gridSize: z.number().int().min(1).max(1000).describe('Tamanho do grid deve ser entre 1 e 1000'),
  maxEntitiesPerCell: z.number().int().min(1).max(1000).describe('Máximo de entidades por célula deve ser entre 1 e 1000'),
  searchRadius: z.number().min(0).max(10000).describe('Raio de busca deve ser entre 0 e 10000'),
}).strict();

/**
 * Schema de validação para rendering
 */
export const RenderingConfigSchema = z.object({
  targetFPS: z.number().int().min(1).max(240).describe('FPS alvo deve ser entre 1 e 240'),
  vsync: z.boolean().describe('VSync deve ser booleano'),
  antialiasing: z.enum(['none', 'low', 'medium', 'high']).describe('Anti-aliasing deve ser none, low, medium ou high'),
  shadows: z.boolean().describe('Sombras deve ser booleano'),
}).strict();

/**
 * Schema de validação para UI
 */
export const UIConfigSchema = z.object({
  padding: z.number().min(0).max(100).describe('Padding deve ser entre 0 e 100 pixels'),
  margin: z.number().min(0).max(100).describe('Margin deve ser entre 0 e 100 pixels'),
  borderRadius: z.number().min(0).max(50).describe('Border radius deve ser entre 0 e 50 pixels'),
  animationDuration: z.number().int().min(0).max(10000).describe('Duração de animação deve ser entre 0 e 10000ms'),
}).strict();

/**
 * Schema de validação para dimensões
 */
export const DimensionsConfigSchema = z.object({
  width: z.number().int().min(1).max(10000).describe('Largura deve ser entre 1 e 10000 pixels'),
  height: z.number().int().min(1).max(10000).describe('Altura deve ser entre 1 e 10000 pixels'),
  aspectRatio: z.number().min(0.1).max(10).describe('Aspect ratio deve ser entre 0.1 e 10'),
}).strict();

/**
 * Schema de validação completo
 */
export const SystemConfigSchema = z.object({
  physics: PhysicsConfigSchema,
  gameplay: GameplayConfigSchema,
  collision: CollisionConfigSchema,
  rendering: RenderingConfigSchema,
  ui: UIConfigSchema,
  dimensions: DimensionsConfigSchema,
}).strict();

import type { SystemConfig } from './types';

/**
 * Valida configuração do sistema
 * 
 * @throws {z.ZodError} Se a configuração for inválida
 */
export function validateSystemConfig(config: unknown): SystemConfig {
  return SystemConfigSchema.parse(config) as unknown as SystemConfig;
}

/**
 * Valida configuração do sistema com fallback seguro
 * 
 * @returns Configuração validada ou fallback se inválida
 */
export function validateSystemConfigSafe(
  config: unknown,
  fallback: SystemConfig
): SystemConfig {
  const result = SystemConfigSchema.safeParse(config);
  if (result.success) {
    return result.data as unknown as SystemConfig;
  }
  
  // Log estruturado do erro
  console.error('Invalid system config:', {
    errors: result.error.errors,
    config,
    fallbackUsed: true
  });
  
  return fallback;
}