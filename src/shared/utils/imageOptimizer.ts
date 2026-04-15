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
}

const DEFAULT_OPTIONS: Required<ImageOptimizeOptions> = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.85,
};

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
        // Calculate new dimensions
        let { width, height } = img;

        if (width > opts.maxWidth || height > opts.maxHeight) {
          const ratio = Math.min(
            opts.maxWidth / width,
            opts.maxHeight / height,
          );
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas and resize
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
