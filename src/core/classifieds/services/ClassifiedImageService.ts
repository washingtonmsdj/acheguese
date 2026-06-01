/**
 * 📸 SSOT: CLASSIFIED IMAGE SERVICE
 *
 * Serviço centralizado para upload, compressão e gerenciamento de imagens de classificados.
 * 
 * Features:
 * - Upload para Supabase Storage
 * - Compressão automática de imagens
 * - Geração de thumbnails
 * - Validação de tipo e tamanho
 * - Otimização de performance
 */
import { logger } from '@/shared/utils/logger';
import imageCompression from "browser-image-compression";
import { CLASSIFIED_UPLOAD_LIMITS } from "../constants/upload-limits";
import { mediaService } from "@/core/media/services/MediaService";
// ─── Constants ────────────────────────────────────────────────

const STORAGE_BUCKET = "classified-images";

const IMAGE_CONSTRAINTS = {
  maxSizeMB: 5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/webp" as const,
} as const;

const THUMBNAIL_CONSTRAINTS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 400,
  useWebWorker: true,
  fileType: "image/webp" as const,
} as const;

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

// ─── Types ────────────────────────────────────────────────────

export interface UploadedImage {
  url: string;
  thumbnailUrl: string;
  fileName: string;
  size: number;
  width?: number;
  height?: number;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: "compressing" | "uploading" | "complete" | "error";
  error?: string;
}

// ─── Service ──────────────────────────────────────────────────

export class ClassifiedImageService {
  /**
   * Valida se o arquivo é uma imagem válida.
   */
  static validateImage(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo não suportado. Use: ${ALLOWED_TYPES.join(", ")}`,
      };
    }

    if (file.size > CLASSIFIED_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `Arquivo muito grande. Máximo: ${CLASSIFIED_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Comprime uma imagem mantendo qualidade aceitável.
   */
  static async compressImage(file: File): Promise<File> {
    try {
      const compressed = await imageCompression(file, IMAGE_CONSTRAINTS);
      return compressed;
    } catch (error) {
      logger.error("Erro ao comprimir imagem:", error);
      throw new Error("Falha ao comprimir imagem");
    }
  }

  /**
   * Gera thumbnail de uma imagem.
   */
  static async generateThumbnail(file: File): Promise<File> {
    try {
      const thumbnail = await imageCompression(file, THUMBNAIL_CONSTRAINTS);
      return thumbnail;
    } catch (error) {
      logger.error("Erro ao gerar thumbnail:", error);
      throw new Error("Falha ao gerar thumbnail");
    }
  }

  /**
   * Obtém dimensões de uma imagem.
   */
  static async getImageDimensions(
    file: File
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Falha ao carregar imagem"));
      };

      img.src = url;
    });
  }

  /**
   * Faz upload de uma imagem para o Supabase Storage.
   */
  static async uploadToStorage(
    file: File,
    userId: string,
    folder: "images" | "thumbnails"
  ): Promise<string> {
    const upload = await mediaService.uploadToBucket(file, {
      bucket: "classified-images",
      pathPrefix: `${userId}/${folder}`,
      preset: folder === "images" ? "classified_image" : "classified_thumbnail",
      upsert: false,
    });
    return upload.url;
  }

  /**
   * Upload completo: valida, comprime, gera thumbnail e faz upload.
   */
  static async uploadClassifiedImage(
    file: File,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadedImage> {
    // 1. Validação
    const validation = this.validateImage(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    try {
      // 2. Compressão da imagem principal
      onProgress?.({
        fileName: file.name,
        progress: 20,
        status: "compressing",
      });

      const [compressedImage, dimensions] = await Promise.all([
        this.compressImage(file),
        this.getImageDimensions(file),
      ]);

      // 3. Geração de thumbnail
      onProgress?.({
        fileName: file.name,
        progress: 40,
        status: "compressing",
      });

      const thumbnail = await this.generateThumbnail(file);

      // 4. Upload da imagem principal
      onProgress?.({
        fileName: file.name,
        progress: 60,
        status: "uploading",
      });

      const imageUrl = await this.uploadToStorage(
        compressedImage,
        userId,
        "images"
      );

      // 5. Upload do thumbnail
      onProgress?.({
        fileName: file.name,
        progress: 80,
        status: "uploading",
      });

      const thumbnailUrl = await this.uploadToStorage(
        thumbnail,
        userId,
        "thumbnails"
      );

      // 6. Completo
      onProgress?.({
        fileName: file.name,
        progress: 100,
        status: "complete",
      });

      return {
        url: imageUrl,
        thumbnailUrl,
        fileName: file.name,
        size: compressedImage.size,
        width: dimensions.width,
        height: dimensions.height,
      };
    } catch (error) {
      onProgress?.({
        fileName: file.name,
        progress: 0,
        status: "error",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
      throw error;
    }
  }

  /**
   * Upload de múltiplas imagens em paralelo.
   */
  static async uploadMultipleImages(
    files: File[],
    userId: string,
    onProgress?: (fileName: string, progress: UploadProgress) => void
  ): Promise<UploadedImage[]> {
    const uploads = files.map((file) =>
      this.uploadClassifiedImage(file, userId, (progress) => {
        onProgress?.(file.name, progress);
      })
    );

    return Promise.all(uploads);
  }

  /**
   * Deleta uma imagem e seu thumbnail do storage.
   */
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extrair path do URL
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
      
      if (!pathMatch) {
        throw new Error("URL inválida");
      }

      const filePath = pathMatch[1];

      // Deletar imagem principal
      // Deletar thumbnail (substituir /images/ por /thumbnails/)
      const thumbnailPath = filePath.replace("/images/", "/thumbnails/");
      await mediaService.deleteFromBucket(STORAGE_BUCKET, [filePath, thumbnailPath]);
    } catch (error) {
      logger.error("Erro ao deletar imagem:", error);
      throw error;
    }
  }

  /**
   * Deleta múltiplas imagens.
   */
  static async deleteMultipleImages(imageUrls: string[]): Promise<void> {
    await Promise.all(imageUrls.map((url) => this.deleteImage(url)));
  }
}

export default ClassifiedImageService;

