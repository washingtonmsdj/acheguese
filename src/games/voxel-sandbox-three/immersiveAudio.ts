/**
 * 🔊 SISTEMA DE ÁUDIO IMERSIVO AAA
 * 
 * Áudio procedural e dinâmico:
 * - Chuva em camadas (folhagem, solo, poças)
 * - Trovões procedural com variação
 * - Vento dinâmico baseado na intensidade do clima
 * - Ambiente oceano (ondas distantes)
 * - Positional audio para elementos da arca
 * 
 * Inspirado em:
 * - Hellblade (áudio binaural)
 * - Red Dead Redemption 2 (ambiente dinâmico)
 * - Journey (música contextual)
 */

import * as THREE from 'three';

// ============================================================================
// CONFIGURAÇÕES DE ÁUDIO
// ============================================================================

const AUDIO_CONFIG = {
  /** Master volume (0-1) */
  MASTER_VOLUME: 0.7,
  /** Distância máxima de audição */
  MAX_DISTANCE: 1000,
  /** Rolloff do áudio posicional */
  ROLLOFF_FACTOR: 0.5,
  /** Transição suave de volumes (segundos) */
  FADE_TIME: 2.0,
} as const;

// ============================================================================
// TIPOS
// ============================================================================

export type AudioLayer = 'rain-light' | 'rain-heavy' | 'thunder' | 'wind' | 'ocean' | 'ambience';

export interface AudioZone {
  position: THREE.Vector3;
  radius: number;
  type: 'rain-shelter' | 'wind-tunnel' | 'ocean-shore';
  intensity: number;
}

export interface ImmersiveAudioConfig {
  camera: THREE.Camera;
  listener: THREE.AudioListener;
  initialRainIntensity?: number; // 0-1
  initialWindSpeed?: number; // m/s
}

// ============================================================================
// GERADOR DE ÁUDIO PROCEDURAL (Web Audio API)
// ============================================================================

class ProceduralAudioGenerator {
  private audioContext: AudioContext;
  
  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  /**
   * Gerar som de chuva usando noise synthesis
   */
  generateRainSound(intensity: 'light' | 'medium' | 'heavy', duration: number): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const samples = Math.floor(duration * sampleRate);
    const buffer = this.audioContext.createBuffer(2, samples, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // Parâmetros baseados na intensidade
    const baseIntensity = intensity === 'light' ? 0.1 : intensity === 'medium' ? 0.3 : 0.6;
    const frequency = intensity === 'light' ? 8000 : intensity === 'medium' ? 5000 : 3000;
    
    for (let i = 0; i < samples; i++) {
      // Pink noise approximation
      let noise = 0;
      let amplitude = 1.0;
      for (let o = 0; o < 4; o++) {
        noise += (Math.random() * 2 - 1) * amplitude;
        amplitude *= 0.5;
      }
      
      // Aplicar low-pass filter simples (FIR)
      const filtered = this.applyLowPass(noise, frequency, sampleRate, i, leftChannel);
      
      // Variar intensidade para simular rajadas
      const variation = 1 + Math.sin(i / sampleRate * 0.5) * 0.3;
      
      leftChannel[i] = filtered * baseIntensity * variation;
      rightChannel[i] = filtered * baseIntensity * variation * (0.9 + Math.random() * 0.2);
    }
    
    return buffer;
  }
  
  /**
   * Gerar trovão procedural
   */
  generateThunderSound(distance: 'near' | 'far' | 'distant'): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = distance === 'near' ? 4 : distance === 'far' ? 6 : 8;
    const samples = Math.floor(duration * sampleRate);
    const buffer = this.audioContext.createBuffer(2, samples, sampleRate);
    
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    
    // Decay baseado na distância
    const decayRate = distance === 'near' ? 0.995 : distance === 'far' ? 0.998 : 0.999;
    const initialDelay = distance === 'near' ? 0 : distance === 'far' ? 0.3 : 0.8;
    const delaySamples = Math.floor(initialDelay * sampleRate);
    
    let amplitude = distance === 'near' ? 1.0 : distance === 'far' ? 0.6 : 0.3;
    
    for (let i = 0; i < samples; i++) {
      if (i < delaySamples) {
        left[i] = 0;
        right[i] = 0;
        continue;
      }
      
      // Brown noise (deep rumble)
      const noise = (Math.random() * 2 - 1) * amplitude;
      
      // Ocasional crackle (close lightning)
      const crackle = (Math.random() < 0.001 && distance === 'near') 
        ? (Math.random() * 2 - 1) * 0.5 
        : 0;
      
      const sample = noise + crackle;
      
      left[i] = sample * (0.8 + Math.random() * 0.4);
      right[i] = sample * (0.8 + Math.random() * 0.4);
      
      amplitude *= decayRate;
    }
    
    return buffer;
  }
  
  /**
   * Gerar som de vento
   */
  generateWindSound(speed: number, duration: number): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const samples = Math.floor(duration * sampleRate);
    const buffer = this.audioContext.createBuffer(2, samples, sampleRate);
    
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    
    // Wind é modulated noise
    const baseFreq = Math.min(500, speed * 20);
    const intensity = Math.min(0.8, speed / 30);
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      
      // Modulação lenta (gusts)
      const gust = 0.5 + 0.5 * Math.sin(t * 0.2) + 0.3 * Math.sin(t * 0.7);
      
      // White noise base
      const noise = Math.random() * 2 - 1;
      
      // Aplicar modulação
      const modulated = noise * intensity * gust;
      
      // Stereo width
      left[i] = modulated * (0.8 + Math.sin(t) * 0.2);
      right[i] = modulated * (0.8 + Math.cos(t) * 0.2);
    }
    
    return buffer;
  }
  
  /**
   * Gerar som de ondas oceânicas
   */
  generateOceanSound(intensity: number, duration: number): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const samples = Math.floor(duration * sampleRate);
    const buffer = this.audioContext.createBuffer(2, samples, sampleRate);
    
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      
      // Waves crash periodically
      const wavePeriod = 8 / Math.max(0.5, intensity); // seconds between waves
      const wavePhase = (t % wavePeriod) / wavePeriod;
      
      // Build up and crash
      let amplitude = 0;
      if (wavePhase < 0.7) {
        amplitude = wavePhase / 0.7 * 0.3; // Build up
      } else if (wavePhase < 0.9) {
        amplitude = 0.3 + (wavePhase - 0.7) / 0.2 * 0.7; // Crash
      } else {
        amplitude = Math.max(0, 1.0 - (wavePhase - 0.9) / 0.1); // Decay
      }
      
      // Noise para textura
      const noise = (Math.random() * 2 - 1) * amplitude * intensity;
      
      // Stereo para simular movimento
      const pan = Math.sin(t * 0.1);
      left[i] = noise * (1 + pan * 0.3);
      right[i] = noise * (1 - pan * 0.3);
    }
    
    return buffer;
  }
  
  private applyLowPass(
    input: number, 
    cutoff: number, 
    sampleRate: number, 
    index: number,
    buffer: Float32Array
  ): number {
    // Simple 1-pole lowpass
    const rc = 1.0 / (2 * Math.PI * cutoff);
    const dt = 1.0 / sampleRate;
    const alpha = dt / (rc + dt);
    
    if (index === 0) {
      return input * alpha;
    }
    
    return buffer[index - 1] + alpha * (input - buffer[index - 1]);
  }
  
  get context(): AudioContext {
    return this.audioContext;
  }
  
  resume(): Promise<void> {
    return this.audioContext.resume();
  }
}

// ============================================================================
// SISTEMA DE ÁUDIO IMERSIVO
// ============================================================================

export class ImmersiveAudioSystem {
  private camera: THREE.Camera;
  private listener: THREE.AudioListener;
  private audioGenerator: ProceduralAudioGenerator;
  
  // Layers de áudio
  private rainLight?: THREE.Audio;
  private rainHeavy?: THREE.Audio;
  private thunder?: THREE.PositionalAudio;
  private wind?: THREE.Audio;
  private ocean?: THREE.Audio;
  private ambience?: THREE.Audio;
  
  // Estado
  private currentRainIntensity = 0;
  private currentWindSpeed = 0;
  private isInitialized = false;
  private thunderTimeout?: number;
  
  // Zonas de áudio
  private zones: AudioZone[] = [];
  
  constructor(config: ImmersiveAudioConfig) {
    this.camera = config.camera;
    this.listener = config.listener;
    this.currentRainIntensity = config.initialRainIntensity ?? 0;
    this.currentWindSpeed = config.initialWindSpeed ?? 0;
    
    this.audioGenerator = new ProceduralAudioGenerator();
    
    // Adicionar listener à câmera
    this.camera.add(this.listener);
    
    console.log('🔊 Sistema de Áudio Imersivo criado!');
  }
  
  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    await this.audioGenerator.resume();
    
    // Criar buffers de áudio procedurais
    const rainLightBuffer = this.audioGenerator.generateRainSound('light', 10);
    const rainHeavyBuffer = this.audioGenerator.generateRainSound('heavy', 10);
    const windBuffer = this.audioGenerator.generateWindSound(10, 15);
    const oceanBuffer = this.audioGenerator.generateOceanSound(0.5, 20);
    
    // Chuva leve (loop)
    this.rainLight = new THREE.Audio(this.listener);
    this.rainLight.setBuffer(rainLightBuffer);
    this.rainLight.setLoop(true);
    this.rainLight.setVolume(0);
    
    // Chuva forte (loop)
    this.rainHeavy = new THREE.Audio(this.listener);
    this.rainHeavy.setBuffer(rainHeavyBuffer);
    this.rainHeavy.setLoop(true);
    this.rainHeavy.setVolume(0);
    
    // Vento (loop)
    this.wind = new THREE.Audio(this.listener);
    this.wind.setBuffer(windBuffer);
    this.wind.setLoop(true);
    this.wind.setVolume(0.3);
    this.wind.play();
    
    // Oceano distante (loop)
    this.ocean = new THREE.Audio(this.listener);
    this.ocean.setBuffer(oceanBuffer);
    this.ocean.setLoop(true);
    this.ocean.setVolume(0.2);
    this.ocean.play();
    
    this.isInitialized = true;
    
    console.log('✅ Sistema de áudio inicializado');
    console.log('   Layers: rain-light, rain-heavy, wind, ocean');
  }
  
  /**
   * Atualizar intensidade da chuva
   */
  setRainIntensity(intensity: number, duration: number = AUDIO_CONFIG.FADE_TIME): void {
    if (!this.isInitialized) return;
    
    this.currentRainIntensity = Math.max(0, Math.min(1, intensity));
    
    // Crossfade entre chuva leve e forte
    const lightVolume = Math.max(0, 1 - this.currentRainIntensity * 2) * 0.5;
    const heavyVolume = Math.max(0, (this.currentRainIntensity - 0.3) * 1.4) * 0.8;
    
    this.fadeAudio(this.rainLight!, lightVolume, duration);
    this.fadeAudio(this.rainHeavy!, heavyVolume, duration);
    
    // Trigger thunder se intensidade alta
    if (this.currentRainIntensity > 0.7 && Math.random() < 0.3) {
      this.triggerThunder();
    }
  }
  
  /**
   * Atualizar velocidade do vento
   */
  setWindSpeed(speed: number, duration: number = AUDIO_CONFIG.FADE_TIME): void {
    if (!this.isInitialized) return;
    
    this.currentWindSpeed = speed;
    const volume = Math.min(0.8, speed / 40);
    this.fadeAudio(this.wind!, volume, duration);
  }
  
  /**
   * Trigger trovão
   */
  triggerThunder(distance: 'near' | 'far' | 'distant' = 'far'): void {
    if (!this.isInitialized) return;
    
    const thunderBuffer = this.audioGenerator.generateThunderSound(distance);
    
    // Usar THREE.Audio (global) — PositionalAudio requer Object3D na cena
    // O volume simula a distância
    const volumeByDistance = distance === 'near' ? 0.9 : distance === 'far' ? 0.5 : 0.2;
    
    this.thunder = new THREE.PositionalAudio(this.listener);
    this.thunder.setBuffer(thunderBuffer);
    this.thunder.setRefDistance(200);
    this.thunder.setRolloffFactor(0.3);
    this.thunder.setVolume(volumeByDistance);
    
    // Adicionar ao listener para ter posição relativa à câmera
    this.listener.add(this.thunder);
    
    // Posicionar aleatoriamente relativo ao listener
    const angle = Math.random() * Math.PI * 2;
    const dist = distance === 'near' ? 100 : distance === 'far' ? 300 : 600;
    this.thunder.position.set(
      Math.cos(angle) * dist,
      200,
      Math.sin(angle) * dist,
    );
    
    this.thunder.play();
    
    // Auto-cleanup
    setTimeout(() => {
      if (this.thunder) {
        this.listener.remove(this.thunder);
        this.thunder.disconnect();
        this.thunder = undefined;
      }
    }, thunderBuffer.duration * 1000);
  }
  
  /**
   * Configurar oceano baseado na intensidade do dilúvio
   */
  setOceanIntensity(intensity: number): void {
    if (!this.isInitialized || !this.ocean) return;
    
    const volume = 0.2 + intensity * 0.5;
    this.fadeAudio(this.ocean, volume, 3.0);
  }
  
  /**
   * Adicionar zona de áudio
   */
  addZone(zone: AudioZone): void {
    this.zones.push(zone);
  }
  
  /**
   * Atualizar sistema (chamar no loop)
   */
  update(deltaTime: number): void {
    if (!this.isInitialized) return;
    
    // Verificar zonas
    const cameraPos = this.camera.position;
    
    for (const zone of this.zones) {
      const dist = cameraPos.distanceTo(zone.position);
      
      if (dist < zone.radius) {
        // Dentro da zona - aplicar efeito
        const factor = 1 - (dist / zone.radius);
        
        switch (zone.type) {
          case 'rain-shelter':
            // Reduzir som de chuva
            if (this.rainLight && this.rainHeavy) {
              const reduction = factor * zone.intensity;
              this.rainLight.setVolume(this.rainLight.getVolume() * (1 - reduction * 0.5));
              this.rainHeavy.setVolume(this.rainHeavy.getVolume() * (1 - reduction * 0.8));
            }
            break;
            
          case 'wind-tunnel':
            // Aumentar vento
            if (this.wind) {
              this.wind.setVolume(Math.min(1, this.wind.getVolume() * (1 + factor * 0.5)));
            }
            break;
            
          case 'ocean-shore':
            // Ondas mais próximas — ocean é THREE.Audio (global), sem posição 3D
            if (this.ocean) {
              const targetVol = Math.min(0.8, 0.2 + factor * zone.intensity * 0.6);
              this.ocean.setVolume(targetVol);
            }
            break;
        }
      }
    }
    
    // Thunder random
    if (this.currentRainIntensity > 0.6 && Math.random() < 0.001) {
      const dist = Math.random() < 0.3 ? 'near' : Math.random() < 0.6 ? 'far' : 'distant';
      this.triggerThunder(dist);
    }
  }
  
  private fadeAudio(audio: THREE.Audio, targetVolume: number, duration: number): void {
    const startVolume = audio.getVolume();
    const startTime = performance.now();
    
    const fade = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const t = Math.min(1, elapsed / duration);
      
      const current = startVolume + (targetVolume - startVolume) * t;
      audio.setVolume(current);
      
      if (t < 1) {
        requestAnimationFrame(fade);
      }
    };
    
    fade();
  }
  
  dispose(): void {
    if (this.thunder) {
      this.listener.remove(this.thunder);
      this.thunder.disconnect();
      this.thunder = undefined;
    }
    this.rainLight?.disconnect();
    this.rainHeavy?.disconnect();
    this.wind?.disconnect();
    this.ocean?.disconnect();
    this.ambience?.disconnect();
    
    this.audioGenerator.context.close();
  }
}
