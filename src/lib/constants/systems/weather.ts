/**
 * Constantes de Clima e Atmosfera - Engine SSOT
 * 
 * Sistema universal de clima baseado em:
 * - Física atmosférica real
 * - Ciclo dia/noite
 * - Condições meteorológicas
 * 
 * Usado por: Flood Test, Weather Systems, Day/Night Cycle
 */

/**
 * Tipos de clima
 */
export type WeatherType = 
  | 'clear'       // Céu limpo
  | 'cloudy'      // Nublado
  | 'overcast'    // Encoberto
  | 'rain'        // Chuva
  | 'storm'       // Tempestade
  | 'snow'        // Neve
  | 'fog'         // Névoa
  | 'sandstorm';  // Tempestade de areia

/**
 * Intensidade do clima
 */
export type WeatherIntensity = 'light' | 'moderate' | 'heavy' | 'extreme';

/**
 * Período do dia
 */
export type DayPeriod = 'night' | 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk';

/**
 * Configuração de clima
 */
export interface WeatherConfig {
  /** Tipo de clima */
  type: WeatherType;
  /** Intensidade */
  intensity: WeatherIntensity;
  /** Hora do dia (0-24) */
  timeOfDay: number;
  /** Velocidade do vento (m/s) */
  windSpeed: number;
  /** Direção do vento (graus, 0=norte) */
  windDirection: number;
  /** Temperatura (°C) */
  temperature: number;
  /** Umidade (0-1) */
  humidity: number;
  /** Visibilidade (metros) */
  visibility: number;
}

/**
 * Presets de clima
 */
export const WEATHER_PRESETS: Record<WeatherType, Record<WeatherIntensity, Partial<WeatherConfig>>> = {
  clear: {
    light: {
      windSpeed: 2,
      visibility: 10000,
      humidity: 0.4,
    },
    moderate: {
      windSpeed: 5,
      visibility: 10000,
      humidity: 0.5,
    },
    heavy: {
      windSpeed: 8,
      visibility: 10000,
      humidity: 0.6,
    },
    extreme: {
      windSpeed: 12,
      visibility: 10000,
      humidity: 0.7,
    },
  },
  cloudy: {
    light: {
      windSpeed: 3,
      visibility: 8000,
      humidity: 0.6,
    },
    moderate: {
      windSpeed: 6,
      visibility: 6000,
      humidity: 0.7,
    },
    heavy: {
      windSpeed: 10,
      visibility: 4000,
      humidity: 0.8,
    },
    extreme: {
      windSpeed: 15,
      visibility: 2000,
      humidity: 0.9,
    },
  },
  overcast: {
    light: {
      windSpeed: 4,
      visibility: 5000,
      humidity: 0.7,
    },
    moderate: {
      windSpeed: 8,
      visibility: 3000,
      humidity: 0.8,
    },
    heavy: {
      windSpeed: 12,
      visibility: 1500,
      humidity: 0.9,
    },
    extreme: {
      windSpeed: 18,
      visibility: 800,
      humidity: 0.95,
    },
  },
  rain: {
    light: {
      windSpeed: 5,
      visibility: 3000,
      humidity: 0.85,
    },
    moderate: {
      windSpeed: 10,
      visibility: 1500,
      humidity: 0.9,
    },
    heavy: {
      windSpeed: 15,
      visibility: 800,
      humidity: 0.95,
    },
    extreme: {
      windSpeed: 25,
      visibility: 400,
      humidity: 0.98,
    },
  },
  storm: {
    light: {
      windSpeed: 15,
      visibility: 1000,
      humidity: 0.9,
    },
    moderate: {
      windSpeed: 20,
      visibility: 600,
      humidity: 0.95,
    },
    heavy: {
      windSpeed: 30,
      visibility: 300,
      humidity: 0.98,
    },
    extreme: {
      windSpeed: 40,
      visibility: 150,
      humidity: 0.99,
    },
  },
  snow: {
    light: {
      windSpeed: 3,
      visibility: 2000,
      humidity: 0.8,
      temperature: -2,
    },
    moderate: {
      windSpeed: 8,
      visibility: 1000,
      humidity: 0.85,
      temperature: -5,
    },
    heavy: {
      windSpeed: 15,
      visibility: 500,
      humidity: 0.9,
      temperature: -10,
    },
    extreme: {
      windSpeed: 25,
      visibility: 200,
      humidity: 0.95,
      temperature: -15,
    },
  },
  fog: {
    light: {
      windSpeed: 1,
      visibility: 500,
      humidity: 0.95,
    },
    moderate: {
      windSpeed: 2,
      visibility: 200,
      humidity: 0.97,
    },
    heavy: {
      windSpeed: 3,
      visibility: 100,
      humidity: 0.98,
    },
    extreme: {
      windSpeed: 5,
      visibility: 50,
      humidity: 0.99,
    },
  },
  sandstorm: {
    light: {
      windSpeed: 10,
      visibility: 1000,
      humidity: 0.1,
      temperature: 35,
    },
    moderate: {
      windSpeed: 20,
      visibility: 500,
      humidity: 0.05,
      temperature: 40,
    },
    heavy: {
      windSpeed: 30,
      visibility: 200,
      humidity: 0.02,
      temperature: 45,
    },
    extreme: {
      windSpeed: 45,
      visibility: 50,
      humidity: 0.01,
      temperature: 50,
    },
  },
};

/**
 * Constantes de chuva
 */
export const RAIN_CONSTANTS = {
  /** Velocidade terminal da chuva (m/s) */
  TERMINAL_VELOCITY: {
    light: 5,      // Garoa
    moderate: 8,   // Chuva normal
    heavy: 10,     // Chuva forte
    extreme: 12,   // Chuva torrencial
  },
  /** Taxa de precipitação (mm/hora) */
  PRECIPITATION_RATE: {
    light: 2.5,    // Garoa
    moderate: 10,  // Chuva moderada
    heavy: 50,     // Chuva forte
    extreme: 100,  // Chuva torrencial
  },
  /** Contagem de partículas recomendada */
  PARTICLE_COUNT: {
    light: 5000,
    moderate: 15000,
    heavy: 30000,
    extreme: 50000,
  },
} as const;

/**
 * Constantes de iluminação por período do dia
 */
export const DAY_LIGHTING = {
  night: {
    sunElevation: -30,    // Graus abaixo do horizonte
    ambientIntensity: 0.1,
    sunIntensity: 0,
    skyColor: 0x000510,
  },
  dawn: {
    sunElevation: -5,
    ambientIntensity: 0.3,
    sunIntensity: 0.3,
    skyColor: 0xFF6B35,
  },
  morning: {
    sunElevation: 15,
    ambientIntensity: 0.6,
    sunIntensity: 0.7,
    skyColor: 0x87CEEB,
  },
  noon: {
    sunElevation: 60,
    ambientIntensity: 1.0,
    sunIntensity: 1.0,
    skyColor: 0x87CEEB,
  },
  afternoon: {
    sunElevation: 30,
    ambientIntensity: 0.8,
    sunIntensity: 0.9,
    skyColor: 0x87CEEB,
  },
  dusk: {
    sunElevation: -5,
    ambientIntensity: 0.3,
    sunIntensity: 0.3,
    skyColor: 0xFF6B35,
  },
} as const;

/**
 * Constantes atmosféricas
 */
export const ATMOSPHERE_CONSTANTS = {
  /** Turbidez (claridade do ar) */
  TURBIDITY: {
    clear: 2,
    light_haze: 5,
    moderate_haze: 10,
    heavy_haze: 15,
    polluted: 20,
  },
  /** Rayleigh scattering (dispersão atmosférica) */
  RAYLEIGH: {
    clear: 0.5,
    moderate: 1.5,
    heavy: 3.0,
  },
  /** Densidade de névoa */
  FOG_DENSITY: {
    none: 0,
    light: 0.005,
    moderate: 0.015,
    heavy: 0.03,
    extreme: 0.05,
  },
} as const;

/**
 * Constantes de iluminação AAA
 * 
 * ✨ VISUAL UPGRADE: Iluminação dramática + cores vibrantes
 * Baseado em: RDR2, The Witcher 3, Horizon Zero Dawn
 */
export const LIGHTING_CONSTANTS = {
  /** Intensidade do sol por período do dia */
  SUN_INTENSITY: {
    night: 0.1,       // Lua fraca
    dawn: 2.0,        // ✨ Nascer do sol dramático
    morning: 3.0,     // ✨ Manhã brilhante
    noon: 3.5,        // ✨ Meio-dia intenso (era 1.8)
    afternoon: 3.2,   // ✨ Tarde dourada
    dusk: 2.5,        // ✨ Pôr do sol dramático
  },
  /** Cor do sol por período do dia (hex) */
  SUN_COLOR: {
    night: 0xC0C0FF,     // Azul prateado (lua)
    dawn: 0xFFB366,      // ✨ Laranja dourado (nascer)
    morning: 0xFFF4E6,   // ✨ Amarelo claro (manhã)
    noon: 0xFFFAF0,      // Branco quente (meio-dia)
    afternoon: 0xFFE4B5, // ✨ Pêssego dourado (tarde)
    dusk: 0xFF8C42,      // ✨ Laranja intenso (pôr do sol)
  },
  /** Intensidade da luz ambiente por período */
  AMBIENT_INTENSITY: {
    night: 0.3,       // Noite escura
    dawn: 1.0,        // ✨ Amanhecer suave
    morning: 1.2,     // ✨ Manhã clara (era 0.8)
    noon: 1.5,        // ✨ Meio-dia brilhante
    afternoon: 1.3,   // ✨ Tarde clara
    dusk: 1.0,        // ✨ Entardecer suave
  },
  /** Cor da luz ambiente por período (hex) */
  AMBIENT_COLOR: {
    night: 0x4A5568,     // Cinza azulado (noite)
    dawn: 0xFFE4CC,      // ✨ Pêssego claro (amanhecer)
    morning: 0xE6F2FF,   // ✨ Azul céu claro (manhã)
    noon: 0xFFFFE0,      // Amarelo muito claro (meio-dia)
    afternoon: 0xFFE4B5, // ✨ Pêssego (tarde)
    dusk: 0xFFB380,      // ✨ Laranja suave (entardecer)
  },
  /** Cor do céu por período (hex) */
  SKY_COLOR: {
    night: 0x0A1929,     // Azul muito escuro (noite)
    dawn: 0xFF6B6B,      // ✨ Rosa avermelhado (amanhecer)
    morning: 0x4A90E2,   // ✨ Azul vibrante (manhã)
    noon: 0x87CEEB,      // Azul céu claro (meio-dia)
    afternoon: 0x6BA3D9, // ✨ Azul médio (tarde)
    dusk: 0xFF7F50,      // ✨ Coral (entardecer)
  },
  /** Cor do horizonte por período (hex) */
  HORIZON_COLOR: {
    night: 0x1A2332,     // Cinza escuro (noite)
    dawn: 0xFFB366,      // ✨ Laranja dourado (amanhecer)
    morning: 0xFFE4B5,   // ✨ Pêssego claro (manhã)
    noon: 0xFFFFE0,      // Amarelo muito claro (meio-dia)
    afternoon: 0xFFD4A3, // ✨ Pêssego médio (tarde)
    dusk: 0xFF6347,      // ✨ Tomate (entardecer)
  },
  /** Exposição do tone mapping */
  TONE_MAPPING_EXPOSURE: {
    night: 0.3,       // Escuro
    dawn: 0.6,        // ✨ Amanhecer suave
    morning: 0.7,     // ✨ Manhã clara
    noon: 0.8,        // ✨ Meio-dia brilhante (era 0.5)
    afternoon: 0.75,  // ✨ Tarde clara
    dusk: 0.65,       // ✨ Entardecer suave
  },
} as const;

/**
 * Obter período do dia baseado na hora
 * 
 * @param hour - Hora do dia (0-24)
 * @returns Período do dia
 */
export function getDayPeriod(hour: number): DayPeriod {
  const h = hour % 24;
  
  if (h >= 0 && h < 5) return 'night';
  if (h >= 5 && h < 7) return 'dawn';
  if (h >= 7 && h < 11) return 'morning';
  if (h >= 11 && h < 14) return 'noon';
  if (h >= 14 && h < 18) return 'afternoon';
  if (h >= 18 && h < 20) return 'dusk';
  return 'night';
}

/**
 * Obter emoji do período do dia
 * 
 * @param period - Período do dia
 * @returns Emoji representativo
 */
export function getDayPeriodEmoji(period: DayPeriod): string {
  const emojis: Record<DayPeriod, string> = {
    night: '🌙',
    dawn: '🌅',
    morning: '🌄',
    noon: '☀️',
    afternoon: '☀️',
    dusk: '🌇',
  };
  return emojis[period];
}

/**
 * Obter nome legível do período do dia
 * 
 * @param period - Período do dia
 * @returns Nome legível
 */
export function getDayPeriodName(period: DayPeriod): string {
  const names: Record<DayPeriod, string> = {
    night: 'Noite',
    dawn: 'Amanhecer',
    morning: 'Manhã',
    noon: 'Meio-dia',
    afternoon: 'Tarde',
    dusk: 'Entardecer',
  };
  return names[period];
}

/**
 * Criar configuração de clima a partir de preset
 * 
 * @param type - Tipo de clima
 * @param intensity - Intensidade
 * @param timeOfDay - Hora do dia (0-24)
 * @returns Configuração completa de clima
 */
export function createWeatherConfig(
  type: WeatherType,
  intensity: WeatherIntensity,
  timeOfDay: number = 12
): WeatherConfig {
  const preset = WEATHER_PRESETS[type][intensity];
  
  return {
    type,
    intensity,
    timeOfDay,
    windSpeed: preset.windSpeed ?? 5,
    windDirection: 0,
    temperature: preset.temperature ?? 20,
    humidity: preset.humidity ?? 0.5,
    visibility: preset.visibility ?? 5000,
  };
}

/**
 * Interpolar entre duas configurações de clima
 * 
 * @param from - Configuração inicial
 * @param to - Configuração final
 * @param t - Fator de interpolação (0-1)
 * @returns Configuração interpolada
 */
export function lerpWeatherConfig(
  from: WeatherConfig,
  to: WeatherConfig,
  t: number
): WeatherConfig {
  const clampedT = Math.max(0, Math.min(1, t));
  
  return {
    type: clampedT < 0.5 ? from.type : to.type,
    intensity: clampedT < 0.5 ? from.intensity : to.intensity,
    timeOfDay: from.timeOfDay + (to.timeOfDay - from.timeOfDay) * clampedT,
    windSpeed: from.windSpeed + (to.windSpeed - from.windSpeed) * clampedT,
    windDirection: from.windDirection + (to.windDirection - from.windDirection) * clampedT,
    temperature: from.temperature + (to.temperature - from.temperature) * clampedT,
    humidity: from.humidity + (to.humidity - from.humidity) * clampedT,
    visibility: from.visibility + (to.visibility - from.visibility) * clampedT,
  };
}
