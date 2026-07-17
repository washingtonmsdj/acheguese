/** Canonical image workflow for Classified aggregates. */
import { mediaService } from "@/core/media/services/MediaService";
import { CLASSIFIED_UPLOAD_LIMITS } from "../constants/upload-limits";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export interface UploadedImage {
  reference: string;
  url: string;
  fileName: string;
  size: number;
  width: number;
  height: number;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: "compressing" | "uploading" | "complete" | "error";
  error?: string;
}

export class ClassifiedImageService {
  static validateImage(file: File): { valid: boolean; error?: string } {
    if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
      return {
        valid: false,
        error: "Tipo nao suportado. Use JPEG, PNG, WebP ou GIF.",
      };
    }

    if (file.size > CLASSIFIED_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `Arquivo muito grande. Maximo: ${CLASSIFIED_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`,
      };
    }

    return { valid: true };
  }

  static async uploadClassifiedImage(
    file: File,
    ownerProfileId: string,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<UploadedImage> {
    const validation = this.validateImage(file);
    if (!validation.valid) throw new Error(validation.error);

    onProgress?.({
      fileName: file.name,
      progress: 20,
      status: "compressing",
    });

    try {
      onProgress?.({
        fileName: file.name,
        progress: 60,
        status: "uploading",
      });
      const asset = await mediaService.uploadMediaAsset(
        ownerProfileId,
        file,
        "classified_image",
        { fit: "contain" },
      );

      onProgress?.({
        fileName: file.name,
        progress: 100,
        status: "complete",
      });
      return {
        reference: asset.reference,
        url: asset.url,
        fileName: file.name,
        size: asset.byteSize,
        width: asset.width,
        height: asset.height,
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

  static async uploadMultipleImages(
    files: File[],
    ownerProfileId: string,
    onProgress?: (fileName: string, progress: UploadProgress) => void,
  ): Promise<UploadedImage[]> {
    const results = new Array<UploadedImage>(files.length);
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < files.length) {
        const index = nextIndex;
        nextIndex += 1;
        const file = files[index];
        results[index] = await this.uploadClassifiedImage(
          file,
          ownerProfileId,
          (progress) => onProgress?.(file.name, progress),
        );
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(2, files.length) }, () => worker()),
    );
    return results;
  }
}

export default ClassifiedImageService;
