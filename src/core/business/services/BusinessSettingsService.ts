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
    businessId: string;
    file: File;
    type: "logo" | "banner" | "gallery";
  }): Promise<string> {
    const upload = await mediaService.uploadBusinessImage(
      input.businessId,
      input.file,
      input.type === "logo" ? "logo" : "capa",
    );
    return upload.url;
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
