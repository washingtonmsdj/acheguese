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

function getFunctionsHttpErrorContext(
  error: unknown,
): { json(): Promise<unknown> } | null {
  if (!error || typeof error !== "object" || Array.isArray(error)) return null;
  if (Reflect.get(error, "name") !== "FunctionsHttpError") return null;

  const context = Reflect.get(error, "context");
  if (!context || typeof context !== "object" || Array.isArray(context)) return null;

  const json = Reflect.get(context, "json");
  if (typeof json !== "function") return null;

  return {
    json: () => Promise.resolve(Reflect.apply(json, context, [])),
  };
}

export async function readSupabaseFunctionHttpErrorBody(
  error: unknown,
): Promise<unknown | null> {
  const context = getFunctionsHttpErrorContext(error);
  if (!context) return null;

  try {
    return await context.json();
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
