/**
 * SSOT - Image Optimization Utilities
 * 
 * Utilities para otimização de imagens:
 * - Resize automático
 * - Conversão para WebP
 * - Compressão
 * - Supabase Storage integration
 * 
 * @version 1.0.0
 */

/**
 * Image size presets
 */
export const IMAGE_SIZES = {
  THUMBNAIL: { width: 150, height: 150 },
  SMALL: { width: 320, height: 320 },
  MEDIUM: { width: 640, height: 640 },
  LARGE: { width: 1280, height: 1280 },
  XLARGE: { width: 1920, height: 1920 },
} as const;

/**
 * Image quality presets
 */
export const IMAGE_QUALITY = {
  LOW: 60,
  MEDIUM: 75,
  HIGH: 85,
  ULTRA: 95,
} as const;

/**
 * Supabase Storage transform options
 */
export interface StorageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'origin';
  resize?: 'cover' | 'contain' | 'fill';
}

/**
 * Get optimized image URL from Supabase Storage
 * 
 * Supabase Storage supports automatic image transformation:
 * https://supabase.com/docs/guides/storage/serving/image-transformations
 * 
 * @param publicUrl - Public URL from Supabase Storage
 * @param options - Transform options
 * @returns Optimized image URL
 * 
 * @example
 * const url = getOptimizedImageUrl(publicUrl, {
 *   width: 640,
 *   quality: 80,
 *   format: 'webp'
 * });
 */
export function getOptimizedImageUrl(
  publicUrl: string,
  options: StorageTransformOptions = {}
): string {
  if (!publicUrl) return '';

  // Se não é URL do Supabase, retorna original
  if (!publicUrl.includes('supabase.co/storage')) {
    return publicUrl;
  }

  const {
    width,
    height,
    quality = IMAGE_QUALITY.MEDIUM,
    format = 'webp',
    resize = 'cover',
  } = options;

  // Constrói query params para transformação
  const params = new URLSearchParams();

  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  if (quality) params.append('quality', quality.toString());
  if (format !== 'origin') params.append('format', format);
  if (resize) params.append('resize', resize);

  // Adiciona params à URL
  const separator = publicUrl.includes('?') ? '&' : '?';
  return `${publicUrl}${separator}${params.toString()}`;
}

/**
 * Get responsive image URLs (srcset)
 * 
 * @param publicUrl - Public URL from Supabase Storage
 * @param sizes - Array of widths
 * @returns Object with srcset and sizes
 * 
 * @example
 * const { srcset, sizes } = getResponsiveImageUrls(publicUrl, [320, 640, 1280]);
 */
export function getResponsiveImageUrls(
  publicUrl: string,
  sizes: number[] = [320, 640, 1280]
): {
  srcset: string;
  sizes: string;
} {
  const srcset = sizes
    .map((width) => {
      const url = getOptimizedImageUrl(publicUrl, { width });
      return `${url} ${width}w`;
    })
    .join(', ');

  // Generate sizes attribute
  const sizesAttr = sizes
    .map((width, index) => {
      if (index === sizes.length - 1) {
        return `${width}px`;
      }
      return `(max-width: ${width}px) ${width}px`;
    })
    .join(', ');

  return { srcset, sizes: sizesAttr };
}

/**
 * Compress image file before upload
 * 
 * Uses browser-image-compression library
 * 
 * @param file - Image file
 * @param options - Compression options
 * @returns Compressed file
 */
export async function compressImage(
  file: File,
  options: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
    quality?: number;
  } = {}
): Promise<File> {
  // Lazy load compression library
  const imageCompression = await import('browser-image-compression');

  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1920,
    useWebWorker = true,
    quality = 0.8,
  } = options;

  try {
    const compressedFile = await imageCompression.default(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker,
      initialQuality: quality,
    });

    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    return file; // Return original if compression fails
  }
}

/**
 * Validate image file
 * 
 * @param file - File to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateImageFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSizeMB = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  } = options;

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Permitidos: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Get image dimensions from file
 * 
 * @param file - Image file
 * @returns Promise with width and height
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Generate thumbnail from image file
 * 
 * @param file - Image file
 * @param size - Thumbnail size (default: 150x150)
 * @returns Promise with thumbnail blob
 */
export async function generateThumbnail(
  file: File,
  size: number = 150
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Calculate dimensions (square crop)
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;

      // Set canvas size
      canvas.width = size;
      canvas.height = size;

      // Draw image
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail'));
          }
        },
        'image/jpeg',
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Check if browser supports WebP
 */
export function supportsWebP(): boolean {
  if (typeof window === 'undefined') return false;

  const elem = document.createElement('canvas');
  if (elem.getContext && elem.getContext('2d')) {
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
}

/**
 * Check if browser supports AVIF
 */
export function supportsAVIF(): boolean {
  if (typeof window === 'undefined') return false;

  const elem = document.createElement('canvas');
  if (elem.getContext && elem.getContext('2d')) {
    return elem.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }
  return false;
}

/**
 * Get best supported image format
 */
export function getBestImageFormat(): 'avif' | 'webp' | 'jpeg' {
  if (supportsAVIF()) return 'avif';
  if (supportsWebP()) return 'webp';
  return 'jpeg';
}
