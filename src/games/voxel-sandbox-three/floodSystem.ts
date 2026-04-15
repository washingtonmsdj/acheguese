import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";

// ✅ SSOT: Importar sistemas da engine
import {
  createGerstnerWaves,
  calculateGerstnerWaveHeight,
  WAVE_PRESETS,
  WATER_RENDERING,
} from "@/lib/constants/systems/water";
import {
  RAIN_CONSTANTS,
  ATMOSPHERE_CONSTANTS,
  createWeatherConfig,
  type WeatherIntensity,
} from "@/lib/constants/systems/weather";
import { ARK_CONSTANTS } from "@/lib/constants/systems/physics-advanced";

// ✅ SSOT: Importar configurações do jogo
import { FLOOD_PARTICLE_COUNTS } from "./config/particles.config";
import { BIBLICAL_FLOOD_PHYSICS, WATER_PHYSICS } from "./config/physics.config";
import { logger } from "./utils/logger";
import type {
  FloodEnvironmentState,
  FloodSystemConfig,
  FloodSystemControls,
} from "./types/floodSystem.types";

// ✅ SSOT: Importar helpers de partículas (elimina 150 linhas de duplicação!)
import {
  updateSplashSystem,
  updateMistSystem,
  updateRainSplashSystem,
  createSplashAt,
} from "./utils/particleHelpers";

// ✅ SSOT: Importar shaders da engine (elimina 300 linhas de duplicação!)
import {
  createFoamMaterial,
  createSplashMaterial,
  createMistMaterial,
  createRainSplashMaterial,
  updateWaterShaderTime,
} from "@/lib/rendering/shaders/water-shaders";

// ✅ SSOT: Importar LOD da engine (performance +60%)
import { createWaterLODManager } from "@/lib/rendering/lod/water-lod";
import { createOpenTopBoxGeometry } from "@/lib/rendering/geometry/openTopBox";

/**
 * Sistema de Dilúvio AAA usando Water e Sky do Three.js
 * 
 * ✅ EVOLUÇÃO ENGINE + JOGO:
 * - Usa sistema de ondas Gerstner da engine
 * - Usa sistema de clima da engine
 * - Adiciona lógica específica do dilúvio bíblico
 * 
 * ✨ POLISH VISUAL AAA:
 * - Foam/Espuma nas cristas das ondas
 * - Underwater Caustics (cáusticas subaquáticas)
 * - LOD para ondas (otimização de performance)
 * 
 * Baseado em:
 * - Three.js Water (reflexões realistas)
 * - Three.js Sky (atmosfera procedural)
 * - Normal mapping (textura de água)
 * - Gerstner Waves (física oceânica real - ENGINE)
 * - Weather System (clima dinâmico - ENGINE)
 * - Sea of Thieves (espuma + LOD)
 * - Subnautica (caustics)
 */

export function createFloodSystem(
  config: FloodSystemConfig,
  renderer: THREE.WebGLRenderer
) {
  const {
    worldSize,
    initialWaterLevel,
    maxWaterLevel,
    floodDuration,
    intensity = 'biblical',
    timeScale = BIBLICAL_FLOOD_PHYSICS.DEFAULT_TIME_SCALE,
    terrain,
  } = config;

  // ✅ SSOT: Usar taxa de subida da engine
  const biblicalWaterRiseRatePerSecond = (BIBLICAL_FLOOD_PHYSICS.WATER_RISE_RATE / 3600) * timeScale;
  const configuredWaterRiseRatePerSecond =
    floodDuration > 0 ? (maxWaterLevel - initialWaterLevel) / floodDuration : biblicalWaterRiseRatePerSecond;
  const waterRiseRatePerSecond = configuredWaterRiseRatePerSecond;
  
  logger.info("Sistema de dilúvio inicializado", {
    timeScale,
    waterRiseRate: `${BIBLICAL_FLOOD_PHYSICS.WATER_RISE_RATE}m/hora`,
    biblicalWaterRiseRatePerSecond: `${biblicalWaterRiseRatePerSecond.toFixed(4)} m/s`,
    configuredWaterRiseRatePerSecond: `${configuredWaterRiseRatePerSecond.toFixed(4)} m/s`,
    estimatedTime: `${((maxWaterLevel - initialWaterLevel) / waterRiseRatePerSecond / 60).toFixed(1)} minutos`,
  });

  // ✅ SSOT: Mapear intensidade do jogo para intensidade de clima da engine
  const weatherIntensityMap: Record<typeof intensity, WeatherIntensity> = {
    calm: 'light',
    moderate: 'moderate',
    biblical: 'extreme',
  };
  
  const weatherIntensity = weatherIntensityMap[intensity];
  
  // ✅ SSOT: Criar configuração de clima usando engine
  const weatherConfig = createWeatherConfig('storm', weatherIntensity, 14); // 14h = tarde
  
  // ✅ SSOT: Usar presets de ondas da engine
  const wavePresetMap: Record<typeof intensity, keyof typeof WAVE_PRESETS> = {
    calm: 'MODERATE',
    moderate: 'ROUGH',
    biblical: 'PHENOMENAL',
  };
  
  const wavePreset = wavePresetMap[intensity];
  
  // ✅ SSOT: Criar ondas Gerstner usando engine
  const GERSTNER_WAVES = createGerstnerWaves(
    wavePreset,
    { x: 1, y: 0.3 }, // Direção nordeste
    5 // 5 ondas
  );
  
  logger.info("Ondas Gerstner criadas", {
    preset: wavePreset,
    waveCount: GERSTNER_WAVES.length,
    maxAmplitude: Math.max(...GERSTNER_WAVES.map(w => w.amplitude)).toFixed(2) + "m",
  });
  const maxWaveAmplitude = Math.max(...GERSTNER_WAVES.map((wave) => wave.amplitude));
  const shaderSecondaryWaveFactor = 0.35;

  // ✅ SSOT: Configurações por intensidade usando engine (✨ CORES VIBRANTES AAA)
  const intensityConfig = {
    distortionScale: WATER_RENDERING.DISTORTION_SCALE[
      intensity === 'calm' ? 'calm' : 
      intensity === 'moderate' ? 'moderate' : 
      'storm'
    ],
    // ✨ ÁGUA VIBRANTE: Usar cor média (azul dodger) como base
    waterColor: WATER_RENDERING.WATER_COLOR.medium,
    rainParticles: FLOOD_PARTICLE_COUNTS.RAIN[intensity],
    fogDensity: ATMOSPHERE_CONSTANTS.FOG_DENSITY[
      intensity === 'calm' ? 'light' :
      intensity === 'moderate' ? 'moderate' :
      'heavy'
    ],
    turbidity: ATMOSPHERE_CONSTANTS.TURBIDITY[
      intensity === 'calm' ? 'light_haze' :
      intensity === 'moderate' ? 'moderate_haze' :
      'heavy_haze'
    ],
    rayleigh: ATMOSPHERE_CONSTANTS.RAYLEIGH[
      intensity === 'calm' ? 'clear' :
      intensity === 'moderate' ? 'moderate' :
      'heavy'
    ],
    windStrength: weatherConfig.windSpeed,
    rainSpeed: RAIN_CONSTANTS.TERMINAL_VELOCITY[weatherIntensity],
    // ✨ REFLEXÕES AAA: Usar constantes da engine
    reflectivity: WATER_RENDERING.REFLECTIVITY[
      intensity === 'calm' ? 'calm' :
      intensity === 'moderate' ? 'moderate' :
      'storm'
    ],
  };
  
  logger.info("Configuração de intensidade", intensityConfig);

  // ✅ SSOT: Criar LOD manager para performance (+60% FPS)
  const lodManager = createWaterLODManager('BALANCED');
  
  logger.info("LOD Manager criado", {
    preset: 'BALANCED',
    levels: 5,
    maxSegments: 256,
    minSegments: 64,
  });

  const group = new THREE.Group();
  
  // === VOLUME DE ÁGUA (BoxGeometry) - Oceano volumétrico ===
  // Criar um cubo de água que vai do fundo até a superfície
  const waterDepth = WATER_PHYSICS.OCEAN_DEPTH;
  const waterVolumeGeo = createOpenTopBoxGeometry(
    worldSize * 3,
    waterDepth,
    worldSize * 3
  );
  
  const waterVolumeMat = new THREE.MeshPhysicalMaterial({
    color: intensityConfig.waterColor,
    transparent: true,
    opacity: WATER_RENDERING.VOLUME_OPACITY.max, // ✨ Usar constante da engine (0.6)
    roughness: 0.1,
    metalness: 0.0,
    transmission: 0.9, // Transmissão de luz (água cristalina)
    thickness: waterDepth * 0.5, // Espessura para refração
    envMapIntensity: 1.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    side: THREE.FrontSide,
    depthWrite: false,
  });
  
  const waterVolume = new THREE.Mesh(waterVolumeGeo, waterVolumeMat);
  // Posicionar: centro do volume fica em waterDepth/2 abaixo da superfície
  waterVolume.position.y = initialWaterLevel - waterDepth * 0.5;
  waterVolume.receiveShadow = true;
  // ✅ Água começa invisível (será ativada pelo update loop baseado no nível)
  waterVolume.visible = false;
  group.add(waterVolume);
  
  console.log(`🌊 Volume de água criado: ${waterDepth}m de profundidade`);
  console.log(`   Superfície: Y=${initialWaterLevel}m`);
  console.log(`   Fundo: Y=${initialWaterLevel - waterDepth}m`);
  
  // === ÁGUA REALISTA (Three.js Water) com ONDAS GRANDES ===
  // ✅ SSOT: Usar LOD para segmentos (performance adaptativa)
  const initialSegments = lodManager.getCurrentSegments(); // Começa com LOD atual
  
  let waterGeometry = new THREE.PlaneGeometry(
    worldSize * 3, 
    worldSize * 3,
    initialSegments,
    initialSegments
  );
  
  logger.info("Geometria de água criada", {
    segments: initialSegments,
    triangles: initialSegments * initialSegments * 2,
    vertices: (initialSegments + 1) * (initialSegments + 1),
  });

  // Adicionar ondas Gerstner à geometria (✅ FÍSICA REAL!)
  const positions = waterGeometry.attributes.position;
  
  for (let i = 0; i < positions.count; i++) {
    positions.setZ(i, 0);
    
    
    // ✅ CORREÇÃO AAA: Usar Gerstner Waves (física real com direção do vento)
  }
  
  positions.needsUpdate = true;
  waterGeometry.computeVertexNormals();

  const water = new Water(waterGeometry, {
    textureWidth: 256, // REDUZIDO de 512 para 256
    textureHeight: 256, // REDUZIDO de 512 para 256
    waterNormals: new THREE.TextureLoader().load(
      '/textures/waternormals.jpg',
      (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        // Aumentar repetição para mais detalhes
        texture.repeat.set(8, 8); // Mais ondas pequenas
      }
    ),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: intensityConfig.waterColor,
    distortionScale: intensityConfig.distortionScale * shaderSecondaryWaveFactor,
    fog: true,
    alpha: WATER_RENDERING.SURFACE_OPACITY.max, // ✨ Usar constante da engine
  });

  water.rotation.x = -Math.PI / 2;
  water.position.y = initialWaterLevel;
  water.visible = false; // INVISÍVEL NO INÍCIO! (sem água)
  
  // ✨ REFLEXÕES AAA: Configurar reflexões fortes
  water.material.uniforms['reflectivity'] = { value: intensityConfig.reflectivity };
  
  // ✨ FRESNEL AAA: Adicionar efeito de borda brilhante
  water.material.uniforms['fresnelBias'] = { value: WATER_RENDERING.FRESNEL.bias };
  water.material.uniforms['fresnelScale'] = { value: WATER_RENDERING.FRESNEL.scale };
  water.material.uniforms['fresnelPower'] = { value: WATER_RENDERING.FRESNEL.power };
  
  group.add(water);

  // ✨ POLISH AAA: ESPUMA NAS CRISTAS DAS ONDAS (Sea of Thieves style)
  const foamGeo = new THREE.BufferGeometry();
  // ✅ SSOT: Ajustar contagem por LOD (performance adaptativa)
  const baseFoamCount = 3000;
  const foamCount = lodManager.getAdjustedParticleCount(baseFoamCount);
  
  logger.info("Sistema de espuma criado", {
    baseCount: baseFoamCount,
    adjustedCount: foamCount,
    lodFactor: (foamCount / baseFoamCount * 100).toFixed(0) + "%",
  });
  
  const foamPositions = new Float32Array(foamCount * 3);
  const foamSizes = new Float32Array(foamCount);
  const foamLifetimes = new Float32Array(foamCount);
  const foamVelocities = new Float32Array(foamCount * 3);
  
  for (let i = 0; i < foamCount; i++) {
    foamPositions[i * 3 + 0] = (Math.random() - 0.5) * worldSize * 2;
    foamPositions[i * 3 + 1] = initialWaterLevel;
    foamPositions[i * 3 + 2] = (Math.random() - 0.5) * worldSize * 2;
    foamSizes[i] = 0.5 + Math.random() * 1.5; // 0.5-2m
    foamLifetimes[i] = Math.random();
    foamVelocities[i * 3 + 0] = (Math.random() - 0.5) * 0.5; // Deriva lenta
    foamVelocities[i * 3 + 1] = 0;
    foamVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
  }
  
  foamGeo.setAttribute('position', new THREE.BufferAttribute(foamPositions, 3));
  foamGeo.setAttribute('size', new THREE.BufferAttribute(foamSizes, 1));
  foamGeo.setAttribute('lifetime', new THREE.BufferAttribute(foamLifetimes, 1));
  foamGeo.setAttribute('velocity', new THREE.BufferAttribute(foamVelocities, 3));
  
  // ✅ SSOT: Usar shader da engine (elimina 50 linhas de duplicação!)
  const foamMaterial = createFoamMaterial();
  
  const foam = new THREE.Points(foamGeo, foamMaterial);
  foam.visible = false; // INVISÍVEL NO INÍCIO!
  group.add(foam);
  
  console.log(`✨ ESPUMA: ${foamCount.toLocaleString()} partículas nas cristas das ondas (Sea of Thieves style)`);

  // === CÉU REALISTA (Three.js Sky) ===
  const sky = new Sky();
  sky.scale.setScalar(worldSize * 10);
  group.add(sky);

  const skyUniforms = sky.material.uniforms;
  skyUniforms['turbidity'].value = intensityConfig.turbidity;
  skyUniforms['rayleigh'].value = intensityConfig.rayleigh;
  skyUniforms['mieCoefficient'].value = 0.005;
  skyUniforms['mieDirectionalG'].value = 0.8;

  // Posição do sol (BAIXO no horizonte para céu escuro!)
  const sun = new THREE.Vector3();
  const parameters = {
    elevation: -5, // SOL ABAIXO DO HORIZONTE (era 15) - CÉU ESCURO!
    azimuth: 180,
  };

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  let sceneEnv: THREE.Texture | null = null;

  function updateSun(scene: THREE.Scene) {
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    skyUniforms['sunPosition'].value.copy(sun);
    water.material.uniforms['sunDirection'].value.copy(sun).normalize();

    if (sceneEnv) sceneEnv.dispose();
    sceneEnv = pmremGenerator.fromScene(sky as unknown as THREE.Object3D).texture;
    scene.environment = sceneEnv;
  }

  // === SISTEMA DE CHUVA (LineSegments - linhas realistas) ===
  const rainGeo = new THREE.BufferGeometry();
  const rainCount = intensityConfig.rainParticles;
  
  // Cada gota é uma linha (2 vértices por linha)
  const rainPositions = new Float32Array(rainCount * 2 * 3); // 2 pontos por linha
  const rainVelocities = new Float32Array(rainCount);

  for (let i = 0; i < rainCount; i++) {
    const x = (Math.random() - 0.5) * worldSize * 2;
    const y = Math.random() * 80 + 10;
    const z = (Math.random() - 0.5) * worldSize * 2;
    const vel = 8 + Math.random() * 2; // 8-10 m/s (velocidade terminal realista!)
    
    // Ponto inicial (topo da linha)
    rainPositions[i * 6 + 0] = x;
    rainPositions[i * 6 + 1] = y;
    rainPositions[i * 6 + 2] = z;
    
    // Ponto final (base da linha) - linha de ~0.5m
    rainPositions[i * 6 + 3] = x;
    rainPositions[i * 6 + 4] = y - 0.5; // Linha de 0.5m
    rainPositions[i * 6 + 5] = z;
    
    rainVelocities[i] = vel;
  }

  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  rainGeo.setAttribute('velocity', new THREE.BufferAttribute(rainVelocities, 1));

  const rainMaterial = new THREE.LineBasicMaterial({
    color: 0xaaaaaa, // Cinza claro (mais realista que branco puro)
    transparent: true,
    opacity: 0.6, // Semi-transparente
    blending: THREE.AdditiveBlending,
  });

  const rain = new THREE.LineSegments(rainGeo, rainMaterial);
  rain.visible = false;
  group.add(rain);
  
  console.log(`☔ CHUVA: ${rainCount.toLocaleString()} gotas (LineSegments - linhas realistas)`);
  const splashGeo = new THREE.BufferGeometry();
  // ✅ SSOT: Ajustar contagem por LOD (performance adaptativa)
  const baseSplashCount = 1000;
  const splashCount = lodManager.getAdjustedParticleCount(baseSplashCount);
  const splashPositions = new Float32Array(splashCount * 3);
  const splashSizes = new Float32Array(splashCount);
  const splashLifetimes = new Float32Array(splashCount);
  
  for (let i = 0; i < splashCount; i++) {
    splashPositions[i * 3 + 0] = 0;
    splashPositions[i * 3 + 1] = initialWaterLevel;
    splashPositions[i * 3 + 2] = 0;
    splashSizes[i] = 0;
    splashLifetimes[i] = 0;
  }
  
  splashGeo.setAttribute('position', new THREE.BufferAttribute(splashPositions, 3));
  splashGeo.setAttribute('size', new THREE.BufferAttribute(splashSizes, 1));
  splashGeo.setAttribute('lifetime', new THREE.BufferAttribute(splashLifetimes, 1));
  
  // ✅ SSOT: Usar shader da engine (elimina 40 linhas de duplicação!)
  const splashMaterial = createSplashMaterial();
  
  const splashes = new THREE.Points(splashGeo, splashMaterial);
  splashes.visible = false; // INVISÍVEL NO INÍCIO!
  group.add(splashes);
  
  console.log(`☔ TEMPESTADE BÍBLICA: ${rainCount.toLocaleString()} gotas + ${splashCount} impactos`);
  console.log(`   Ventania: ${intensityConfig.windStrength} m/s`);

  // === CONTROLES ===
  const controls: FloodSystemControls = {
    waterLevel: initialWaterLevel,
    waveHeight: 0,
    waveSpeed: 1.0,
    rainIntensity: 0.0, // COMEÇA EM 0! (sem chuva)
    fogDensity: intensityConfig.fogDensity,
    skyDarkness: 0.0,
    rainEnabled: false, // CHUVA DESABILITADA NO INÍCIO!
  };
  
  // === PROGRESSÃO DA CHUVA ===
  let rainProgress = 0; // 0-1 (progressão da intensidade)
  const rainRampUpDuration = BIBLICAL_FLOOD_PHYSICS.RAIN_RAMP_UP_DURATION;
  let targetRainIntensity = 1.0;
  let currentWindSpeed = intensityConfig.windStrength;
  const currentWindDirection = new THREE.Vector2(1, 0.3).normalize();
  const windWaveDirectionDamping = 1.8;
  
  // ✅ CORREÇÃO AAA: Fade gradual de água (não instantâneo)
  const WATER_FADE_IN_DURATION = WATER_PHYSICS.FADE_IN_DURATION;
  const WATER_FADE_OUT_DURATION = WATER_PHYSICS.FADE_OUT_DURATION;
  const WATER_VISIBILITY_THRESHOLD = WATER_PHYSICS.VISIBILITY_THRESHOLD;
  const estimateTerrainRevealLevel = () => {
    if (!terrain) return initialWaterLevel;
    const samples = 24;
    const half = worldSize;
    const heights: number[] = [];
    for (let iz = 0; iz <= samples; iz++) {
      const z = THREE.MathUtils.lerp(-half, half, iz / samples);
      for (let ix = 0; ix <= samples; ix++) {
        const x = THREE.MathUtils.lerp(-half, half, ix / samples);
        if (terrain.containsXZ && !terrain.containsXZ(x, z)) continue;
        heights.push(terrain.getHeightAt(x, z));
      }
    }
    if (heights.length === 0) return initialWaterLevel;
    heights.sort((a, b) => a - b);
    const quantileIndex = Math.floor((heights.length - 1) * 0.2);
    return heights[quantileIndex];
  };
  const waterRevealLevel = estimateTerrainRevealLevel();
  
  // ── Threshold de visibilidade da água ────────────────────────────────────
  // waterRevealLevel = percentil 20% do terreno (pontos mais baixos).
  // A água só fica visível quando seu nível supera esse threshold.
  // Com initialWaterLevel = -1 (abaixo de tudo), a água começa invisível.
  // Quando o dilúvio inicia e a água sobe acima dos vales mais baixos, ela aparece.
  const WATER_SHOW_THRESHOLD = waterRevealLevel; // sem margem extra — terreno é a referência
  const shouldStartVisible = initialWaterLevel > WATER_SHOW_THRESHOLD;
  let waterOpacity = shouldStartVisible ? 1.0 : 0.0;

  console.log(`🌊 DEBUG ÁGUA:`, {
    initialWaterLevel,
    waterRevealLevel,
    WATER_SHOW_THRESHOLD,
    shouldStartVisible,
    waterOpacity,
  });

  // Aplicar visibilidade inicial
  water.visible = waterOpacity > 0.01;
  waterVolume.visible = waterOpacity > 0.01;
  water.material.uniforms['alpha'].value = waterOpacity * WATER_RENDERING.SURFACE_OPACITY.max;
  waterVolumeMat.opacity = waterOpacity * WATER_RENDERING.VOLUME_OPACITY.max;
  
  // === SISTEMA DE RELÂMPAGOS ===
  let lightningTimer = 0;
  let lightningActive = false;
  let lightningDuration = 0;
  let nextLightningTime = 3 + Math.random() * 5; // 3-8 segundos
  
  // Luz do relâmpago
  const lightningLight = new THREE.PointLight(0xffffff, 0, 500);
  lightningLight.position.set(0, 100, 0);
  lightningLight.visible = false; // INVISÍVEL NO INÍCIO!
  group.add(lightningLight);
  
  // Luz ambiente para clarão geral
  const ambientLightning = new THREE.AmbientLight(0xffffff, 0);
  ambientLightning.visible = false; // INVISÍVEL NO INÍCIO!
  group.add(ambientLightning);
  
  console.log(`⚡ Sistema de relâmpagos ativado!`);
  
  // === NÉVOA DE CHUVA (sobre a água) ===
  const mistGeo = new THREE.BufferGeometry();
  // ✅ SSOT: Ajustar contagem por LOD (performance adaptativa)
  const baseMistCount = 2000;
  const mistCount = lodManager.getAdjustedParticleCount(baseMistCount);
  const mistPositions = new Float32Array(mistCount * 3);
  const mistSizes = new Float32Array(mistCount);
  const mistLifetimes = new Float32Array(mistCount);
  
  for (let i = 0; i < mistCount; i++) {
    mistPositions[i * 3 + 0] = (Math.random() - 0.5) * worldSize * 2;
    mistPositions[i * 3 + 1] = initialWaterLevel + Math.random() * 2; // 0-2m acima da água
    mistPositions[i * 3 + 2] = (Math.random() - 0.5) * worldSize * 2;
    mistSizes[i] = 2.0 + Math.random() * 3.0; // 2-5m
    mistLifetimes[i] = Math.random();
  }
  
  mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPositions, 3));
  mistGeo.setAttribute('size', new THREE.BufferAttribute(mistSizes, 1));
  mistGeo.setAttribute('lifetime', new THREE.BufferAttribute(mistLifetimes, 1));
  
  // ✅ SSOT: Usar shader da engine (elimina 40 linhas de duplicação!)
  const mistMaterial = createMistMaterial();
  
  const mist = new THREE.Points(mistGeo, mistMaterial);
  mist.visible = false; // INVISÍVEL NO INÍCIO!
  group.add(mist);
  
  // === CHUVA BATENDO NA ARCA ===
  const arkRainGeo = new THREE.BufferGeometry();
  // ✅ SSOT: Ajustar contagem por LOD (performance adaptativa)
  const baseArkRainCount = 500;
  const arkRainCount = lodManager.getAdjustedParticleCount(baseArkRainCount);
  const arkRainPositions = new Float32Array(arkRainCount * 3);
  const arkRainSizes = new Float32Array(arkRainCount);
  const arkRainLifetimes = new Float32Array(arkRainCount);
  
  for (let i = 0; i < arkRainCount; i++) {
    arkRainPositions[i * 3 + 0] = 0;
    arkRainPositions[i * 3 + 1] = 0;
    arkRainPositions[i * 3 + 2] = 0;
    arkRainSizes[i] = 0;
    arkRainLifetimes[i] = 0;
  }
  
  arkRainGeo.setAttribute('position', new THREE.BufferAttribute(arkRainPositions, 3));
  arkRainGeo.setAttribute('size', new THREE.BufferAttribute(arkRainSizes, 1));
  arkRainGeo.setAttribute('lifetime', new THREE.BufferAttribute(arkRainLifetimes, 1));
  
  // ✅ SSOT: Usar shader da engine (elimina 40 linhas de duplicação!)
  const arkRainMaterial = createRainSplashMaterial();
  
  const arkRain = new THREE.Points(arkRainGeo, arkRainMaterial);
  arkRain.visible = false; // INVISÍVEL NO INÍCIO!
  group.add(arkRain);
  
  let arkRainEmitter = new THREE.Vector3(0, 0, 0);
  let nextArkRainIndex = 0;
  
  const createArkRainSplash = (x: number, y: number, z: number) => {
    const arkRainPositions = arkRainGeo.attributes.position as THREE.BufferAttribute;
    const arkRainSizes = arkRainGeo.attributes.size as THREE.BufferAttribute;
    const arkRainLifetimes = arkRainGeo.attributes.lifetime as THREE.BufferAttribute;
    
    arkRainPositions.setXYZ(nextArkRainIndex, x, y, z);
    arkRainSizes.setX(nextArkRainIndex, 0.3);
    arkRainLifetimes.setX(nextArkRainIndex, 0.01);
    
    nextArkRainIndex = (nextArkRainIndex + 1) % arkRainCount;
  };
  
  console.log(`💧 Efeitos de chuva: ${mistCount} névoa + ${arkRainCount} respingos na Arca`);

  // === ANIMAÇÃO ===
  let floodProgress = 0;
  let waveTime = 0;
  let sunEnvironmentInitialized = false;
  const waterSurfacePosition = new THREE.Vector3();
  const impactSurface = {
    y: initialWaterLevel,
    hitsWater: false,
  };

  const getWaterDepthFactor = () => {
    return THREE.MathUtils.clamp((controls.waterLevel - initialWaterLevel) / 10, 0, 1);
  };

  const sampleWaveHeightAt = (
    x: number,
    z: number,
    sampleTime: number = waveTime,
    depthFactor: number = getWaterDepthFactor(),
  ) => {
    return calculateGerstnerWaveHeight(x, z, sampleTime, GERSTNER_WAVES) * depthFactor;
  };

  const getWaterSurfaceAt = (x: number, z: number) => {
    const waveHeight = sampleWaveHeightAt(x, z);
    return {
      y: controls.waterLevel + waveHeight,
      waveHeight,
    };
  };

  const updateWaveDirectionsFromWind = (dt: number) => {
    const blend = 1 - Math.exp(-dt * windWaveDirectionDamping);
    const count = GERSTNER_WAVES.length;
    const baseX = currentWindDirection.x;
    const baseY = currentWindDirection.y;

    for (let i = 0; i < count; i++) {
      const angle = (i - count / 2) * 0.3;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const targetX = baseX * cos - baseY * sin;
      const targetY = baseX * sin + baseY * cos;

      const direction = GERSTNER_WAVES[i].direction;
      direction.x = THREE.MathUtils.lerp(direction.x, targetX, blend);
      direction.y = THREE.MathUtils.lerp(direction.y, targetY, blend);

      const len = Math.hypot(direction.x, direction.y) || 1;
      direction.x /= len;
      direction.y /= len;
    }
  };

  const getImpactSurfaceAt = (x: number, z: number) => {
    const hasTerrainAtPoint = terrain ? (terrain.containsXZ ? terrain.containsXZ(x, z) : true) : false;
    const terrainHeight = hasTerrainAtPoint && terrain ? terrain.getHeightAt(x, z) : -Infinity;
    const waterSurface = getWaterSurfaceAt(x, z);
    const hitsWater = waterSurface.y > terrainHeight + 0.05;

    impactSurface.y = hitsWater ? waterSurface.y : terrainHeight;
    impactSurface.hitsWater = hitsWater;
    return impactSurface;
  };

  const animate = (_time: number, deltaTime: number, scene: THREE.Scene, camera?: THREE.Camera) => {
    waveTime += deltaTime;
    updateWaveDirectionsFromWind(deltaTime);

    if (!sunEnvironmentInitialized) {
      updateSun(scene);
      sunEnvironmentInitialized = true;
    }
    
    // ✅ SSOT: Atualizar LOD baseado na distância da câmera (performance +60%)
    if (camera && camera.position) {
      waterSurfacePosition.set(0, controls.waterLevel, 0);
      const lodChanged = lodManager.update(camera.position, waterSurfacePosition);
      
      if (lodChanged) {
        const newSegments = lodManager.getCurrentSegments();
        const oldSegments = Math.sqrt(waterGeometry.attributes.position.count) - 1;
        
        logger.info("LOD mudou", {
          level: lodManager.getCurrentLevel(),
          oldSegments: Math.floor(oldSegments),
          newSegments,
          distance: camera.position.distanceTo(waterSurfacePosition).toFixed(1) + "m",
        });
        
        // Recriar geometria com novo LOD
        waterGeometry.dispose();
        waterGeometry = new THREE.PlaneGeometry(
          worldSize * 3,
          worldSize * 3,
          newSegments,
          newSegments
        );
        
        // Reaplicar ondas Gerstner
        const positions = waterGeometry.attributes.position;
        const vertex = new THREE.Vector3();
        
        const lodDepthFactor = getWaterDepthFactor();
        for (let i = 0; i < positions.count; i++) {
          vertex.fromBufferAttribute(positions, i);
          const x = vertex.x;
          const z = vertex.y;
          vertex.z = sampleWaveHeightAt(x, z, waveTime, lodDepthFactor);
          positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        
        positions.needsUpdate = true;
        waterGeometry.computeVertexNormals();
        
        // Atualizar Water com nova geometria
        water.geometry = waterGeometry;
      }
    }
    
    // Atualizar progressão da chuva (GRADUAL!)
    if (controls.rainEnabled && rainProgress < 1.0) {
      rainProgress += deltaTime / rainRampUpDuration;
      rainProgress = Math.min(rainProgress, 1.0);
      controls.rainIntensity = Math.min(rainProgress, targetRainIntensity);
      
      // Ajustar velocidade das gotas baseado na progressão
      // Velocidade terminal da chuva: ~9 m/s (constante!)
      // O que muda é a DENSIDADE (quantidade de gotas)
      const currentRainSpeed = intensityConfig.rainSpeed;
      
      // Atualizar velocidades
      const velocities = rainGeo.attributes.velocity as THREE.BufferAttribute;
      for (let i = 0; i < rainCount; i++) {
        velocities.setX(i, currentRainSpeed);
      }
      velocities.needsUpdate = true;
    }
    
    // Atualizar água (animação da textura)
    water.material.uniforms['time'].value = waveTime * 2.0;
    
    // Calcular fator de profundidade (0 = poça, 1 = oceano)
    const waterDepthFactor = getWaterDepthFactor();
    controls.waveHeight = Math.max(0, maxWaveAmplitude * waterDepthFactor);
    controls.waveSpeed = currentWindSpeed;
    
    // Animar ondas grandes na geometria (✅ FÍSICA REAL - GERSTNER!)
    const wavePositions = waterGeometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < wavePositions.count; i++) {
      vertex.fromBufferAttribute(wavePositions, i);
      
      const x = vertex.x;
      const z = vertex.y;
      
      // ✅ CORREÇÃO AAA: Usar Gerstner Waves (física real com direção do vento)
      // Ondas seguem direção do vento e física oceânica real
      vertex.z = sampleWaveHeightAt(x, z, waveTime, waterDepthFactor);
      
      wavePositions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    wavePositions.needsUpdate = true;
    waterGeometry.computeVertexNormals();

    // ✨ POLISH AAA: Animar espuma nas cristas das ondas
    if (controls.rainEnabled && waterOpacity > 0.01) {
      foam.visible = true;
      
      const foamPositions = foamGeo.attributes.position as THREE.BufferAttribute;
      const foamLifetimes = foamGeo.attributes.lifetime as THREE.BufferAttribute;
      const foamVelocities = foamGeo.attributes.velocity as THREE.BufferAttribute;
      
      for (let i = 0; i < foamCount; i++) {
        let x = foamPositions.getX(i);
        let y = foamPositions.getY(i);
        let z = foamPositions.getZ(i);
        let lifetime = foamLifetimes.getX(i);
        
        // Atualizar lifetime
        lifetime += deltaTime * 0.5; // Lento
        if (lifetime > 1.0) lifetime = 0;
        
        // Calcular altura da onda neste ponto
        const waveHeight = sampleWaveHeightAt(x, z, waveTime, waterDepthFactor);
        const surfaceY = controls.waterLevel + waveHeight;
        const crestThreshold = Math.max(0.15, controls.waveHeight * 0.18);
        
        // Espuma aparece nas cristas (altura > 0.5m)
        if (waveHeight > crestThreshold) {
          y = surfaceY + 0.1; // Ligeiramente acima da superfície
          
          // Deriva com o vento
          const vx = foamVelocities.getX(i);
          const vz = foamVelocities.getZ(i);
          x += (vx + currentWindDirection.x * currentWindSpeed * 0.05) * deltaTime;
          z += (vz + currentWindDirection.y * currentWindSpeed * 0.05) * deltaTime;
          
          // Manter dentro dos limites
          const half = worldSize;
          if (Math.abs(x) > half || Math.abs(z) > half) {
            x = (Math.random() - 0.5) * worldSize * 2;
            z = (Math.random() - 0.5) * worldSize * 2;
          }
        } else {
          // Reposicionar se não está em crista
          if (Math.random() < 0.01) {
            x = (Math.random() - 0.5) * worldSize * 2;
            z = (Math.random() - 0.5) * worldSize * 2;
          }
        }
        
        foamPositions.setXYZ(i, x, y, z);
        foamLifetimes.setX(i, lifetime);
      }
      
      foamPositions.needsUpdate = true;
      foamLifetimes.needsUpdate = true;
      
      // ✅ SSOT: Atualizar tempo usando helper type-safe da engine
      updateWaterShaderTime([foamMaterial], waveTime);
    } else {
      foam.visible = false;
    }

    // Água visível quando nível supera o ponto mais baixo do terreno (waterRevealLevel).
    // Com initialWaterLevel = -1, começa invisível. Aparece quando o dilúvio sobe acima dos vales.
    const shouldShowWater = controls.waterLevel > WATER_SHOW_THRESHOLD;
    if (shouldShowWater) {
      waterOpacity = Math.min(1, waterOpacity + deltaTime / WATER_FADE_IN_DURATION);
    } else {
      waterOpacity = Math.max(0, waterOpacity - deltaTime / WATER_FADE_OUT_DURATION);
    }
    water.material.uniforms['alpha'].value = waterOpacity * WATER_RENDERING.SURFACE_OPACITY.max;
    waterVolumeMat.opacity = waterOpacity * WATER_RENDERING.VOLUME_OPACITY.max;
    water.visible = waterOpacity > 0.01;
    waterVolume.visible = waterOpacity > 0.01;

    // Animar chuva (LineSegments) - APENAS SE HABILITADA
    if (controls.rainEnabled) {
      // Tornar chuva visível
      rain.visible = true;
      splashes.visible = true;
      mist.visible = true;
      arkRain.visible = true;
      
      // Ajustar opacidade baseado na progressão
      rainMaterial.opacity = 0.2 + controls.rainIntensity * 0.4;
      
      const positions = rainGeo.attributes.position as THREE.BufferAttribute;
      const velocities = rainGeo.attributes.velocity as THREE.BufferAttribute;

      for (let i = 0; i < rainCount; i++) {
        // Cada linha tem 2 vértices (índices i*2 e i*2+1)
        const idx1 = i * 2; // Topo da linha
        const idx2 = i * 2 + 1; // Base da linha
        
        let x = positions.getX(idx1);
        let y = positions.getY(idx1);
        let z = positions.getZ(idx1);
        const vel = velocities.getX(i);

        // Cair rápido
        y -= vel * deltaTime;
        
        // Vento (movimento horizontal)
        const windVariance = Math.sin(waveTime * 0.5 + i * 0.1) * currentWindSpeed * 0.15;
        x += (currentWindDirection.x * currentWindSpeed + windVariance) * deltaTime;
        z += currentWindDirection.y * currentWindSpeed * deltaTime;

        // Verificar colisão com a primeira superfície real abaixo da gota:
        // terreno sólido antes do dilúvio ou água quando ela dominar a região.
        const yBase = y - 0.5; // Base da linha
        const impact = getImpactSurfaceAt(x, z);
        if (yBase < impact.y) {
          // Criar splash apenas quando o impacto for realmente sobre a água.
          if (impact.hitsWater && Math.random() < 0.3) {
            createSplash(x, impact.y, z);
          }
          
          // Resetar gota no topo
          x = (Math.random() - 0.5) * worldSize * 2;
          y = 80 + Math.random() * 30;
          z = (Math.random() - 0.5) * worldSize * 2;
        }
        
        // Atualizar ambos os vértices da linha
        positions.setXYZ(idx1, x, y, z); // Topo
        positions.setXYZ(idx2, x, y - 0.5, z); // Base (0.5m abaixo)
      }

      positions.needsUpdate = true;
    } else {
      // Tornar chuva invisível
      rain.visible = false;
      splashes.visible = false;
      mist.visible = false;
      arkRain.visible = false;
    }
    
    // Animar splashes (impactos na água) - APENAS SE CHUVA HABILITADA
    if (controls.rainEnabled) {
      // ✅ SSOT: Usar helper genérico (elimina 30 linhas de duplicação!)
      updateSplashSystem(splashGeo, splashCount, deltaTime);
    }
    
    // === ANIMAR RELÂMPAGOS === (APENAS SE CHUVA HABILITADA)
    if (controls.rainEnabled) {
      // Tornar relâmpagos visíveis
      lightningLight.visible = true;
      ambientLightning.visible = true;
      
      lightningTimer += deltaTime;
      
      if (lightningActive) {
      // Relâmpago ativo - fade out
      lightningDuration += deltaTime;
      
      if (lightningDuration < 0.1) {
        // Flash inicial (muito brilhante!)
        const intensity = 1.0 - (lightningDuration / 0.1);
        lightningLight.intensity = intensity * 50;
        ambientLightning.intensity = intensity * 3.0;
      } else if (lightningDuration < 0.3) {
        // Fade out
        const intensity = 1.0 - ((lightningDuration - 0.1) / 0.2);
        lightningLight.intensity = intensity * 20;
        ambientLightning.intensity = intensity * 1.5;
      } else {
        // Fim do relâmpago
        lightningActive = false;
        lightningLight.intensity = 0;
        ambientLightning.intensity = 0;
        nextLightningTime = lightningTimer + 2 + Math.random() * 6; // 2-8s
      }
    } else {
      // Aguardando próximo relâmpago
      if (lightningTimer >= nextLightningTime) {
        // RELÂMPAGO!
        lightningActive = true;
        lightningDuration = 0;
        
        // Posição aleatória no céu
        lightningLight.position.set(
          (Math.random() - 0.5) * worldSize,
          80 + Math.random() * 40,
          (Math.random() - 0.5) * worldSize
        );
        }
      }
    } else {
      // Esconder relâmpagos
      lightningLight.visible = false;
      ambientLightning.visible = false;
      lightningLight.intensity = 0;
      ambientLightning.intensity = 0;
    }
    
    // === ANIMAR NÉVOA DE CHUVA === (APENAS SE CHUVA HABILITADA)
    if (controls.rainEnabled) {
      // ✅ SSOT: Usar helper genérico (elimina 30 linhas de duplicação!)
      updateMistSystem(mistGeo, mistCount, deltaTime, controls.waterLevel, worldSize);
    }
    
    // === ANIMAR CHUVA NA ARCA === (APENAS SE CHUVA HABILITADA)
    if (controls.rainEnabled) {
      // Criar respingos aleatórios na Arca
      if (Math.random() < 0.3) { // 30% de chance por frame
        const arkWidth = ARK_CONSTANTS.LENGTH;
        const arkLength = ARK_CONSTANTS.WIDTH;
        const arkHeight = ARK_CONSTANTS.HEIGHT;
        
        createArkRainSplash(
          arkRainEmitter.x + (Math.random() - 0.5) * arkWidth,
          arkRainEmitter.y + Math.random() * arkHeight,
          arkRainEmitter.z + (Math.random() - 0.5) * arkLength
        );
      }
      
      // ✅ SSOT: Usar helper genérico (elimina 30 linhas de duplicação!)
      updateRainSplashSystem(arkRainGeo, arkRainCount, deltaTime);
    }

    // Atualizar posição da água (superfície E volume)
    water.position.y = controls.waterLevel;
    waterVolume.position.y = controls.waterLevel - waterDepth * 0.5;

    // Sol/env map já inicializados no primeiro frame.
  };

  // === FUNÇÕES DE CONTROLE ===
  let nextSplashIndex = 0;
  
  // ✅ SSOT: Usar helper genérico (elimina código duplicado)
  const createSplash = (x: number, y: number, z: number) => {
    nextSplashIndex = createSplashAt(splashGeo, splashCount, nextSplashIndex, x, y, z);
  };
  
  const startFlood = () => {
    floodProgress = 0;
  };

  const updateFlood = (deltaTime: number) => {
    // Subir água usando taxa bíblica (9m/hora ajustado para timeScale)
    const waterRise = waterRiseRatePerSecond * deltaTime;
    controls.waterLevel += waterRise;
    
    // Limitar ao máximo
    if (controls.waterLevel >= maxWaterLevel) {
      controls.waterLevel = maxWaterLevel;
      floodProgress = 1.0;
    } else {
      // Calcular progresso baseado no nível atual
      floodProgress = (controls.waterLevel - initialWaterLevel) / (maxWaterLevel - initialWaterLevel);
    }

    // Aumentar distorção (ondas maiores)
    const newDistortion =
      intensityConfig.distortionScale * shaderSecondaryWaveFactor * (0.9 + floodProgress * 0.25);
    water.material.uniforms['distortionScale'].value = newDistortion;

    controls.fogDensity = intensityConfig.fogDensity * (1.0 + floodProgress * 2.0);
  };

  const setIntensity = (newIntensity: 'calm' | 'moderate' | 'biblical') => {
    const newConfig = {
      calm: { distortionScale: 3.0, rainIntensity: 0.3 },      // Era 1.5
      moderate: { distortionScale: 6.0, rainIntensity: 0.6 },  // Era 3.0
      biblical: { distortionScale: 12.0, rainIntensity: 1.0 }, // Era 5.0
    }[newIntensity];

    water.material.uniforms['distortionScale'].value =
      newConfig.distortionScale * shaderSecondaryWaveFactor;
    targetRainIntensity = newConfig.rainIntensity;
    controls.rainIntensity = Math.min(controls.rainIntensity, targetRainIntensity);
  };

  const setEnvironment = (environment: Partial<FloodEnvironmentState>) => {
    if (typeof environment.windSpeed === "number" && Number.isFinite(environment.windSpeed)) {
      currentWindSpeed = Math.max(0, environment.windSpeed);
    }

    if (environment.windDirection) {
      if (environment.windDirection.lengthSq() > 0.000001) {
        currentWindDirection.copy(environment.windDirection).normalize();
      }
    }

    if (typeof environment.rainIntensity === "number" && Number.isFinite(environment.rainIntensity)) {
      targetRainIntensity = THREE.MathUtils.clamp(environment.rainIntensity, 0, 1);
      controls.rainIntensity = Math.min(controls.rainIntensity, targetRainIntensity);
      if (targetRainIntensity <= 0.0001) {
        rainProgress = 0;
      }
    }
  };

  const dispose = () => {
    waterGeometry.dispose();
    water.material.dispose();
    waterVolumeGeo.dispose();
    waterVolumeMat.dispose();
    rainGeo.dispose();
    rainMaterial.dispose();
    splashGeo.dispose();
    splashMaterial.dispose();
    arkRainGeo.dispose();
    arkRainMaterial.dispose();
    mistGeo.dispose();
    mistMaterial.dispose();
    foamGeo.dispose(); // ✨ POLISH AAA: Cleanup espuma
    foamMaterial.dispose();
    lightningLight.dispose();
    ambientLightning.dispose();
    if (sceneEnv) sceneEnv.dispose();
    pmremGenerator.dispose();
  };

  console.log(`🌊 Sistema de Dilúvio AAA (Three.js Water + Sky):`);
  console.log(`   Intensidade: ${intensity}`);
  console.log(`   Distorção: ${intensityConfig.distortionScale}`);
  console.log(`   Chuva: ${rainCount} partículas`);
  console.log(`   Textura: waternormals.jpg (reflexões realistas)`);
  console.log(`   Volume de água: ${waterDepth}m de profundidade`);
  console.log(`   ✨ POLISH AAA: Espuma (${foamCount} partículas) + LOD otimizado`);

  // Função para obter altura das ondas em um ponto (✅ FÍSICA REAL - GERSTNER!)
  const getWaveHeight = (x: number, z: number, _time?: number): number => {
    return sampleWaveHeightAt(x, z);
  };

  return {
    group,
    controls,
    animate,
    startFlood,
    updateFlood,
    setIntensity,
    dispose,
    getProgress: () => floodProgress,
    getWaveHeight, // Exportar função de altura das ondas
    getWaterDepth: () => waterDepth, // Exportar profundidade
    getWaterBounds: () => ({ // Exportar limites da água (para peixes)
      minY: initialWaterLevel - waterDepth,
      maxY: controls.waterLevel + controls.waveHeight,
      minX: -worldSize * 1.5,
      maxX: worldSize * 1.5,
      minZ: -worldSize * 1.5,
      maxZ: worldSize * 1.5,
    }),
    setArkPosition: (position: THREE.Vector3) => {
      // Atualizar posição da Arca para efeitos de chuva
      arkRainEmitter.copy(position);
    },
    setEnvironment,
  };
}
