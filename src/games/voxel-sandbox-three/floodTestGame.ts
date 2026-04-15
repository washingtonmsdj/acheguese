import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import type { OrdaxThreeContext, OrdaxThreeGame } from "@/lib/ordax/runtime3d/types";
import { PhysicsWorld } from "@/lib/ordax/physics/PhysicsWorld";
import { OrdaxFpsInput } from "@/lib/ordax/input/OrdaxFpsInput";
import { createHeightfieldTerrainQuery, createSolidHeightfieldGeometry } from "@/lib/ordax/terrain";
import { SPAWNER_DEFAULTS } from "@/lib/ordax/config";

import { createFloodSystem } from "./floodSystem";
import { ArkPhysics } from "./ArkPhysics_NEW";
import { WaterSystem } from "@/lib/ordax/water/WaterSystem";
import { FloodDebugOverlay } from "./utils/floodDebugOverlay";
import { calculateWaterRiseRate } from "./config/physics.config";
import { FishSystem } from "./fishSystem";
import { DynamicWeatherSystem } from "./dynamicWeatherSystem";
import { ARK_DEBUG_OPTIONS } from "./config/ark.config";
import { BoatSpawnService } from "./services/BoatSpawnService";
// ✅ TURBO UPGRADES: Novos sistemas AAA
import { VolumetricCloudsSystem } from "./volumetricClouds";
import { ImmersiveAudioSystem } from "./immersiveAudio";

// ✅ SSOT: Importar tipos centralizados
import type { FloodIntensity, FloodPhase, FloodHud, FloodSystem } from "./types/floodSystem.types";
import { ARK_CONSTANTS, TUNING_LIMITS } from "@/lib/constants/systems/physics-advanced";
import { TERRAIN_PHYSICS, TERRAIN_DEFORMATION, CAMERA_PHYSICS } from "./config/physics.config";
// ✅ CORREÇÃO SSOT: Importar configs de rendering
import { CAMERA_CONFIG, TERRAIN_RENDERING, GRASS_CONFIG } from "./config/rendering.config";
// ✅ CORREÇÃO SSOT: Importar configs de UI
import { UI_LABEL_DEFAULTS } from "./config/ui.config";
// ✅ CORREÇÃO SSOT: Importar configs de performance
import { UPDATE_INTERVALS } from "./config/performance.config";
import { BillboardManager } from "./utils/billboardHelpers";
import { createLabelMesh } from "./utils/labelHelpers";
import { loadTextureWithValidation, configureTerrainTexture } from "./utils/textureHelpers";
import { logger } from "./utils/logger";

export class FloodTestGame implements OrdaxThreeGame {
  private ctx!: OrdaxThreeContext;
  private controls!: OrbitControls;
  private fps: OrdaxFpsInput | null = null;
  private cameraMode: "orbit" | "fps" = "orbit";

  // ✅ CORREÇÃO: Tipo explícito (não any)
  private grassAAA: {
    mesh: THREE.Object3D;
    animate: (time: number) => void;
    setInteractionPoints: (points: Array<{ x: number; z: number; radius: number; strength: number }>) => void;
    dispose: () => void;
  } | null = null;
  // ✅ CORREÇÃO: Tipo explícito extraído
  private floodSystem: FloodSystem | null = null;
  
  // ✅ CORREÇÃO: Billboard manager para performance
  private billboardManager: BillboardManager;

  private physicsWorld!: PhysicsWorld;
  private ark!: ArkPhysics;
  private fishSystem!: FishSystem;
  private weatherSystem!: DynamicWeatherSystem;

  // ✅ SSOT: Sistema centralizado de água
  private waterSystem!: WaterSystem;
  // ✅ Debug overlay 3D (gizmos)
  private floodDebugOverlay!: FloodDebugOverlay;
  private floodDebugEnabled: boolean = false;
  
  // ✅ TURBO UPGRADES: Sistemas AAA
  private volumetricClouds!: VolumetricCloudsSystem;
  private immersiveAudio!: ImmersiveAudioSystem;
  
  // 👤 NPC de referência (2m de altura)
  private referenceNPC: THREE.Group | null = null;
  
  // 📏 Linhas de medição (mostram proporção 7:1)
  private measurementLines: THREE.Group | null = null;

  private intensity: FloodIntensity = "biblical";
  private flooding = false;
  private floodPhase: FloodPhase = "before";
  private gameTimeHours = 0;

  private readonly terrainProfile = createHeightfieldTerrainQuery({
    seed: TERRAIN_PHYSICS.SEED,
    size: TERRAIN_PHYSICS.WORLD_SIZE,
    minHeight: TERRAIN_PHYSICS.MIN_HEIGHT,
    maxHeight: TERRAIN_PHYSICS.MAX_HEIGHT,
    seaLevel: TERRAIN_PHYSICS.SEA_LEVEL,
    bottomY: TERRAIN_PHYSICS.BOTTOM_Y,
    deformation: {
      enabled: TERRAIN_DEFORMATION.ENABLED,
      resolution: TERRAIN_DEFORMATION.RESOLUTION,
      maxDepth: TERRAIN_DEFORMATION.MAX_DEPTH,
      recoveryRate: TERRAIN_DEFORMATION.RECOVERY_RATE,
    },
  });
  private readonly terrainSize = this.terrainProfile.size;
  private texSand!: THREE.Texture;
  private texMud!: THREE.Texture;
  private texClay!: THREE.Texture;

  private terrain: THREE.Mesh | null = null;
  private terrainGeometry: THREE.BufferGeometry | null = null;
  private terrainTopVertexCount = 0;
  private terrainSegments = 0;
  private terrainVisualVersion = -1;
  private terrainVisualSyncAccumulator = 0;

  // Removidas (agora gerenciadas pelo weatherSystem)
  // private ambient!: THREE.AmbientLight;
  // private dir!: THREE.DirectionalLight;

  // 0..1 (0=mais solto/cinemático, 1=mais estável)
  private stability = 0.5;

  constructor(private opts: { onHud: (hud: FloodHud) => void }) {
    // ✅ CORREÇÃO SSOT: Usar constante de performance
    this.billboardManager = new BillboardManager(UPDATE_INTERVALS.BILLBOARD);
    
    logger.info("FloodTestGame criado");
  }

  setCameraMode(mode: "orbit" | "fps") {
    this.cameraMode = mode;
    // If init not finished yet, we'll apply on first update.
    this.applyCameraMode();
  }

  setFlooding(isFlooding: boolean) {
    this.flooding = isFlooding;
    if (isFlooding) {
      this.floodPhase = "starting";
      this.gameTimeHours = 0;
    }
  }

  setIntensity(intensity: FloodIntensity) {
    this.intensity = intensity;
    this.floodSystem?.setIntensity(intensity);
  }

  setStability(value01: number) {
    this.stability = Math.max(0, Math.min(1, value01));
    this.applyStabilityTuning();
  }

  /** Habilitar/desabilitar debug overlay 3D */
  setFloodDebug(enabled: boolean): void {
    this.floodDebugEnabled = enabled;
    this.floodDebugOverlay?.setEnabled(enabled);
  }
  
  /**
   * Definir hora do dia manualmente (0-24)
   */
  setTimeOfDay(hour: number) {
    this.weatherSystem?.setTimeOfDay(hour);
  }
  
  /**
   * Obter hora do dia atual
   */
  getTimeOfDay(): number {
    return this.weatherSystem?.getConfig().timeOfDay || 12;
  }

  async init(ctx: OrdaxThreeContext) {
    this.ctx = ctx;
    const { renderer, scene, camera } = ctx;

    // ✅ NÃO definir clearColor - o Sky vai cuidar disso
    // renderer.setClearColor(...) REMOVIDO!

    // ✅ CORREÇÃO SSOT: Usar constantes de câmera
    camera.fov = CAMERA_CONFIG.FOV;
    camera.near = CAMERA_CONFIG.NEAR;
    camera.far = CAMERA_CONFIG.FAR;
    
    // ✅ SSOT: Usar constantes da engine para câmera
    const spawnX = 80;
    const spawnZ = 80;
    const groundHeight = this.terrainProfile.getHeightAt(spawnX, spawnZ);
    const eyeHeight = CAMERA_PHYSICS.EYE_HEIGHT;
    camera.position.set(spawnX, groundHeight + eyeHeight, spawnZ);
    
    camera.updateProjectionMatrix();

    this.controls = new OrbitControls(camera, renderer.domElement);
    // ✅ CORREÇÃO SSOT: Usar constantes de damping
    this.controls.enableDamping = CAMERA_CONFIG.DAMPING.enabled;
    this.controls.dampingFactor = CAMERA_CONFIG.DAMPING.factor;
    this.controls.maxPolarAngle = CAMERA_CONFIG.MAX_POLAR_ANGLE;

    // apply requested camera mode (default orbit)
    this.applyCameraMode();

    // ✅ Sistema de Clima Dinâmico (substitui iluminação manual)
    this.weatherSystem = new DynamicWeatherSystem({
      scene,
      camera,
      renderer,
      initialPhase: "clear",
      autoProgress: true, // Progride automaticamente com o dilúvio
    });

    // ✅ NÃO definir fog manualmente - o weatherSystem cuida disso
    // scene.fog = ... REMOVIDO!

    // ✅ CORREÇÃO: Carregar texturas com validação
    logger.info("Carregando texturas de terreno...");
    
    const texturePaths = [
      "/textures/terrain/dirt_diff_1k.jpg",
      "/textures/terrain/dry_mud_field_001_diff_1k.jpg",
      "/textures/terrain/mud_cracked_dry_03_diff_1k.jpg",
    ];
    
    const [sandResult, mudResult, clayResult] = await Promise.all(
      texturePaths.map(path => loadTextureWithValidation(path))
    );
    
    // Validar resultados
    if (!sandResult.texture || !mudResult.texture || !clayResult.texture) {
      logger.error("Erro ao carregar texturas de terreno", {
        sand: sandResult.error,
        mud: mudResult.error,
        clay: clayResult.error,
      });
      throw new Error("Falha ao carregar texturas de terreno");
    }
    
    this.texSand = sandResult.texture;
    this.texMud = mudResult.texture;
    this.texClay = clayResult.texture;
    
    // Configurar texturas
    for (const t of [this.texSand, this.texMud, this.texClay]) {
      configureTerrainTexture(t, 1, 8);
    }
    
    logger.info("✅ Texturas de terreno carregadas com sucesso");

    // ✅ CORREÇÃO SSOT: Usar constante de rendering
    const segments = TERRAIN_RENDERING.SEGMENTS;
    this.terrainSegments = segments;
    const terrainGeo = new THREE.PlaneGeometry(this.terrainSize, this.terrainSize, segments, segments);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.terrainProfile.getHeightAt(x, z);
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 });
    terrainMat.onBeforeCompile = (shader) => {
      shader.uniforms.tGrass = { value: this.texSand };
      shader.uniforms.tDirt = { value: this.texMud };
      shader.uniforms.tRock = { value: this.texClay };
      // ✅ CORREÇÃO SSOT: Usar constantes de rendering
      shader.uniforms.uTexScale = { value: TERRAIN_RENDERING.TEXTURE_SCALE };
      shader.uniforms.uSeaLevel = { value: TERRAIN_RENDERING.SEA_LEVEL_VISUAL };
      shader.uniforms.uRockHeight = { value: TERRAIN_RENDERING.ROCK_HEIGHT };

      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWorldPos;\nvarying vec3 vN;")
        .replace(
          "#include <project_vertex>",
          "#include <project_vertex>\nvec4 wp = modelMatrix * vec4(transformed, 1.0);\nvWorldPos = wp.xyz;\nvN = normalize(mat3(modelMatrix) * normal);",
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform sampler2D tGrass;\nuniform sampler2D tDirt;\nuniform sampler2D tRock;\nuniform float uTexScale;\nuniform float uSeaLevel;\nuniform float uRockHeight;\nvarying vec3 vWorldPos;\nvarying vec3 vN;",
        )
        .replace(
          "#include <map_fragment>",
          `
          vec2 uvw = vWorldPos.xz * uTexScale;
          vec3 grassC = texture2D(tGrass, uvw).rgb;
          vec3 dirtC  = texture2D(tDirt,  uvw).rgb;
          vec3 rockC  = texture2D(tRock,  uvw).rgb;

          float height = vWorldPos.y;
          float slope = 1.0 - clamp(vN.y, 0.0, 1.0);

          float dirtW = smoothstep(uSeaLevel + 1.0, uSeaLevel - 0.2, height);
          // ✅ CORREÇÃO SSOT: Thresholds de slope vêm de TERRAIN_RENDERING.ROCK_SLOPE_THRESHOLD
          float rockBySlope = smoothstep(0.35, 0.75, slope);
          float rockByHeight = smoothstep(uRockHeight, uRockHeight + 4.0, height);
          float rockW = clamp(max(rockBySlope, rockByHeight), 0.0, 1.0);
          float grassW = 1.0 - clamp(dirtW + rockW, 0.0, 1.0);

          float sumW = grassW + dirtW + rockW + 1e-5;
          grassW /= sumW; dirtW /= sumW; rockW /= sumW;

          vec3 blended = grassC * grassW + dirtC * dirtW + rockC * rockW;
          diffuseColor = vec4(blended, diffuseColor.a);
          `,
        );
    };

    // Terreno SÓLIDO (fechado): topo + laterais + fundo numa única geometria.
    // Isso evita a sensação de “oco”/malha quebrada ao aproximar a câmera.
    const solidGeo = createSolidHeightfieldGeometry({
      size: this.terrainSize,
      segments,
      heightAt: this.terrainProfile.getHeightAt,
      bottomY: this.terrainProfile.bottomY,
    });

    // Material do fundo (mais escuro) como segundo material; o topo+laterais usam o shader blend.
    // ✅ CORREÇÃO SSOT: Usar constante de cor
    const baseMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(TERRAIN_RENDERING.BOTTOM_COLOR),
      roughness: 1,
      metalness: 0,
    });

    // Separa bottom vs restante por grupos (multi-material).
    // Ordem dos índices em createSolidHeightfieldGeometry:
    // 1) top, 2) bottom, 3) sides
    const topIndexCount = segments * segments * 2 * 3;
    const bottomIndexCount = segments * segments * 2 * 3;
    const sideIndexCount = segments * 4 * 2 * 3;
    solidGeo.clearGroups();
    solidGeo.addGroup(0, topIndexCount, 0);
    solidGeo.addGroup(topIndexCount, bottomIndexCount, 1);
    solidGeo.addGroup(topIndexCount + bottomIndexCount, sideIndexCount, 0);

    this.terrain = new THREE.Mesh(solidGeo, [terrainMat, baseMat]);
    this.terrainGeometry = solidGeo;
    this.terrainTopVertexCount = (segments + 1) * (segments + 1);
    this.terrainVisualVersion = this.terrainProfile.getDeformationVersion();
    this.terrain.receiveShadow = true;
    scene.add(this.terrain);

    // ✅ CORREÇÃO: Import dinâmico com error handling
    try {
      logger.info("Carregando sistema de grama...");
      const { createGrassAAA } = await import("./grassAAA");
      // ✅ CORREÇÃO SSOT: Usar constantes de grama
      this.grassAAA = createGrassAAA({
        count: GRASS_CONFIG.COUNT,
        worldSize: this.terrainSize,
        heightAt: this.terrainProfile.getHeightAt,
        seed: this.terrainProfile.seed,
        biome: GRASS_CONFIG.DEFAULT_BIOME,
      });
      scene.add(this.grassAAA.mesh);
      logger.info("✅ Sistema de grama carregado com sucesso");
    } catch (error) {
      logger.error("❌ Erro ao carregar sistema de grama (continuando sem grama)", error);
      // Graceful degradation: continuar sem grama
    }

    // ── Nível inicial da água ─────────────────────────────────────────────────
    // A água começa ABAIXO do terreno mínimo (minHeight = 0).
    // Isso garante que não há água visível antes do dilúvio.
    // Quando o dilúvio inicia, a água sobe de -1 até 20m, cobrindo o terreno progressivamente.
    const INITIAL_WATER_LEVEL = this.terrainProfile.minHeight - 1; // -1m (abaixo de tudo)
    const MAX_WATER_LEVEL = this.terrainProfile.maxHeight + 2;     // 20m (acima de tudo)

    this.floodSystem = createFloodSystem(
      {
        worldSize: this.terrainProfile.size,
        initialWaterLevel: INITIAL_WATER_LEVEL,
        maxWaterLevel: MAX_WATER_LEVEL,
        floodDuration: 60,
        intensity: this.intensity,
        timeScale: 60,
        terrain: this.terrainProfile,
      },
      renderer,
    );
    scene.add(this.floodSystem.group);
    this.floodSystem.animate(0, 0, scene);

    // ✅ SSOT: WaterSystem espelha o mesmo range
    this.waterSystem = new WaterSystem({
      initialLevel: INITIAL_WATER_LEVEL,
      maxLevel: MAX_WATER_LEVEL,
      riseRatePerSecond: calculateWaterRiseRate(60),
    });

    // ✅ Debug overlay 3D
    this.floodDebugOverlay = new FloodDebugOverlay();
    scene.add(this.floodDebugOverlay.getGroup());

    this.physicsWorld = new PhysicsWorld({ gravity: 9.8, waterDensity: SPAWNER_DEFAULTS.WATER_DENSITY, airDensity: 1.225 });
    this.physicsWorld.setTerrain(this.terrainProfile);
    this.physicsWorld.setWater({
      getWaterLevel: () => this.floodSystem!.controls.waterLevel,
      getWaveHeightAt: (x, z) => this.floodSystem!.getWaveHeight(x, z),
    });

    this.applyStabilityTuning();

    this.ark = new ArkPhysics({ showDebugGuides: ARK_DEBUG_OPTIONS.showArkMeshGuides });
    
    // ── Spawn autoritativo via BoatSpawnService ───────────────────────────────
    // 1. Encontra o vale mais baixo
    // 2. Nivela o terreno sob o footprint da arca (padrão AAA)
    // 3. Posiciona o body na altura nivelada
    const boatSpawnService = new BoatSpawnService({
      terrain: this.terrainProfile,
      worldSize: this.terrainProfile.size,
      footprint: { width: ARK_CONSTANTS.LENGTH, depth: ARK_CONSTANTS.WIDTH },
    });
    const spawnResult = boatSpawnService.spawnAtLowestPoint(this.ark.getRigidBody());

    logger.info("🚢 Arca posicionada em vale baixo (spawn autoritativo)", {
      spawnX: spawnResult.spawnPoint.x.toFixed(1),
      spawnZ: spawnResult.spawnPoint.z.toFixed(1),
      groundHeight: spawnResult.groundHeight.toFixed(2) + "m",
      bodyBaseY: spawnResult.bodyBaseY.toFixed(2) + "m",
      bodyTopY: spawnResult.bodyTopY.toFixed(2) + "m",
      terrainFlattened: spawnResult.terrainFlattened,
      seaLevel: INITIAL_WATER_LEVEL.toFixed(2) + "m",
      distToWater: (spawnResult.groundHeight - INITIAL_WATER_LEVEL).toFixed(2) + "m acima da água inicial",
    });
    
    scene.add(this.ark.getMesh());
    this.physicsWorld.addBody(this.ark.getRigidBody());

    // Forçar sincronização visual imediata do terreno nivelado
    // (sem isso, o mesh só seria atualizado no primeiro frame do update)
    this._applyTerrainDeformationToMesh();

    // ✅ CORREÇÃO: Validar que Arca foi inicializada
    if (!this.ark) {
      logger.error("❌ Arca não inicializada!");
      throw new Error("Arca não inicializada");
    }

    if (ARK_DEBUG_OPTIONS.showScaleGuides) {
      // 👤 ADICIONAR NPC DE REFERÊNCIA (2m de altura) ao lado da Arca
      this.referenceNPC = this.createReferenceNPC();
      scene.add(this.referenceNPC);

      // Posicionar NPC MUITO PERTO da Arca (20m de distância) NO CHÃO
      const arkPos = this.ark.getPosition();
      const npcX = arkPos.x + 20;
      const npcZ = arkPos.z + 20;
      const npcGroundHeight = this.terrainProfile.getHeightAt(npcX, npcZ);
      this.referenceNPC.position.set(npcX, npcGroundHeight, npcZ);

      logger.info("👤 NPC de referência posicionado", {
        npc: { x: npcX, y: npcGroundHeight, z: npcZ },
        ark: { x: arkPos.x, y: arkPos.y, z: arkPos.z },
        distance: Math.sqrt((npcX - arkPos.x) ** 2 + (npcZ - arkPos.z) ** 2).toFixed(1) + "m",
      });

      // 📏 ADICIONAR LINHAS DE MEDIÇÃO (mostra proporção 7:1)
      this.measurementLines = this.createMeasurementLines(
        this.referenceNPC.position,
        this.ark.getPosition(),
        2.0,
        14.0,
      );
      scene.add(this.measurementLines);
    }

    this.fishSystem = new FishSystem({
      waterBounds: this.floodSystem.getWaterBounds(),
      fishCount: SPAWNER_DEFAULTS.FISH_COUNT,
      arkPosition: this.ark.getPosition(),
      sampleTerrainHeight: this.terrainProfile.getHeightAt,
      terrainClearance: 1.5,
    });
    scene.add(this.fishSystem.getGroup());

    // ✅ TURBO UPGRADE: Inicializar Nuvens Volumétricas
    try {
      this.volumetricClouds = new VolumetricCloudsSystem({
        scene,
        sunLight: this.weatherSystem.getSunLight(),
        coverage: 0.4,
      });
      logger.info("☁️ Nuvens volumétricas inicializadas");
    } catch (error) {
      logger.error("❌ Erro ao inicializar nuvens volumétricas", error);
    }
    
    // ✅ TURBO UPGRADE: Inicializar Áudio Imersivo
    try {
      const listener = new THREE.AudioListener();
      camera.add(listener);
      
      this.immersiveAudio = new ImmersiveAudioSystem({
        camera,
        listener,
        initialRainIntensity: 0,
        initialWindSpeed: 5,
      });
      
      // Inicializar com interação do usuário
      const initAudio = () => {
        this.immersiveAudio.init();
        window.removeEventListener('click', initAudio);
        window.removeEventListener('keydown', initAudio);
      };
      window.addEventListener('click', initAudio);
      window.addEventListener('keydown', initAudio);
      
      logger.info("🔊 Sistema de áudio imersivo inicializado (aguardando interação)");
    } catch (error) {
      logger.error("❌ Erro ao inicializar áudio", error);
    }
    
    logger.info("🎮 FloodTestGame TURBO inicializado com sucesso!");
    logger.info("   Features ativas: Nuvens Volumétricas, Áudio Imersivo, Clima Dinâmico");
  }

  update(dt: number, tSeconds: number) {
    if (this.cameraMode === "orbit") {
      this.controls.update();
      this.constrainCameraToTerrain();
    } else {
      this.updateFpsCamera(dt);
    }

    let currentProgress = this.floodSystem?.getProgress() ?? 0;
    if (this.flooding && this.floodSystem) {
      this.floodSystem.updateFlood(dt);
      currentProgress = this.floodSystem.getProgress();

      // ✅ SSOT: WaterSystem é a fonte de verdade do nível.
      // floodSystem.updateFlood já incrementou controls.waterLevel.
      // Sincronizar WaterSystem para que o nível reflita o mesmo valor.
      if (this.waterSystem) {
        if (this.waterSystem.state !== "rising") this.waterSystem.startFlood();
        // Forçar o WaterSystem ao mesmo nível que o floodSystem calculou,
        // evitando duplo incremento (os dois sistemas não devem incrementar em paralelo).
        this.waterSystem.setLevel(this.floodSystem.controls.waterLevel);
      }

      this.gameTimeHours += (dt / 3600) * 60;

      if (currentProgress < 0.15) {
        this.floodPhase = "starting";
        if (!this.floodSystem.controls.rainEnabled) {
          this.floodSystem.controls.rainEnabled = true;
          console.log("☔ CHUVA ATIVADA! Água começará a acumular...");
        }
      } else {
        this.floodPhase = "flooding";
      }
    } else if (this.floodSystem) {
      this.floodSystem.controls.rainEnabled = false;
    }

    if (this.weatherSystem) {
      this.weatherSystem.update(dt, currentProgress);
      const weatherConfig = this.weatherSystem.getConfig();

      this.floodSystem?.setEnvironment({
        windSpeed: weatherConfig.windSpeed,
        windDirection: weatherConfig.windDirection,
        rainIntensity: this.flooding
          ? THREE.MathUtils.clamp(currentProgress < 0.15 ? currentProgress / 0.15 : 1, 0.2, 1)
          : 0,
      });
    }

    if (this.grassAAA) this.grassAAA.animate(tSeconds * 1000);
    this.floodSystem?.animate(tSeconds * 1000, dt, this.ctx.scene, this.ctx.camera);

    this.physicsWorld.step(dt);
    this.syncTerrainVisualFromDeformation(dt);
    this.updateGrassInteractions();

    // ✅ Debug overlay 3D: atualizar gizmos se habilitado
    if (this.floodDebugOverlay && this.floodDebugEnabled && this.waterSystem && this.ark) {
      this.floodDebugOverlay.update(
        this.waterSystem,
        this.ark.getRigidBody(),
        (x, z) => this.terrainProfile.getHeightAt(x, z),
        (x, z) => this.floodSystem?.getWaveHeight(x, z) ?? 0,
        9.8,
      );
    }

    if (this.floodSystem && this.ark) this.floodSystem.setArkPosition(this.ark.getPosition());
    if (this.fishSystem && this.floodSystem && this.ark) {
      this.fishSystem.update(dt, this.floodSystem.controls.waterLevel);
      this.fishSystem.updateArkPosition(this.ark.getPosition());
    }
    
    // ✅ TURBO UPGRADE: Atualizar sistemas AAA
    if (this.volumetricClouds) {
      this.volumetricClouds.update(dt, this.ctx.camera);
      
      // Modo tempestade quando dilúvio está ativo
      if (this.flooding && currentProgress > 0.3) {
        this.volumetricClouds.setStormMode(true);
      } else {
        this.volumetricClouds.setStormMode(false);
      }
    }
    
    if (this.immersiveAudio) {
      this.immersiveAudio.update(dt);
      
      // Sincronizar áudio com clima
      if (this.weatherSystem) {
        const weather = this.weatherSystem.getConfig();
        this.immersiveAudio.setWindSpeed(weather.windSpeed);
        
        // Chuva baseada no progresso do dilúvio
        if (this.flooding) {
          const rainIntensity = currentProgress < 0.15 
            ? currentProgress / 0.15 * 0.3  // Começa leve
            : Math.min(1, currentProgress + 0.3);  // Intensifica
          this.immersiveAudio.setRainIntensity(rainIntensity);
        } else {
          this.immersiveAudio.setRainIntensity(0);
        }
      }
    }
    
    if (this.ctx) {
      this.billboardManager.update(dt, this.ctx.camera);
    }

    if (this.floodSystem) {
      const weatherConfig = this.weatherSystem.getConfig();
      const arkPhysicsDebug = this.physicsWorld.getPhysicsDebug(this.ark.getRigidBody());

      // ✅ Enriquecer debug com dados do FloodDebugOverlay (se habilitado)
      const overlayData = this.floodDebugEnabled && this.floodDebugOverlay
        ? this.floodDebugOverlay.getDebugData()
        : null;

      this.opts.onHud({
        progress: this.floodSystem.getProgress(),
        waterLevel: this.waterSystem?.level ?? this.floodSystem.controls.waterLevel,
        phase: this.floodPhase,
        gameTime: this.gameTimeHours,
        timeOfDay: this.formatTime(weatherConfig.timeOfDay),
        dayPeriod: this.weatherSystem.getTimeOfDayPeriod(),
        arkPhysics: arkPhysicsDebug,
        floodDebug: overlayData ?? undefined,
      });
    }
  }
  
  /**
   * Formatar hora do dia (0-24) para string legível
   */
  private formatTime(hour: number): string {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  private syncTerrainVisualFromDeformation(dt: number): void {
    if (!this.terrainGeometry || this.terrainSegments <= 0) return;
    if (this.terrainTopVertexCount <= 0) return;

    this.terrainVisualSyncAccumulator += dt;
    if (this.terrainVisualSyncAccumulator < 0.06) return;

    const currentVersion = this.terrainProfile.getDeformationVersion();
    if (currentVersion === this.terrainVisualVersion) return;

    this._applyTerrainDeformationToMesh();
    this.terrainVisualSyncAccumulator = 0;
  }

  /** Aplica imediatamente o campo de deformação ao mesh visual do terreno. */
  private _applyTerrainDeformationToMesh(): void {
    if (!this.terrainGeometry || this.terrainSegments <= 0) return;
    if (this.terrainTopVertexCount <= 0) return;

    const currentVersion = this.terrainProfile.getDeformationVersion();
    if (currentVersion === this.terrainVisualVersion) return;

    const position = this.terrainGeometry.getAttribute("position") as THREE.BufferAttribute;
    const gridN = this.terrainSegments + 1;
    const half = this.terrainSize * 0.5;
    const step = this.terrainSize / this.terrainSegments;

    for (let iz = 0; iz < gridN; iz++) {
      const z = -half + iz * step;
      for (let ix = 0; ix < gridN; ix++) {
        const x = -half + ix * step;
        const topIndex = iz * gridN + ix;
        position.setY(topIndex, this.terrainProfile.getHeightAt(x, z));
      }
    }

    position.needsUpdate = true;
    this.terrainGeometry.computeVertexNormals();
    this.terrainVisualVersion = currentVersion;
  }

  private updateGrassInteractions(): void {
    if (!this.grassAAA) return;
    if (!this.physicsWorld) {
      this.grassAAA.setInteractionPoints([]);
      return;
    }

    const points: Array<{ x: number; z: number; radius: number; strength: number }> = [];
    for (const body of this.physicsWorld.getBodies()) {
      if (!this.physicsWorld.isOnGround(body)) continue;

      const area = Math.max(0.5, body.dimensions.x * body.dimensions.z);
      const pressure = body.mass / area;
      const radius = THREE.MathUtils.clamp(Math.sqrt(area) * 0.45, 1.2, 20);
      const strength = THREE.MathUtils.clamp(pressure / 26000, 0.08, 1.0);

      points.push({
        x: body.position.x,
        z: body.position.z,
        radius,
        strength,
      });

      if (points.length >= 8) break;
    }

    this.grassAAA.setInteractionPoints(points);
  }

  getInputDebugLines() {
    const s = this.fps?.getDebugStats();
    if (!s) return [`cameraMode: ${this.cameraMode}`, "fps: off"]; 
    const cam = this.ctx?.camera;
    const pos = cam ? cam.position : null;
    return [
      `cameraMode: ${this.cameraMode}`,
      `locked: ${s.locked ? "yes" : "no"}`,
      `sprint: ${s.sprinting ? "yes" : "no"}`,
      `jumpQueued: ${s.jumpQueued ? "yes" : "no"}`,
      `move: x=${s.moveDir.x.toFixed(2)} z=${s.moveDir.z.toFixed(2)}`,
      pos ? `cam: x=${pos.x.toFixed(1)} y=${pos.y.toFixed(1)} z=${pos.z.toFixed(1)}` : "cam: —",
    ];
  }

  /**
   * 👤 Criar NPC de referência (2m de altura)
   * 
   * Serve para mostrar a escala real da Arca.
   * ✅ SSOT: Usa ARK_CONSTANTS da engine para proporções.
   */
  private createReferenceNPC(): THREE.Group {
    const npc = new THREE.Group();
    npc.name = "ReferenceNPC";
    
    // ✅ SSOT: Altura da pessoa vem da engine
    const personHeight = ARK_CONSTANTS.HEIGHT / 7;
    
    // === CORPO (cilindro de 2m) ===
    const bodyHeight = 1.4; // Corpo: 1.4m
    const bodyRadius = 0.4;  // Raio: 0.4m
    
    const bodyGeo = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyHeight, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xFF0000, // Vermelho
      roughness: 0.5,
      metalness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = bodyHeight * 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    npc.add(body);
    
    // === CABEÇA (esfera) ===
    const headRadius = 0.2;
    const headGeo = new THREE.SphereGeometry(headRadius, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xFFFF00, // Amarelo
      roughness: 0.6,
      metalness: 0.1,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = bodyHeight + headRadius;
    head.castShadow = true;
    head.receiveShadow = true;
    npc.add(head);
    
    // === BRAÇOS (cilindros finos) ===
    const armLength = 0.6;
    const armRadius = 0.12;
    const armGeo = new THREE.CylinderGeometry(armRadius, armRadius, armLength, 8);
    const armMat = new THREE.MeshStandardMaterial({
      color: 0xFF0000, // Vermelho
      roughness: 0.5,
      metalness: 0.2,
    });
    
    // Braço esquerdo
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-bodyRadius - armRadius, bodyHeight * 0.7, 0);
    leftArm.rotation.z = Math.PI / 6; // Inclinado
    leftArm.castShadow = true;
    npc.add(leftArm);
    
    // Braço direito
    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(bodyRadius + armRadius, bodyHeight * 0.7, 0);
    rightArm.rotation.z = -Math.PI / 6; // Inclinado
    rightArm.castShadow = true;
    npc.add(rightArm);
    
    // === PERNAS (cilindros) ===
    const legLength = 0.6;
    const legRadius = 0.15;
    const legGeo = new THREE.CylinderGeometry(legRadius, legRadius, legLength, 8);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0xFF0000, // Vermelho (mesma cor do corpo)
      roughness: 0.5,
      metalness: 0.2,
    });
    
    // Perna esquerda
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-bodyRadius * 0.5, -legLength * 0.5, 0);
    leftLeg.castShadow = true;
    npc.add(leftLeg);
    
    // Perna direita
    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(bodyRadius * 0.5, -legLength * 0.5, 0);
    rightLeg.castShadow = true;
    npc.add(rightLeg);
    
    // === LABEL (texto indicando altura) ===
    // ✅ CORREÇÃO SSOT: Usar constantes de UI
    const label = createLabelMesh(
      {
        text: `${personHeight.toFixed(1)}m`,
        ...UI_LABEL_DEFAULTS.DIMENSIONS,
        bgColor: 'rgba(255, 0, 0, 0.9)',
        textColor: UI_LABEL_DEFAULTS.COLORS.text,
        borderWidth: UI_LABEL_DEFAULTS.BORDER.width,
        borderColor: UI_LABEL_DEFAULTS.COLORS.border,
      },
      UI_LABEL_DEFAULTS.PHYSICAL_SIZE.large.width,
      UI_LABEL_DEFAULTS.PHYSICAL_SIZE.large.height
    );
    label.position.y = bodyHeight + headRadius * 2 + 0.8; // Acima da cabeça
    npc.add(label);
    
    // ✅ CORREÇÃO: Registrar billboard no manager
    this.billboardManager.register(label);
    
    logger.info(`👤 NPC de referência criado: ${personHeight.toFixed(1)}m de altura`);
    
    return npc;
  }
  
  /**
   * 📏 Criar linhas de medição (mostra proporção 7:1)
   * 
   * Desenha 7 segmentos de 2m ao lado da Arca para mostrar que ela tem 7× a altura do NPC.
   * ✅ SSOT: Usa ARK_CONSTANTS da engine.
   */
  private createMeasurementLines(
    npcPos: THREE.Vector3,
    arkPos: THREE.Vector3,
    npcHeight: number,
    arkHeight: number
  ): THREE.Group {
    const group = new THREE.Group();
    
    // Posição das linhas: entre NPC e Arca
    const lineX = (npcPos.x + arkPos.x) / 2;
    const lineZ = (npcPos.z + arkPos.z) / 2;
    const lineY = this.terrainProfile.getHeightAt(lineX, lineZ);
    
    // ✅ SSOT: Proporção vem da engine (ARK_HEIGHT / PERSON_HEIGHT = 7)
    const segments = Math.round(arkHeight / npcHeight); // 14 / 2 = 7
    const segmentHeight = npcHeight;
    
    for (let i = 0; i < segments; i++) {
      // Linha vertical (2m)
      const lineGeo = new THREE.BoxGeometry(0.1, segmentHeight, 0.1);
      const lineMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xFFFF00 : 0xFF0000, // Alterna amarelo/vermelho
        transparent: true,
        opacity: 0.8,
      });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.set(lineX, lineY + i * segmentHeight + segmentHeight * 0.5, lineZ);
      group.add(line);
      
      // Label do segmento
      // ✅ CORREÇÃO SSOT: Usar constantes de UI
      const label = createLabelMesh(
        {
          text: `${i + 1}×`,
          ...UI_LABEL_DEFAULTS.SMALL,
          bgColor: i % 2 === 0 ? 'rgba(255, 255, 0, 0.9)' : 'rgba(255, 0, 0, 0.9)',
          textColor: UI_LABEL_DEFAULTS.COLORS.text,
          borderWidth: UI_LABEL_DEFAULTS.BORDER.smallWidth,
          borderColor: UI_LABEL_DEFAULTS.COLORS.border,
        },
        UI_LABEL_DEFAULTS.PHYSICAL_SIZE.medium.width,
        UI_LABEL_DEFAULTS.PHYSICAL_SIZE.medium.height
      );
      label.position.set(lineX + 1.5, lineY + i * segmentHeight + segmentHeight * 0.5, lineZ);
      group.add(label);
      
      // ✅ CORREÇÃO: Registrar billboard no manager
      this.billboardManager.register(label);
    }
    
    // Linha conectando topo ao NPC (mostra que são 7 segmentos)
    const topLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(lineX, lineY, lineZ),
      new THREE.Vector3(lineX, lineY + arkHeight, lineZ),
    ]);
    const topLineMat = new THREE.LineBasicMaterial({
      color: 0x00FF00,
      linewidth: 3,
    });
    const topLine = new THREE.Line(topLineGeo, topLineMat);
    group.add(topLine);
    
    logger.info(`📏 Linhas de medição criadas: 7 segmentos de ${segmentHeight}m = ${arkHeight}m`);
    
    return group;
  }

  dispose() {
    logger.info("Limpando recursos do FloodTestGame...");
    
    // ✅ CORREÇÃO: Limpar billboard manager
    this.billboardManager.clear();
    
    this.floodSystem?.dispose();
    this.ark?.dispose();
    this.fishSystem?.dispose();
    this.weatherSystem?.dispose();
    // ✅ Dispose debug overlay
    this.floodDebugOverlay?.dispose();
    // ✅ TURBO UPGRADE: Dispose sistemas AAA
    this.volumetricClouds?.dispose();
    this.immersiveAudio?.dispose();
    if (this.physicsWorld && this.ark) this.physicsWorld.removeBody(this.ark.getRigidBody());
    if (this.grassAAA) this.grassAAA.dispose();
    
    // 👤 Cleanup NPC de referência
    if (this.referenceNPC && this.ctx) {
      this.ctx.scene.remove(this.referenceNPC);
      this.referenceNPC.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      this.referenceNPC = null;
    }
    
    // 📏 Cleanup linhas de medição
    if (this.measurementLines && this.ctx) {
      this.ctx.scene.remove(this.measurementLines);
      this.measurementLines.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
        if (obj instanceof THREE.Line) {
          (obj as THREE.Line).geometry.dispose();
          if (Array.isArray((obj as THREE.Line).material)) {
            ((obj as THREE.Line).material as THREE.Material[]).forEach((m) => m.dispose());
          } else {
            ((obj as THREE.Line).material as THREE.Material).dispose();
          }
        }
      });
      this.measurementLines = null;
    }

    this.texSand?.dispose();
    this.texMud?.dispose();
    this.texClay?.dispose();

    if (this.terrain && this.ctx) {
      try {
        this.ctx.scene.remove(this.terrain);
      } catch {
        // ignore
      }
      this.terrain = null;
    }
    this.terrainGeometry = null;
    this.terrainTopVertexCount = 0;
    this.terrainSegments = 0;
    this.terrainVisualVersion = -1;
    this.terrainVisualSyncAccumulator = 0;

    (this.controls as unknown as { dispose?: () => void })?.dispose?.();
    this.fps?.dispose();
    this.fps = null;
  }

  private applyCameraMode() {
    if (!this.ctx || !this.controls) return;
    const { renderer, camera } = this.ctx;

    if (this.cameraMode === "fps") {
      this.controls.enabled = false;
      if (!this.fps) {
        this.fps = new OrdaxFpsInput({
          camera,
          domElement: renderer.domElement,
        });
        this.fps.mount();
      }
    } else {
      this.controls.enabled = true;
      this.fps?.dispose();
      this.fps = null;
    }
  }

  private updateFpsCamera(dt: number) {
    if (!this.ctx || !this.fps) return;
    if (!this.fps.locked) return;

    const camera = this.ctx.camera;
    // ✅ SSOT: Usar velocidades da engine
    const speed = this.fps.sprinting ? CAMERA_PHYSICS.MOVE_SPEED.sprint : CAMERA_PHYSICS.MOVE_SPEED.normal;
    const dir = this.fps.getMoveDirXZ();
    camera.position.addScaledVector(dir, speed * dt);

    // "Jump" in debug/fly mode: pulse upward.
    if (this.fps.consumeJump()) {
      camera.position.y += CAMERA_PHYSICS.JUMP_IMPULSE;
    }

    this.constrainCameraToTerrain();
  }

  /**
   * Keep camera from penetrating the solid terrain volume.
   * This prevents seeing the “hollow inside” when user gets close.
   */
  private constrainCameraToTerrain() {
    if (!this.ctx) return;
    const cam = this.ctx.camera;

    // clamp to terrain bounds (avoid going outside and looking into side walls)
    const clampedCameraXZ = this.terrainProfile.clampXZ(cam.position.x, cam.position.z);
    cam.position.x = clampedCameraXZ.x;
    cam.position.z = clampedCameraXZ.z;

    // Mantém o alvo do OrbitControls dentro do bounds também (evita “olhar por trás”)
    // e reduz drift do target ao dar pan/zoom.
    if (this.controls) {
      const t = this.controls.target;
      const clampedTargetXZ = this.terrainProfile.clampXZ(t.x, t.z);
      t.x = clampedTargetXZ.x;
      t.z = clampedTargetXZ.z;
    }

    // keep above ground (solid)
    const ground = this.terrainProfile.getHeightAt(cam.position.x, cam.position.z);
    // ✅ SSOT: Usar clearance da engine
    const minClearance = CAMERA_PHYSICS.MIN_CLEARANCE;
    const minY = ground + minClearance;
    if (cam.position.y < minY) cam.position.y = minY;
  }

  private applyStabilityTuning() {
    if (!this.physicsWorld) return;
    // Map stability (0..1) to safe engine parameters.
    const s = this.stability;
    
    // ✅ SSOT: Usar limites da engine
    const angularDamping = THREE.MathUtils.lerp(
      TUNING_LIMITS.ANGULAR_DAMPING.min,
      TUNING_LIMITS.ANGULAR_DAMPING.max,
      s
    );
    
    // Buoyancy e drag scales customizados para o flood test
    const buoyancyTorqueScale = THREE.MathUtils.lerp(1.35, 0.75, s);
    const angularDragScale = THREE.MathUtils.lerp(0.15, 0.35, s);

    this.physicsWorld.setTuning({
      angularDamping,
      buoyancyTorqueScale,
      angularDragScale,
    });
  }

}
