export const ORDAX_PRODUCT_OAUTH_CLIENT_ID = "acheguese-web-01" as const;
export const ORDAX_PRODUCT_OAUTH_AUDIENCE =
  "ordax:first-party:acheguese" as const;

export const ORDAX_PRODUCT_OAUTH_INITIAL_SCOPES = Object.freeze([
  "network.space.read",
  "network.directory.read",
  "network.communities.read",
] as const);

export type OrdaxProductOAuthInitialScope =
  (typeof ORDAX_PRODUCT_OAUTH_INITIAL_SCOPES)[number];

const OAUTH_STATE_BYTES = 32;
const PKCE_VERIFIER_BYTES = 48;
const MAX_OAUTH_VALUE_LENGTH = 4_096;
const RESERVED_REDIRECT_QUERY_KEYS = new Set([
  "code",
  "state",
  "error",
  "error_description",
]);

export interface OrdaxProductOAuthServerConfig {
  readonly issuer: string;
  readonly redirectUri: string;
  readonly clientId: typeof ORDAX_PRODUCT_OAUTH_CLIENT_ID;
  readonly audience: typeof ORDAX_PRODUCT_OAUTH_AUDIENCE;
  readonly scopes: readonly OrdaxProductOAuthInitialScope[];
}

export interface OrdaxProductOAuthPkce {
  readonly verifier: string;
  readonly challenge: string;
  readonly method: "S256";
}

export interface OrdaxProductOAuthToken {
  readonly accessToken: string;
  readonly tokenType: "Bearer";
  readonly expiresIn: number;
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function containsUnsafeOpaqueCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if (
      code <= 0x20 ||
      code === 0x7f ||
      character.trim() === ""
    ) {
      return true;
    }
  }
  return false;
}

function requireBoundedOpaqueValue(value: unknown, label: string): string {
  if (
    typeof value !== "string" ||
    value.length < 8 ||
    value.length > MAX_OAUTH_VALUE_LENGTH ||
    containsUnsafeOpaqueCharacter(value)
  ) {
    throw new TypeError(`${label} must be a bounded opaque value`);
  }
  return value;
}

function requireHttpsOrigin(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length > 512) {
    throw new TypeError(`${label} must be a bounded HTTPS origin`);
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new TypeError(`${label} must be a valid HTTPS origin`);
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.search !== "" ||
    parsed.hash !== "" ||
    (parsed.pathname !== "" && parsed.pathname !== "/")
  ) {
    throw new TypeError(`${label} must be an HTTPS origin without credentials, path, query or fragment`);
  }

  return parsed.origin;
}

function requireHttpsRedirectUri(value: unknown): string {
  if (typeof value !== "string" || value.length > 1_024) {
    throw new TypeError("OrdaX OAuth redirect URI must be a bounded HTTPS URL");
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new TypeError("OrdaX OAuth redirect URI must be a valid HTTPS URL");
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.hash !== ""
  ) {
    throw new TypeError(
      "OrdaX OAuth redirect URI must use HTTPS without credentials or fragment",
    );
  }

  for (const key of parsed.searchParams.keys()) {
    if (RESERVED_REDIRECT_QUERY_KEYS.has(key)) {
      throw new TypeError(
        "OrdaX OAuth redirect URI cannot contain reserved OAuth query keys",
      );
    }
  }

  return parsed.toString();
}

export function resolveOrdaxProductOAuthServerConfig(input: {
  readonly enabled?: string | null;
  readonly issuer?: string | null;
  readonly redirectUri?: string | null;
}): OrdaxProductOAuthServerConfig | null {
  if (input.enabled !== "true") return null;

  return Object.freeze({
    issuer: requireHttpsOrigin(input.issuer, "OrdaX OAuth issuer"),
    redirectUri: requireHttpsRedirectUri(input.redirectUri),
    clientId: ORDAX_PRODUCT_OAUTH_CLIENT_ID,
    audience: ORDAX_PRODUCT_OAUTH_AUDIENCE,
    scopes: ORDAX_PRODUCT_OAUTH_INITIAL_SCOPES,
  });
}

export function createOrdaxOAuthState(): string {
  return base64Url(randomBytes(OAUTH_STATE_BYTES));
}

export async function createOrdaxOAuthPkce(): Promise<OrdaxProductOAuthPkce> {
  const verifier = base64Url(randomBytes(PKCE_VERIFIER_BYTES));
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );

  return Object.freeze({
    verifier,
    challenge: base64Url(new Uint8Array(digest)),
    method: "S256" as const,
  });
}

export function assertOrdaxOAuthCallback(input: {
  readonly code: unknown;
  readonly state: unknown;
  readonly expectedState: string;
}): { readonly code: string } {
  const expectedState = requireBoundedOpaqueValue(
    input.expectedState,
    "Expected OrdaX OAuth state",
  );
  const state = requireBoundedOpaqueValue(input.state, "OrdaX OAuth state");
  const code = requireBoundedOpaqueValue(input.code, "OrdaX OAuth code");

  if (state !== expectedState) {
    throw new TypeError("OrdaX OAuth state mismatch");
  }

  return Object.freeze({ code });
}

export function buildOrdaxOAuthTokenRequest(
  config: OrdaxProductOAuthServerConfig,
  code: string,
  verifier: string,
): { readonly url: string; readonly body: string } {
  const safeCode = requireBoundedOpaqueValue(code, "OrdaX OAuth code");
  const safeVerifier = requireBoundedOpaqueValue(
    verifier,
    "OrdaX OAuth PKCE verifier",
  );

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    code: safeCode,
    redirect_uri: config.redirectUri,
    code_verifier: safeVerifier,
  }).toString();

  return Object.freeze({
    url: new URL("/oauth/token", config.issuer).toString(),
    body,
  });
}

export function buildOrdaxOAuthRevocationRequest(
  config: OrdaxProductOAuthServerConfig,
  accessToken: string,
): { readonly url: string; readonly body: string } {
  const token = requireBoundedOpaqueValue(
    accessToken,
    "OrdaX OAuth access token",
  );

  return Object.freeze({
    url: new URL("/oauth/revoke", config.issuer).toString(),
    body: new URLSearchParams({ token }).toString(),
  });
}

export function validateOrdaxOAuthTokenResponse(
  value: unknown,
): OrdaxProductOAuthToken {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("OrdaX OAuth token response must be an object");
  }

  const input = value as Record<string, unknown>;
  if (
    typeof input.access_token !== "string" ||
    input.access_token.length < 16 ||
    input.access_token.length > MAX_OAUTH_VALUE_LENGTH ||
    containsUnsafeOpaqueCharacter(input.access_token)
  ) {
    throw new TypeError("OrdaX OAuth access token is invalid");
  }
  if (input.token_type !== "Bearer") {
    throw new TypeError("OrdaX OAuth token type must be Bearer");
  }
  if (
    !Number.isSafeInteger(input.expires_in) ||
    Number(input.expires_in) < 1 ||
    Number(input.expires_in) > 3_600
  ) {
    throw new TypeError("OrdaX OAuth token expiry is invalid");
  }
  if ("refresh_token" in input) {
    throw new TypeError("OrdaX OAuth refresh tokens are not enabled");
  }

  return Object.freeze({
    accessToken: input.access_token,
    tokenType: "Bearer",
    expiresIn: Number(input.expires_in),
  });
}