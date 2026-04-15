/**
 * Tipos TypeScript para o sistema de constantes
 * 
 * Este arquivo define os tipos base para todas as constantes do sistema.
 * Segue o princípio de type safety 100% e validação robusta.
 */

/**
 * Configuração de física do jogo
 */
export interface PhysicsConfig {
  /** Gravidade (pixels/s²) */
  readonly gravity: number;
  /** Velocidade máxima (pixels/s) */
  readonly maxVelocity: number;
  /** Fricção (0-1) */
  readonly friction: number;
  /** Densidade do ar (0-1) */
  readonly airDensity: number;
}

/**
 * Configuração de dimensões
 */
export interface DimensionsConfig {
  /** Largura padrão (pixels) */
  readonly width: number;
  /** Altura padrão (pixels) */
  readonly height: number;
  /** Aspect ratio */
  readonly aspectRatio: number;
}

/**
 * Configuração de gameplay
 */
export interface GameplayConfig {
  /** Velocidade do jogador (pixels/s) */
  readonly playerSpeed: number;
  /** Velocidade de pulo (pixels/s) */
  readonly jumpSpeed: number;
  /** Vida inicial */
  readonly initialHealth: number;
  /** Pontuação inicial */
  readonly initialScore: number;
}

/**
 * Configuração de colisão
 */
export interface CollisionConfig {
  /** Tamanho do grid de colisão */
  readonly gridSize: number;
  /** Máximo de entidades por célula */
  readonly maxEntitiesPerCell: number;
  /** Raio de busca para colisões */
  readonly searchRadius: number;
}

/**
 * Configuração de rendering
 */
export interface RenderingConfig {
  /** FPS alvo */
  readonly targetFPS: number;
  /** Habilitar VSync */
  readonly vsync: boolean;
  /** Qualidade de anti-aliasing */
  readonly antialiasing: 'none' | 'low' | 'medium' | 'high';
  /** Habilitar sombras */
  readonly shadows: boolean;
}

/**
 * Configuração de UI
 */
export interface UIConfig {
  /** Padding padrão (pixels) */
  readonly padding: number;
  /** Margin padrão (pixels) */
  readonly margin: number;
  /** Border radius padrão (pixels) */
  readonly borderRadius: number;
  /** Duração de animação padrão (ms) */
  readonly animationDuration: number;
}

/**
 * Configuração completa do sistema
 */
export interface SystemConfig {
  readonly physics: PhysicsConfig;
  readonly gameplay: GameplayConfig;
  readonly collision: CollisionConfig;
  readonly rendering: RenderingConfig;
  readonly ui: UIConfig;
  readonly dimensions: DimensionsConfig;
}