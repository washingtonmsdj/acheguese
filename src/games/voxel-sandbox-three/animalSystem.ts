import * as THREE from "three";
import { RigidBody, type PhysicsWorld, type RigidBodyConfig } from "@/lib/ordax/physics/PhysicsWorld";
import type { HeightfieldTerrainSample } from "@/lib/ordax/terrain";

/**
 * Sistema de Animais para Arca de Noé
 * 
 * ✅ PROFISSIONAL: Usa PhysicsWorld para colisão com terreno
 * ✅ Sem gambiarras: Animais são RigidBody como qualquer objeto
 * ✅ Física universal: Gravidade, colisão, flutuação
 * 
 * Gerencia animais terrestres, voadores e aquáticos com:
 * - IA básica (pathfinding, comportamento)
 * - Animação procedural
 * - Reação ao dilúvio (fogem para Arca)
 * 
 * Inspirado em:
 * - Red Dead Redemption 2 (IA de animais)
 * - Minecraft (comportamento simples mas efetivo)
 * - Zoo Tycoon (variedade de espécies)
 */

// ==========================================================================
// TYPES
// ==========================================================================

export type AnimalType = 'terrestrial' | 'flying' | 'aquatic';
export type AnimalSpecies = 'sheep' | 'lion' | 'bird' | 'elephant';
export type AnimalState = 'idle' | 'walking' | 'running' | 'fleeing' | 'boarding';

export interface Animal {
  id: string;
  type: AnimalType;
  species: AnimalSpecies;
  
  // ✅ PROFISSIONAL: Animal é um RigidBody
  rigidBody: RigidBody;
  
  // Estado
  state: AnimalState;
  
  // Características
  walkSpeed: number;
  runSpeed: number;
  size: THREE.Vector3;
  
  // IA
  target: THREE.Vector3 | null;
  idleTimer: number;
  
  // Animação
  animationTime: number;
}

export interface AnimalSystemConfig {
  scene: THREE.Scene;
  arkPosition: THREE.Vector3;
  physicsWorld: PhysicsWorld;
  sampleTerrain: (x: number, z: number) => HeightfieldTerrainSample;
}

// ==========================================================================
// ANIMAL SYSTEM
// ==========================================================================

export class AnimalSystem {
  private scene: THREE.Scene;
  private arkPosition: THREE.Vector3;
  private physicsWorld: PhysicsWorld;
  private sampleTerrain: (x: number, z: number) => HeightfieldTerrainSample;
  
  private animals: Animal[] = [];
  private nextId: number = 0;

  // Vetores reutilizáveis para evitar alocações no loop de update
  private readonly _dir = new THREE.Vector3();
  
  constructor(config: AnimalSystemConfig) {
    this.scene = config.scene;
    this.arkPosition = config.arkPosition;
    this.physicsWorld = config.physicsWorld;
    this.sampleTerrain = config.sampleTerrain;
    
    console.log('🦁 Sistema de Animais criado (com PhysicsWorld)!');
  }
  
  // ==========================================================================
  // SPAWN
  // ==========================================================================
  
  /**
   * Criar um animal
   */
  public spawnAnimal(species: AnimalSpecies, position: THREE.Vector3): Animal {
    // ✅ PROFISSIONAL: Spawnar BEM ACIMA do terreno (não dentro!)
    const terrainSample = this.sampleTerrain(position.x, position.z);
    const spawnHeight = terrainSample.height + 20; // 20m acima! (margem MUITO maior)
    const spawnPosition = new THREE.Vector3(
      terrainSample.x,
      spawnHeight,
      terrainSample.z
    );
    
    // Criar mesh
    const mesh = this.createAnimalMesh(species);
    mesh.position.copy(spawnPosition);
    this.scene.add(mesh);
    
    console.log(`🦁 Spawn ${species}: ground=${terrainSample.height.toFixed(1)}m, spawn=${spawnHeight.toFixed(1)}m, pos=(${spawnPosition.x.toFixed(1)}, ${spawnPosition.y.toFixed(1)}, ${spawnPosition.z.toFixed(1)})`);
    
    // Obter stats da espécie
    const stats = this.getAnimalStats(species);
    
    // ✅ PROFISSIONAL: Criar RigidBody para física
    const rigidBodyConfig: RigidBodyConfig = {
      mass: stats.mass,
      volume: stats.size.x * stats.size.y * stats.size.z,
      dimensions: stats.size.clone(),
      centerOfMass: new THREE.Vector3(0, stats.size.y * 0.5, 0),
      dragCoefficient: 0.5,
    };
    
    const rigidBody = new RigidBody(rigidBodyConfig, mesh);
    
    // Adicionar ao PhysicsWorld
    this.physicsWorld.addBody(rigidBody);
    
    const animal: Animal = {
      id: `animal_${this.nextId++}`,
      type: this.getAnimalType(species),
      species,
      rigidBody,
      state: 'idle',
      
      // Características baseadas na espécie
      ...stats,
      
      // IA
      target: null,
      idleTimer: 0,
      
      // Animação
      animationTime: 0,
    };
    
    this.animals.push(animal);
    
    console.log(`✅ ${species} criado:`);
    console.log(`   Posição: (${spawnPosition.x.toFixed(1)}, ${spawnPosition.y.toFixed(1)}, ${spawnPosition.z.toFixed(1)})`);
    console.log(`   Massa: ${stats.mass}kg, Volume: ${(stats.size.x * stats.size.y * stats.size.z).toFixed(2)}m³`);
    console.log(`   Densidade: ${(stats.mass / (stats.size.x * stats.size.y * stats.size.z)).toFixed(1)}kg/m³`);
    console.log(`   RigidBody adicionado ao PhysicsWorld`);
    
    return animal;
  }
  
  /**
   * Criar um rebanho de animais
   */
  public spawnHerd(species: AnimalSpecies, count: number, center: THREE.Vector3, radius: number = 10): Animal[] {
    const herd: Animal[] = [];
    
    for (let i = 0; i < count; i++) {
      // Posição aleatória ao redor do centro
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      const position = new THREE.Vector3(
        center.x + Math.cos(angle) * distance,
        0,
        center.z + Math.sin(angle) * distance
      );
      
      const animal = this.spawnAnimal(species, position);
      herd.push(animal);
    }
    
    console.log(`🦁 Rebanho de ${count} ${species}s criado!`);
    
    return herd;
  }
  
  // ==========================================================================
  // UPDATE
  // ==========================================================================
  
  public update(dt: number, floodLevel: number): void {
    for (const animal of this.animals) {
      // Atualizar IA
      this.updateAnimalAI(animal, dt, floodLevel);

      // Atualizar animação
      this.updateAnimalAnimation(animal, dt);
    }
  }
  
  /**
   * Atualizar IA do animal
   */
  private updateAnimalAI(animal: Animal, dt: number, floodLevel: number): void {
    const position = animal.rigidBody.position;
    
    // Verificar se precisa fugir para Arca
    if (floodLevel > position.y - 2 && animal.state !== 'boarding' && animal.state !== 'fleeing') {
      animal.state = 'fleeing';
      animal.target = this.arkPosition.clone();
    }
    
    // Atualizar comportamento baseado no estado
    switch (animal.state) {
      case 'idle':
        this.updateIdle(animal, dt);
        break;
      case 'walking':
        this.updateWalking(animal, dt);
        break;
      case 'fleeing':
        this.updateFleeing(animal, dt);
        break;
      case 'boarding':
        this.updateBoarding(animal, dt);
        break;
    }
  }
  
  private updateIdle(animal: Animal, dt: number): void {
    animal.idleTimer += dt;
    
    // Zerar velocidade (parado)
    animal.rigidBody.velocity.set(0, animal.rigidBody.velocity.y, 0);
    
    // Após 3-5 segundos, escolher novo destino
    if (animal.idleTimer > 3 + Math.random() * 2) {
      animal.state = 'walking';
      animal.target = this.getRandomNearbyPoint(animal.rigidBody.position, 10);
      animal.idleTimer = 0;
    }
  }
  
  private updateWalking(animal: Animal, dt: number): void {
    if (!animal.target) return;

    const position = animal.rigidBody.position;

    this._dir.subVectors(animal.target, position).normalize();

    animal.rigidBody.velocity.x = this._dir.x * animal.walkSpeed;
    animal.rigidBody.velocity.z = this._dir.z * animal.walkSpeed;

    const angle = Math.atan2(this._dir.x, this._dir.z);
    animal.rigidBody.rotation.y = angle;
    animal.rigidBody.mesh.rotation.y = angle;

    if (position.distanceTo(animal.target) < 1) {
      animal.state = 'idle';
      animal.target = null;
      animal.rigidBody.velocity.set(0, animal.rigidBody.velocity.y, 0);
    }
  }

  private updateFleeing(animal: Animal, dt: number): void {
    if (!animal.target) return;

    const position = animal.rigidBody.position;

    this._dir.subVectors(animal.target, position).normalize();

    animal.rigidBody.velocity.x = this._dir.x * animal.runSpeed;
    animal.rigidBody.velocity.z = this._dir.z * animal.runSpeed;

    const angle = Math.atan2(this._dir.x, this._dir.z);
    animal.rigidBody.rotation.y = angle;
    animal.rigidBody.mesh.rotation.y = angle;

    if (position.distanceTo(animal.target) < 10) {
      animal.state = 'boarding';
      animal.rigidBody.velocity.set(0, animal.rigidBody.velocity.y, 0);
    }
  }
  
  private updateBoarding(animal: Animal, dt: number): void {
    // Fade out (animal entra na Arca)
    animal.rigidBody.mesh.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const material = obj.material;
        if (Array.isArray(material)) {
          material.forEach(m => {
            m.transparent = true;
            m.opacity -= dt * 0.5;
          });
        } else {
          material.transparent = true;
          material.opacity -= dt * 0.5;
        }
      }
    });
    
    // Remover quando invisível
    const firstMesh = animal.rigidBody.mesh.children.find(c => c instanceof THREE.Mesh) as THREE.Mesh;
    if (firstMesh) {
      const material = firstMesh.material;
      const opacity = Array.isArray(material) ? material[0].opacity : material.opacity;
      if (opacity <= 0) {
        this.removeAnimal(animal);
        console.log(`🚢 ${animal.species} embarcou com sucesso!`);
      }
    }
  }
  
  /**
   * Atualizar animação do animal
   */
  private updateAnimalAnimation(animal: Animal, dt: number): void {
    animal.animationTime += dt;
    
    // Animação baseada no estado
    if (animal.state === 'walking' || animal.state === 'fleeing') {
      const speed = animal.state === 'fleeing' ? animal.runSpeed : animal.walkSpeed;
      this.animateWalk(animal, speed);
    } else if (animal.state === 'idle') {
      this.animateIdle(animal);
    }
  }
  
  private animateWalk(animal: Animal, speed: number): void {
    const time = animal.animationTime;
    const mesh = animal.rigidBody.mesh;
    
    // Encontrar modelo do animal (sheep_model, lion_model, etc)
    const model = mesh.children.find(child => child.name.includes('_model')) as THREE.Group;
    if (!model) return;
    
    // ✅ FASE 2: Animação de caminhada com pernas
    
    // Pernas alternam (sin/cos)
    const legAngle = Math.sin(time * speed * 5) * 0.3;
    
    const legFL = model.children.find(c => c.name === 'leg_fl');
    const legFR = model.children.find(c => c.name === 'leg_fr');
    const legBL = model.children.find(c => c.name === 'leg_bl');
    const legBR = model.children.find(c => c.name === 'leg_br');
    
    if (legFL) legFL.rotation.x = legAngle;   // Frente esquerda
    if (legFR) legFR.rotation.x = -legAngle;  // Frente direita
    if (legBL) legBL.rotation.x = -legAngle;  // Trás esquerda
    if (legBR) legBR.rotation.x = legAngle;   // Trás direita
    
    // Corpo balança levemente (vertical)
    const body = model.children.find(c => c.name === 'body');
    if (body) {
      const originalY = body.userData.originalY ?? body.position.y;
      body.userData.originalY = originalY;
      body.position.y = originalY + Math.sin(time * speed * 10) * 0.02;
      
      // Corpo balança lateralmente
      body.rotation.z = Math.sin(time * speed * 5) * 0.05;
    }
    
    // Cabeça balança (olha ao redor)
    const head = model.children.find(c => c.name === 'head');
    if (head) {
      head.rotation.y = Math.sin(time * speed * 3) * 0.1;
    }
    
    // Cauda balança (se tiver)
    const tail = model.children.find(c => c.name === 'tail');
    if (tail) {
      const originalRotX = tail.userData.originalRotX ?? tail.rotation.x;
      tail.userData.originalRotX = originalRotX;
      tail.rotation.x = originalRotX + Math.sin(time * speed * 4) * 0.1;
    }
  }
  
  private animateIdle(animal: Animal): void {
    const time = animal.animationTime;
    const mesh = animal.rigidBody.mesh;
    
    // Encontrar modelo do animal
    const model = mesh.children.find(child => child.name.includes('_model')) as THREE.Group;
    if (!model) return;
    
    // Respiração suave (corpo sobe/desce)
    const body = model.children.find(c => c.name === 'body');
    if (body) {
      const originalY = body.userData.originalY ?? body.position.y;
      body.userData.originalY = originalY;
      body.position.y = originalY + Math.sin(time * 2) * 0.01;
    }
    
    // Cabeça olha ao redor (lento)
    const head = model.children.find(c => c.name === 'head');
    if (head) {
      head.rotation.y = Math.sin(time * 1) * 0.2;
    }
    
    // Cauda balança levemente (se tiver)
    const tail = model.children.find(c => c.name === 'tail');
    if (tail) {
      const originalRotX = tail.userData.originalRotX ?? tail.rotation.x;
      tail.userData.originalRotX = originalRotX;
      tail.rotation.x = originalRotX + Math.sin(time * 2) * 0.05;
    }
  }
  
  // ==========================================================================
  // HELPERS
  // ==========================================================================
  
  private getAnimalType(species: AnimalSpecies): AnimalType {
    switch (species) {
      case 'bird':
        return 'flying';
      case 'sheep':
      case 'lion':
      case 'elephant':
        return 'terrestrial';
      default:
        return 'terrestrial';
    }
  }
  
  private getAnimalStats(species: AnimalSpecies) {
    const stats = {
      sheep: {
        walkSpeed: 2,
        runSpeed: 5,
        size: new THREE.Vector3(1, 0.6, 0.8),
        mass: 50, // kg (ovelha adulta)
      },
      lion: {
        walkSpeed: 3,
        runSpeed: 15,
        size: new THREE.Vector3(2, 1, 1.2),
        mass: 190, // kg (leão adulto)
      },
      bird: {
        walkSpeed: 5,
        runSpeed: 10,
        size: new THREE.Vector3(0.3, 0.2, 0.2),
        mass: 0.5, // kg (pássaro médio)
      },
      elephant: {
        walkSpeed: 2,
        runSpeed: 8,
        size: new THREE.Vector3(4, 3, 3),
        mass: 5000, // kg (elefante adulto)
      },
    };
    
    return stats[species];
  }
  
  private getRandomNearbyPoint(position: THREE.Vector3, radius: number): THREE.Vector3 {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;

    const terrainSample = this.sampleTerrain(
      position.x + Math.cos(angle) * distance,
      position.z + Math.sin(angle) * distance
    );

    return new THREE.Vector3(
      terrainSample.x,
      terrainSample.height,
      terrainSample.z
    );
  }
  
  private createAnimalMesh(species: AnimalSpecies): THREE.Group {
    const group = new THREE.Group();
    group.name = species;
    
    // ✅ FASE 2: Geometria realista baseada na espécie
    let animalMesh: THREE.Group;
    
    switch (species) {
      case 'sheep':
        animalMesh = this.createSheepGeometry();
        break;
      case 'lion':
        animalMesh = this.createLionGeometry();
        break;
      case 'bird':
        animalMesh = this.createBirdGeometry();
        break;
      case 'elephant':
        animalMesh = this.createElephantGeometry();
        break;
      default:
        animalMesh = this.createSimpleCube(species);
    }
    
    group.add(animalMesh);
    
    console.log(`🎨 Mesh ${species} criado (geometria realista)`);
    
    return group;
  }
  
  /**
   * 🐑 OVELHA: Corpo branco + Cabeça preta + 4 Pernas
   */
  private createSheepGeometry(): THREE.Group {
    const sheep = new THREE.Group();
    sheep.name = 'sheep_model';
    
    // Corpo (cilindro horizontal, branco)
    const bodyGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.8, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xEEEEEE, // Branco
      roughness: 0.9,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2; // Horizontal
    body.position.y = 0.3;
    body.castShadow = true;
    body.receiveShadow = true;
    body.name = 'body';
    sheep.add(body);
    
    // Cabeça (esfera, preta)
    const headGeo = new THREE.SphereGeometry(0.2, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x333333, // Preto
      roughness: 0.8,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0.5, 0.35, 0);
    head.castShadow = true;
    head.name = 'head';
    sheep.add(head);
    
    // 4 Pernas (cilindros, pretos)
    const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x333333, // Preto
      roughness: 0.8,
    });
    
    const legPositions = [
      { x: 0.25, z: 0.2, name: 'leg_fl' },  // Frente esquerda
      { x: 0.25, z: -0.2, name: 'leg_fr' }, // Frente direita
      { x: -0.25, z: 0.2, name: 'leg_bl' }, // Trás esquerda
      { x: -0.25, z: -0.2, name: 'leg_br' },// Trás direita
    ];
    
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeo, legMat.clone());
      leg.position.set(pos.x, 0.2, pos.z);
      leg.castShadow = true;
      leg.name = pos.name;
      sheep.add(leg);
    });
    
    return sheep;
  }
  
  /**
   * 🦁 LEÃO: Corpo bege + Juba marrom + Cauda + 4 Pernas
   */
  private createLionGeometry(): THREE.Group {
    const lion = new THREE.Group();
    lion.name = 'lion_model';
    
    // Corpo (cilindro horizontal, bege)
    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.45, 1.2, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xD4A574, // Bege
      roughness: 0.8,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2; // Horizontal
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    body.name = 'body';
    lion.add(body);
    
    // Juba (esfera, marrom escuro)
    const maneGeo = new THREE.SphereGeometry(0.45, 12, 12);
    const maneMat = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Marrom
      roughness: 1.0,
    });
    const mane = new THREE.Mesh(maneGeo, maneMat);
    mane.position.set(0.6, 0.55, 0);
    mane.castShadow = true;
    mane.name = 'mane';
    lion.add(mane);
    
    // Cabeça (esfera, bege) - dentro da juba
    const headGeo = new THREE.SphereGeometry(0.3, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xD4A574, // Bege
      roughness: 0.8,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0.7, 0.55, 0);
    head.castShadow = true;
    head.name = 'head';
    lion.add(head);
    
    // 4 Pernas (cilindros, bege)
    const legGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0xD4A574, // Bege
      roughness: 0.8,
    });
    
    const legPositions = [
      { x: 0.4, z: 0.25, name: 'leg_fl' },
      { x: 0.4, z: -0.25, name: 'leg_fr' },
      { x: -0.4, z: 0.25, name: 'leg_bl' },
      { x: -0.4, z: -0.25, name: 'leg_br' },
    ];
    
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeo, legMat.clone());
      leg.position.set(pos.x, 0.3, pos.z);
      leg.castShadow = true;
      leg.name = pos.name;
      lion.add(leg);
    });
    
    // Cauda (cilindro fino, bege)
    const tailGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6);
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xD4A574, // Bege
      roughness: 0.8,
    });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.rotation.x = Math.PI / 4; // Inclinado
    tail.position.set(-0.8, 0.4, 0);
    tail.castShadow = true;
    tail.name = 'tail';
    lion.add(tail);
    
    // Tufo da cauda (esfera pequena, marrom)
    const tufGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const tufMat = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Marrom
      roughness: 1.0,
    });
    const tuf = new THREE.Mesh(tufGeo, tufMat);
    tuf.position.set(-1.1, 0.2, 0);
    tuf.castShadow = true;
    tuf.name = 'tail_tuf';
    lion.add(tuf);
    
    return lion;
  }
  
  /**
   * 🐦 PÁSSARO: Corpo + Asas + Cabeça (placeholder)
   */
  private createBirdGeometry(): THREE.Group {
    const bird = new THREE.Group();
    bird.name = 'bird_model';
    
    // Corpo (elipsoide)
    const bodyGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Marrom
      roughness: 0.8,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.scale.set(1, 0.8, 1.5);
    body.position.y = 0.1;
    body.castShadow = true;
    body.name = 'body';
    bird.add(body);
    
    // Cabeça (esfera pequena)
    const headGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.set(0, 0.15, 0.2);
    head.castShadow = true;
    head.name = 'head';
    bird.add(head);
    
    return bird;
  }
  
  /**
   * 🐘 ELEFANTE: Corpo + Tromba + Orelhas (placeholder)
   */
  private createElephantGeometry(): THREE.Group {
    const elephant = new THREE.Group();
    elephant.name = 'elephant_model';
    
    // Corpo grande (cilindro)
    const bodyGeo = new THREE.CylinderGeometry(1.2, 1.3, 2.5, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x888888, // Cinza
      roughness: 0.9,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 1.5;
    body.castShadow = true;
    body.name = 'body';
    elephant.add(body);
    
    return elephant;
  }
  
  /**
   * Fallback: Cubo simples (para espécies não implementadas)
   */
  private createSimpleCube(species: AnimalSpecies): THREE.Group {
    const group = new THREE.Group();
    const stats = this.getAnimalStats(species);
    const size = stats.size;
    
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const material = new THREE.MeshStandardMaterial({
      color: this.getAnimalColor(species),
      roughness: 0.8,
      metalness: 0.2,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = size.y * 0.5;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    
    return group;
  }
  
  private getAnimalColor(species: AnimalSpecies): number {
    switch (species) {
      case 'sheep':
        return 0xEEEEEE; // Branco
      case 'lion':
        return 0xD4A574; // Bege
      case 'bird':
        return 0x8B4513; // Marrom
      case 'elephant':
        return 0x888888; // Cinza
      default:
        return 0xFF0000; // Vermelho (fallback)
    }
  }
  
  private removeAnimal(animal: Animal): void {
    // ✅ PROFISSIONAL: Remover do PhysicsWorld
    this.physicsWorld.removeBody(animal.rigidBody);
    
    this.scene.remove(animal.rigidBody.mesh);
    
    // Dispose geometries and materials
    animal.rigidBody.mesh.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    
    // Remove from array
    const index = this.animals.indexOf(animal);
    if (index > -1) {
      this.animals.splice(index, 1);
    }
  }
  
  // ==========================================================================
  // PUBLIC API
  // ==========================================================================
  
  public getAnimals(): Animal[] {
    return this.animals;
  }
  
  public getAnimalCount(): number {
    return this.animals.length;
  }
  
  public dispose(): void {
    for (const animal of this.animals) {
      // ✅ PROFISSIONAL: Remover do PhysicsWorld
      this.physicsWorld.removeBody(animal.rigidBody);
      
      this.scene.remove(animal.rigidBody.mesh);
      animal.rigidBody.mesh.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    }
    
    this.animals = [];
    console.log('🦁 Sistema de Animais destruído');
  }
}
