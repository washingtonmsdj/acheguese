import { supabase } from "@/integrations/supabase";

class ActiveBanReader {
  async readCurrent(): Promise<boolean> {
    const { data, error } = await supabase.rpc("has_current_active_ban");

    if (error) throw error;
    return data === true;
  }
}

export const activeBanReader = new ActiveBanReader();
