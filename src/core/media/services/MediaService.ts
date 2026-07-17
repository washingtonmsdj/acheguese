/**
 * MediaService - SSOT para upload e gerenciamento de mídia
 *
 * Responsável por:
 * - Upload de avatares
 * - Upload de imagens de posts
 * - Upload de arquivos de negócios
 * - Gerenciamento de storage do Supabase
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { MEDIA_UPLOAD_LIMITS } from "@/core/media/config/uploadLimits";
import {
  MEDIA_PRESET_CLIENT_CONFIG,
  MEDIA_PRESET_VERSION,
  type MediaPreset,
} from "@/core/media/config/mediaPresets";
import {
  MEDIA_STORAGE_BUCKETS,
  type PublicImageUploadBucket,
  type PublicMediaBucket,
} from "@/core/media/config/storageBuckets";
import {
  getImageOptimizePreset,
  optimizeImage,
} from "@/shared/utils/imageOptimizer";
import { secureRandomString } from "@/shared/utils/secureRandom";
import {
  parseMediaAssetReference,
  resolveMediaAssetReference,
} from "@/core/media/references/mediaAssetReference";

export class MediaError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "MediaError";
  }
}

export interface UploadResult {
  url: string;
  path: string;
}

export interface MediaAssetRef extends UploadResult {
  id: string;
  reference: string;
  ownerProfileId: string;
  preset: MediaPreset;
  presetVersion: number;
  mimeType: "image/jpeg";
  byteSize: number;
  width: number;
  height: number;
}

export interface UploadMediaAssetOptions {
  fit?: "cover" | "contain";
  focalPointX?: number;
  focalPointY?: number;
}

interface UploadPostImageOptions {
  preset?: "post_image";
  fit?: "cover" | "contain";
  focalPointX?: number;
  focalPointY?: number;
}

interface UploadToBucketOptions {
  bucket: PublicImageUploadBucket;
  pathPrefix?: string;
  fileName?: string;
  preset?:
    | "site_asset"
    | "banner_image"
    | "post_image"
    | "classified_image"
    | "classified_thumbnail";
  upsert?: boolean;
}

class MediaServiceClass {
  private readonly ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  private readonly ALLOWED_ADDRESS_PROOF_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  private getSafeExtensionFromMime(mimeType: string): string {
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType === "image/jpeg") return "jpg";
    if (mimeType === "image/png") return "png";
    if (mimeType === "image/webp") return "webp";
    if (mimeType === "image/gif") return "gif";
    return "jpg";
  }

  private assertMaxFileSize(
    file: File,
    maxSizeBytes: number,
    message: string,
  ): void {
    if (file.size > maxSizeBytes) {
      throw new MediaError(message, "FILE_TOO_LARGE");
    }
  }

  private assertAllowedMimeType(
    file: File,
    allowedTypes: string[],
    message: string,
  ): void {
    if (!allowedTypes.includes(file.type)) {
      throw new MediaError(message, "INVALID_FILE_TYPE");
    }
  }

  private assertImageFileAllowed(
    file: File,
    maxSizeBytes = MEDIA_UPLOAD_LIMITS.FILE_SIZE_BYTES,
  ): void {
    this.assertMaxFileSize(
      file,
      maxSizeBytes,
      "Imagem muito grande. Maximo 5MB",
    );
    this.assertAllowedMimeType(
      file,
      this.ALLOWED_IMAGE_TYPES,
      "Tipo de arquivo nao permitido. Use JPEG, PNG, WebP ou GIF",
    );
  }

  private assertVerificationDocumentAllowed(
    file: File,
    type: "proof" | "photo",
  ): void {
    this.assertMaxFileSize(
      file,
      MEDIA_UPLOAD_LIMITS.FILE_SIZE_BYTES,
      "Arquivo muito grande. Maximo 5MB",
    );

    if (type === "proof") {
      this.assertAllowedMimeType(
        file,
        this.ALLOWED_ADDRESS_PROOF_TYPES,
        "Tipo de comprovante nao permitido. Use PDF, JPG ou PNG",
      );
      return;
    }

    this.assertAllowedMimeType(
      file,
      ["image/jpeg", "image/png"],
      "Tipo de foto nao permitido. Use JPG ou PNG",
    );
  }

  private async optimizeForPreset(
    file: File,
    preset:
      | "user_avatar"
      | "post_image"
      | "professional_logo"
      | "professional_portfolio"
      | "business_logo"
      | "business_banner"
      | "verification_photo",
  ): Promise<File> {
    this.assertImageFileAllowed(file);

    try {
      const optimizedFile = await optimizeImage(
        file,
        getImageOptimizePreset(preset),
      );
      this.assertImageFileAllowed(optimizedFile);
      return optimizedFile;
    } catch (error) {
      logger.warn(
        "Image optimization failed, fallback to original file:",
        error,
      );
      return file;
    }
  }

  async uploadMediaAsset(
    ownerProfileId: string,
    file: File,
    preset: MediaPreset,
    options: UploadMediaAssetOptions = {},
  ): Promise<MediaAssetRef> {
    const config = MEDIA_PRESET_CLIENT_CONFIG[preset];
    this.assertMaxFileSize(
      file,
      config.maxSourceBytes,
      "Imagem excede o limite deste tipo de midia",
    );
    this.assertImageFileAllowed(file, config.maxSourceBytes);

    let optimizedFile: File;
    try {
      const optimizePreset = getImageOptimizePreset(config.optimizerPreset);
      optimizedFile = await optimizeImage(file, {
        ...optimizePreset,
        fit: options.fit ?? optimizePreset.fit,
        focalPointX: options.focalPointX ?? optimizePreset.focalPointX,
        focalPointY: options.focalPointY ?? optimizePreset.focalPointY,
      });
    } catch (error) {
      logger.warn("Media asset image decoding failed", error);
      throw new MediaError("Arquivo de imagem invalido", "INVALID_IMAGE_DATA");
    }

    this.assertMaxFileSize(
      optimizedFile,
      config.maxSourceBytes,
      "Imagem processada excede o limite deste tipo de midia",
    );
    if (optimizedFile.type !== "image/jpeg") {
      throw new MediaError(
        "A imagem processada deve estar em JPEG",
        "INVALID_FILE_TYPE",
      );
    }

    const body = new FormData();
    body.set("file", optimizedFile, "upload.jpg");
    body.set("ownerProfileId", ownerProfileId);
    body.set("preset", preset);

    const { data, error } = await supabase.functions.invoke("media-assets", {
      body,
    });
    if (error) {
      logger.error("Media asset broker upload failed", error);
      throw new MediaError("Erro ao enviar a imagem", "UPLOAD_FAILED");
    }

    const response = data as { asset?: Record<string, unknown> } | null;
    const asset = response?.asset;
    const reference =
      typeof asset?.reference === "string" ? asset.reference : "";
    const parsed = parseMediaAssetReference(reference);
    if (
      !parsed ||
      parsed.ownerProfileId !== ownerProfileId.toLowerCase() ||
      parsed.preset !== preset ||
      parsed.presetVersion !== MEDIA_PRESET_VERSION
    ) {
      throw new MediaError(
        "Resposta invalida do servico de midia",
        "INVALID_UPLOAD_RESPONSE",
      );
    }

    const url = resolveMediaAssetReference(reference);
    const byteSize = Number(asset?.byteSize);
    const width = Number(asset?.width);
    const height = Number(asset?.height);
    if (
      !url ||
      typeof asset?.id !== "string" ||
      asset.id.toLowerCase() !== parsed.assetId ||
      asset.preset !== preset ||
      asset.presetVersion !== MEDIA_PRESET_VERSION ||
      asset.mimeType !== "image/jpeg" ||
      !Number.isSafeInteger(byteSize) ||
      !Number.isSafeInteger(width) ||
      !Number.isSafeInteger(height) ||
      byteSize <= 0 ||
      width <= 0 ||
      height <= 0
    ) {
      throw new MediaError(
        "Resposta invalida do servico de midia",
        "INVALID_UPLOAD_RESPONSE",
      );
    }

    return {
      id: parsed.assetId,
      reference,
      ownerProfileId: parsed.ownerProfileId,
      preset,
      presetVersion: parsed.presetVersion,
      mimeType: "image/jpeg",
      byteSize,
      width,
      height,
      path: parsed.path,
      url,
    };
  }

  /**
   * Upload de imagem de post/conteúdo
   */
  async uploadPostImage(
    profileId: string,
    file: File,
    options: UploadPostImageOptions = {},
  ): Promise<UploadResult> {
    try {
      this.assertImageFileAllowed(file);

      const preset = options.preset ?? "post_image";
      let optimizedFile: File;
      try {
        optimizedFile = await optimizeImage(file, {
          ...getImageOptimizePreset(preset),
          fit: options.fit ?? getImageOptimizePreset(preset).fit,
          focalPointX:
            options.focalPointX ?? getImageOptimizePreset(preset).focalPointX,
          focalPointY:
            options.focalPointY ?? getImageOptimizePreset(preset).focalPointY,
        });
      } catch (error) {
        logger.warn("Post image decoding failed:", error);
        throw new MediaError(
          "Arquivo de imagem invalido",
          "INVALID_IMAGE_DATA",
        );
      }
      this.assertImageFileAllowed(optimizedFile);

      const timestamp = Date.now();
      const ext = this.getSafeExtensionFromMime(optimizedFile.type);
      const path = `${profileId}/posts/${timestamp}-${secureRandomString(16)}.${ext}`;

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from(MEDIA_STORAGE_BUCKETS.POST_IMAGES)
        .upload(path, optimizedFile, {
          contentType: optimizedFile.type,
        });

      if (uploadError) {
        logger.error("Error uploading post image:", uploadError);
        throw new MediaError("Erro ao fazer upload da imagem", "UPLOAD_FAILED");
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(MEDIA_STORAGE_BUCKETS.POST_IMAGES)
        .getPublicUrl(path);

      return { url: urlData.publicUrl, path };
    } catch (error) {
      if (error instanceof MediaError) throw error;
      logger.error("Unexpected error uploading post image:", error);
      throw new MediaError(
        "Erro inesperado ao fazer upload",
        "UNEXPECTED_ERROR",
      );
    }
  }

  /**
   * Upload de múltiplas imagens
   */
  async uploadMultipleImages(
    profileId: string,
    files: File[],
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      try {
        const result = await this.uploadPostImage(profileId, file);
        results.push(result);
      } catch (error) {
        logger.error("Error uploading image in batch:", error);
        // Continua com as outras imagens
      }
    }

    return results;
  }

  /**
   * Deletar arquivo do storage
   */
  async deleteFile(bucket: PublicMediaBucket, path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);

      if (error) {
        logger.error("Error deleting file:", error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error("Unexpected error deleting file:", error);
      return false;
    }
  }

  /**
   * Obter URL pública de um arquivo
   */
  getPublicUrl(bucket: PublicMediaBucket, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Upload de documento de verificação
   * ✅ SSOT para storage de documentos de verificação
   */
  async uploadVerificationDocument(
    profileId: string,
    file: File,
    type: "proof" | "photo",
  ): Promise<string> {
    try {
      this.assertVerificationDocumentAllowed(file, type);

      const optimizedFile =
        type === "photo"
          ? await this.optimizeForPreset(file, "verification_photo")
          : file;
      this.assertVerificationDocumentAllowed(optimizedFile, type);

      const timestamp = Date.now();
      const ext = this.getSafeExtensionFromMime(optimizedFile.type);
      const path = `${profileId}/${type}_${timestamp}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(MEDIA_STORAGE_BUCKETS.VERIFICATION_DOCUMENTS)
        .upload(path, optimizedFile, {
          upsert: true,
          contentType: optimizedFile.type,
        });

      if (uploadError) {
        logger.error("Error uploading verification document:", uploadError);
        throw new MediaError(
          "Erro ao fazer upload do documento",
          "UPLOAD_FAILED",
        );
      }

      return `storage://verification-documents/${path}`;
    } catch (error) {
      if (error instanceof MediaError) throw error;
      logger.error("Unexpected error uploading verification document:", error);
      throw new MediaError(
        "Erro inesperado ao fazer upload",
        "UNEXPECTED_ERROR",
      );
    }
  }

  async uploadToBucket(
    file: File,
    options: UploadToBucketOptions,
  ): Promise<UploadResult> {
    this.assertImageFileAllowed(file);

    const preset = options.preset ?? "site_asset";
    const optimizedFile = await optimizeImage(
      file,
      getImageOptimizePreset(preset),
    ).catch((error) => {
      logger.warn(
        "Image optimization failed, fallback to original file:",
        error,
      );
      return file;
    });

    this.assertImageFileAllowed(optimizedFile);

    const ext = this.getSafeExtensionFromMime(optimizedFile.type);
    const prefix = options.pathPrefix?.replace(/^\/+|\/+$/g, "") || "uploads";
    const sanitizedFileName = options.fileName
      ? options.fileName.replace(/[\\/]/g, "").replace(/\.+/g, ".")
      : `${Date.now()}-${secureRandomString(16)}.${ext}`;
    const ensuredName = sanitizedFileName.includes(".")
      ? sanitizedFileName
      : `${sanitizedFileName}.${ext}`;
    const path = `${prefix}/${ensuredName}`;

    const { error: uploadError } = await supabase.storage
      .from(options.bucket)
      .upload(path, optimizedFile, {
        upsert: options.upsert ?? true,
        contentType: optimizedFile.type,
      });

    if (uploadError) {
      logger.error("Error uploading bucket image:", uploadError);
      throw new MediaError("Erro ao fazer upload da imagem", "UPLOAD_FAILED");
    }

    const { data: urlData } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(path);
    return { url: urlData.publicUrl, path };
  }

  async deleteFromBucket(
    bucket: PublicImageUploadBucket,
    paths: string[],
  ): Promise<void> {
    if (!paths.length) return;
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) {
      logger.error("Error deleting bucket files:", error);
      throw new MediaError("Erro ao remover arquivos", "DELETE_FAILED");
    }
  }
}

export const mediaService = new MediaServiceClass();
