/**
 * Helpers para criação de labels 3D (canvas textures)
 */

import * as THREE from "three";
// ✅ CORREÇÃO SSOT: Importar constantes de UI
import { UI_LABEL_DEFAULTS } from "../config/ui.config";

/**
 * Configuração de label
 */
export interface LabelConfig {
  /** Texto do label */
  text: string;
  /** Largura do canvas (pixels) */
  width: number;
  /** Altura do canvas (pixels) */
  height: number;
  /** Tamanho da fonte (pixels) */
  fontSize: number;
  /** Cor de fundo */
  bgColor: string;
  /** Cor do texto */
  textColor?: string;
  /** Largura da borda (pixels) */
  borderWidth?: number;
  /** Cor da borda */
  borderColor?: string;
  /** Fonte (padrão: Arial) */
  fontFamily?: string;
  /** Peso da fonte (padrão: bold) */
  fontWeight?: string;
}

/**
 * Criar textura de label (canvas texture)
 * 
 * @param config - Configuração do label
 * @returns Textura do label
 * 
 * @example
 * const texture = createLabelTexture({
 *   text: "2.0m",
 *   width: 512,
 *   height: 256,
 *   fontSize: 96,
 *   bgColor: "rgba(255, 0, 0, 0.9)",
 *   textColor: "white",
 * });
 */
export function createLabelTexture(config: LabelConfig): THREE.CanvasTexture {
  const {
    text,
    width,
    height,
    fontSize,
    bgColor,
    textColor = 'white',
    borderWidth = 8,
    borderColor = 'white',
    fontFamily = 'Arial',
    fontWeight = 'bold',
  } = config;
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  
  // Fundo
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  
  // Borda
  if (borderWidth > 0) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(
      borderWidth / 2,
      borderWidth / 2,
      width - borderWidth,
      height - borderWidth
    );
  }
  
  // Texto
  ctx.fillStyle = textColor;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  
  return new THREE.CanvasTexture(canvas);
}

/**
 * Criar mesh de label 3D (billboard)
 * 
 * @param config - Configuração do label
 * @param meshWidth - Largura do mesh em metros
 * @param meshHeight - Altura do mesh em metros
 * @returns Mesh do label
 * 
 * @example
 * const label = createLabelMesh(
 *   { text: "2.0m", width: 512, height: 256, fontSize: 96, bgColor: "red" },
 *   4, // 4 metros de largura
 *   2  // 2 metros de altura
 * );
 * label.position.y = 5; // 5m acima do chão
 * scene.add(label);
 */
export function createLabelMesh(
  config: LabelConfig,
  meshWidth: number,
  meshHeight: number
): THREE.Mesh {
  const texture = createLabelTexture(config);
  
  const geometry = new THREE.PlaneGeometry(meshWidth, meshHeight);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.isBillboard = true; // Marcar como billboard
  
  return mesh;
}

/**
 * Atualizar texto de um label existente
 * 
 * @param mesh - Mesh do label
 * @param newText - Novo texto
 * @param config - Configuração original (opcional, usa valores padrão se não fornecido)
 */
export function updateLabelText(
  mesh: THREE.Mesh,
  newText: string,
  config?: Partial<LabelConfig>
): void {
  const material = mesh.material as THREE.MeshBasicMaterial;
  const oldTexture = material.map;
  
  if (!oldTexture) {
    console.warn("Label não tem textura para atualizar");
    return;
  }
  
  // Usar configuração antiga ou padrão
  // ✅ CORREÇÃO SSOT: Usar constantes de UI
  const fullConfig: LabelConfig = {
    text: newText,
    width: (oldTexture.image as { width?: number })?.width || UI_LABEL_DEFAULTS.DIMENSIONS.width,
    height: (oldTexture.image as { height?: number })?.height || UI_LABEL_DEFAULTS.DIMENSIONS.height,
    fontSize: UI_LABEL_DEFAULTS.DIMENSIONS.fontSize,
    bgColor: UI_LABEL_DEFAULTS.COLORS.background,
    ...config,
  };
  
  // Criar nova textura
  const newTexture = createLabelTexture(fullConfig);
  
  // Atualizar material
  material.map = newTexture;
  material.needsUpdate = true;
  
  // Limpar textura antiga
  oldTexture.dispose();
}

/**
 * Criar label de medição (com seta)
 * 
 * @param text - Texto do label
 * @param startPos - Posição inicial
 * @param endPos - Posição final
 * @param color - Cor da linha
 * @returns Grupo contendo linha e label
 */
export function createMeasurementLabel(
  text: string,
  startPos: THREE.Vector3,
  endPos: THREE.Vector3,
  color: THREE.ColorRepresentation = 0xffff00
): THREE.Group {
  const group = new THREE.Group();
  
  // Linha
  const lineGeo = new THREE.BufferGeometry().setFromPoints([startPos, endPos]);
  const lineMat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  const line = new THREE.Line(lineGeo, lineMat);
  group.add(line);
  
  // Label no meio
  const midPoint = new THREE.Vector3().lerpVectors(startPos, endPos, 0.5);
  const _c = new THREE.Color(color);
  const label = createLabelMesh(
    {
      text,
      ...UI_LABEL_DEFAULTS.SMALL,
      height: 128,
      fontSize: 48,
      bgColor: `rgba(${Math.round(_c.r * 255)}, ${Math.round(_c.g * 255)}, ${Math.round(_c.b * 255)}, 0.9)`,
      textColor: 'white',
    },
    2,
    1
  );
  label.position.copy(midPoint);
  group.add(label);
  
  return group;
}
