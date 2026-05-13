/**
 * Image Optimizer
 *
 * Redimensiona e otimiza imagens antes do upload.
 * Reduz tamanho de arquivo e meltime performance.
 */

export interface ImageOptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  targetWidth?: number;
  targetHeight?: number;
  fit?: "cover" | "contain";
  focalPointX?: number;
  focalPointY?: number;
}

export type ImageOptimizePreset =
  | "gastronomy_menu_item"
  | "user_avatar"
  | "post_image"
  | "professional_logo"
  | "professional_portfolio"
  | "verification_photo"
  | "site_asset"
  | "banner_image"
  | "classified_image"
  | "classified_thumbnail"
  | "business_logo"
  | "business_banner"
  | "business_gallery";

const DEFAULT_OPTIONS: Required<ImageOptimizeOptions> = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.85,
  targetWidth: 1200,
  targetHeight: 900,
  fit: "cover",
  focalPointX: 0.5,
  focalPointY: 0.5,
};

export const IMAGE_OPTIMIZE_PRESETS: Record<ImageOptimizePreset, Required<ImageOptimizeOptions>> = {
  gastronomy_menu_item: {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.86,
    targetWidth: 1200,
    targetHeight: 900,
    fit: "cover",
    focalPointX: 0.5,
    focalPointY: 0.5,
  },
  user_avatar: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.9,
    targetWidth: 400,
    targetHeight: 400,
    fit: "cover",
    focalPointX: 0.5,
    focalPointY: 0.5,
  },
  post_image: {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.86,
    targetWidth: 1280,
    targetHeight: 1280,
    fit: "contain",
    focalPointX: 0.5,
    focalPointY: 0.5,
  },
  professional_logo: {
    maxWidth: 1400,
    maxHeight: 1400,
    quality: 0.88,
    targetWidth: 800,
    targetHeight: 800,
    fit: "cover",
    focalPointX: 0.5,
    focalPointY: 0.5,
  },
  professional_portfolio: {
    maxWidth: 1800,
    maxHeight: 1800,
    quality: 0.86,
    targetWidth: 1200,
    targetHeight: 900,
    fit: "cover",
    focalPointX: 0.5,
    focalPointY: 0.5,
  },
  verification_photo: {
    maxWidth: 1800,
    maxHeight: 1800,
    quality: 0.88,
    targetWidth: 1400,
    targetHeight: 1050,
    fit: "contain",
    focalPointX: 0.5,
    focalPointY: 0.5,
  },
  site_asset: {
    maxWidth: 2200,
    maxHeight: 2200,
    quality: 0.88,
    targetWidth: 1600,
    targetHeight: 900,
    fit: "contain",
    focalPointX: 0.5,
    focalPointY: 0.5,
  },
  banner_image: {
    maxWidth: 2200,
    maxHeight: 2200,
    quality: 0.86,
    targetWidth: 1920,
    targetHeight: 1080,
    fit: "cover",
    focalPointX: 0.5,
    focalPointY: 0.5,
  },
  classified_image: {
    maxWidth: 2200,
    maxHeight: 2200,
    quality: 0.84,
    targetWidth: 1920,
    targetHeight: 1440,
    fit: "contain",
    focalPointX: 0.5,
    focalPointY: 0.5,
  },
  classified_thumbnail: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.8,
    targetWidth: 400,
    targetHeight: 300,
    fit: "cover",
    focalPointX: 0.5,
    focalPointY: 0.5,
  },
  business_logo: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.9,
    targetWidth: 800,
    targetHeight: 800,
    fit: "contain",
    focalPointX: 0.5,
    focalPointY: 0.5,
  },
  business_banner: {
    maxWidth: 2200,
    maxHeight: 2200,
    quality: 0.86,
    targetWidth: 1920,
    targetHeight: 820,
    fit: "cover",
    focalPointX: 0.5,
    focalPointY: 0.5,
  },
  business_gallery: {
    maxWidth: 1800,
    maxHeight: 1800,
    quality: 0.86,
    targetWidth: 1200,
    targetHeight: 900,
    fit: "cover",
    focalPointX: 0.5,
    focalPointY: 0.5,
  },
};

export function getImageOptimizePreset(preset: ImageOptimizePreset): Required<ImageOptimizeOptions> {
  return IMAGE_OPTIMIZE_PRESETS[preset];
}

/**
 * Resize and optimize image file
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizeOptions = {},
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const targetWidth = Math.min(opts.targetWidth, opts.maxWidth);
        const targetHeight = Math.min(opts.targetHeight, opts.maxHeight);

        if (opts.fit === "cover") {
          const sourceRatio = img.width / img.height;
          const targetRatio = targetWidth / targetHeight;
          let sx = 0;
          let sy = 0;
          let sWidth = img.width;
          let sHeight = img.height;

          if (sourceRatio > targetRatio) {
            sWidth = Math.round(img.height * targetRatio);
            const maxOffsetX = Math.max(0, img.width - sWidth);
            sx = Math.round(maxOffsetX * Math.min(Math.max(opts.focalPointX, 0), 1));
          } else if (sourceRatio < targetRatio) {
            sHeight = Math.round(img.width / targetRatio);
            const maxOffsetY = Math.max(0, img.height - sHeight);
            sy = Math.round(maxOffsetY * Math.min(Math.max(opts.focalPointY, 0), 1));
          }

          const canvas = document.createElement("canvas");
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }

          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to create blob"));
                return;
              }

              resolve(
                new File([blob], file.name, {
                  type: "image/jpeg",
                }),
              );
            },
            "image/jpeg",
            opts.quality,
          );
          return;
        }

        if (width > targetWidth || height > targetHeight) {
          const ratio = Math.min(targetWidth / width, targetHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"));
              return;
            }

            // Create optimized file
            const optimizedFile = new File([blob], file.name, {
              type: "image/jpeg",
            });

            resolve(optimizedFile);
          },
          "image/jpeg",
          opts.quality,
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions without loading full image
 */
export async function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file type
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "Arquivo deve ser uma image" };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: "Imagem muito grande (máx 10MB)" };
  }

  return { valid: true };
}
