import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";

export interface ClassifiedData {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  photos: string[];
  seller_id: string;
  seller_name?: string;
  seller_avatar?: string;
  seller_phone?: string;
  seller_whatsapp?: string;
  slug?: string;
  public_id?: string;
  category_id?: string;
  subcategory_id?: string;
  location_id?: string;
  location?: string;
  neighborhood?: string;
  geographic_path?: string;
  category_slug?: string;
  subcategory_slug?: string;
  status?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getClassifiedById(id: string): Promise<ClassifiedData | null> {
  try {
    const { data, error } = await supabase
      .from("classifieds")
      .select(
        `
        *,
        seller:profiles!seller_id (
          id,
          name,
          avatar_url,
          phone,
          whatsapp
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      logger.error("Error fetching classified:", error);
      throw error;
    }

    return {
      ...data,
      seller_name: data.seller?.name,
      seller_avatar: data.seller?.avatar_url,
      seller_phone: data.seller?.phone,
      seller_whatsapp: data.seller?.whatsapp,
    } as ClassifiedData;
  } catch (error) {
    logger.error("Error in getClassifiedById:", error);
    trackError(error as Error, {
      component: "CoreClassifiedsQueries",
      action: "getClassifiedById",
    });
    throw error;
  }
}

