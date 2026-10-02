export const CI_AUTH_UPSTREAM_TIMEOUT_MS = 10_000;

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

export interface BoundedAuthFetch {
  fetch: typeof fetch;
  didTimeout(): boolean;
}

export class AuthUpstreamTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Auth upstream request timed out after ${timeoutMs}ms.`);
    this.name = "AuthUpstreamTimeoutError";
  }
}

export function createBoundedAuthFetch(
  timeoutMs = CI_AUTH_UPSTREAM_TIMEOUT_MS,
  fetchImpl: typeof fetch = fetch,
): BoundedAuthFetch {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 30_000) {
    throw new Error("Auth upstream timeout must be between 1ms and 30000ms.");
  }

  let timedOut = false;

  const boundedFetch = async (
    input: FetchInput,
    init?: FetchInit,
  ): Promise<Response> => {
    const controller = new AbortController();
    const inheritedSignal =
      init?.signal ?? (input instanceof Request ? input.signal : undefined);
    const propagateAbort = () => controller.abort(inheritedSignal?.reason);

    if (inheritedSignal?.aborted) {
      propagateAbort();
    } else {
      inheritedSignal?.addEventListener("abort", propagateAbort, { once: true });
    }

    let requestTimedOut = false;
    const timer = setTimeout(() => {
      requestTimedOut = true;
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    try {
      return await fetchImpl(input, {
        ...init,
        signal: controller.signal,
      });
    } catch (error) {
      if (requestTimedOut) {
        throw new AuthUpstreamTimeoutError(timeoutMs);
      }
      throw error;
    } finally {
      clearTimeout(timer);
      inheritedSignal?.removeEventListener("abort", propagateAbort);
    }
  };

  return {
    fetch: boundedFetch as typeof fetch,
    didTimeout: () => timedOut,
  };
}
