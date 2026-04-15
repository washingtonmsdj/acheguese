import * as THREE from "three";
import { OrdaxFpsInput } from "@/lib/ordax/input/OrdaxFpsInput";
import { createSolidHeightfieldGeometry } from "@/lib/ordax/terrain";
import { heightAt as engineHeightAt } from "@/lib/ordax/terrain/noise";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import type { OrdaxThreeContext, OrdaxThreeGame } from "@/lib/ordax/runtime3d/types";
import { createAlluvialInstancedProps } from "./sceneProps";
import { createGrassAAAOptimized } from "./grassAAAOptimized";
import { VoxelBlockSystem, BlockType } from "./voxelBlockSystem";
import { VOXEL_WORLD } from "@/lib/ordax/config";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function heightAt(x: number, z: number, seed: number) {
  // Unificado com a engine (ordax/terrain/noise)
  return engineHeightAt(x, z, seed, VOXEL_WORLD.MAX_HEIGHT);
}

function buildTerrainMesh({
  seed,
  textures,
}: {
  seed: number;
  textures: { grass: THREE.Texture; dirt: THREE.Texture; rock: THREE.Texture };
}) {
  const segments = 220;
  const size = VOXEL_WORLD.SIZE;

  // Terreno SÓLIDO (fechado): topo + laterais + fundo (evita parecer oco ao aproximar).
  const bottomY = -28;
  const geo = createSolidHeightfieldGeometry({
    size,
    segments,
    heightAt: (x, z) => heightAt(x, z, seed),
    bottomY,
  });

  const mat = new THREE.MeshStandardMaterial({
    roughness: 1,
    metalness: 0,
  });

  // Terrain blend via onBeforeCompile (usa normals e altura)
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.tGrass = { value: textures.grass };
    shader.uniforms.tDirt = { value: textures.dirt };
    shader.uniforms.tRock = { value: textures.rock };
    shader.uniforms.uTexScale = { value: 0.08 };
    shader.uniforms.uSeaLevel = { value: 3.2 };
    shader.uniforms.uRockHeight = { value: 10.0 };

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vWorldPos;\nvarying vec3 vN;`)
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>\nvec4 wp = modelMatrix * vec4(transformed, 1.0);\nvWorldPos = wp.xyz;\nvN = normalize(mat3(modelMatrix) * normal);`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>\nuniform sampler2D tGrass;\nuniform sampler2D tDirt;\nuniform sampler2D tRock;\nuniform float uTexScale;\nuniform float uSeaLevel;\nuniform float uRockHeight;\nvarying vec3 vWorldPos;\nvarying vec3 vN;`,
      )
      .replace(
        "#include <map_fragment>",
        `
        // Custom terrain texturing (realista, sem cara de Minecraft)
        vec2 uvw = vWorldPos.xz * uTexScale;
        vec3 grassC = texture2D(tGrass, uvw).rgb;
        vec3 dirtC  = texture2D(tDirt,  uvw).rgb;
        vec3 rockC  = texture2D(tRock,  uvw).rgb;

        float height = vWorldPos.y;
        float slope = 1.0 - clamp(vN.y, 0.0, 1.0); // 0=plano, 1=vertical

        // Dirt em baixadas
        float dirtW = smoothstep(uSeaLevel + 1.0, uSeaLevel - 0.2, height);
        // Rock em encostas e altitudes
        float rockBySlope = smoothstep(0.35, 0.75, slope);
        float rockByHeight = smoothstep(uRockHeight, uRockHeight + 4.0, height);
        float rockW = clamp(max(rockBySlope, rockByHeight), 0.0, 1.0);
        // Grass no resto
        float grassW = 1.0 - clamp(dirtW + rockW, 0.0, 1.0);

        // Normalize
        float sumW = grassW + dirtW + rockW + 1e-5;
        grassW /= sumW; dirtW /= sumW; rockW /= sumW;

        vec3 blended = grassC * grassW + dirtC * dirtW + rockC * rockW;
        diffuseColor = vec4(blended, diffuseColor.a);
        `,
      );
  };

  const baseMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("hsl(35, 18%, 18%)"),
    roughness: 1,
    metalness: 0,
  });

  // Multi-material groups: top, bottom, sides
  const topIndexCount = segments * segments * 2 * 3;
  const bottomIndexCount = segments * segments * 2 * 3;
  const sideIndexCount = segments * 4 * 2 * 3;
  geo.clearGroups();
  geo.addGroup(0, topIndexCount, 0);
  geo.addGroup(topIndexCount, bottomIndexCount, 1);
  geo.addGroup(topIndexCount + bottomIndexCount, sideIndexCount, 0);

  const mesh = new THREE.Mesh(geo, [mat, baseMat]);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  return mesh;
}

export class VoxelSandboxThreeGame implements OrdaxThreeGame {
  private ctx: OrdaxThreeContext | null = null;
  private seed = 1337;

  private cameraMode: "fps" | "orbit" = "fps";
  private orbit: OrbitControls | null = null;

  private fps: OrdaxFpsInput | null = null;
  private controlsObject: THREE.Object3D | null = null;

  private terrain: THREE.Mesh | null = null;
  private props: ReturnType<typeof createAlluvialInstancedProps> | null = null;
  private grassOptimized: ReturnType<typeof createGrassAAAOptimized> | null = null;
  private blockSystem: VoxelBlockSystem | null = null;

  private texSand: THREE.Texture | null = null;
  private texMud: THREE.Texture | null = null;
  private texClay: THREE.Texture | null = null;

  private vel = new THREE.Vector3();
  
  // Mouse state para blocos
  private mouse = new THREE.Vector2();
  private mouseDown = { left: false, right: false };

  private yVel = 0;
  private grounded = false;
  private readonly eyeHeight = 2.0; // 2m de altura (pessoa real)
  private readonly playerRadius = 0.35;
  private readonly stepUp = 1.0;

  constructor(
    private opts: {
      onLockChange?: (locked: boolean) => void;
      onHint?: (hint: string) => void;
    } = {},
  ) {}

  setCameraMode(mode: "fps" | "orbit") {
    this.cameraMode = mode;
    this.applyCameraMode();
  }

  async init(ctx: OrdaxThreeContext) {
    this.ctx = ctx;
    const { renderer, scene, camera } = ctx;

    renderer.setClearColor(new THREE.Color("hsl(210, 25%, 7%)"), 1);

    scene.fog = new THREE.Fog(new THREE.Color("hsl(210, 22%, 10%)"), 20, 140);

    camera.fov = 70;
    camera.near = 0.1;
    camera.far = 600;
    camera.updateProjectionMatrix();
    
    // Posição inicial: no chão (Y=altura do terreno) + 2m (altura da pessoa)
    const initialX = 0;
    const initialZ = 18;
    const groundHeight = heightAt(initialX, initialZ, this.seed);
    camera.position.set(initialX, groundHeight + 2.0, initialZ);

    // OrbitControls (modo inspeção)
    this.orbit = new OrbitControls(camera, renderer.domElement);
    this.orbit.enableDamping = true;
    this.orbit.dampingFactor = 0.05;
    this.orbit.maxPolarAngle = Math.PI / 2.05;
    this.orbit.enablePan = true;

    // FPS Input Profile
    const fps = new OrdaxFpsInput({
      camera,
      domElement: renderer.domElement,
      onLockChange: this.opts.onLockChange,
      onHint: this.opts.onHint,
    });
    this.fps = fps;
    fps.mount();

    // Controls object (camera holder)
    this.controlsObject =
      (fps.controls as unknown as { getObject?: () => THREE.Object3D; object?: THREE.Object3D; camera?: THREE.Camera }).getObject?.() ?? (fps.controls as unknown as { object?: THREE.Object3D }).object ?? (fps.controls as unknown as { camera?: THREE.Camera }).camera ?? camera;
    scene.add(this.controlsObject);

    const ambient = new THREE.AmbientLight(new THREE.Color("hsl(0, 0%, 100%)"), 0.55);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(new THREE.Color("hsl(45, 90%, 95%)"), 1.1);
    dir.position.set(30, 60, 20);
    scene.add(dir);

    // Terrain realista (malha + texturas)
    const loader = new THREE.TextureLoader();
    this.texSand = loader.load("/textures/terrain/dirt_diff_1k.jpg");
    this.texMud = loader.load("/textures/terrain/dry_mud_field_001_diff_1k.jpg");
    this.texClay = loader.load("/textures/terrain/mud_cracked_dry_03_diff_1k.jpg");
    for (const t of [this.texSand, this.texMud, this.texClay]) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
      t.needsUpdate = true;
    }

    this.terrain = buildTerrainMesh({
      seed: this.seed,
      textures: { grass: this.texSand, dirt: this.texMud, rock: this.texClay },
    });
    scene.add(this.terrain);

    this.props = createAlluvialInstancedProps({
      seed: this.seed,
      worldSize: VOXEL_WORLD.SIZE,
      heightAt: (x, z) => heightAt(x, z, this.seed),
    });
    scene.add(this.props.group);

    this.grassOptimized = createGrassAAAOptimized({
      worldSize: VOXEL_WORLD.SIZE,
      heightAt: (x, z) => heightAt(x, z, this.seed),
      seed: this.seed,
      biome: "mesopotamia",
      enableLOD: true,
      enableWaterCulling: true,
    });
    for (const mesh of this.grassOptimized.meshes) {
      scene.add(mesh);
    }

    // Sistema de blocos voxel
    this.blockSystem = new VoxelBlockSystem({
      blockSize: 1.0,
      maxBlocks: 10000,
      worldBounds: {
        minX: -VOXEL_WORLD.SIZE / 2,
        maxX: VOXEL_WORLD.SIZE / 2,
        minY: 0,
        maxY: 50,
        minZ: -VOXEL_WORLD.SIZE / 2,
        maxZ: VOXEL_WORLD.SIZE / 2,
      },
    });
    scene.add(this.blockSystem.getGroup());

    // Event listeners para mouse (blocos)
    renderer.domElement.addEventListener('mousemove', this.onMouseMove);
    renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    renderer.domElement.addEventListener('mouseup', this.onMouseUp);
    renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Event listener para trocar tipo de bloco (teclas 1-5)
    window.addEventListener('keydown', this.onKeyDown);

    // crosshair
    const cross = new THREE.Mesh(
      new THREE.RingGeometry(0.02, 0.03, 24),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("hsl(0, 0%, 98%)"),
        transparent: true,
        opacity: 0.8,
      }),
    );
    cross.position.set(0, 0, -1);
    camera.add(cross);

    // Apply requested mode (default fps)
    this.applyCameraMode();

  }

  update(dtSeconds: number, tSeconds: number) {
    if (!this.ctx || !this.fps || !this.controlsObject) return;

    const dt = Math.min(0.05, dtSeconds);
    const tMs = tSeconds * 1000;

    this.props?.animate(tMs);
    
    // Animar grama otimizada (com LOD e water culling)
    if (this.grassOptimized && this.controlsObject) {
      const waterLevel = -999; // TODO: pegar do floodSystem quando implementado
      this.grassOptimized.animate(tMs, this.controlsObject.position, waterLevel);
    }

    // Atualizar highlight de blocos (apenas em FPS mode)
    if (this.cameraMode === "fps" && this.blockSystem && this.ctx.camera) {
      this.blockSystem.updateHighlight(this.ctx.camera, this.mouse);
    }

    if (this.cameraMode === "orbit") {
      this.orbit?.update();
      this.constrainOrbitToTerrain();
      return;
    }

    if (this.fps.locked) {
      const speed = this.fps.sprinting ? 9 : 6;
      const dir = this.fps.getMoveDirXZ();
      this.vel.copy(dir).multiplyScalar(speed * dt);

      const groundAfterMove = this.tryMoveXZ(this.vel.x, this.vel.z);

      const pos = this.controlsObject.position;
      const ground = groundAfterMove;
      const groundY = ground + this.eyeHeight;

      if (this.grounded && this.fps.consumeJump()) {
        this.yVel = 8.5;
        this.grounded = false;
      }

      this.yVel += -22 * dt;
      pos.y += this.yVel * dt;
      if (pos.y <= groundY) {
        pos.y = groundY;
        this.yVel = 0;
        this.grounded = true;
      }

      if (this.grounded && pos.y < groundY) pos.y = groundY;

      const half = VOXEL_WORLD.SIZE / 2 - 2;
      pos.x = clamp(pos.x, -half, half);
      pos.z = clamp(pos.z, -half, half);

      // Evita edge cases onde a câmera “atravessa” o terreno/volume.
      this.constrainCameraToTerrain();
    }
  }

  private constrainCameraToTerrain() {
    if (!this.controlsObject) return;
    const pos = this.controlsObject.position;

    // bounds do terreno
    const half = VOXEL_WORLD.SIZE / 2;
    pos.x = clamp(pos.x, -half, half);
    pos.z = clamp(pos.z, -half, half);

    // mantém acima do solo (usa o mesmo heightAt da engine)
    const ground = this.footprintHeight(pos.x, pos.z);
    const minClearance = this.eyeHeight; // câmera não deve ficar abaixo da superfície
    const minY = ground + minClearance;
    if (pos.y < minY) pos.y = minY;
  }

  private constrainOrbitToTerrain() {
    if (!this.ctx || !this.orbit) return;
    const cam = this.ctx.camera;
    const half = VOXEL_WORLD.SIZE / 2;

    cam.position.x = clamp(cam.position.x, -half, half);
    cam.position.z = clamp(cam.position.z, -half, half);

    const t = this.orbit.target;
    t.x = clamp(t.x, -half, half);
    t.z = clamp(t.z, -half, half);

    const ground = heightAt(cam.position.x, cam.position.z, this.seed);
    const minY = ground + 1.0;
    if (cam.position.y < minY) cam.position.y = minY;
  }

  getInputDebugLines() {
    const s = this.fps?.getDebugStats();
    if (!s) return [];
    
    const blockInfo = this.blockSystem ? [
      `blocks: ${this.blockSystem.getBlockCount()}`,
      `type: ${BlockType[this.blockSystem.getCurrentBlockType()]}`,
    ] : [];
    
    const grassInfo = this.grassOptimized ? (() => {
      const stats = this.grassOptimized.getStats();
      return [
        `grass: ${stats.visibleBlades.toLocaleString()}/${stats.totalBlades.toLocaleString()}`,
        `lod: ${stats.lodLevels} levels`,
      ];
    })() : [];
    
    return [
      `locked: ${s.locked ? "yes" : "no"}`,
      `sprint: ${s.sprinting ? "yes" : "no"}`,
      `jumpQueued: ${s.jumpQueued ? "yes" : "no"}`,
      `move: x=${s.moveDir.x.toFixed(2)} z=${s.moveDir.z.toFixed(2)}`,
      `keys: W${s.keys.w ? 1 : 0} A${s.keys.a ? 1 : 0} S${s.keys.s ? 1 : 0} D${s.keys.d ? 1 : 0} Space${s.keys.space ? 1 : 0} Shift${s.keys.shift ? 1 : 0}`,
      ...blockInfo,
      ...grassInfo,
    ];
  }

  // ==========================================================================
  // EVENT HANDLERS (BLOCOS)
  // ==========================================================================

  private onMouseMove = (event: MouseEvent) => {
    if (!this.ctx) return;
    
    // Calcular coordenadas normalizadas (-1 a +1)
    const rect = this.ctx.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  };

  private onMouseDown = (event: MouseEvent) => {
    if (!this.blockSystem || !this.ctx || !this.fps?.locked) return;
    
    if (event.button === 0) {
      // Click esquerdo: quebrar bloco
      this.mouseDown.left = true;
      this.blockSystem.breakTargetBlock();
    } else if (event.button === 2) {
      // Click direito: colocar bloco
      this.mouseDown.right = true;
      this.blockSystem.placeBlockAdjacent(this.ctx.camera, this.mouse);
    }
  };

  private onMouseUp = (event: MouseEvent) => {
    if (event.button === 0) {
      this.mouseDown.left = false;
    } else if (event.button === 2) {
      this.mouseDown.right = false;
    }
  };

  private onKeyDown = (event: KeyboardEvent) => {
    if (!this.blockSystem) return;
    
    // Teclas 1-5 para trocar tipo de bloco
    const keyToBlockType: Record<string, BlockType> = {
      '1': BlockType.DIRT,
      '2': BlockType.GRASS,
      '3': BlockType.STONE,
      '4': BlockType.WOOD,
      '5': BlockType.SAND,
    };
    
    const blockType = keyToBlockType[event.key];
    if (blockType !== undefined) {
      this.blockSystem.setCurrentBlockType(blockType);
      this.opts.onHint?.(`Bloco: ${BlockType[blockType]}`);
    }
  };

  dispose() {
    if (!this.ctx) return;
    const { scene, renderer } = this.ctx;

    this.fps?.dispose();
    this.fps = null;

    this.orbit?.dispose();
    this.orbit = null;

    // Remover event listeners
    renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
    renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
    renderer.domElement.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('keydown', this.onKeyDown);

    // Keep disposal local to what we added.
    try {
      if (this.terrain) scene.remove(this.terrain);
      if (this.props) scene.remove(this.props.group);
      if (this.grassOptimized) {
        for (const mesh of this.grassOptimized.meshes) {
          scene.remove(mesh);
        }
      }
      if (this.blockSystem) scene.remove(this.blockSystem.getGroup());
    } catch {
      // ignore
    }

    this.texSand?.dispose();
    this.texMud?.dispose();
    this.texClay?.dispose();
    this.props?.dispose();
    this.grassOptimized?.dispose();
    this.blockSystem?.dispose();

    // Let the runtime dispose scene materials/geometries.
    this.controlsObject = null;
    this.ctx = null;
  }

  private applyCameraMode() {
    if (!this.ctx || !this.orbit) return;
    const { camera, renderer } = this.ctx;

    if (this.cameraMode === "orbit") {
      this.orbit.enabled = true;
      this.fps?.dispose();
      this.fps = null;
      this.controlsObject = camera;
      this.opts.onLockChange?.(false);
      this.opts.onHint?.("Modo Orbit: arraste para orbitar • scroll zoom");
      return;
    }

    // FPS
    this.orbit.enabled = false;
    if (!this.fps) {
      const fps = new OrdaxFpsInput({
        camera,
        domElement: renderer.domElement,
        onLockChange: this.opts.onLockChange,
        onHint: this.opts.onHint,
      });
      this.fps = fps;
      fps.mount();
      this.controlsObject =
        (fps.controls as unknown as { getObject?: () => THREE.Object3D; object?: THREE.Object3D; camera?: THREE.Camera }).getObject?.() ?? (fps.controls as unknown as { object?: THREE.Object3D }).object ?? (fps.controls as unknown as { camera?: THREE.Camera }).camera ?? camera;
    }
  }

  private footprintHeight(x: number, z: number) {
    const s = this.playerRadius;
    const h0 = heightAt(x, z, this.seed);
    const h1 = heightAt(x + s, z, this.seed);
    const h2 = heightAt(x - s, z, this.seed);
    const h3 = heightAt(x, z + s, this.seed);
    const h4 = heightAt(x, z - s, this.seed);
    return Math.max(h0, h1, h2, h3, h4);
  }

  private tryMoveXZ(dx: number, dz: number) {
    if (!this.controlsObject) return this.footprintHeight(0, 0);
    const pos = this.controlsObject.position;
    let x = pos.x;
    let z = pos.z;
    let groundHere = this.footprintHeight(x, z);

    if (dx !== 0) {
      const nx = x + dx;
      const ng = this.footprintHeight(nx, z);
      if (ng - groundHere <= this.stepUp) {
        x = nx;
        groundHere = ng;
      }
    }

    if (dz !== 0) {
      const nz = z + dz;
      const ng = this.footprintHeight(x, nz);
      if (ng - groundHere <= this.stepUp) {
        z = nz;
        groundHere = ng;
      }
    }

    pos.x = x;
    pos.z = z;
    return groundHere;
  }
}
