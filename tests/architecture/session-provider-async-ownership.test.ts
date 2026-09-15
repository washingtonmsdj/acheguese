import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const provider = readFileSync(
  resolve(root, "src/core/session/providers/SessionProvider.tsx"),
  "utf8",
);
const service = readFileSync(
  resolve(root, "src/core/session/services/SessionService.ts"),
  "utf8",
);

describe("session provider async ownership", () => {
  it("keeps bootstrap loading separate from overlapping session operations", () => {
    expect(provider).toContain("const bootstrapLoadingRef = useRef(true);");
    expect(provider).toContain(
      "const activeOperationIdsRef = useRef<Set<number>>(new Set());",
    );
    expect(provider).toContain(
      "bootstrapLoadingRef.current || activeOperationIdsRef.current.size > 0",
    );
    expect(provider).toContain("activeOperationIdsRef.current.add(operationId);");
    expect(provider).toContain("activeOperationIdsRef.current.delete(operationId);");
  });

  it("lets only the latest live operation publish provider error state", () => {
    expect(provider).toContain("const latestOperationIdRef = useRef(0);");
    expect(provider).toContain("latestOperationIdRef.current = operationId;");
    expect(provider).toContain(
      "operationId !== latestOperationIdRef.current",
    );
    expect(provider).toContain(
      "setError(cause instanceof Error ? cause : new Error(String(cause)));",
    );
  });

  it("invalidates bootstrap and state publication after provider unmount", () => {
    expect(provider).toContain("const mountedRef = useRef(true);");
    expect(provider).toContain("const bootstrapVersionRef = useRef(0);");
    expect(provider).toContain(
      "bootstrapVersion !== bootstrapVersionRef.current",
    );
    expect(provider).toContain("mountedRef.current = false;");
    expect(provider).toContain("bootstrapVersionRef.current += 1;");
    expect(provider).toContain("activeOperationIdsRef.current.clear();");
  });

  it("preserves known session identity while exposing initial hydration failure", () => {
    const initialization = provider.indexOf("SessionService.initializeSession()");
    const catchBlock = provider.indexOf(".catch((cause: unknown) => {", initialization);
    const snapshot = provider.indexOf(
      "setSessionData(SessionState.getState());",
      catchBlock,
    );
    const publishError = provider.indexOf(
      "setError(cause instanceof Error ? cause : new Error(String(cause)));",
      snapshot,
    );
    const finish = provider.indexOf("finishBootstrap();", publishError);

    expect(initialization).toBeGreaterThanOrEqual(0);
    expect(catchBlock).toBeGreaterThan(initialization);
    expect(snapshot).toBeGreaterThan(catchBlock);
    expect(publishError).toBeGreaterThan(snapshot);
    expect(finish).toBeGreaterThan(publishError);
  });

  it("keeps UI timeout in the provider without resolving canonical session authority early", () => {
    expect(provider).toContain("const AUTH_INIT_TIMEOUT_MS = 7000;");
    expect(provider).toContain("const timeout = setTimeout(() => {");
    expect(provider).toContain("finishBootstrap();");
    expect(service).toContain("await SessionService.initPromise;");
    expect(service).toContain("if (SessionService.initError) {");
    expect(service).not.toContain("initFallbackStarted");
    expect(service).not.toContain("ensureInitialSessionFallback");
    expect(service).not.toContain("2500");
  });

  it("routes switch and refresh through the same operation owner", () => {
    expect(provider).toContain("const operationId = beginOperation();");
    expect(provider).toContain("await SessionService.switchProfile(profileId);");
    expect(provider).toContain("await SessionService.refreshSession();");
    expect(provider).toContain("publishOperationError(operationId, cause);");
    expect(provider).toContain("endOperation(operationId);");
  });
});
