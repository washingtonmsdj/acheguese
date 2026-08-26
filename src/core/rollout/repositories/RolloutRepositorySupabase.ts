/**
 * RolloutRepositorySupabase
 *
 * Implementacao real de IRolloutRepository usando Supabase.
 *
 * Status: implementacao canonica; depende da migration de module_rollouts no ambiente.
 * Schema versionado exclusivamente em supabase/migrations.
 */

import { supabase } from "@/integrations/supabase";
import { RolloutError } from "../errors/RolloutError";
import type { IRolloutRepository } from "./IRolloutRepository";
import type {
  ModuleKey,
  ModuleRollout,
  RolloutStatus,
} from "../types/index";
import { ROLLOUT_PAGINATION, RolloutErrorCode } from "../types/index";

const TABLE = "module_rollouts";
const PUBLIC_ROLLOUT_COLUMNS =
  "id,module_key,location_id,status,config,created_at,updated_at";

type QueryResult<T> = Promise<{
  data: T;
  error: { code?: string; message?: string } | null;
  count?: number | null;
}>;

interface QueryBuilder<TRow> {
  select(
    columns?: string,
    options?: { count?: "exact" | "planned" | "estimated" },
  ): QueryBuilder<TRow>;
  upsert(values: unknown, options?: { onConflict?: string }): QueryBuilder<TRow>;
  delete(): QueryBuilder<TRow>;
  eq(column: string, value: unknown): QueryBuilder<TRow>;
  in(column: string, values: readonly unknown[]): QueryBuilder<TRow>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<TRow>;
  range(from: number, to: number): QueryBuilder<TRow>;
  maybeSingle(): QueryResult<TRow | null>;
  single(): QueryResult<TRow>;
  then<
    TResult1 = {
      data: TRow[];
      error: { code?: string; message?: string } | null;
      count?: number | null;
    },
    TResult2 = never,
  >(
    onfulfilled?:
      | ((
          value: {
            data: TRow[];
            error: { code?: string; message?: string } | null;
            count?: number | null;
          },
        ) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
}

interface RolloutDbClient {
  from<TRow>(table: string): QueryBuilder<TRow>;
}

type ModuleRolloutRow = ModuleRollout;

const rolloutDb = supabase as unknown as RolloutDbClient;

function rowToRollout(row: ModuleRolloutRow): ModuleRollout {
  return {
    id: row.id,
    module_key: row.module_key,
    location_id: row.location_id,
    status: row.status,
    config: row.config ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export class RolloutRepositorySupabase implements IRolloutRepository {
  async findByModuleAndLocation(
    module_key: ModuleKey,
    location_id: string,
  ): Promise<ModuleRollout | null> {
    const { data, error } = await rolloutDb
      .from<ModuleRolloutRow>(TABLE)
      .select(PUBLIC_ROLLOUT_COLUMNS)
      .eq("module_key", module_key)
      .eq("location_id", location_id)
      .maybeSingle();

    if (error) {
      throw new RolloutError(RolloutErrorCode.DATABASE_ERROR, error.message);
    }
    if (!data) {
      return null;
    }
    return rowToRollout(data);
  }

  async findByModuleAndLocations(
    module_key: ModuleKey,
    location_ids: string[],
  ): Promise<Map<string, ModuleRollout>> {
    if (location_ids.length === 0) {
      return new Map();
    }

    const { data, error } = await rolloutDb
      .from<ModuleRolloutRow>(TABLE)
      .select(PUBLIC_ROLLOUT_COLUMNS)
      .eq("module_key", module_key)
      .in("location_id", location_ids);

    if (error) {
      throw new RolloutError(RolloutErrorCode.DATABASE_ERROR, error.message);
    }

    const result = new Map<string, ModuleRollout>();
    for (const row of data ?? []) {
      const rollout = rowToRollout(row);
      result.set(rollout.location_id, rollout);
    }
    return result;
  }

  async findByModule(
    module_key: ModuleKey,
    options: { status?: RolloutStatus; page?: number; page_size?: number },
  ): Promise<{ rollouts: ModuleRollout[]; total_count: number }> {
    const page = options.page ?? ROLLOUT_PAGINATION.DEFAULT_PAGE;
    const page_size = options.page_size ?? ROLLOUT_PAGINATION.DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * page_size;

    let query = rolloutDb
      .from<ModuleRolloutRow>(TABLE)
      .select(PUBLIC_ROLLOUT_COLUMNS, { count: "exact" })
      .eq("module_key", module_key)
      .order("created_at", { ascending: false })
      .range(offset, offset + page_size - 1);

    if (options.status) {
      query = query.eq("status", options.status);
    }

    const { data, error, count } = await query;
    if (error) {
      throw new RolloutError(RolloutErrorCode.DATABASE_ERROR, error.message);
    }

    return {
      rollouts: (data ?? []).map(rowToRollout),
      total_count: count ?? 0,
    };
  }

  async findByLocation(location_id: string): Promise<ModuleRollout[]> {
    const { data, error } = await rolloutDb
      .from<ModuleRolloutRow>(TABLE)
      .select(PUBLIC_ROLLOUT_COLUMNS)
      .eq("location_id", location_id)
      .order("module_key", { ascending: true });

    if (error) {
      throw new RolloutError(RolloutErrorCode.DATABASE_ERROR, error.message);
    }
    return (data ?? []).map(rowToRollout);
  }

  async upsert(
    module_key: ModuleKey,
    location_id: string,
    status: RolloutStatus,
    config?: Record<string, unknown>,
    user_id?: string,
  ): Promise<ModuleRollout> {
    const now = new Date().toISOString();
    void user_id;

    const { data, error } = await rolloutDb
      .from<ModuleRolloutRow>(TABLE)
      .upsert(
        {
          module_key,
          location_id,
          status,
          config: config ?? null,
          updated_at: now,
        },
        { onConflict: "module_key,location_id" },
      )
      .select(PUBLIC_ROLLOUT_COLUMNS)
      .single();

    if (error) {
      throw new RolloutError(RolloutErrorCode.DATABASE_ERROR, error.message);
    }
    return rowToRollout(data);
  }

  async delete(module_key: ModuleKey, location_id: string): Promise<void> {
    const { error } = await rolloutDb
      .from<ModuleRolloutRow>(TABLE)
      .delete()
      .eq("module_key", module_key)
      .eq("location_id", location_id);

    if (error) {
      throw new RolloutError(RolloutErrorCode.DATABASE_ERROR, error.message);
    }
  }
}
