/**
 * Constantes avançadas de física
 * 
 * Constantes físicas reais e valores de configuração para o sistema de física 3D
 */

/**
 * Constantes físicas fundamentais
 */
export const PHYSICAL_CONSTANTS = {
  // Gravidade terrestre (m/s²)
  GRAVITY_EARTH: 9.80665,
  
  // Gravidade lunar (m/s²)
  GRAVITY_MOON: 1.62,
  
  // Densidade da água (kg/m³)
  WATER_DENSITY: 1000,
  
  // Densidade do ar ao nível do mar (kg/m³)
  AIR_DENSITY: 1.225,
  
  // Divisor para fórmula de inércia de caixa sólida
  INERTIA_DIVISOR: 12,
} as const;

/**
 * Configuração padrão de física
 */
export const PHYSICS_CONFIG_DEFAULTS = {
  gravity: PHYSICAL_CONSTANTS.GRAVITY_EARTH,
  waterDensity: PHYSICAL_CONSTANTS.WATER_DENSITY,
  airDensity: PHYSICAL_CONSTANTS.AIR_DENSITY,
} as const;

/**
 * Limites de tuning para estabilidade da simulação
 */
export const TUNING_LIMITS = {
  ANGULAR_DAMPING: { min: 0.9, max: 0.9999 },
  BUOYANCY_SCALE: { min: 0, max: 5 },
  DRAG_SCALE: { min: 0, max: 5 },
} as const;

/**
 * Valores padrão de tuning
 */
export const TUNING_DEFAULTS = {
  angularDamping: 0.985,
  buoyancyTorqueScale: 1.0,
  angularDragScale: 0.25,
} as const;

/**
 * Constantes de colisão
 */
export const COLLISION_CONSTANTS = {
  // Threshold para considerar colisão (metros)
  COLLISION_THRESHOLD: 0.1,
  
  // Margem de contato para estabilizar resolução com o terreno
  CONTACT_EPSILON: 0.005,
  
  // Threshold para velocidade de queda (m/s)
  FALLING_THRESHOLD: 0.5,
  
  // Fator de atrito no chão
  GROUND_FRICTION: 0.9,

  // DistÃ¢ncia mÃ¡xima para "snap" no chÃ£o (evita corpos pairando)
  GROUND_SNAP_DISTANCE: 0.08,

  // Velocidade vertical mÃ¡xima (em queda) para permitir snap
  GROUND_SNAP_MAX_VERTICAL_SPEED: 1.5,

  // Timestep máximo interno para evitar tunneling em frames longos
  MAX_INTERNAL_TIMESTEP: 1 / 120,

  // Limite de substeps internos por frame
  MAX_SUBSTEPS: 8,
  
  // Threshold para velocidade angular (rad/s)
  ANGULAR_VELOCITY_THRESHOLD: 0.000001,
  
  // Threshold para velocidade linear (m/s)
  LINEAR_VELOCITY_THRESHOLD: 0.001,
} as const;

/**
 * Constantes de amostragem
 */
export const SAMPLING_CONSTANTS = {
  // Grid de amostragem para empuxo distribuído
  BUOYANCY_GRID_SIZE: 3,
  
  // Número de amostras para colisão com terreno
  TERRAIN_SAMPLES: 5,

  // Espaçamento-alvo entre amostras do footprint do corpo
  TERRAIN_SAMPLE_SPACING: 6,

  // Limites por eixo para o grid adaptativo de contato com terreno
  TERRAIN_MIN_AXIS_SAMPLES: 3,
  TERRAIN_MAX_AXIS_SAMPLES: 9,
} as const;

/**
 * Constantes de Arca de Noé (exemplo)
 */
export const ARK_CONSTANTS = {
  // Dimensões bíblicas (metros)
  LENGTH: 137,
  WIDTH: 23,
  HEIGHT: 14,
  
  // Densidade da madeira (kg/m³)
  WOOD_DENSITY: 600,
  
  // Densidade média com carga (kg/m³)
  LOADED_DENSITY: 700,
  
  // Coeficiente de arrasto para forma retangular
  DRAG_COEFFICIENT: 1.2,
  
  // Posição do centro de massa (fração da altura)
  CENTER_OF_MASS_HEIGHT_FRACTION: 0.4,
} as const;

/**
 * Valida e normaliza configuração de física
 */
export function validatePhysicsConfig(config: {
  gravity?: number;
  waterDensity?: number;
  airDensity?: number;
}) {
  return {
    gravity: config.gravity ?? PHYSICS_CONFIG_DEFAULTS.gravity,
    waterDensity: config.waterDensity ?? PHYSICS_CONFIG_DEFAULTS.waterDensity,
    airDensity: config.airDensity ?? PHYSICS_CONFIG_DEFAULTS.airDensity,
  };
}

/**
 * Valida e normaliza configuração de tuning
 */
export function validateTuningConfig(config: {
  angularDamping?: number;
  buoyancyTorqueScale?: number;
  angularDragScale?: number;
}) {
  return {
    angularDamping: Math.max(
      TUNING_LIMITS.ANGULAR_DAMPING.min,
      Math.min(
        TUNING_LIMITS.ANGULAR_DAMPING.max,
        config.angularDamping ?? TUNING_DEFAULTS.angularDamping
      )
    ),
    buoyancyTorqueScale: Math.max(
      TUNING_LIMITS.BUOYANCY_SCALE.min,
      Math.min(
        TUNING_LIMITS.BUOYANCY_SCALE.max,
        config.buoyancyTorqueScale ?? TUNING_DEFAULTS.buoyancyTorqueScale
      )
    ),
    angularDragScale: Math.max(
      TUNING_LIMITS.DRAG_SCALE.min,
      Math.min(
        TUNING_LIMITS.DRAG_SCALE.max,
        config.angularDragScale ?? TUNING_DEFAULTS.angularDragScale
      )
    ),
  };
}

/**
 * Calcula inércia aproximada para caixa sólida
 */
export function calculateBoxInertia(
  mass: number,
  width: number,
  height: number,
  depth: number
) {
  return {
    x: (mass / PHYSICAL_CONSTANTS.INERTIA_DIVISOR) * (height * height + depth * depth),
    y: (mass / PHYSICAL_CONSTANTS.INERTIA_DIVISOR) * (width * width + depth * depth),
    z: (mass / PHYSICAL_CONSTANTS.INERTIA_DIVISOR) * (width * width + height * height),
  };
}

/**
 * Cria configuração para Arca de Noé
 */
export function createArkConfig() {
  const volume = ARK_CONSTANTS.LENGTH * ARK_CONSTANTS.WIDTH * ARK_CONSTANTS.HEIGHT;
  const mass = volume * ARK_CONSTANTS.LOADED_DENSITY;
  
  return {
    mass,
    volume,
    dimensions: {
      x: ARK_CONSTANTS.LENGTH,
      y: ARK_CONSTANTS.HEIGHT,
      z: ARK_CONSTANTS.WIDTH,
    },
    centerOfMass: {
      x: 0,
      y: ARK_CONSTANTS.HEIGHT * ARK_CONSTANTS.CENTER_OF_MASS_HEIGHT_FRACTION,
      z: 0,
    },
    dragCoefficient: ARK_CONSTANTS.DRAG_COEFFICIENT,
  };
}
