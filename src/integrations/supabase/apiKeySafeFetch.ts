type FetchLike = typeof fetch;

function isNewFormatSupabaseApiKey(apiKey: string): boolean {
  return (
    apiKey.startsWith("sb_publishable_") ||
    apiKey.startsWith("sb_secret_")
  );
}

function mergeRequestHeaders(
  input: RequestInfo | URL,
  init?: RequestInit,
): Headers {
  const headers = new Headers();

  if (typeof Request !== "undefined" && input instanceof Request) {
    input.headers.forEach((value, key) => headers.set(key, value));
  }

  new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
  return headers;
}

/**
 * New-format Supabase API keys are application credentials, not JWTs.
 *
 * Older supabase-js releases can copy the API key into Authorization as a
 * Bearer fallback before a user session exists. Supabase requires new-format
 * keys to travel on the apikey header instead.
 *
 * This adapter removes only that exact API-key Bearer fallback. Real user JWTs,
 * legacy JWT API keys and unrelated Authorization headers are preserved.
 */
export function createSupabaseApiKeySafeFetch(
  apiKey: string,
  baseFetch: FetchLike = fetch,
): FetchLike {
  if (!isNewFormatSupabaseApiKey(apiKey)) {
    return baseFetch;
  }

  return async (input, init) => {
    const headers = mergeRequestHeaders(input, init);

    if (headers.get("Authorization") === `Bearer ${apiKey}`) {
      headers.delete("Authorization");
    }

    return baseFetch(input, { ...init, headers });
  };
}
