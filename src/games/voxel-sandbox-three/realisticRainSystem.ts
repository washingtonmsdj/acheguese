import * as THREE from "three";

/**
 * Sistema de Chuva Realista com Acúmulo Gradual
 * 
 * Baseado na física bíblica:
 * - Água sobe 9m/hora = 0.0025 m/s
 * - 40 dias = 221m/dia × 40 = 8,640m total
 * 
 * Features:
 * 1. Chuva normal inicial (não torrencial)
 * 2. Terreno úmido progressivo (shader)
 * 3. Poças nas depressões (acúmulo)
 * 4. Água subindo gradualmente
 * 5. Transição para dilúvio
 */

export interface RealisticRainConfig {
  worldSize: number;
  heightAt: (x: number, z: number) => number;
  waterRiseRate: number; // m/s (padrão: 0.0025 = 9m/hora)
}

export interface RainPhase {
  name: 'dry' | 'starting' | 'light-rain' | 'heavy-rain' | 'flood';
  duration: number; // segundos
  rainIntensity: number; // 0-1
  rainParticles: number;
  rainSpeed: number; // m/s
  windSpeed: number; // m/s
}

export class RealisticRainSystem {
  private group: THREE.Group;
  private config: RealisticRainConfig;
  
  // Estado
  private currentPhase: RainPhase['name'] = 'dry';
  private phaseTime: number = 0;
  private totalTime: number = 0;
  private waterLevel: number = 0;
  
  // Terreno úmido
  private terrainMoisture: number = 0; // 0-1 (seco → encharcado)
  private puddles: Map<string, number> = new Map(); // Poças por posição
  
  // Partículas de chuva
  private rain: THREE.Points | null = null;
  private rainGeo: THREE.BufferGeometry | null = null;
  private rainMaterial: THREE.PointsMaterial | null = null;
  
  // Fases da chuva
  private phases: RainPhase[] = [
    {
      name: 'dry',
      duration: 10, // 10s sem chuva (Éden antes do dilúvio)
      rainIntensity: 0,
      rainParticles: 0,
      rainSpeed: 0,
      windSpeed: 0,
    },
    {
      name: 'starting',
      duration: 15, // 15s começando (primeiras gotas)
      rainIntensity: 0.1,
      rainParticles: 5000,
      rainSpeed: 8, // m/s (chuva leve)
      windSpeed: 2,
    },
    {
      name: 'light-rain',
      duration: 30, // 30s chuva leve
      rainIntensity: 0.3,
      rainParticles: 15000,
      rainSpeed: 12, // m/s
      windSpeed: 5,
    },
    {
      name: 'heavy-rain',
      duration: 45, // 45s chuva forte
      rainIntensity: 0.6,
      rainParticles: 40000,
      rainSpeed: 25, // m/s
      windSpeed: 10,
    },
    {
      name: 'flood',
      duration: Infinity, // Dilúvio contínuo
      rainIntensity: 1.0,
      rainParticles: 100000,
      rainSpeed: 50, // m/s (torrencial!)
      windSpeed: 15,
    },
  ];
  
  constructor(config: RealisticRainConfig) {
    this.config = config;
    this.group = new THREE.Group();
    
    this.createRainSystem();
    
    console.log('☔ Sistema de Chuva Realista criado!');
    console.log(`   Taxa de subida: ${config.waterRiseRate} m/s (${config.waterRiseRate * 3600} m/hora)`);
  }
  
  // ==========================================================================
  // CRIAÇÃO
  // ==========================================================================
  
  private createRainSystem(): void {
    // Começar com fase 'dry' (sem chuva)
    this.currentPhase = 'dry';
    this.phaseTime = 0;
  }
  
  private createRainParticles(count: number): void {
    // Limpar chuva anterior
    if (this.rain) {
      this.group.remove(this.rain);
      this.rainGeo?.dispose();
      this.rainMaterial?.dispose();
    }
    
    if (count === 0) {
      this.rain = null;
      return;
    }
    
    // Criar novas partículas
    this.rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * this.config.worldSize * 2;
      positions[i * 3 + 1] = Math.random() * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * this.config.worldSize * 2;
      velocities[i] = 1.0;
    }
    
    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rainGeo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));
    
    this.rainMaterial = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.3,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    
    this.rain = new THREE.Points(this.rainGeo, this.rainMaterial);
    this.group.add(this.rain);
  }
  
  // ==========================================================================
  // ATUALIZAÇÃO
  // ==========================================================================
  
  public update(deltaTime: number): void {
    this.totalTime += deltaTime;
    this.phaseTime += deltaTime;
    
    // Verificar transição de fase
    const currentPhaseData = this.phases.find(p => p.name === this.currentPhase);
    if (currentPhaseData && this.phaseTime >= currentPhaseData.duration) {
      this.transitionToNextPhase();
    }
    
    // Atualizar chuva
    if (this.rain && this.rainGeo) {
      this.updateRainParticles(deltaTime);
    }
    
    // Atualizar nível de água (APENAS se estiver chovendo)
    if (this.currentPhase !== 'dry') {
      this.waterLevel += this.config.waterRiseRate * deltaTime;
    }
    
    // Atualizar umidade do terreno
    this.updateTerrainMoisture(deltaTime);
    
    // Atualizar poças
    this.updatePuddles(deltaTime);
  }
  
  private transitionToNextPhase(): void {
    const currentIndex = this.phases.findIndex(p => p.name === this.currentPhase);
    if (currentIndex < this.phases.length - 1) {
      const nextPhase = this.phases[currentIndex + 1];
      this.currentPhase = nextPhase.name;
      this.phaseTime = 0;
      
      console.log(`☔ Transição para fase: ${nextPhase.name}`);
      console.log(`   Intensidade: ${nextPhase.rainIntensity}`);
      console.log(`   Partículas: ${nextPhase.rainParticles.toLocaleString()}`);
      
      // Criar novas partículas
      this.createRainParticles(nextPhase.rainParticles);
    }
  }
  
  private updateRainParticles(deltaTime: number): void {
    if (!this.rain || !this.rainGeo) return;
    
    const currentPhaseData = this.phases.find(p => p.name === this.currentPhase);
    if (!currentPhaseData) return;
    
    const positions = this.rainGeo.attributes.position as THREE.BufferAttribute;
    const velocities = this.rainGeo.attributes.velocity as THREE.BufferAttribute;
    
    for (let i = 0; i < positions.count; i++) {
      let y = positions.getY(i);
      const x = positions.getX(i);
      const z = positions.getZ(i);
      
      // Cair
      y -= currentPhaseData.rainSpeed * deltaTime;
      
      // Vento
      const windX = currentPhaseData.windSpeed * deltaTime;
      const newX = x + windX;
      
      // Verificar colisão com terreno
      const terrainHeight = this.config.heightAt(x, z);
      
      if (y < terrainHeight || y < this.waterLevel) {
        // Resetar gota
        positions.setXYZ(
          i,
          (Math.random() - 0.5) * this.config.worldSize * 2,
          80 + Math.random() * 20,
          (Math.random() - 0.5) * this.config.worldSize * 2
        );
        
        // Criar poça se atingiu terreno
        if (y < terrainHeight) {
          this.createPuddle(x, z, terrainHeight);
        }
      } else {
        positions.setXYZ(i, newX, y, z);
      }
    }
    
    positions.needsUpdate = true;
  }
  
  private updateTerrainMoisture(deltaTime: number): void {
    const currentPhaseData = this.phases.find(p => p.name === this.currentPhase);
    if (!currentPhaseData) return;
    
    // Aumentar umidade quando chove
    if (currentPhaseData.rainIntensity > 0) {
      this.terrainMoisture += currentPhaseData.rainIntensity * deltaTime * 0.1;
      this.terrainMoisture = Math.min(this.terrainMoisture, 1.0);
    } else {
      // Secar lentamente
      this.terrainMoisture -= deltaTime * 0.05;
      this.terrainMoisture = Math.max(this.terrainMoisture, 0.0);
    }
  }
  
  private createPuddle(x: number, z: number, height: number): void {
    // Criar poça em depressões (partes baixas)
    const key = `${Math.floor(x)}_${Math.floor(z)}`;
    
    // Verificar se é uma depressão (comparar com vizinhos)
    const neighbors = [
      this.config.heightAt(x + 1, z),
      this.config.heightAt(x - 1, z),
      this.config.heightAt(x, z + 1),
      this.config.heightAt(x, z - 1),
    ];
    
    const avgNeighborHeight = neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
    
    // Se for mais baixo que vizinhos, é uma depressão
    if (height < avgNeighborHeight - 0.5) {
      const currentDepth = this.puddles.get(key) || 0;
      this.puddles.set(key, Math.min(currentDepth + 0.01, 0.5)); // Máximo 0.5m
    }
  }
  
  private updatePuddles(deltaTime: number): void {
    // Poças evaporam lentamente quando não chove
    const currentPhaseData = this.phases.find(p => p.name === this.currentPhase);
    if (!currentPhaseData || currentPhaseData.rainIntensity === 0) {
      for (const [key, depth] of this.puddles.entries()) {
        const newDepth = depth - deltaTime * 0.02; // Evaporação
        if (newDepth <= 0) {
          this.puddles.delete(key);
        } else {
          this.puddles.set(key, newDepth);
        }
      }
    }
  }
  
  // ==========================================================================
  // CONTROLE
  // ==========================================================================
  
  public startRain(): void {
    if (this.currentPhase === 'dry') {
      this.transitionToNextPhase();
    }
  }
  
  public skipToPhase(phaseName: RainPhase['name']): void {
    this.currentPhase = phaseName;
    this.phaseTime = 0;
    
    const phaseData = this.phases.find(p => p.name === phaseName);
    if (phaseData) {
      this.createRainParticles(phaseData.rainParticles);
    }
  }
  
  // ==========================================================================
  // GETTERS
  // ==========================================================================
  
  public getGroup(): THREE.Group {
    return this.group;
  }
  
  public getWaterLevel(): number {
    return this.waterLevel;
  }
  
  public getCurrentPhase(): RainPhase['name'] {
    return this.currentPhase;
  }
  
  public getTerrainMoisture(): number {
    return this.terrainMoisture;
  }
  
  public getPuddleDepth(x: number, z: number): number {
    const key = `${Math.floor(x)}_${Math.floor(z)}`;
    return this.puddles.get(key) || 0;
  }
  
  public getTotalTime(): number {
    return this.totalTime;
  }
  
  public getPhaseProgress(): number {
    const currentPhaseData = this.phases.find(p => p.name === this.currentPhase);
    if (!currentPhaseData || currentPhaseData.duration === Infinity) {
      return 1.0;
    }
    return Math.min(this.phaseTime / currentPhaseData.duration, 1.0);
  }
  
  // ==========================================================================
  // SHADER PARA TERRENO ÚMIDO
  // ==========================================================================
  
  /**
   * Retorna uniforms para shader de terreno úmido
   */
  public getTerrainShaderUniforms(): Record<string, THREE.IUniform> {
    return {
      uMoisture: { value: this.terrainMoisture },
      uWaterLevel: { value: this.waterLevel },
    };
  }
  
  /**
   * Código GLSL para adicionar ao shader do terreno
   */
  public static getTerrainShaderCode(): string {
    return `
      uniform float uMoisture;
      uniform float uWaterLevel;
      
      // Aplicar efeito de umidade
      vec3 applyMoisture(vec3 color, float height) {
        // Escurecer terreno úmido
        float moistureFactor = uMoisture * 0.5;
        color = mix(color, color * 0.6, moistureFactor);
        
        // Adicionar brilho (água refletindo)
        float wetness = smoothstep(0.3, 0.8, uMoisture);
        color += vec3(0.1, 0.15, 0.2) * wetness;
        
        // Áreas submersas (poças)
        if (height < uWaterLevel) {
          float submerged = smoothstep(height, height + 0.5, uWaterLevel);
          color = mix(color, vec3(0.1, 0.2, 0.3), submerged * 0.8);
        }
        
        return color;
      }
    `;
  }
  
  // ==========================================================================
  // CLEANUP
  // ==========================================================================
  
  public dispose(): void {
    if (this.rain) {
      this.group.remove(this.rain);
    }
    this.rainGeo?.dispose();
    this.rainMaterial?.dispose();
    this.puddles.clear();
  }
}
