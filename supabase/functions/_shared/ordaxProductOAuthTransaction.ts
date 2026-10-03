import {
  ORDAX_PRODUCT_OAUTH_CLIENT_ID,
  type OrdaxProductOAuthInitialScope,
  type OrdaxProductOAuthServerConfig,
  createOrdaxOAuthPkce,
  createOrdaxOAuthState,
} from "./ordaxProductOAuth.ts";

export const ORDAX_OAUTH_PENDING_TRANSACTION_SCHEMA =
  "acheguese.ordax-oauth-pending-transaction/1" as const;

export const ORDAX_OAUTH_PENDING_TRANSACTION_TTL_MS = 5 * 60 * 1_000;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const MAX_CODE_LENGTH = 4_096;

export interface OrdaxOAuthPendingTransactionRecord {
  readonly schema: typeof ORDAX_OAUTH_PENDING_TRANSACTION_SCHEMA;
  readonly ownerUserId: string;
  readonly profileId: string;
  readonly stateDigest: string;
  readonly pkceVerifier: string;
  readonly clientId: typeof ORDAX_PRODUCT_OAUTH_CLIENT_ID;
  readonly redirectUri: string;
  readonly scopes: readonly OrdaxProductOAuthInitialScope[];
  readonly createdAt: string;
  readonly expiresAt: string;
}

export interface OrdaxOAuthConsentInitialization {
  readonly clientId: typeof ORDAX_PRODUCT_OAUTH_CLIENT_ID;
  readonly redirectUri: string;
  readonly scope: string;
  readonly state: string;
  readonly codeChallenge: string;
  readonly codeChallengeMethod: "S256";
}

export interface OrdaxOAuthPendingTransactionStore {
  /**
   * Persist the server-only transaction record. Implementations must not expose
   * the PKCE verifier or raw OAuth state to browser-readable storage.
   */
  create(record: OrdaxOAuthPendingTransactionRecord): Promise<void>;

  /**
   * Atomically returns and removes exactly one matching pending transaction.
   * Implementations must make replay/double-consumption impossible.
   */
  consumeOnce(input: {
    readonly stateDigest: string;
    readonly ownerUserId: string;
    readonly profileId: string;
  }): Promise<OrdaxOAuthPendingTransactionRecord | null>;
}

function requireUuid(value: unknown, label: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new TypeError(`${label} must be a UUID`);
  }
  return value.toLowerCase();
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return base64Url(new Uint8Array(digest));
}

function requireCallbackState(value: unknown): string {
  if (typeof value !== "string" || !STATE_PATTERN.test(value)) {
    throw new TypeError("OrdaX OAuth callback state is invalid");
  }
  return value;
}

function requireAuthorizationCode(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length < 8 ||
    value.length > MAX_CODE_LENGTH
  ) {
    throw new TypeError("OrdaX OAuth authorization code is invalid");
  }

  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (
      codePoint <= 0x20 ||
      codePoint === 0x7f ||
      character.trim() === ""
    ) {
      throw new TypeError("OrdaX OAuth authorization code is invalid");
    }
  }

  return value;
}

function assertRecordMatchesConfig(
  record: OrdaxOAuthPendingTransactionRecord,
  config: OrdaxProductOAuthServerConfig,
): void {
  if (
    record.schema !== ORDAX_OAUTH_PENDING_TRANSACTION_SCHEMA ||
    record.clientId !== config.clientId ||
    record.redirectUri !== config.redirectUri ||
    record.scopes.length !== config.scopes.length ||
    record.scopes.some((scope, index) => scope !== config.scopes[index])
  ) {
    throw new TypeError("OrdaX OAuth pending transaction contract mismatch");
  }
}

export async function createOrdaxOAuthPendingTransaction(input: {
  readonly config: OrdaxProductOAuthServerConfig;
  readonly ownerUserId: string;
  readonly profileId: string;
  readonly nowMs?: number;
}): Promise<{
  readonly record: OrdaxOAuthPendingTransactionRecord;
  readonly consent: OrdaxOAuthConsentInitialization;
}> {
  const ownerUserId = requireUuid(input.ownerUserId, "OrdaX OAuth owner user");
  const profileId = requireUuid(input.profileId, "OrdaX OAuth Profile");
  const nowMs = input.nowMs ?? Date.now();

  if (!Number.isSafeInteger(nowMs) || nowMs < 0) {
    throw new TypeError("OrdaX OAuth transaction clock is invalid");
  }

  const state = createOrdaxOAuthState();
  const pkce = await createOrdaxOAuthPkce();
  const stateDigest = await sha256Base64Url(state);
  const createdAt = new Date(nowMs).toISOString();
  const expiresAt = new Date(
    nowMs + ORDAX_OAUTH_PENDING_TRANSACTION_TTL_MS,
  ).toISOString();

  const record = Object.freeze({
    schema: ORDAX_OAUTH_PENDING_TRANSACTION_SCHEMA,
    ownerUserId,
    profileId,
    stateDigest,
    pkceVerifier: pkce.verifier,
    clientId: input.config.clientId,
    redirectUri: input.config.redirectUri,
    scopes: Object.freeze([...input.config.scopes]),
    createdAt,
    expiresAt,
  });

  const consent = Object.freeze({
    clientId: input.config.clientId,
    redirectUri: input.config.redirectUri,
    scope: input.config.scopes.join(" "),
    state,
    codeChallenge: pkce.challenge,
    codeChallengeMethod: pkce.method,
  });

  return Object.freeze({ record, consent });
}

export async function consumeOrdaxOAuthPendingCallback(input: {
  readonly store: OrdaxOAuthPendingTransactionStore;
  readonly config: OrdaxProductOAuthServerConfig;
  readonly ownerUserId: string;
  readonly profileId: string;
  readonly state: unknown;
  readonly code: unknown;
  readonly nowMs?: number;
}): Promise<{
  readonly record: OrdaxOAuthPendingTransactionRecord;
  readonly code: string;
}> {
  const ownerUserId = requireUuid(input.ownerUserId, "OrdaX OAuth owner user");
  const profileId = requireUuid(input.profileId, "OrdaX OAuth Profile");
  const state = requireCallbackState(input.state);
  const code = requireAuthorizationCode(input.code);
  const nowMs = input.nowMs ?? Date.now();

  if (!Number.isSafeInteger(nowMs) || nowMs < 0) {
    throw new TypeError("OrdaX OAuth callback clock is invalid");
  }

  const record = await input.store.consumeOnce({
    stateDigest: await sha256Base64Url(state),
    ownerUserId,
    profileId,
  });

  if (!record) {
    throw new TypeError(
      "OrdaX OAuth pending transaction is missing, mismatched or already consumed",
    );
  }

  assertRecordMatchesConfig(record, input.config);

  const expiresAtMs = Date.parse(record.expiresAt);
  if (!Number.isFinite(expiresAtMs) || nowMs > expiresAtMs) {
    throw new TypeError("OrdaX OAuth pending transaction has expired");
  }

  return Object.freeze({ record, code });
}
