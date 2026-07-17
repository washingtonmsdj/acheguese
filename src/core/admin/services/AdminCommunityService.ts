import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type {
  ProfessionalData,
} from "../types/adminDatabase.types";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
};

type AdminCommunityDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const adminCommunityDb = supabase as unknown as AdminCommunityDbClient;

class AdminCommunityService {
  private readonly db = adminCommunityDb;

  async getAllProfessionals(): Promise<ProfessionalData[]> {
    try {
      const { data, error } = await this.db
        .from<ProfessionalData>("professional_data")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as ProfessionalData[];
    } catch (error) {
      logger.error("Error fetching professionals", error as Error);
      return [];
    }
  }
}

export const adminCommunityService = new AdminCommunityService();
