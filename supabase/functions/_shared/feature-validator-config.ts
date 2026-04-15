// Configuration for feature-validator.ts

export const ENGINE_CAPABILITIES = {
  // Rendering
  render_2d: true,
  render_3d: false,
  
  // Physics
  physics_arcade: true,
  physics_realistic: false,
  
  // Game Systems
  vehicle_system: true,
  weapon_system: true,
  ai_basic: true,
  ai_advanced: false,
  particle_system: true,
  animation_system: true,
  
  // Audio
  audio_system: false,
  audio_music: false,
  audio_sfx: false,
  
  // Multiplayer
  multiplayer: false,
  online_multiplayer: false,
  local_multiplayer: false,
  
  // Advanced Features
  save_system: true,
  dialogue_system: true,
  inventory_system: true,
  procedural_generation: false,
  
  // UI
  ui_system: true,
  hud_system: true,
  menu_system: true,
  
  // Camera
  camera_topdown: true,
  camera_sideview: true,
  camera_isometric: false,
  camera_3d: false,
} as const;

export type EngineCapability = keyof typeof ENGINE_CAPABILITIES;

export const FEATURE_TO_CAPABILITY_MAP: Record<string, EngineCapability[]> = {
  // Audio features
  "audio": ["audio_system", "audio_music", "audio_sfx"],
  "som": ["audio_system", "audio_music", "audio_sfx"],
  "áudio": ["audio_system", "audio_music", "audio_sfx"],
  "sound": ["audio_system", "audio_music", "audio_sfx"],
  "música": ["audio_music"],
  "musica": ["audio_music"],
  "music": ["audio_music"],
  "efeitos sonoros": ["audio_sfx"],
  "sound effects": ["audio_sfx"],
  "sfx": ["audio_sfx"],
  
  // Multiplayer features
  "multiplayer": ["multiplayer", "online_multiplayer"],
  "multijogador": ["multiplayer", "online_multiplayer"],
  "online": ["online_multiplayer"],
  "local": ["local_multiplayer"],
  "2 jogadores": ["local_multiplayer"],
  "dois jogadores": ["local_multiplayer"],
  "two players": ["local_multiplayer"],
  "players": ["multiplayer"],
  "jogadores": ["multiplayer"],
  
  // Procedural generation
  "procedural": ["procedural_generation"],
  "geração procedural": ["procedural_generation"],
  "procedural generation": ["procedural_generation"],
  "gerado proceduralmente": ["procedural_generation"],
  
  // 3D features
  "3d": ["render_3d", "camera_3d"],
  "3-d": ["render_3d", "camera_3d"],
  "three dimensional": ["render_3d", "camera_3d"],
  "tridimensional": ["render_3d", "camera_3d"],
  
  // Isometric features
  "isométrico": ["camera_isometric"],
  "isometrico": ["camera_isometric"],
  "isometric": ["camera_isometric"],
  
  // Advanced physics
  "física realista": ["physics_realistic"],
  "realistic physics": ["physics_realistic"],
  "física avançada": ["physics_realistic"],
  
  // Advanced AI
  "ia avançada": ["ai_advanced"],
  "advanced ai": ["ai_advanced"],
  "inteligência artificial avançada": ["ai_advanced"],
} as const;

export const FEATURE_ALTERNATIVES: Record<string, string> = {
  "audio": "Jogo será criado sem áudio. Você pode adicionar sons manualmente depois.",
  "som": "Jogo será criado sem áudio. Você pode adicionar sons manualmente depois.",
  "áudio": "Jogo será criado sem áudio. Você pode adicionar sons manualmente depois.",
  "sound": "Jogo será criado sem áudio. Você pode adicionar sons manualmente depois.",
  "música": "Jogo será criado sem música. Você pode adicionar trilha sonora manualmente depois.",
  "musica": "Jogo será criado sem música. Você pode adicionar trilha sonora manualmente depois.",
  "music": "Jogo será criado sem música. Você pode adicionar trilha sonora manualmente depois.",
  "multiplayer": "Jogo será criado no modo single-player.",
  "multijogador": "Jogo será criado no modo single-player.",
  "online": "Jogo será criado no modo single-player offline.",
  "local": "Jogo será criado no modo single-player.",
  "3d": "Jogo será criado em 2D top-down.",
  "isométrico": "Jogo será criado em 2D top-down.",
  "isometrico": "Jogo será criado em 2D top-down.",
  "isometric": "Jogo será criado em 2D top-down.",
  "procedural": "Níveis serão criados manualmente (não procedurais).",
  "geração procedural": "Níveis serão criados manualmente (não procedurais).",
  "procedural generation": "Níveis serão criados manualmente (não procedurais).",
  "física realista": "Jogo usará física arcade simplificada.",
  "realistic physics": "Jogo usará física arcade simplificada.",
  "ia avançada": "Jogo usará IA básica para comportamento de inimigos.",
  "advanced ai": "Jogo usará IA básica para comportamento de inimigos.",
};

// Helper functions
export function getCapabilityStatus(capability: EngineCapability): boolean {
  return ENGINE_CAPABILITIES[capability];
}

export function getFeatureAlternative(feature: string): string | undefined {
  const normalized = normalizeFeatureNameForConfig(feature);
  return FEATURE_ALTERNATIVES[normalized];
}

export function normalizeFeatureNameForConfig(feature: string): string {
  return feature.toLowerCase().trim();
}

export function getAllFeatures(): string[] {
  return Object.keys(FEATURE_TO_CAPABILITY_MAP);
}

export function getCapabilitiesForFeature(feature: string): EngineCapability[] {
  const normalized = normalizeFeatureNameForConfig(feature);
  return FEATURE_TO_CAPABILITY_MAP[normalized] || [];
}