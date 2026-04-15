/**
 * Sistema de Constantes Centralizado
 * 
 * Exportação principal de todas as constantes e configurações do sistema.
 * Este é o ponto de entrada único para todas as constantes do sistema.
 */

// Tipos
export type * from './types';

// Schemas de validação
export { validateSystemConfig, validateSystemConfigSafe } from './validation';

// Constantes de jogo
export * from './game/physics';
export * from './game/gameplay';
export * from './game/genres';
export * from './game/entities';

// Constantes de áudio
export * from './audio';

// Constantes de UI
export * from './ui/dimensions';
export * from './ui/colors';
export * from './ui/typography';
export * from './ui/animations';

// Constantes de rendering
export * from './rendering/canvas';
// export * from './rendering/camera'; // TODO: Implementar
// export * from './rendering/effects'; // TODO: Implementar

// Constantes de sistemas
export * from './systems/collision';
export * from './systems/time';
export * from './systems/ecs';
export * from './systems/physics-advanced';
export * from './systems/input';
export * from './systems/particles';
export * from './systems/water';
export * from './systems/weather';

// Constantes do compilador
export * from './compiler';

// Configuração padrão do sistema
import { SystemConfig } from './types';
import { PHYSICS, PHYSICS_BY_GENRE } from './game/physics';
import { GAMEPLAY, GAMEPLAY_BY_GENRE } from './game/gameplay';
import { COLLISION } from './systems/collision';
import { RENDERING } from './rendering/canvas';
import { UI, CANVAS_DIMENSIONS } from './ui/dimensions';

/**
 * Configuração padrão do sistema
 */
export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  physics: PHYSICS,
  gameplay: GAMEPLAY,
  collision: COLLISION,
  rendering: RENDERING,
  ui: UI,
  dimensions: CANVAS_DIMENSIONS,
};

/**
 * Obtém configuração por gênero
 */
export function getConfigForGenre(genre: string): SystemConfig {
  return {
    physics: PHYSICS_BY_GENRE[genre as keyof typeof PHYSICS_BY_GENRE] || PHYSICS,
    gameplay: GAMEPLAY_BY_GENRE[genre as keyof typeof GAMEPLAY_BY_GENRE] || GAMEPLAY,
    collision: COLLISION,
    rendering: RENDERING,
    ui: UI,
    dimensions: CANVAS_DIMENSIONS,
  };
}



