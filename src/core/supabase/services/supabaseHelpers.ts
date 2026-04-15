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
