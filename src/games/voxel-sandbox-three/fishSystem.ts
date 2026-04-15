import * as THREE from "three";

/**
 * Sistema de Peixes para o Dilúvio
 * 
 * Features:
 * - Peixes nadando no volume de água
 * - Movimento procedural (boids)
 * - Evitam a Arca
 * - Ficam dentro dos limites da água
 */

export interface FishSystemConfig {
  waterBounds: {
    minY: number;
    maxY: number;
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  fishCount: number;
  arkPosition?: THREE.Vector3;
  sampleTerrainHeight?: (x: number, z: number) => number;
  terrainClearance?: number;
}

interface Fish {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  targetPosition: THREE.Vector3;
  speed: number;
  size: number;
}

export class FishSystem {
  private group: THREE.Group;
  private fishes: Fish[] = [];
  private bounds: FishSystemConfig['waterBounds'];
  private arkPosition: THREE.Vector3;
  private readonly sampleTerrainHeight?: (x: number, z: number) => number;
  private readonly terrainClearance: number;
  private simulationTime = 0;

  // Vetores reutilizáveis para evitar alocações no loop de update
  private readonly _direction = new THREE.Vector3();
  private readonly _toArk = new THREE.Vector3();
  private readonly _moveStep = new THREE.Vector3();
  
  constructor(config: FishSystemConfig) {
    this.group = new THREE.Group();
    this.bounds = config.waterBounds;
    this.arkPosition = config.arkPosition || new THREE.Vector3(0, 0, 0);
    this.sampleTerrainHeight = config.sampleTerrainHeight;
    this.terrainClearance = config.terrainClearance ?? 1.25;
    
    // Criar peixes
    for (let i = 0; i < config.fishCount; i++) {
      this.createFish();
    }
    
    console.log(`🐟 Sistema de Peixes criado: ${config.fishCount} peixes`);
    console.log(`   Limites: Y[${this.bounds.minY.toFixed(1)}, ${this.bounds.maxY.toFixed(1)}]`);
  }
  
  private getWaterCeilingY(): number {
    return Math.max(this.bounds.maxY, this.bounds.minY + this.terrainClearance + 0.5);
  }

  private getTerrainMinY(x: number, z: number): number {
    const terrainY = this.sampleTerrainHeight ? this.sampleTerrainHeight(x, z) + this.terrainClearance : -Infinity;
    return Math.max(this.bounds.minY, terrainY);
  }

  private getRandomFishY(x: number, z: number): number {
    const minY = this.getTerrainMinY(x, z) + 0.5;
    const maxY = this.getWaterCeilingY();
    if (maxY <= minY) return minY;
    return THREE.MathUtils.randFloat(minY, maxY);
  }

  private clampFishToVolume(fish: Fish): void {
    const pos = fish.mesh.position;

    if (pos.x < this.bounds.minX || pos.x > this.bounds.maxX) {
      pos.x = THREE.MathUtils.clamp(pos.x, this.bounds.minX, this.bounds.maxX);
      fish.velocity.x *= -0.5;
    }

    if (pos.z < this.bounds.minZ || pos.z > this.bounds.maxZ) {
      pos.z = THREE.MathUtils.clamp(pos.z, this.bounds.minZ, this.bounds.maxZ);
      fish.velocity.z *= -0.5;
    }

    const minY = this.getTerrainMinY(pos.x, pos.z);
    const maxY = this.getWaterCeilingY();
    if (pos.y < minY || pos.y > maxY) {
      pos.y = THREE.MathUtils.clamp(pos.y, minY, maxY);
      fish.velocity.y *= -0.5;
    }
  }

  private createFish() {
    // Geometria simples de peixe (elipsoide)
    const size = 0.3 + Math.random() * 0.5; // 0.3m a 0.8m
    const fishGeo = new THREE.ConeGeometry(size * 0.3, size, 8);
    
    // Cores variadas de peixes
    const colors = [
      0xFF6B35, // Laranja
      0x4ECDC4, // Turquesa
      0xFFE66D, // Amarelo
      0x95E1D3, // Verde-água
      0xF38181, // Salmão
      0x5D5D5D, // Cinza
    ];
    
    const fishMat = new THREE.MeshStandardMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      roughness: 0.3,
      metalness: 0.2,
      emissive: colors[Math.floor(Math.random() * colors.length)],
      emissiveIntensity: 0.1,
    });
    
    const fishMesh = new THREE.Mesh(fishGeo, fishMat);
    
    // Rotacionar para ficar horizontal
    fishMesh.rotation.z = Math.PI / 2;
    
    // Posição inicial aleatória dentro do volume de água válido
    const spawnX = THREE.MathUtils.randFloat(this.bounds.minX * 0.5, this.bounds.maxX * 0.5);
    const spawnZ = THREE.MathUtils.randFloat(this.bounds.minZ * 0.5, this.bounds.maxZ * 0.5);
    fishMesh.position.set(
      spawnX,
      this.getRandomFishY(spawnX, spawnZ),
      spawnZ,
    );
    
    fishMesh.castShadow = true;
    this.group.add(fishMesh);
    
    // Criar objeto Fish
    const fish: Fish = {
      mesh: fishMesh,
      velocity: new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(2),
        THREE.MathUtils.randFloatSpread(1),
        THREE.MathUtils.randFloatSpread(2)
      ),
      targetPosition: fishMesh.position.clone(),
      speed: 1.0 + Math.random() * 2.0,
      size: size,
    };

    this.clampFishToVolume(fish);
    
    this.fishes.push(fish);
  }
  
  public update(deltaTime: number, waterLevel: number) {
    this.simulationTime += deltaTime;

    // Atualizar limite superior (água pode subir), preservando espessura mínima do volume.
    this.bounds.maxY = Math.max(
      this.bounds.minY + this.terrainClearance + 0.5,
      waterLevel - 1,
    ); // 1m abaixo da superfície
    
    for (const fish of this.fishes) {
      // === MOVIMENTO PROCEDURAL ===
      
      // 1. Escolher novo alvo ocasionalmente
      if (Math.random() < 0.01) {
        const targetX = THREE.MathUtils.randFloat(this.bounds.minX * 0.5, this.bounds.maxX * 0.5);
        const targetZ = THREE.MathUtils.randFloat(this.bounds.minZ * 0.5, this.bounds.maxZ * 0.5);
        fish.targetPosition.set(
          targetX,
          this.getRandomFishY(targetX, targetZ),
          targetZ,
        );
      }
      
      // 2. Mover em direção ao alvo
      this._direction
        .subVectors(fish.targetPosition, fish.mesh.position)
        .normalize();
      
      fish.velocity.lerp(this._direction.multiplyScalar(fish.speed), 0.05);
      
      // 3. Evitar a Arca (repulsão)
      this._toArk
        .subVectors(fish.mesh.position, this.arkPosition);
      const distToArk = this._toArk.length();
      
      if (distToArk < 80 && distToArk > 0.001) {
        const repulsion = this._toArk.normalize().multiplyScalar(3.0 / distToArk);
        fish.velocity.add(repulsion);
      }
      
      // 4. Manter dentro dos limites (repulsão das bordas + HARD LIMITS)
      const margin = 10;
      
      if (fish.mesh.position.x < this.bounds.minX + margin) {
        fish.velocity.x += 0.5;
      } else if (fish.mesh.position.x > this.bounds.maxX - margin) {
        fish.velocity.x -= 0.5;
      }

      const terrainMinY = this.getTerrainMinY(fish.mesh.position.x, fish.mesh.position.z);
      
      if (fish.mesh.position.y < terrainMinY + margin) {
        fish.velocity.y += 0.5;
      } else if (fish.mesh.position.y > this.bounds.maxY - margin) {
        fish.velocity.y -= 0.5;
      }
      
      if (fish.mesh.position.z < this.bounds.minZ + margin) {
        fish.velocity.z += 0.5;
      } else if (fish.mesh.position.z > this.bounds.maxZ - margin) {
        fish.velocity.z -= 0.5;
      }
      
      // HARD LIMITS: teleportar se escapar (BUG FIX!)
      if (fish.mesh.position.x < this.bounds.minX || fish.mesh.position.x > this.bounds.maxX) {
        fish.mesh.position.x = THREE.MathUtils.clamp(fish.mesh.position.x, this.bounds.minX, this.bounds.maxX);
        fish.velocity.x *= -0.5; // Inverter e reduzir velocidade
      }
      
      if (fish.mesh.position.y < terrainMinY || fish.mesh.position.y > this.bounds.maxY) {
        fish.mesh.position.y = THREE.MathUtils.clamp(fish.mesh.position.y, terrainMinY, this.bounds.maxY);
        fish.velocity.y *= -0.5;
      }
      
      if (fish.mesh.position.z < this.bounds.minZ || fish.mesh.position.z > this.bounds.maxZ) {
        fish.mesh.position.z = THREE.MathUtils.clamp(fish.mesh.position.z, this.bounds.minZ, this.bounds.maxZ);
        fish.velocity.z *= -0.5;
      }
      
      // 5. Limitar velocidade
      const maxSpeed = fish.speed * 1.5;
      if (fish.velocity.length() > maxSpeed) {
        fish.velocity.normalize().multiplyScalar(maxSpeed);
      }
      
      // 6. Aplicar movimento
      this._moveStep.copy(fish.velocity).multiplyScalar(deltaTime);
      fish.mesh.position.add(this._moveStep);
      this.clampFishToVolume(fish);
      
      // 7. Rotacionar peixe na direção do movimento
      if (fish.velocity.length() > 0.1) {
        const angle = Math.atan2(fish.velocity.x, fish.velocity.z);
        fish.mesh.rotation.y = angle;
        
        // Inclinação vertical
        const verticalAngle = Math.asin(fish.velocity.y / fish.velocity.length());
        fish.mesh.rotation.x = -verticalAngle;
      }
      
      // 8. Animação de nado (ondulação)
      const swimTime = this.simulationTime * 5;
      fish.mesh.rotation.z = Math.PI / 2 + Math.sin(swimTime * fish.speed) * 0.1;
    }
  }
  
  public updateArkPosition(position: THREE.Vector3) {
    this.arkPosition.copy(position);
  }
  
  public getGroup(): THREE.Group {
    return this.group;
  }
  
  public dispose() {
    for (const fish of this.fishes) {
      fish.mesh.geometry.dispose();
      if (Array.isArray(fish.mesh.material)) {
        fish.mesh.material.forEach(m => m.dispose());
      } else {
        fish.mesh.material.dispose();
      }
    }
    this.fishes = [];
  }
}
