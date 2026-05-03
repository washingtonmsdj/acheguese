import { supabase } from "@/integrations/supabase";

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
    const fileExt = input.file.name.split(".").pop();
    const fileName = `${input.businessId}/${input.type}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("business-images")
      .upload(fileName, input.file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("business-images").getPublicUrl(fileName);

    return publicUrl;
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
