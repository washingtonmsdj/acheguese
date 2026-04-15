/**
 * Helpers para carregamento de texturas com validação
 */

import * as THREE from "three";
import { logger } from "./logger";

/**
 * Resultado do carregamento de textura
 */
export interface TextureLoadResult {
  texture: THREE.Texture | null;
  error: Error | null;
}

/**
 * Carregar textura com validação e callbacks
 */
export async function loadTextureWithValidation(
  path: string,
  onSuccess?: (texture: THREE.Texture) => void,
  onError?: (error: Error) => void
): Promise<TextureLoadResult> {
  const loader = new THREE.TextureLoader();

  return new Promise((resolve) => {
    loader.load(
      path,
      (texture) => {
        logger.info(`✅ Textura carregada: ${path}`);
        onSuccess?.(texture);
        resolve({ texture, error: null });
      },
      undefined,
      (error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error(`❌ Erro ao carregar textura: ${path}`, err);
        onError?.(err);
        resolve({ texture: null, error: err });
      }
    );
  });
}

/**
 * Carregar múltiplas texturas com validação
 * 
 * @param paths - Array de caminhos de texturas
 * @returns Promise com array de resultados
 */
export async function loadMultipleTextures(
  paths: string[]
): Promise<TextureLoadResult[]> {
  return Promise.all(
    paths.map(path => loadTextureWithValidation(path))
  );
}

/**
 * Configurar textura de terreno (repeat, anisotropy, etc)
 * 
 * @param texture - Textura a configurar
 * @param repeat - Repetição (padrão: 1)
 * @param anisotropy - Anisotropia (padrão: 8)
 */
export function configureTerrainTexture(
  texture: THREE.Texture,
  repeat: number = 1,
  anisotropy: number = 8
): void {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
}

/**
 * Configurar textura de água (normal map)
 * 
 * @param texture - Textura a configurar
 * @param repeat - Repetição (padrão: 8)
 */
export function configureWaterNormalTexture(
  texture: THREE.Texture,
  repeat: number = 8
): void {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.needsUpdate = true;
}

/**
 * Criar textura de fallback (cor sólida)
 * 
 * @param color - Cor da textura
 * @param size - Tamanho da textura (padrão: 1x1)
 * @returns Textura de fallback
 */
export function createFallbackTexture(
  color: THREE.ColorRepresentation = 0x808080,
  size: number = 1
): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const colorObj = new THREE.Color(color);
  ctx.fillStyle = `rgb(${colorObj.r * 255}, ${colorObj.g * 255}, ${colorObj.b * 255})`;
  ctx.fillRect(0, 0, size, size);
  
  return new THREE.CanvasTexture(canvas);
}
