import * as THREE from "three";
import { SimpleSkySystem } from "./simpleSkySystem";

// ✅ SSOT: Importar constantes de iluminação AAA da engine
import { 
  LIGHTING_CONSTANTS,
  type DayPeriod,
  getDayPeriod,
} from "@/lib/constants/systems/weather";

/**
 * Sistema de Clima Dinâmico AAA
 * 
 * ✨ VISUAL UPGRADE: Iluminação dramática + cores vibrantes
 * 
 * Evolução natural do clima durante o dilúvio:
 * 1. Céu claro → Nublado → Tempestade → Dilúvio
 * 2. Iluminação dinâmica (dia → tarde → noite)
 * 3. Neblina progressiva
 * 4. Arco-íris pós-dilúvio
 * 5. Partículas atmosféricas (poeira, névoa)
 * 
 * Inspirado em:
 * - Red Dead Redemption 2 (clima dinâmico + God Rays)
 * - The Witcher 3 (transições suaves + iluminação dramática)
 * - Zelda BOTW (atmosfera + cores vibrantes)
 */

export type WeatherPhase = 
  | "clear"           // Céu claro (pré-dilúvio)
  | "cloudy"          // Nublado (começando)
  | "overcast"        // Encoberto (escurecendo)
  | "storm"           // Tempestade (trovões)
  | "deluge"          // Dilúvio (apocalíptico)
  | "aftermath";      // Pós-dilúvio (arco-íris)

export interface WeatherConfig {
  phase: WeatherPhase;
  transition: number;  // 0-1 (transição suave entre fases)
  timeOfDay: number;   // 0-24 (hora do dia)
  windSpeed: number;   // m/s
  windDirection: THREE.Vector2;
  visibility: number;  // 0-1 (0=neblina densa, 1=claro)
}

export interface DynamicWeatherSystemConfig {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  initialPhase?: WeatherPhase;
  autoProgress?: boolean; // Progride automaticamente com o tempo
  dayNightCycle?: boolean; // Habilita ciclo dia/noite
  dayNightSpeed?: number; // Velocidade do ciclo (1 = tempo real, 60 = 1 min real = 1 hora)
  initialTimeOfDay?: number; // Hora inicial (0-24)
}

export class DynamicWeatherSystem {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  
  // Estado atual
  private currentPhase: WeatherPhase;
  private targetPhase: WeatherPhase;
  private transition: number = 0; // 0-1
  private timeOfDay: number = 12; // 12h (meio-dia)
  private dayNightCycleEnabled: boolean = true; // Ciclo dia/noite ativo
  private dayNightSpeed: number = 1; // Velocidade do ciclo (1 = tempo real, 60 = 1 min real = 1 hora no jogo)
  private windSpeed: number = 2; // m/s
  private windDirection: THREE.Vector2 = new THREE.Vector2(1, 0.3).normalize();
  private windTime = 0;
  
  // Iluminação
  private sunLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private skyColor: THREE.Color = new THREE.Color();
  private fogColor: THREE.Color = new THREE.Color();
  
  // Céu procedural (sol, lua, estrelas)
  private simpleSky: SimpleSkySystem | null = null;
  
  // Neblina
  private fog: THREE.FogExp2;
  
  // Partículas atmosféricas
  private atmosphericParticles: THREE.Points | null = null;
  
  // Arco-íris (pós-dilúvio)
  private rainbow: THREE.Mesh | null = null;
  
  // Configuração
  private autoProgress: boolean;
  
  constructor(config: DynamicWeatherSystemConfig) {
    this.scene = config.scene;
    this.camera = config.camera;
    this.renderer = config.renderer;
    this.currentPhase = config.initialPhase || "clear";
    this.targetPhase = this.currentPhase;
    this.autoProgress = config.autoProgress ?? false;
    this.dayNightCycleEnabled = config.dayNightCycle ?? true;
    this.dayNightSpeed = config.dayNightSpeed ?? 60; // Padrão: 1 min real = 1 hora no jogo
    this.timeOfDay = config.initialTimeOfDay ?? 12; // Padrão: meio-dia
    
    // Configurar renderer para Sky funcionar
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.5;
    
    // Criar iluminação
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
    this.sunLight.position.set(30, 80, 50);
    this.sunLight.castShadow = true;
    this.scene.add(this.sunLight);
    
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(this.ambientLight);
    
    // Criar neblina
    this.fog = new THREE.FogExp2(0xcccccc, 0.001);
    this.scene.fog = this.fog;
    
    // Criar partículas atmosféricas
    this.createAtmosphericParticles();
    
    // Criar céu procedural simples (sol, lua, estrelas)
    this.createSimpleSky();
    
    console.log(`🌤️ Sistema de Clima Dinâmico inicializado: ${this.currentPhase}`);
    console.log(`🌅 Ciclo dia/noite: ${this.dayNightCycleEnabled ? 'ATIVO' : 'DESATIVADO'} (velocidade: ${this.dayNightSpeed}x)`);
    console.log(`⏰ Hora inicial: ${this.formatTime(this.timeOfDay)}`);
  }
  
  // ==========================================================================
  // CONTROLE DE FASE
  // ==========================================================================
  
  /**
   * Mudar para uma nova fase do clima
   */
  public setPhase(phase: WeatherPhase, immediate: boolean = false): void {
    // Evitar loop infinito (não mudar se já está na fase alvo)
    if (phase === this.targetPhase) return;
    
    this.targetPhase = phase;
    
    if (immediate) {
      this.currentPhase = phase;
      this.transition = 1;
    } else {
      this.transition = 0;
    }
  }
  
  /**
   * Obter fase atual
   */
  public getPhase(): WeatherPhase {
    return this.currentPhase;
  }
  
  /**
   * Obter luz direcional do sol (para sistemas externos)
   */
  public getSunLight(): THREE.DirectionalLight {
    return this.sunLight;
  }

  /**
   * Obter configuração atual do clima
   */
  public getConfig(): WeatherConfig {
    return {
      phase: this.currentPhase,
      transition: this.transition,
      timeOfDay: this.timeOfDay,
      windSpeed: this.windSpeed,
      windDirection: this.windDirection.clone(),
      visibility: this.getVisibility(),
    };
  }
  
  /**
   * Habilitar/desabilitar ciclo dia/noite
   */
  public setDayNightCycle(enabled: boolean): void {
    this.dayNightCycleEnabled = enabled;
    console.log(`🌅 Ciclo dia/noite: ${enabled ? 'ATIVADO' : 'DESATIVADO'}`);
  }
  
  /**
   * Definir velocidade do ciclo dia/noite
   */
  public setDayNightSpeed(speed: number): void {
    this.dayNightSpeed = Math.max(1, speed);
    console.log(`⏰ Velocidade do ciclo: ${this.dayNightSpeed}x`);
  }
  
  /**
   * Definir hora do dia manualmente
   */
  public setTimeOfDay(hour: number): void {
    this.timeOfDay = hour % 24;
  }
  
  // ==========================================================================
  // UPDATE
  // ==========================================================================
  
  public update(dt: number, floodProgress: number): void {
    // Atualizar ciclo dia/noite
    if (this.dayNightCycleEnabled) {
      this.updateDayNightCycle(dt);
    }
    
    // Progressão automática baseada no dilúvio
    if (this.autoProgress) {
      this.updateAutoProgress(floodProgress);
    }
    
    // Transição suave entre fases
    if (this.currentPhase !== this.targetPhase) {
      this.transition = Math.min(1, this.transition + dt * 0.2); // 5 segundos para transição
      
      if (this.transition >= 1) {
        this.currentPhase = this.targetPhase;
        this.transition = 1;
      }
    }
    
    // Atualizar iluminação
    this.updateLighting(dt);
    
    // Atualizar neblina
    this.updateFog(dt);

    // Atualizar vento antes das partículas para manter o frame coerente
    this.updateWind(dt);
    
    // Atualizar partículas atmosféricas
    this.updateAtmosphericParticles(dt);
    
    // Atualizar arco-íris (se fase aftermath)
    this.updateRainbow(dt);
    
    // Atualizar céu procedural simples (sol, lua, estrelas)
    this.updateSimpleSky(dt);
    
  }
  
  /**
   * Atualizar ciclo dia/noite
   */
  private updateDayNightCycle(dt: number): void {
    // Avançar tempo (dt em segundos, dayNightSpeed é multiplicador)
    // 1 hora no jogo = 3600 segundos reais / dayNightSpeed
    const hoursPerSecond = this.dayNightSpeed / 3600;
    this.timeOfDay += dt * hoursPerSecond;
    
    // Wrap around (0-24 horas)
    if (this.timeOfDay >= 24) {
      this.timeOfDay -= 24;
    }
  }
  
  /**
   * Progressão automática baseada no progresso do dilúvio
   */
  private updateAutoProgress(floodProgress: number): void {
    if (floodProgress < 0.1) {
      this.setPhase("clear");
    } else if (floodProgress < 0.25) {
      this.setPhase("cloudy");
    } else if (floodProgress < 0.5) {
      this.setPhase("overcast");
    } else if (floodProgress < 0.75) {
      this.setPhase("storm");
    } else if (floodProgress < 1.0) {
      this.setPhase("deluge");
    } else {
      this.setPhase("aftermath");
    }
  }
  
  // ==========================================================================
  // ILUMINAÇÃO
  // ==========================================================================
  
  private updateLighting(dt: number): void {
    const config = this.getPhaseConfig(this.currentPhase);
    const targetConfig = this.getPhaseConfig(this.targetPhase);
    
    // Interpolar entre configurações
    const t = this.transition;
    
    // === CICLO DIA/NOITE COM ILUMINAÇÃO AAA ===
    const period = getDayPeriod(this.timeOfDay);
    
    // ✅ SSOT: Usar constantes de iluminação AAA da engine
    const baseSunIntensity = LIGHTING_CONSTANTS.SUN_INTENSITY[period];
    const sunColor = new THREE.Color(LIGHTING_CONSTANTS.SUN_COLOR[period]);
    const baseAmbientIntensity = LIGHTING_CONSTANTS.AMBIENT_INTENSITY[period];
    const ambientColor = new THREE.Color(LIGHTING_CONSTANTS.AMBIENT_COLOR[period]);
    
    // Ajustar por fase do clima (tempestade escurece)
    const phaseMultiplier = THREE.MathUtils.lerp(
      config.sunIntensity / 1.8, // Normalizar (1.8 era o padrão)
      targetConfig.sunIntensity / 1.8,
      t
    );
    
    // Luz do sol (afetada por dia/noite E clima)
    this.sunLight.intensity = baseSunIntensity * phaseMultiplier;
    this.sunLight.color.copy(sunColor);
    
    // Luz ambiente (afetada por dia/noite E clima)
    const ambientPhaseMultiplier = THREE.MathUtils.lerp(
      config.ambientIntensity / 0.8, // Normalizar (0.8 era o padrão)
      targetConfig.ambientIntensity / 0.8,
      t
    );
    this.ambientLight.intensity = baseAmbientIntensity * ambientPhaseMultiplier;
    this.ambientLight.color.copy(ambientColor);
    
    // Posição do sol (baseada na hora do dia)
    const sunAngle = this.getSunAngle();
    const sunDistance = 100;
    this.sunLight.position.set(
      Math.cos(sunAngle) * sunDistance,
      Math.sin(sunAngle) * sunDistance,
      50
    );
    
    // ✅ SSOT: Atualizar exposição do tone mapping (mais brilho!)
    this.renderer.toneMappingExposure = LIGHTING_CONSTANTS.TONE_MAPPING_EXPOSURE[period];
  }
  
  /**
   * Calcular fator de iluminação dia/noite (0-1)
   * 0 = noite total, 1 = dia total
   */
  private getDayNightFactor(): number {
    const hour = this.timeOfDay;
    
    // Nascer do sol: 6h (0.2) → 8h (1.0)
    // Pôr do sol: 18h (1.0) → 20h (0.2)
    // Noite: 20h-6h (0.2)
    
    if (hour >= 6 && hour < 8) {
      // Nascer do sol (6h → 8h)
      return THREE.MathUtils.lerp(0.2, 1.0, (hour - 6) / 2);
    } else if (hour >= 8 && hour < 18) {
      // Dia (8h → 18h)
      return 1.0;
    } else if (hour >= 18 && hour < 20) {
      // Pôr do sol (18h → 20h)
      return THREE.MathUtils.lerp(1.0, 0.2, (hour - 18) / 2);
    } else {
      // Noite (20h → 6h)
      return 0.2;
    }
  }
  
  /**
   * Calcular ângulo do sol baseado na hora do dia
   */
  private getSunAngle(): number {
    const hour = this.timeOfDay;
    
    // Sol nasce às 6h (0°), meio-dia às 12h (90°), pôr do sol às 18h (180°)
    // Normalizar: 6h = 0, 12h = 0.5, 18h = 1
    const normalizedTime = (hour - 6) / 12; // 0-1 (6h-18h)
    
    // Ângulo: 0° (horizonte) → 90° (zênite) → 0° (horizonte)
    // Usar seno para movimento suave
    const angle = Math.PI * Math.max(0, Math.min(1, normalizedTime));
    
    return angle;
  }
  
  // ==========================================================================
  // NEBLINA
  // ==========================================================================
  
  private updateFog(dt: number): void {
    const config = this.getPhaseConfig(this.currentPhase);
    const targetConfig = this.getPhaseConfig(this.targetPhase);
    
    const t = this.transition;
    
    // Densidade da neblina
    const fogDensity = THREE.MathUtils.lerp(
      config.fogDensity,
      targetConfig.fogDensity,
      t
    );
    this.fog.density = fogDensity;
    
    // Cor da neblina
    this.fogColor.lerpColors(
      new THREE.Color(config.fogColor),
      new THREE.Color(targetConfig.fogColor),
      t
    );
    this.fog.color.copy(this.fogColor);
  }
  
  // ==========================================================================
  // PARTÍCULAS ATMOSFÉRICAS
  // ==========================================================================
  
  private createAtmosphericParticles(): void {
    const particleCount = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const centerX = this.camera.position.x;
    const centerZ = this.camera.position.z;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Posição aleatória em um volume grande
      positions[i3] = centerX + (Math.random() - 0.5) * 300;
      positions[i3 + 1] = Math.random() * 100;
      positions[i3 + 2] = centerZ + (Math.random() - 0.5) * 300;
      
      // Velocidade aleatória (deriva lenta)
      velocities[i3] = (Math.random() - 0.5) * 0.5;
      velocities[i3 + 1] = -Math.random() * 0.2; // Cai lentamente
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    this.atmosphericParticles = new THREE.Points(geometry, material);
    this.scene.add(this.atmosphericParticles);
  }
  
  private updateAtmosphericParticles(dt: number): void {
    if (!this.atmosphericParticles) return;
    
    const config = this.getPhaseConfig(this.currentPhase);
    const targetConfig = this.getPhaseConfig(this.targetPhase);
    const t = this.transition;
    
    // Opacidade baseada na fase
    const opacity = THREE.MathUtils.lerp(
      config.particleOpacity,
      targetConfig.particleOpacity,
      t
    );
    (this.atmosphericParticles.material as THREE.PointsMaterial).opacity = opacity;
    
    // Atualizar posições
    const positions = this.atmosphericParticles.geometry.attributes.position;
    const velocities = this.atmosphericParticles.geometry.attributes.velocity;
    const centerX = this.camera.position.x;
    const centerZ = this.camera.position.z;
    
    for (let i = 0; i < positions.count; i++) {
      const i3 = i * 3;
      
      // Aplicar velocidade
      positions.array[i3] += velocities.array[i3] * dt;
      positions.array[i3 + 1] += velocities.array[i3 + 1] * dt;
      positions.array[i3 + 2] += velocities.array[i3 + 2] * dt;

      // Vento global do sistema (sincroniza atmosfera com clima atual)
      positions.array[i3] += this.windDirection.x * this.windSpeed * dt * 0.15;
      positions.array[i3 + 2] += this.windDirection.y * this.windSpeed * dt * 0.15;
      
      // Resetar se sair dos limites
      if (positions.array[i3 + 1] < 0) {
        positions.array[i3 + 1] = 100;
      }
      
      if (Math.abs(positions.array[i3] - centerX) > 150) {
        positions.array[i3] = centerX + (Math.random() - 0.5) * 300;
      }
      
      if (Math.abs(positions.array[i3 + 2] - centerZ) > 150) {
        positions.array[i3 + 2] = centerZ + (Math.random() - 0.5) * 300;
      }
    }
    
    positions.needsUpdate = true;
  }
  
  // ==========================================================================
  // CÉU PROCEDURAL SIMPLES (Sol, Lua, Estrelas)
  // ==========================================================================
  
  private createSimpleSky(): void {
    // Criar sistema de céu simples
    this.simpleSky = new SimpleSkySystem(
      this.scene,
      this.sunLight
    );
    
    // Definir hora inicial
    this.simpleSky.setTimeOfDay(this.timeOfDay);
    
    console.log('🌅 Sistema de Céu Simples criado!');
  }
  
  private updateSimpleSky(dt: number): void {
    if (!this.simpleSky) return;
    
    // Atualizar hora do dia no céu
    this.simpleSky.setTimeOfDay(this.timeOfDay);
  }
  
  // ==========================================================================
  // ARCO-ÍRIS (Pós-Dilúvio)
  // ==========================================================================
  
  private updateRainbow(dt: number): void {
    if (this.currentPhase === "aftermath" && !this.rainbow) {
      this.createRainbow();
    } else if (this.currentPhase !== "aftermath" && this.rainbow) {
      this.scene.remove(this.rainbow);
      this.rainbow.geometry.dispose();
      (this.rainbow.material as THREE.Material).dispose();
      this.rainbow = null;
    }
    
    // Fazer arco-íris sempre olhar para câmera
    if (this.rainbow) {
      this.rainbow.lookAt(this.camera.position);
    }
  }
  
  private createRainbow(): void {
    const geometry = new THREE.PlaneGeometry(200, 100);
    
    // Shader customizado para arco-íris
    const material = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        
        vec3 rainbow(float t) {
          vec3 c = vec3(0.0);
          c.r = sin(t * 6.28318 + 0.0) * 0.5 + 0.5;
          c.g = sin(t * 6.28318 + 2.09439) * 0.5 + 0.5;
          c.b = sin(t * 6.28318 + 4.18879) * 0.5 + 0.5;
          return c;
        }
        
        void main() {
          float dist = length(vUv - vec2(0.5, 1.0));
          float arc = smoothstep(0.5, 0.45, dist) - smoothstep(0.4, 0.35, dist);
          
          vec3 color = rainbow(vUv.x);
          float alpha = arc * 0.6;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
    
    this.rainbow = new THREE.Mesh(geometry, material);
    this.rainbow.position.set(0, 50, -100);
    this.scene.add(this.rainbow);
    
    console.log("🌈 Arco-íris criado!");
  }
  
  // ==========================================================================
  // VENTO
  // ==========================================================================
  
  private updateWind(dt: number): void {
    const config = this.getPhaseConfig(this.currentPhase);
    const targetConfig = this.getPhaseConfig(this.targetPhase);
    const t = this.transition;
    this.windTime += dt;
    
    // Velocidade do vento
    this.windSpeed = THREE.MathUtils.lerp(
      config.windSpeed,
      targetConfig.windSpeed,
      t
    );
    
    // Direção do vento (varia levemente)
    const windAngle = Math.sin(this.windTime * 0.12) * 0.3;
    this.windDirection.set(
      Math.cos(windAngle),
      0.35 + Math.sin(this.windTime * 0.07) * 0.25
    ).normalize();
  }
  
  // ==========================================================================
  // CONFIGURAÇÕES POR FASE
  // ==========================================================================
  
  private getPhaseConfig(phase: WeatherPhase) {
    const configs = {
      clear: {
        skyColor: 0x87CEEB,        // Azul céu claro
        sunIntensity: 1.8,
        sunColor: 0xFFFAF0,        // Branco quente
        sunAngle: Math.PI / 3,     // 60° (meio-dia)
        ambientIntensity: 0.8,
        ambientColor: 0xFFFFE0,    // Amarelo claro
        fogDensity: 0.0005,
        fogColor: 0xE0F0FF,        // Azul muito claro
        particleOpacity: 0.1,
        windSpeed: 2,
      },
      cloudy: {
        skyColor: 0xB0C4DE,        // Azul acinzentado
        sunIntensity: 1.2,
        sunColor: 0xFFF8DC,        // Branco amarelado
        sunAngle: Math.PI / 3.5,   // 51° (tarde)
        ambientIntensity: 0.7,
        ambientColor: 0xE0E0E0,    // Cinza claro
        fogDensity: 0.001,
        fogColor: 0xD0D0D0,
        particleOpacity: 0.2,
        windSpeed: 4,
      },
      overcast: {
        skyColor: 0x708090,        // Cinza escuro
        sunIntensity: 0.6,
        sunColor: 0xE0E0E0,        // Cinza
        sunAngle: Math.PI / 4,     // 45° (tarde)
        ambientIntensity: 0.5,
        ambientColor: 0xC0C0C0,    // Cinza médio
        fogDensity: 0.002,
        fogColor: 0xA0A0A0,
        particleOpacity: 0.3,
        windSpeed: 8,
      },
      storm: {
        skyColor: 0x4A5568,        // Cinza muito escuro
        sunIntensity: 0.3,
        sunColor: 0xB0B0B0,        // Cinza escuro
        sunAngle: Math.PI / 6,     // 30° (quase noite)
        ambientIntensity: 0.3,
        ambientColor: 0x808080,    // Cinza
        fogDensity: 0.003,
        fogColor: 0x606060,
        particleOpacity: 0.4,
        windSpeed: 15,
      },
      deluge: {
        skyColor: 0x2D3748,        // Quase preto
        sunIntensity: 0.1,
        sunColor: 0x808080,        // Cinza escuro
        sunAngle: Math.PI / 12,    // 15° (noite)
        ambientIntensity: 0.2,
        ambientColor: 0x606060,    // Cinza escuro
        fogDensity: 0.005,
        fogColor: 0x404040,
        particleOpacity: 0.5,
        windSpeed: 25,
      },
      aftermath: {
        skyColor: 0x87CEEB,        // Azul céu claro (volta ao normal)
        sunIntensity: 1.5,
        sunColor: 0xFFFFE0,        // Amarelo claro
        sunAngle: Math.PI / 2.5,   // 72° (manhã)
        ambientIntensity: 0.9,
        ambientColor: 0xFFFFE0,    // Amarelo claro
        fogDensity: 0.0003,
        fogColor: 0xF0F8FF,        // Azul muito claro
        particleOpacity: 0.05,
        windSpeed: 1,
      },
    };
    
    return configs[phase];
  }
  
  // ==========================================================================
  // HELPERS
  // ==========================================================================
  
  private getVisibility(): number {
    const config = this.getPhaseConfig(this.currentPhase);
    return 1 - config.fogDensity * 200; // 0-1
  }
  
  /**
   * Formatar hora do dia (0-24) para string legível
   */
  private formatTime(hour: number): string {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
  
  /**
   * Obter período do dia
   */
  public getTimeOfDayPeriod(): string {
    const hour = this.timeOfDay;
    
    if (hour >= 6 && hour < 8) return "🌅 Nascer do sol";
    if (hour >= 8 && hour < 12) return "🌄 Manhã";
    if (hour >= 12 && hour < 18) return "☀️ Tarde";
    if (hour >= 18 && hour < 20) return "🌇 Pôr do sol";
    return "🌙 Noite";
  }
  
  // ==========================================================================
  // CLEANUP
  // ==========================================================================
  
  public dispose(): void {
    if (this.atmosphericParticles) {
      this.scene.remove(this.atmosphericParticles);
      this.atmosphericParticles.geometry.dispose();
      (this.atmosphericParticles.material as THREE.Material).dispose();
    }
    
    if (this.rainbow) {
      this.scene.remove(this.rainbow);
      this.rainbow.geometry.dispose();
      (this.rainbow.material as THREE.Material).dispose();
    }
    
    if (this.simpleSky) {
      this.simpleSky.dispose();
      this.simpleSky = null;
    }
    
    this.scene.remove(this.sunLight);
    this.scene.remove(this.ambientLight);
  }
}
