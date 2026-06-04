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
import { getImageOptimizePreset, optimizeImage } from "@/shared/utils/imageOptimizer";
import { secureRandomString } from "@/shared/utils/secureRandom";

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

interface UploadPostImageOptions {
  preset?: "post_image" | "gastronomy_menu_item";
  fit?: "cover" | "contain";
  focalPointX?: number;
  focalPointY?: number;
}

interface UploadToBucketOptions {
  bucket:
    | "banners"
    | "business-images"
    | "posts"
    | "classified-images"
    | "safety-evidence"
    | "tryon"
    | "community-posts";
  pathPrefix?: string;
  fileName?: string;
  preset?: "site_asset" | "banner_image" | "post_image" | "classified_image" | "classified_thumbnail";
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

  private assertMaxFileSize(file: File, maxSizeBytes: number, message: string): void {
    if (file.size > maxSizeBytes) {
      throw new MediaError(message, "FILE_TOO_LARGE");
    }
  }

  private assertAllowedMimeType(file: File, allowedTypes: string[], message: string): void {
    if (!allowedTypes.includes(file.type)) {
      throw new MediaError(message, "INVALID_FILE_TYPE");
    }
  }

  private assertImageFileAllowed(
    file: File,
    maxSizeBytes = MEDIA_UPLOAD_LIMITS.FILE_SIZE_BYTES,
  ): void {
    this.assertMaxFileSize(file, maxSizeBytes, "Imagem muito grande. Maximo 5MB");
    this.assertAllowedMimeType(
      file,
      this.ALLOWED_IMAGE_TYPES,
      "Tipo de arquivo nao permitido. Use JPEG, PNG, WebP ou GIF",
    );
  }

  private assertVerificationDocumentAllowed(file: File, type: "proof" | "photo"): void {
    this.assertMaxFileSize(file, MEDIA_UPLOAD_LIMITS.FILE_SIZE_BYTES, "Arquivo muito grande. Maximo 5MB");

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
      const optimizedFile = await optimizeImage(file, getImageOptimizePreset(preset));
      this.assertImageFileAllowed(optimizedFile);
      return optimizedFile;
    } catch (error) {
      logger.warn("Image optimization failed, fallback to original file:", error);
      return file;
    }
  }

  /**
   * Upload de avatar de usuário
   */
  async uploadAvatar(userId: string, file: File): Promise<UploadResult> {
    try {
      const optimizedFile = await this.optimizeForPreset(file, "user_avatar");
      // Validações
      if (optimizedFile.size > MEDIA_UPLOAD_LIMITS.AVATAR_SIZE_BYTES) {
        throw new MediaError(
          "Avatar muito grande. Máximo 2MB",
          "FILE_TOO_LARGE",
        );
      }

      if (!this.ALLOWED_IMAGE_TYPES.includes(optimizedFile.type)) {
        throw new MediaError(
          "Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF",
          "INVALID_FILE_TYPE",
        );
      }

      // Gerar path único
      const ext = this.getSafeExtensionFromMime(optimizedFile.type);
      const path = `${userId}/avatar.${ext}`;

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, optimizedFile, {
          upsert: true,
          contentType: optimizedFile.type,
        });

      if (uploadError) {
        logger.error("Error uploading avatar:", uploadError);
        throw new MediaError("Erro ao fazer upload do avatar", "UPLOAD_FAILED");
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      // Adicionar timestamp para cache busting
      const url = `${urlData.publicUrl}?t=${Date.now()}`;

      return { url, path };
    } catch (error) {
      if (error instanceof MediaError) throw error;
      logger.error("Unexpected error uploading avatar:", error);
      throw new MediaError(
        "Erro inesperado ao fazer upload",
        "UNEXPECTED_ERROR",
      );
    }
  }

  /**
   * Upload de imagem de post/conteúdo
   */
  async uploadPostImage(
    userId: string,
    file: File,
    options: UploadPostImageOptions = {},
  ): Promise<UploadResult> {
    try {
      this.assertImageFileAllowed(file);

      const preset = options.preset ?? "post_image";
      const optimizedFile = await optimizeImage(file, {
        ...getImageOptimizePreset(preset),
        fit: options.fit ?? getImageOptimizePreset(preset).fit,
        focalPointX: options.focalPointX ?? getImageOptimizePreset(preset).focalPointX,
        focalPointY: options.focalPointY ?? getImageOptimizePreset(preset).focalPointY,
      }).catch((error) => {
        logger.warn("Image optimization failed, fallback to original file:", error);
        return file;
      });
      this.assertImageFileAllowed(optimizedFile);

      const timestamp = Date.now();
      const ext = this.getSafeExtensionFromMime(optimizedFile.type);
      const path = `${userId}/posts/${timestamp}.${ext}`;

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(path, optimizedFile, {
          contentType: optimizedFile.type,
        });

      if (uploadError) {
        logger.error("Error uploading post image:", uploadError);
        throw new MediaError("Erro ao fazer upload da imagem", "UPLOAD_FAILED");
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("post-images")
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
    userId: string,
    files: File[],
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      try {
        const result = await this.uploadPostImage(userId, file);
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
  async deleteFile(
    bucket: "avatars" | "post-images",
    path: string,
  ): Promise<boolean> {
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
   * Upload de imagem de profissional (logo ou portfólio)
   */
  async uploadProfessionalImage(
    userId: string,
    file: File,
    type: "logo" | "portfolio",
  ): Promise<UploadResult> {
    try {
      const optimizedFile = await this.optimizeForPreset(
        file,
        type === "logo" ? "professional_logo" : "professional_portfolio",
      );
      // Validações
      if (optimizedFile.size > MEDIA_UPLOAD_LIMITS.FILE_SIZE_BYTES) {
        throw new MediaError(
          "Imagem muito grande. Máximo 5MB",
          "FILE_TOO_LARGE",
        );
      }

      if (!this.ALLOWED_IMAGE_TYPES.includes(optimizedFile.type)) {
        throw new MediaError(
          "Tipo de arquivo não permitido",
          "INVALID_FILE_TYPE",
        );
      }

      // Gerar path único
      const timestamp = Date.now();
      const random = secureRandomString(16);
      const ext = this.getSafeExtensionFromMime(optimizedFile.type);
      const folder = type === "logo" ? "" : "portfolio/";
      const path = `professionals/${userId}/${folder}${timestamp}-${random}.${ext}`;

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, optimizedFile, {
          contentType: optimizedFile.type,
        });

      if (uploadError) {
        logger.error("Error uploading professional image:", uploadError);
        throw new MediaError("Erro ao fazer upload da imagem", "UPLOAD_FAILED");
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      return { url: urlData.publicUrl, path };
    } catch (error) {
      if (error instanceof MediaError) throw error;
      logger.error("Unexpected error uploading professional image:", error);
      throw new MediaError(
        "Erro inesperado ao fazer upload",
        "UNEXPECTED_ERROR",
      );
    }
  }

  /**
   * Upload de imagem de negócio (logo ou capa)
   */
  async uploadBusinessImage(
    profileId: string,
    file: File,
    type: "logo" | "capa",
  ): Promise<UploadResult> {
    try {
      const optimizedFile = await this.optimizeForPreset(
        file,
        type === "logo" ? "business_logo" : "business_banner",
      );
      // Validações
      if (optimizedFile.size > MEDIA_UPLOAD_LIMITS.FILE_SIZE_BYTES) {
        throw new MediaError(
          "Imagem muito grande. Máximo 5MB",
          "FILE_TOO_LARGE",
        );
      }

      if (!this.ALLOWED_IMAGE_TYPES.includes(optimizedFile.type)) {
        throw new MediaError(
          "Tipo de arquivo não permitido",
          "INVALID_FILE_TYPE",
        );
      }

      // Gerar path único
      const timestamp = Date.now();
      const ext = this.getSafeExtensionFromMime(optimizedFile.type);
      const folder = type === "logo" ? "logos" : "capas";
      const path = `${folder}/${profileId}/${timestamp}.${ext}`;

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from("business-logos")
        .upload(path, optimizedFile, {
          contentType: optimizedFile.type,
        });

      if (uploadError) {
        logger.error("Error uploading business image:", uploadError);
        throw new MediaError("Erro ao fazer upload da imagem", "UPLOAD_FAILED");
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("business-logos")
        .getPublicUrl(path);

      return { url: urlData.publicUrl, path };
    } catch (error) {
      if (error instanceof MediaError) throw error;
      logger.error("Unexpected error uploading business image:", error);
      throw new MediaError(
        "Erro inesperado ao fazer upload",
        "UNEXPECTED_ERROR",
      );
    }
  }

  /**
   * Obter URL pública de um arquivo
   */
  getPublicUrl(bucket: "avatars" | "post-images", path: string): string {
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
    type: "proof" | "photo"
  ): Promise<string> {
    try {
      this.assertVerificationDocumentAllowed(file, type);

      const optimizedFile =
        type === "photo" ? await this.optimizeForPreset(file, "verification_photo") : file;
      this.assertVerificationDocumentAllowed(optimizedFile, type);

      const timestamp = Date.now();
      const ext = this.getSafeExtensionFromMime(optimizedFile.type);
      const path = `${profileId}/${type}_${timestamp}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("verification-documents")
        .upload(path, optimizedFile, { upsert: true, contentType: optimizedFile.type });

      if (uploadError) {
        logger.error("Error uploading verification document:", uploadError);
        throw new MediaError("Erro ao fazer upload do documento", "UPLOAD_FAILED");
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

  async uploadToBucket(file: File, options: UploadToBucketOptions): Promise<UploadResult> {
    this.assertImageFileAllowed(file);

    const preset = options.preset ?? "site_asset";
    const optimizedFile = await optimizeImage(file, getImageOptimizePreset(preset)).catch((error) => {
      logger.warn("Image optimization failed, fallback to original file:", error);
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

    const { data: urlData } = supabase.storage.from(options.bucket).getPublicUrl(path);
    return { url: urlData.publicUrl, path };
  }

  async deleteFromBucket(
    bucket:
      | "banners"
      | "business-images"
      | "posts"
      | "classified-images"
      | "safety-evidence"
      | "tryon"
      | "community-posts",
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
