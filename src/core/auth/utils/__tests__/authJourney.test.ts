import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_FLOW_STORAGE_KEYS, AUTH_PATHS } from "@/core/auth/constants/authFlow";
import {
  cancelGoogleLogin,
  cancelGoogleSignup,
  completeEmailConfirmationLoginJourney,
  completeStandardLoginJourney,
  prepareGoogleLogin,
  prepareGoogleSignup,
} from "@/core/auth/utils/authJourney";
import { getPendingAuthReturn } from "@/core/auth/utils/pendingAuthReturn";
import {
  getPendingSignupEmail,
  getPendingSignupRedirect,
  setPendingSignupEmail,
} from "@/core/auth/utils/pendingSignup";

describe("authJourney", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-14T18:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    window.sessionStorage.clear();
  });

  it("prepares Google login without carrying stale signup state", () => {
    setPendingSignupEmail("OLD@EXAMPLE.COM");
    prepareGoogleLogin("/mensagens/abc");

    expect(getPendingSignupEmail()).toBeNull();
    expect(getPendingAuthReturn()).toBe("/mensagens/abc");

    cancelGoogleLogin();
    expect(getPendingAuthReturn()).toBeNull();
  });

  it("keeps first access and original destination separate for Google signup", () => {
    prepareGoogleSignup("/mensagens/abc");

    expect(getPendingAuthReturn()).toBe(AUTH_PATHS.firstAccess);
    expect(getPendingSignupRedirect()).toBe("/mensagens/abc");
    expect(getPendingSignupEmail()).toBeNull();

    cancelGoogleSignup();
    expect(getPendingAuthReturn()).toBeNull();
    expect(getPendingSignupRedirect()).toBeNull();
  });

  it("cleans every transient auth context after normal login", () => {
    prepareGoogleSignup("/conta");
    completeStandardLoginJourney();

    expect(getPendingAuthReturn()).toBeNull();
    expect(getPendingSignupRedirect()).toBeNull();
    expect(
      window.sessionStorage.getItem(AUTH_FLOW_STORAGE_KEYS.pendingSignupEmail),
    ).toBeNull();
  });

  it("preserves signup redirect after email confirmation until first access", () => {
    prepareGoogleSignup("/mensagens/abc");
    completeEmailConfirmationLoginJourney();

    expect(getPendingAuthReturn()).toBeNull();
    expect(getPendingSignupRedirect()).toBe("/mensagens/abc");
  });
});
