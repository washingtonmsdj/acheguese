const HIBP_RANGE_URL = 'https://api.pwnedpasswords.com/range/';
const HIBP_TIMEOUT_MS = 4_000;

export interface CompromisedPasswordResult {
  compromised: boolean;
  count: number;
}

function wipe(buffer: Uint8Array): void {
  try {
    buffer.fill(0);
  } catch {
    // Best-effort only.
  }
}

async function sha1Hex(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-1', encoded);
  const bytes = new Uint8Array(digest);

  try {
    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  } finally {
    wipe(encoded);
    wipe(bytes);
  }
}

/**
 * Server-side HIBP Pwned Passwords lookup using the k-Anonymity range API.
 * Only the first five SHA-1 characters leave the function; the password and
 * complete hash are never sent to HIBP.
 *
 * Throws when the upstream cannot be verified. Callers that enforce password
 * safety at privileged boundaries should fail closed rather than silently
 * creating an account without the check.
 */
export async function checkCompromisedPassword(
  password: string,
): Promise<CompromisedPasswordResult> {
  let hash = await sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    HIBP_TIMEOUT_MS,
  );

  try {
    const response = await fetch(`${HIBP_RANGE_URL}${prefix}`, {
      headers: { 'Add-Padding': 'true' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HIBP password range lookup failed with ${response.status}`);
    }

    const body = await response.text();
    for (const line of body.split(/\r?\n/)) {
      const [candidateSuffix, rawCount] = line.split(':');
      if (candidateSuffix !== suffix) continue;

      const count = Number.parseInt(rawCount ?? '', 10);
      if (!Number.isFinite(count) || count < 1) continue;
      return { compromised: true, count };
    }

    return { compromised: false, count: 0 };
  } finally {
    globalThis.clearTimeout(timeout);
    hash = '';
  }
}
