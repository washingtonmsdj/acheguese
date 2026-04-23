/**
 * Typed Supabase helpers.
 *
 * This file lives under a core service boundary because these helpers execute
 * database operations and are consumed only by services.
 */

import { supabase } from "@/integrations/supabase";
import type { Database } from "@/integrations/supabase/types.generated";

type TableName = keyof Database["public"]["Tables"];
type TableRow<T extends TableName> = Database["public"]["Tables"][T]["Row"];
type TableInsert<T extends TableName> =
  Database["public"]["Tables"][T]["Insert"];
type TableUpdate<T extends TableName> =
  Database["public"]["Tables"][T]["Update"];

export function createTypedQuery<T extends TableName>(tableName: T) {
  type Row = TableRow<T>;
  type Insert = TableInsert<T>;
  type Update = TableUpdate<T>;

  return {
    select: (columns = "*") => supabase.from(tableName).select<Row>(columns),
    insert: (data: Insert | Insert[]) =>
      supabase.from(tableName).insert(data).select<Row>("*"),
    update: (data: Update) =>
      supabase.from(tableName).update(data).select<Row>("*"),
    delete: () => supabase.from(tableName).delete(),
    upsert: (data: Insert | Insert[]) =>
      supabase.from(tableName).upsert(data).select<Row>("*"),
  };
}

export async function callRPC<T = unknown>(
  functionName: string,
  params?: Record<string, unknown>,
): Promise<{ data: T | null; error: unknown }> {
  return supabase.rpc(functionName, params);
}

export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: { message?: string } | null }>,
): Promise<T> {
  const { data, error } = await queryFn();

  if (error) {
    throw new Error(`Database query failed: ${error.message ?? "unknown error"}`);
  }

  if (data === null) {
    throw new Error("Query returned null data");
  }

  return data;
}

export async function executeQueryMaybe<T>(
  queryFn: () => Promise<{ data: T | null; error: { message?: string } | null }>,
): Promise<T | null> {
  const { data, error } = await queryFn();

  if (error) {
    throw new Error(`Database query failed: ${error.message ?? "unknown error"}`);
  }

  return data;
}

export async function executeParallel<T extends unknown[]>(
  queries: Array<() => Promise<{ data: unknown; error: { message?: string } | null }>>,
): Promise<T> {
  const results = await Promise.all(
    queries.map((query) => executeQueryMaybe(query)),
  );

  return results as T;
}

export function isSupabaseError(error: unknown): error is {
  message: string;
  code: string;
  details: string;
  hint: string;
} {
  return (
    !!error &&
    typeof error === "object" &&
    "message" in error &&
    "code" in error
  );
}

type LooseFilter =
  | { op: "eq"; column: string; value: unknown }
  | { op: "lt"; column: string; value: unknown }
  | { op: "in"; column: string; values: unknown[] }
  | { op: "or"; expression: string };

interface LooseSelectOptions {
  columns?: string;
  filters?: LooseFilter[];
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
}

interface LooseBuilder {
  eq: (column: string, value: unknown) => LooseBuilder;
  lt: (column: string, value: unknown) => LooseBuilder;
  in: (column: string, values: unknown[]) => LooseBuilder;
  or: (expression: string) => LooseBuilder;
  order: (column: string, options?: { ascending?: boolean }) => LooseBuilder;
  limit: (count: number) => LooseBuilder;
  then: PromiseLike<{ data: unknown[] | null; error: unknown }>["then"];
}

interface LooseMutationBuilder {
  eq: (column: string, value: unknown) => LooseMutationBuilder;
  then: PromiseLike<{ error: unknown }>["then"];
}

export async function selectLooseRows<TRow extends Record<string, unknown>>(
  tableName: string,
  options: LooseSelectOptions = {},
): Promise<{ data: TRow[] | null; error: unknown }> {
  const { columns = "*", filters = [], orderBy, limit } = options;
  let query = supabase.from(tableName as never).select(columns) as unknown as LooseBuilder;

  for (const filter of filters) {
    if (filter.op === "eq") query = query.eq(filter.column, filter.value);
    if (filter.op === "lt") query = query.lt(filter.column, filter.value);
    if (filter.op === "in") query = query.in(filter.column, filter.values);
    if (filter.op === "or") query = query.or(filter.expression);
  }

  if (orderBy) query = query.order(orderBy.column, { ascending: orderBy.ascending });
  if (typeof limit === "number") query = query.limit(limit);

  const result = (await query) as { data: unknown[] | null; error: unknown };
  return { data: (result.data as TRow[] | null) ?? null, error: result.error };
}

export async function insertLooseRow(
  tableName: string,
  row: Record<string, unknown>,
): Promise<{ error: unknown }> {
  const result = (await (supabase
    .from(tableName as never)
    .insert(row as never) as unknown as Promise<{ error: unknown }>)) as {
    error: unknown;
  };
  return { error: result.error };
}

export async function updateLooseRows(
  tableName: string,
  patch: Record<string, unknown>,
  filters: Array<{ column: string; value: unknown }>,
): Promise<{ error: unknown }> {
  let query = supabase
    .from(tableName as never)
    .update(patch as never) as unknown as LooseMutationBuilder;

  for (const filter of filters) {
    query = query.eq(filter.column, filter.value);
  }

  const result = (await query) as { error: unknown };
  return { error: result.error };
}
