import { FunctionsHttpError } from "@supabase/supabase-js";

function messageFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;

  for (const key of ["error", "message"] as const) {
    const value = Reflect.get(payload, key);
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return null;
}

function messageFromError(error: unknown): string | null {
  if (!error || typeof error !== "object" || Array.isArray(error)) return null;
  const message = Reflect.get(error, "message");
  return typeof message === "string" && message.trim() ? message.trim() : null;
}

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

export async function resolveSupabaseFunctionErrorMessage(
  error: unknown,
): Promise<string | null> {
  const payload = await readSupabaseFunctionHttpErrorBody(error);
  return messageFromPayload(payload) ?? messageFromError(error);
}
