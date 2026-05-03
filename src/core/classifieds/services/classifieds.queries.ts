import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import * as moduleClassifiedQueries from "@/modules/classifieds/services/classifieds.queries";

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
  return moduleClassifiedQueries.getClassifiedById(id);
}
