import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearAuthFlowSessionValue,
  getAuthFlowSessionValue,
  setAuthFlowSessionValue,
} from "@/core/auth/utils/authFlowStorage";

describe("authFlowStorage", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-14T18:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    window.sessionStorage.clear();
  });

  it("stores ephemeral auth context in a versioned envelope", () => {
    setAuthFlowSessionValue("auth.test", "/mensagens/abc", 60_000);

    expect(getAuthFlowSessionValue("auth.test")).toBe("/mensagens/abc");
    const raw = window.sessionStorage.getItem("auth.test");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? "{}")).toMatchObject({
      version: 1,
      value: "/mensagens/abc",
    });
  });

  it("expires stale context instead of contaminating a later auth journey", () => {
    setAuthFlowSessionValue("auth.test", "/mensagens/abc", 1_000);
    vi.advanceTimersByTime(1_001);

    expect(getAuthFlowSessionValue("auth.test")).toBeNull();
    expect(window.sessionStorage.getItem("auth.test")).toBeNull();
  });

  it("rejects obsolete raw-string values instead of keeping a legacy branch alive", () => {
    window.sessionStorage.setItem("auth.test", "/conta");

    expect(getAuthFlowSessionValue("auth.test")).toBeNull();
    expect(window.sessionStorage.getItem("auth.test")).toBeNull();
  });

  it("rejects malformed or unsupported envelopes", () => {
    window.sessionStorage.setItem(
      "auth.test",
      JSON.stringify({ version: 2, value: "/conta", expiresAt: Date.now() + 60_000 }),
    );

    expect(getAuthFlowSessionValue("auth.test")).toBeNull();
    expect(window.sessionStorage.getItem("auth.test")).toBeNull();
  });

  it("clears a stored value idempotently", () => {
    setAuthFlowSessionValue("auth.test", "/conta", 60_000);
    clearAuthFlowSessionValue("auth.test");
    clearAuthFlowSessionValue("auth.test");
    expect(getAuthFlowSessionValue("auth.test")).toBeNull();
  });
});
