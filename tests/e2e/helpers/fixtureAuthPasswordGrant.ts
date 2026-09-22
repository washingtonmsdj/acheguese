export interface FixtureAuthPasswordGrantSession {
  access_token: string;
  refresh_token: string;
}

interface FixtureAuthPasswordGrantOptions {
  supabaseUrl: string;
  publishableKey: string;
  email: string;
  password: string;
  fetchImpl?: typeof fetch;
  maxAttempts?: number;
  retryDelayMs?: number;
}

class FixtureAuthPasswordGrantError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly contentType: string,
    readonly transient: boolean,
  ) {
    super(message);
    this.name = "FixtureAuthPasswordGrantError";
  }
}

function authTokenUrl(supabaseUrl: string): string {
  return new URL(
    "/auth/v1/token?grant_type=password",
    supabaseUrl.endsWith("/") ? supabaseUrl : `${supabaseUrl}/`,
  ).toString();
}

function isTransientStatus(status: number): boolean {
  return (
    status === 408 ||
    status === 425 ||
    status === 429 ||
    (status >= 500 && status <= 599)
  );
}

function payloadMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  for (const key of ["message", "msg", "error_description", "error"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function parseJsonResponse(
  response: Response,
  rawBody: string,
): unknown {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new FixtureAuthPasswordGrantError(
      `Supabase Auth password grant returned non-JSON response: HTTP ${response.status}; content-type=${contentType || "missing"}.`,
      response.status,
      contentType,
      true,
    );
  }

  try {
    return rawBody ? JSON.parse(rawBody) : {};
  } catch {
    throw new FixtureAuthPasswordGrantError(
      `Supabase Auth password grant returned invalid JSON: HTTP ${response.status}; content-type=${contentType}.`,
      response.status,
      contentType,
      true,
    );
  }
}

function assertSessionPayload(
  response: Response,
  payload: unknown,
): FixtureAuthPasswordGrantSession {
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok) {
    throw new FixtureAuthPasswordGrantError(
      `Supabase Auth password grant failed: HTTP ${response.status}${
        payloadMessage(payload) ? `; ${payloadMessage(payload)}` : ""
      }.`,
      response.status,
      contentType,
      isTransientStatus(response.status),
    );
  }

  if (!payload || typeof payload !== "object") {
    throw new FixtureAuthPasswordGrantError(
      "Supabase Auth password grant returned an invalid session payload.",
      response.status,
      contentType,
      false,
    );
  }

  const record = payload as Record<string, unknown>;
  if (
    typeof record.access_token !== "string" ||
    !record.access_token ||
    typeof record.refresh_token !== "string" ||
    !record.refresh_token
  ) {
    throw new FixtureAuthPasswordGrantError(
      "Supabase Auth password grant response is missing access_token or refresh_token.",
      response.status,
      contentType,
      false,
    );
  }

  return {
    access_token: record.access_token,
    refresh_token: record.refresh_token,
  };
}

export async function signInFixtureWithPasswordGrant({
  supabaseUrl,
  publishableKey,
  email,
  password,
  fetchImpl = fetch,
  maxAttempts = 3,
  retryDelayMs = 750,
}: FixtureAuthPasswordGrantOptions): Promise<FixtureAuthPasswordGrantSession> {
  if (!supabaseUrl || !publishableKey || !email || !password) {
    throw new Error(
      "Fixture Auth password grant requires Supabase URL, publishable key, email and password.",
    );
  }

  let lastError: unknown = null;
  const target = authTokenUrl(supabaseUrl);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchImpl(target, {
        method: "POST",
        headers: {
          Accept: "application/json",
          apikey: publishableKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const rawBody = await response.text();
      const payload = parseJsonResponse(response, rawBody);
      return assertSessionPayload(response, payload);
    } catch (error) {
      lastError = error;
      const transient =
        error instanceof FixtureAuthPasswordGrantError
          ? error.transient
          : true;

      if (!transient || attempt === maxAttempts) break;
      await new Promise((resolve) =>
        setTimeout(resolve, retryDelayMs * attempt),
      );
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : String(lastError ?? "");
  throw new Error(
    `Fixture Auth bootstrap failed after transient-safe password grant: ${message || "unknown error"}`,
  );
}
