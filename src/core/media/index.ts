/**
 * Media Core Module
 * SSOT para gerenciamento de mídia e uploads
 */

export { mediaService, MediaError } from "./services/MediaService";
export type {
  MediaAssetRef,
  UploadMediaAssetOptions,
  UploadResult,
} from "./services/MediaService";
export {
  MEDIA_PRESET_NAMES,
  MEDIA_PRESET_VERSION,
  isMediaPreset,
} from "./config/mediaPresets";
export type { MediaPreset } from "./config/mediaPresets";
export {
  isMediaAssetReference,
  parseMediaAssetReference,
  resolveMediaAssetReference,
  resolveMediaAssetSource,
  toMediaAssetReference,
} from "./references/mediaAssetReference";
