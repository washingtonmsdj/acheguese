import * as THREE from "three";
// ✅ CORREÇÃO SSOT: Importar configurações de céu
import { SKY_CONFIG } from "./config/rendering.config";

/**
 * Sistema de Céu Simples e Funcional
 * 
 * Sem dependências complexas - apenas shaders básicos
 * - Gradiente de céu (azul → laranja → preto)
 * - Sol visível (esfera brilhante)
 * - Lua visível (esfera)
 * - Estrelas (pontos)
 */

export class SimpleSkySystem {
  private scene: THREE.Scene;
  
  // Céu (hemisfera com gradiente)
  private skyDome: THREE.Mesh;
  
  // Sol (esfera brilhante)
  private sun: THREE.Mesh;
  private sunLight: THREE.DirectionalLight;
  
  // Lua (esfera)
  private moon: THREE.Mesh;
  
  // Estrelas
  private stars: THREE.Points;
  
  // Estado
  private timeOfDay: number = 12; // 0-24
  
  constructor(scene: THREE.Scene, sunLight: THREE.DirectionalLight) {
    this.scene = scene;
    this.sunLight = sunLight;
    
    // Criar céu
    this.skyDome = this.createSkyDome();
    this.scene.add(this.skyDome);
    
    // Criar sol
    this.sun = this.createSun();
    this.scene.add(this.sun);
    
    // Criar lua
    this.moon = this.createMoon();
    this.scene.add(this.moon);
    
    // Criar estrelas
    this.stars = this.createStars();
    this.scene.add(this.stars);
    
    console.log('🌅 Sistema de Céu Simples criado!');
  }
  
  private createSkyDome(): THREE.Mesh {
    // ✅ CORREÇÃO SSOT: Usar SKY_CONFIG para raio do dome
    const geometry = new THREE.SphereGeometry(SKY_CONFIG.DOME_RADIUS, 32, 15);
    
    // Shader customizado para gradiente
    const material = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0077ff) },
        bottomColor: { value: new THREE.Color(0xffffff) },
        exponent: { value: 0.6 },
        nightColor: { value: new THREE.Color(0x000033) },
        dayNightMix: { value: 1.0 }, // 0 = noite, 1 = dia
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform vec3 nightColor;
        uniform float exponent;
        uniform float dayNightMix;
        
        varying vec3 vWorldPosition;
        
        void main() {
          // Normalizar posição e pegar componente Y (altura)
          vec3 direction = normalize(vWorldPosition);
          float h = direction.y;
          
          // Gradiente baseado na altura (0 = horizonte, 1 = zênite)
          float gradient = max(pow(max(h, 0.0), exponent), 0.0);
          
          // Gradiente dia (bottomColor no horizonte → topColor no zênite)
          vec3 dayColor = mix(bottomColor, topColor, gradient);
          
          // Gradiente noite (nightColor no horizonte → nightColor*1.5 no zênite)
          vec3 nightSky = mix(nightColor, nightColor * 1.5, gradient);
          
          // Misturar dia/noite baseado em dayNightMix
          // dayNightMix = 0 → noite (nightSky)
          // dayNightMix = 1 → dia (dayColor)
          vec3 finalColor = mix(nightSky, dayColor, dayNightMix);
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false, // ✅ CRÍTICO: Desabilitar fog no céu
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = SKY_CONFIG.DOME_RENDER_ORDER; // ✅ CORREÇÃO SSOT: Usar config
    
    return mesh;
  }
  
  private createSun(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(80, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffee,
      fog: false,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = -999;
    
    return mesh;
  }
  
  private createMoon(): THREE.Mesh {
    // ✅ CORREÇÃO SSOT: Usar SKY_CONFIG para lua
    const geometry = new THREE.SphereGeometry(SKY_CONFIG.MOON.radius, SKY_CONFIG.MOON.segments, SKY_CONFIG.MOON.segments);
    const material = new THREE.MeshBasicMaterial({
      color: SKY_CONFIG.MOON.color,
      fog: false,
      transparent: true,
      opacity: 0,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = -999;
    
    return mesh;
  }
  
  private createStars(): THREE.Points {
    const starCount = 10000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
      const radius = 1700; // Dentro do skyDome
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2, // Menor para compensar distância menor
      transparent: true,
      opacity: 0,
      fog: false,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    const points = new THREE.Points(geometry, material);
    points.renderOrder = -998;
    
    return points;
  }
  
  public setTimeOfDay(hour: number): void {
    this.timeOfDay = hour % 24;
    this.update();
  }
  
  /**
   * Calcular fator dia/noite (0 = noite, 1 = dia)
   * Centralizado para evitar duplicação de lógica
   */
  private calculateDayNightFactor(hour: number): number {
    if (hour >= 6 && hour < 8) {
      // Nascer do sol (6h → 8h): 0.0 → 1.0
      return (hour - 6) / 2;
    } else if (hour >= 8 && hour < 18) {
      // Dia (8h → 18h): 1.0
      return 1.0;
    } else if (hour >= 18 && hour < 20) {
      // Pôr do sol (18h → 20h): 1.0 → 0.0
      return 1.0 - (hour - 18) / 2;
    } else {
      // Noite (20h → 6h): 0.0
      return 0.0;
    }
  }
  
  public update(): void {
    const hour = this.timeOfDay;
    const dayNightFactor = this.calculateDayNightFactor(hour);
    
    // Atualizar shader do céu
    const skyMaterial = this.skyDome.material as THREE.ShaderMaterial;
    skyMaterial.uniforms.dayNightMix.value = dayNightFactor;
    
    // Cores do céu baseadas na hora
    if (hour >= 5 && hour < 7) {
      // Nascer do sol (laranja/rosa)
      skyMaterial.uniforms.topColor.value.setHex(0xff6600);
      skyMaterial.uniforms.bottomColor.value.setHex(0xffaa66);
    } else if (hour >= 7 && hour < 17) {
      // Dia (azul)
      skyMaterial.uniforms.topColor.value.setHex(0x0077ff);
      skyMaterial.uniforms.bottomColor.value.setHex(0xaaccff);
    } else if (hour >= 17 && hour < 19) {
      // Pôr do sol (laranja/roxo)
      skyMaterial.uniforms.topColor.value.setHex(0x663399);
      skyMaterial.uniforms.bottomColor.value.setHex(0xff6600);
      period = 'por';
    } else {
      // Noite (preto/azul escuro)
      skyMaterial.uniforms.topColor.value.setHex(0x000033);
      skyMaterial.uniforms.bottomColor.value.setHex(0x000011);
    }
    
    // Log apenas quando dayNightMix muda significativamente
    // (removido: causava log contínuo a cada frame durante transições)
    
    // ✅ CRÍTICO: Marcar material como atualizado
    skyMaterial.uniformsNeedUpdate = true;
    
    // Atualizar posição do sol
    const sunAngle = ((hour - 6) / 12) * Math.PI;
    const sunDistance = 1500; // Dentro do skyDome (1800)
    this.sun.position.set(
      Math.cos(sunAngle) * sunDistance,
      Math.sin(sunAngle) * sunDistance,
      0
    );
    
    // Atualizar luz do sol
    this.sunLight.position.copy(this.sun.position);
    
    // Opacidade do sol (invisível à noite)
    (this.sun.material as THREE.MeshBasicMaterial).opacity = dayNightFactor;
    (this.sun.material as THREE.MeshBasicMaterial).transparent = dayNightFactor < 1;
    
    // Atualizar posição da lua (oposta ao sol)
    const moonAngle = sunAngle + Math.PI;
    const moonDistance = 1400; // Dentro do skyDome
    this.moon.position.set(
      Math.cos(moonAngle) * moonDistance,
      Math.sin(moonAngle) * moonDistance,
      0
    );
    
    // Opacidade da lua (visível à noite)
    (this.moon.material as THREE.MeshBasicMaterial).opacity = (1 - dayNightFactor) * 0.8;
    
    // Opacidade das estrelas (visíveis à noite)
    (this.stars.material as THREE.PointsMaterial).opacity = (1 - dayNightFactor) * 0.8;
  }
  
  public dispose(): void {
    this.scene.remove(this.skyDome);
    this.scene.remove(this.sun);
    this.scene.remove(this.moon);
    this.scene.remove(this.stars);
    
    this.skyDome.geometry.dispose();
    (this.skyDome.material as THREE.Material).dispose();
    
    this.sun.geometry.dispose();
    (this.sun.material as THREE.Material).dispose();
    
    this.moon.geometry.dispose();
    (this.moon.material as THREE.Material).dispose();
    
    this.stars.geometry.dispose();
    (this.stars.material as THREE.Material).dispose();
  }
}
