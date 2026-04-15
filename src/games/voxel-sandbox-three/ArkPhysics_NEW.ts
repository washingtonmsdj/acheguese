import * as THREE from "three";
import { ARK_CONSTANTS } from "@/lib/constants/systems/physics-advanced";
import { RigidBody, createArkRigidBody } from "@/lib/ordax/physics/PhysicsWorld";
import { ARK_DEBUG_OPTIONS, ARK_VISUAL_STYLE, createArkVisualLayout } from "./config/ark.config";

/**
 * Arca de Noe - Wrapper para RigidBody
 *
 * Cria malha visual e delega fisica ao PhysicsWorld.
 * Sem fisica customizada por objeto.
 */

export interface ArkPhysicsOptions {
  showDebugGuides?: boolean;
}

export class ArkPhysics {
  private rigidBody: RigidBody;
  private mesh: THREE.Group;
  private options: Required<ArkPhysicsOptions>;

  constructor(options: ArkPhysicsOptions = {}) {
    this.options = {
      showDebugGuides: options.showDebugGuides ?? ARK_DEBUG_OPTIONS.showArkMeshGuides,
    };

    // 1. Criar geometria visual
    this.mesh = this.createMesh();

    // 2. Criar RigidBody (fisica universal)
    this.rigidBody = createArkRigidBody(this.mesh);
  }

  // ==========================================================================
  // GEOMETRIA VISUAL
  // ==========================================================================

  private createMesh(): THREE.Group {
    const layout = createArkVisualLayout();
    const group = new THREE.Group();
    group.name = "NoahArk";

    // === CASCO (base) ===
    const hullGeo = new THREE.BoxGeometry(layout.length, layout.hullHeight, layout.width);
    const hullMat = new THREE.MeshStandardMaterial({
      color: ARK_VISUAL_STYLE.hullColor,
      roughness: 0.8,
      metalness: 0.0,
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = layout.hullHeight * 0.5;
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    // === LINHA D'AGUA (referencia visual) ===
    const waterlineGeo = new THREE.BoxGeometry(
      layout.length * 1.02,
      0.2,
      layout.width * 1.02,
    );
    const waterlineMat = new THREE.MeshBasicMaterial({
      color: ARK_VISUAL_STYLE.waterlineColor,
      transparent: true,
      opacity: 0.4,
    });
    const waterline = new THREE.Mesh(waterlineGeo, waterlineMat);
    waterline.position.y = layout.draftHeight;
    group.add(waterline);

    // === SUPERESTRUTURA (andares) ===
    for (const deckLayout of layout.decks) {
      const deckGeo = new THREE.BoxGeometry(
        deckLayout.length,
        deckLayout.height,
        deckLayout.width,
      );
      const deckMat = new THREE.MeshStandardMaterial({
        color: ARK_VISUAL_STYLE.deckColor,
        roughness: 0.9,
        metalness: 0.0,
      });
      const deck = new THREE.Mesh(deckGeo, deckMat);
      deck.position.y = deckLayout.centerY;
      deck.castShadow = true;
      deck.receiveShadow = true;
      group.add(deck);
    }

    // === JANELA (topo - "zohar") ===
    const windowGeo = new THREE.BoxGeometry(
      layout.window.width,
      layout.window.height,
      layout.window.depth,
    );
    const windowMat = new THREE.MeshStandardMaterial({
      color: ARK_VISUAL_STYLE.windowColor,
      emissive: ARK_VISUAL_STYLE.windowEmissive,
      roughness: 0.3,
      metalness: 0.5,
    });
    const window = new THREE.Mesh(windowGeo, windowMat);
    window.position.y = layout.window.centerY;
    group.add(window);

    // === PORTA (lateral) ===
    const doorGeo = new THREE.BoxGeometry(
      layout.door.width,
      layout.door.height,
      layout.door.depth,
    );
    const doorMat = new THREE.MeshStandardMaterial({
      color: ARK_VISUAL_STYLE.doorColor,
      roughness: 0.7,
      metalness: 0.0,
    });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, layout.door.centerY, layout.door.centerZ);
    group.add(door);

    if (this.options.showDebugGuides) {
      this.addDebugGuides(group, layout);
    }

    console.log(
      `Arca criada: ${ARK_CONSTANTS.LENGTH}m x ${ARK_CONSTANTS.WIDTH}m x ${ARK_CONSTANTS.HEIGHT}m`,
    );
    if (this.options.showDebugGuides) {
      console.log("Guias de debug da arca ativadas");
    }

    return group;
  }

  private addDebugGuides(group: THREE.Group, layout: ReturnType<typeof createArkVisualLayout>): void {
    const guideGeo = new THREE.BoxGeometry(2, layout.height, 2);
    const guideMat = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    const guide = new THREE.Mesh(guideGeo, guideMat);
    guide.position.set(layout.length * 0.5 + 5, layout.height * 0.5, 0);
    group.add(guide);

    if (typeof document === "undefined") return;

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "rgba(0, 255, 0, 0.9)";
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 504, 248);
    ctx.fillStyle = "white";
    ctx.font = "bold 96px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${layout.height.toFixed(1)}m`, 256, 128);

    const labelTexture = new THREE.CanvasTexture(canvas);
    const labelGeo = new THREE.PlaneGeometry(6, 3);
    const labelMat = new THREE.MeshBasicMaterial({
      map: labelTexture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.position.set(layout.length * 0.5 + 5, layout.height + 2, 0);
    label.userData.isBillboard = true;
    group.add(label);
  }

  // ==========================================================================
  // API PUBLICA
  // ==========================================================================

  /**
   * Retorna o RigidBody para ser adicionado ao PhysicsWorld
   */
  public getRigidBody(): RigidBody {
    return this.rigidBody;
  }

  /**
   * Retorna o mesh para ser adicionado a cena
   */
  public getMesh(): THREE.Group {
    return this.mesh;
  }

  /**
   * Posicao atual da Arca
   */
  public getPosition(): THREE.Vector3 {
    return this.rigidBody.position.clone();
  }

  /**
   * Cleanup
   */
  public dispose(): void {
    this.mesh.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}
