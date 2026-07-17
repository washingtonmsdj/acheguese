import { supabase } from "@/integrations/supabase";
import { mediaService } from "@/core/media/services/MediaService";

export class BusinessSettingsService {
  static async getBusinessById(businessId: string): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabase
      .from("business_data")
      .select("*")
      .eq("id", businessId)
      .single();

    if (error) throw error;
    return (data as Record<string, unknown>) || null;
  }

  static async uploadBusinessImage(input: {
    ownerProfileId: string;
    file: File;
    type: "logo" | "banner" | "gallery";
  }): Promise<string> {
    const preset = input.type === "logo"
      ? "business_logo"
      : input.type === "banner"
        ? "business_banner"
        : "business_gallery";
    const upload = await mediaService.uploadMediaAsset(
      input.ownerProfileId,
      input.file,
      preset,
    );
    return upload.reference;
  }

  static async addGalleryItem(input: {
    businessDataId: string;
    reference: string;
    caption?: string;
  }): Promise<void> {
    const { error } = await supabase.from("business_gallery").insert({
      business_id: input.businessDataId,
      image_url: input.reference,
      caption: input.caption ?? null,
    });
    if (error) throw error;
  }

  static async updateBusinessById(
    businessId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const { error } = await supabase
      .from("business_data")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", businessId);

    if (error) throw error;
  }
}
