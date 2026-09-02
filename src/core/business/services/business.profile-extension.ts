import { supabase } from "@/integrations/supabase";

export interface BusinessProfileExtensionRecord {
  profile_id: string;
  legal_name: string;
  cnpj?: string | null;
  tax_id?: string | null;
  company_type?: "mei" | "ltda" | "sa" | "eireli" | "other" | null;
  industry?: string | null;
  employee_count?: "1-10" | "11-50" | "51-200" | "201-500" | "500+" | null;
  founded_year?: number | null;
  business_address?: string | null;
  business_city?: string | null;
  business_state?: string | null;
  business_zip?: string | null;
  business_hours?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type BusinessProfileExtensionUpdate = Partial<
  Omit<BusinessProfileExtensionRecord, "profile_id" | "created_at" | "updated_at">
>;

type QueryError = { message?: string | null };

type QuerySingleResult<T> = {
  data: T | null;
  error: QueryError | null;
};

type QueryBuilder<T> = {
  select(columns?: string): QueryBuilder<T>;
  update(values: BusinessProfileExtensionUpdate): QueryBuilder<T>;
  eq(column: string, value: unknown): QueryBuilder<T>;
  single(): Promise<QuerySingleResult<T>>;
};

type BusinessProfileExtensionDb = {
  from<T = never>(table: string): QueryBuilder<T>;
};

const db = supabase as unknown as BusinessProfileExtensionDb;

const BUSINESS_PROFILE_EXTENSION_SELECT = [
  "profile_id",
  "legal_name",
  "cnpj",
  "tax_id",
  "company_type",
  "industry",
  "employee_count",
  "founded_year",
  "business_address",
  "business_city",
  "business_state",
  "business_zip",
  "business_hours",
  "created_at",
  "updated_at",
].join(",");

export async function getBusinessProfileExtension(
  profileId: string,
): Promise<BusinessProfileExtensionRecord | null> {
  const { data, error } = await db
    .from<BusinessProfileExtensionRecord>("business_data")
    .select(BUSINESS_PROFILE_EXTENSION_SELECT)
    .eq("profile_id", profileId)
    .single();

  if (error) {
    throw new Error(error.message || "Failed to load business profile extension");
  }

  return data;
}

export async function updateBusinessProfileExtension(
  profileId: string,
  updates: BusinessProfileExtensionUpdate,
): Promise<BusinessProfileExtensionRecord> {
  const { data, error } = await db
    .from<BusinessProfileExtensionRecord>("business_data")
    .update(updates)
    .eq("profile_id", profileId)
    .select(BUSINESS_PROFILE_EXTENSION_SELECT)
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update business profile extension");
  }
  if (!data) {
    throw new Error("Business profile extension not found after update");
  }

  return data;
}
