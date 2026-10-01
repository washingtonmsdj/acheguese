import { mediaService } from "@/core/media/services/MediaService";
import { MEDIA_PRESET_CLIENT_CONFIG } from "@/core/media/config/mediaPresets";
import { BUSINESS_GALLERY_CONFIG } from "@/core/business/config/businessGalleryConfig";
import { supabase, type Database } from "@/integrations/supabase";

export type BusinessGalleryPhoto = Database["public"]["Tables"]["business_gallery"]["Row"];

async function list(businessDataId: string): Promise<BusinessGalleryPhoto[]> {
  const { data, error } = await supabase
    .from("business_gallery")
    .select("id,business_id,image_url,caption,display_order,is_featured,created_at,updated_at")
    .eq("business_id", businessDataId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function upload(
  ownerProfileId: string,
  businessDataId: string,
  files: File[],
  currentCount: number,
): Promise<void> {
  if (currentCount + files.length > BUSINESS_GALLERY_CONFIG.maxPhotos) {
    throw new Error(`A galeria aceita no máximo ${BUSINESS_GALLERY_CONFIG.maxPhotos} fotos.`);
  }
  if (files.some((file) => file.size > MEDIA_PRESET_CLIENT_CONFIG.business_gallery.maxSourceBytes)) {
    throw new Error("Cada foto deve ter no máximo 5 MB.");
  }
  const existing = await list(businessDataId);
  if (existing.length + files.length > BUSINESS_GALLERY_CONFIG.maxPhotos) {
    throw new Error(`A galeria aceita no máximo ${BUSINESS_GALLERY_CONFIG.maxPhotos} fotos.`);
  }
  const nextOrder = existing.reduce((order, photo) => Math.max(order, photo.display_order + 1), 0);

  for (const [index, file] of files.entries()) {
    const asset = await mediaService.uploadMediaAsset(ownerProfileId, file, "business_gallery");
    const { error } = await supabase.from("business_gallery").insert({
      business_id: businessDataId,
      image_url: asset.reference,
      display_order: nextOrder + index,
      is_featured: existing.length === 0 && index === 0,
    });
    if (error) throw error;
  }
}

async function remove(businessDataId: string, photoId: string): Promise<void> {
  const { data: removedPhoto, error: readError } = await supabase
    .from("business_gallery")
    .select("is_featured")
    .eq("business_id", businessDataId)
    .eq("id", photoId)
    .maybeSingle();
  if (readError) throw readError;
  const { error } = await supabase
    .from("business_gallery")
    .delete()
    .eq("business_id", businessDataId)
    .eq("id", photoId);
  if (error) throw error;

  if (removedPhoto?.is_featured) {
    const { data: nextPhoto, error: nextError } = await supabase
      .from("business_gallery")
      .select("id")
      .eq("business_id", businessDataId)
      .order("display_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (nextError) throw nextError;
    if (nextPhoto?.id) await setFeatured(businessDataId, nextPhoto.id);
  }
}

async function setFeatured(businessDataId: string, photoId: string): Promise<void> {
  const { error: featureError } = await supabase
    .from("business_gallery")
    .update({ is_featured: true })
    .eq("business_id", businessDataId)
    .eq("id", photoId);
  if (featureError) throw featureError;

  const { error } = await supabase
    .from("business_gallery")
    .update({ is_featured: false })
    .eq("business_id", businessDataId)
    .neq("id", photoId);
  if (error) throw error;
}

async function reorder(businessDataId: string, orderedIds: string[]): Promise<void> {
  const results = await Promise.allSettled(orderedIds.map(async (photoId, displayOrder) => {
    const { error } = await supabase
      .from("business_gallery")
      .update({ display_order: displayOrder })
      .eq("business_id", businessDataId)
      .eq("id", photoId);
    if (error) throw error;
  }));
  const failure = results.find((result) => result.status === "rejected");
  if (failure?.status === "rejected") throw failure.reason;
}

export const businessGalleryService = {
  list,
  upload,
  remove,
  setFeatured,
  reorder,
  maxPhotos: BUSINESS_GALLERY_CONFIG.maxPhotos,
};
