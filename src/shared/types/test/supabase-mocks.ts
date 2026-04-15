/**
 * Tipos auxiliares para mocks do Supabase em testes
 * Evita uso de 'as any' nos testes
 */

import type { User } from "@supabase/supabase-js";

// Mock types para queries do Supabase
export interface MockSupabaseQuery<T = unknown> {
  select?: (columns?: string) => MockSupabaseQuery<T>;
  insert?: (data: unknown) => MockSupabaseQuery<T>;
  update?: (data: unknown) => MockSupabaseQuery<T>;
  delete?: () => MockSupabaseQuery<T>;
  eq?: (column: string, value: unknown) => MockSupabaseQuery<T>;
  neq?: (column: string, value: unknown) => MockSupabaseQuery<T>;
  in?: (column: string, values: unknown[]) => MockSupabaseQuery<T>;
  order?: (
    column: string,
    options?: { ascending?: boolean },
  ) => MockSupabaseQuery<T>;
  limit?: (count: number) => MockSupabaseQuery<T>;
  single?: () => Promise<{ data: T | null; error: Error | null }>;
  maybeSingle?: () => Promise<{ data: T | null; error: Error | null }>;
  then?: (
    resolve: (value: { data: T[] | null; error: Error | null }) => void,
  ) => void;
}

// Mock type para auth.getUser response
export interface MockAuthUserResponse {
  data: { user: User | null };
  error: Error | null;
}

// Helper para criar mock de query
export function createMockQuery<T = unknown>(
  data: T[] | T | null = null,
  error: Error | null = null,
): MockSupabaseQuery<T> {
  const query: MockSupabaseQuery<T> = {
    select: () => query,
    insert: () => query,
    update: () => query,
    delete: () => query,
    eq: () => query,
    neq: () => query,
    in: () => query,
    order: () => query,
    limit: () => query,
    single: async () => ({ data: data as T | null, error }),
    maybeSingle: async () => ({ data: data as T | null, error }),
  };
  return query;
}

// Helper para criar mock de auth user
export function createMockAuthUser(user: Partial<User>): MockAuthUserResponse {
  return {
    data: { user: user as User },
    error: null,
  };
}
