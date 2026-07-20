/**
 * AdminCommunityInterestService
 *
 * SSOT das leituras administrativas de `community_interest_registrations`.
 * A tabela vive em `docs/migrations-pending/20260720120000_create_community_interest_registrations.sql`
 * e ainda não foi promovida aos tipos gerados do Supabase — por isso usamos um
 * client tipado localmente, no mesmo padrão de AdminCommunityAlertsService.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  or(filter: string): TableClient<TRow>;
  ilike(column: string, pattern: string): TableClient<TRow>;
  gte(column: string, value: unknown): TableClient<TRow>;
  lte(column: string, value: unknown): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  range(from: number, to: number): TableClient<TRow>;
  limit(count: number): TableClient<TRow>;
  update(values: Record<string, unknown>): TableClient<TRow>;
};

type DbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const db = supabase as unknown as DbClient;

export type CommunityInterestRole =
  | "morador"
  | "comerciante"
  | "prestador"
  | "visitante"
  | "outro";

export type CommunityInterestAdminStatus =
  | "new"
  | "reviewed"
  | "contacted"
  | "converted"
  | "discarded";

export interface CommunityInterestRegistration {
  id: string;
  community_id: string | null;
  community_slug: string | null;
  territory_path: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  role: CommunityInterestRole;
  message: string | null;
  wants_updates: boolean;
  source: string | null;
  user_agent: string | null;
  turnstile_verified: boolean;
  user_id: string | null;
  admin_status: CommunityInterestAdminStatus | null;
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminCommunityInterestFilters {
  search?: string;
  communitySlug?: string;
  territoryPath?: string;
  role?: CommunityInterestRole;
  wantsUpdates?: boolean;
  fromDate?: string; // ISO date (YYYY-MM-DD)
  toDate?: string;   // ISO date (YYYY-MM-DD)
}

export interface AdminCommunityInterestListParams extends AdminCommunityInterestFilters {
  page?: number;
  pageSize?: number;
}

export interface AdminCommunityInterestListResult {
  items: CommunityInterestRegistration[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminCommunityInterestStats {
  total: number;
  last7d: number;
  last30d: number;
  distinctCommunities: number;
  wantsUpdates: number;
}

export interface CommunityBreakdownRow {
  community_slug: string | null;
  territory_path: string | null;
  count: number;
}

function applyFilters<T>(
  query: TableClient<T>,
  filters: AdminCommunityInterestFilters,
): TableClient<T> {
  let q = query;
  if (filters.search && filters.search.trim().length > 0) {
    const term = filters.search.trim().replace(/[%_,]/g, "").slice(0, 80);
    q = q.or(
      `full_name.ilike.%${term}%,email.ilike.%${term}%,message.ilike.%${term}%`,
    );
  }
  if (filters.communitySlug && filters.communitySlug.trim().length > 0) {
    q = q.eq("community_slug", filters.communitySlug.trim());
  }
  if (filters.territoryPath && filters.territoryPath.trim().length > 0) {
    q = q.ilike("territory_path", `${filters.territoryPath.trim()}%`);
  }
  if (filters.role) {
    q = q.eq("role", filters.role);
  }
  if (typeof filters.wantsUpdates === "boolean") {
    q = q.eq("wants_updates", filters.wantsUpdates);
  }
  if (filters.fromDate) {
    q = q.gte("created_at", `${filters.fromDate}T00:00:00.000Z`);
  }
  if (filters.toDate) {
    q = q.lte("created_at", `${filters.toDate}T23:59:59.999Z`);
  }
  return q;
}

async function listRegistrations(
  params: AdminCommunityInterestListParams,
): Promise<AdminCommunityInterestListResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(200, Math.max(5, params.pageSize ?? 25));
  const fromIdx = (page - 1) * pageSize;
  const toIdx = fromIdx + pageSize - 1;

  let query = db
    .from<CommunityInterestRegistration>("community_interest_registrations")
    .select("*", { count: "exact" });

  query = applyFilters(query, params);
  query = query.order("created_at", { ascending: false }).range(fromIdx, toIdx);

  const { data, error, count } = await query;
  if (error) {
    logger.error("AdminCommunityInterestService.list falhou", new Error(error.message ?? "unknown"), {
      component: "AdminCommunityInterestService",
    });
    return { items: [], total: 0, page, pageSize };
  }

  return {
    items: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  };
}

async function exportAll(
  filters: AdminCommunityInterestFilters,
  hardLimit = 5000,
): Promise<CommunityInterestRegistration[]> {
  let query = db
    .from<CommunityInterestRegistration>("community_interest_registrations")
    .select("*");
  query = applyFilters(query, filters);
  query = query.order("created_at", { ascending: false }).limit(hardLimit);

  const { data, error } = await query;
  if (error) {
    logger.error(
      "AdminCommunityInterestService.exportAll falhou",
      new Error(error.message ?? "unknown"),
      { component: "AdminCommunityInterestService" },
    );
    return [];
  }
  return data ?? [];
}

async function getStats(
  filters: AdminCommunityInterestFilters = {},
): Promise<AdminCommunityInterestStats> {
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  async function countWith(overrides: AdminCommunityInterestFilters = {}): Promise<number> {
    let query = db
      .from<CommunityInterestRegistration>("community_interest_registrations")
      .select("id", { count: "exact", head: true });
    query = applyFilters(query, { ...filters, ...overrides });
    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  }

  const [total, last7d, last30d, wantsUpdates, sample] = await Promise.all([
    countWith(),
    countWith({ fromDate: d7.slice(0, 10) }),
    countWith({ fromDate: d30.slice(0, 10) }),
    countWith({ wantsUpdates: true }),
    (async () => {
      let query = db
        .from<CommunityInterestRegistration>("community_interest_registrations")
        .select("community_slug");
      query = applyFilters(query, filters).limit(1000);
      const { data } = await query;
      return data ?? [];
    })(),
  ]);

  const distinctCommunities = new Set(
    sample
      .map((row) => (row.community_slug ?? "").trim())
      .filter((slug) => slug.length > 0),
  ).size;

  return { total, last7d, last30d, wantsUpdates, distinctCommunities };
}

async function getCommunityBreakdown(
  filters: AdminCommunityInterestFilters = {},
  limit = 20,
): Promise<CommunityBreakdownRow[]> {
  let query = db
    .from<CommunityInterestRegistration>("community_interest_registrations")
    .select("community_slug, territory_path");
  query = applyFilters(query, filters).limit(2000);
  const { data, error } = await query;
  if (error || !data) return [];

  const map = new Map<string, CommunityBreakdownRow>();
  for (const row of data) {
    const key = `${row.community_slug ?? ""}|${row.territory_path ?? ""}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, {
        community_slug: row.community_slug,
        territory_path: row.territory_path,
        count: 1,
      });
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface UpdateRegistrationInput {
  admin_status?: CommunityInterestAdminStatus;
  admin_notes?: string | null;
  wants_updates?: boolean;
}

async function updateRegistration(
  id: string,
  patch: UpdateRegistrationInput,
  reviewerId?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const payload: Record<string, unknown> = { ...patch };
  if (patch.admin_status || patch.admin_notes !== undefined) {
    payload.reviewed_at = new Date().toISOString();
    if (reviewerId) payload.reviewed_by = reviewerId;
  }
  const query = db
    .from<CommunityInterestRegistration>("community_interest_registrations")
    .update(payload)
    .eq("id", id);
  const { error } = await query;
  if (error) {
    logger.error(
      "AdminCommunityInterestService.update falhou",
      new Error(error.message ?? "unknown"),
      { component: "AdminCommunityInterestService", registrationId: id },
    );
    return { ok: false, error: error.message ?? "unknown" };
  }
  return { ok: true };
}

export const adminCommunityInterestService = {
  list: listRegistrations,
  exportAll,
  getStats,
  getCommunityBreakdown,
  updateRegistration,
};

export type AdminCommunityInterestService = typeof adminCommunityInterestService;
