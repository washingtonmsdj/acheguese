import { FunctionsHttpError } from "@supabase/supabase-js";

export async function readSupabaseFunctionHttpErrorBody(
  error: unknown,
): Promise<unknown | null> {
  if (!(error instanceof FunctionsHttpError)) return null;

  try {
    return await error.context.json();
  } catch {
    return null;
  }
}
