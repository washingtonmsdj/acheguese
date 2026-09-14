import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_FLOW_STORAGE_KEYS,
  AUTH_JOURNEY_INTENTS,
  AUTH_PATHS,
} from "@/core/auth/constants/authFlow";
import {
  cancelGoogleLogin,
  cancelGoogleSignup,
  completeEmailConfirmationLoginJourney,
  completeFirstAccessJourney,
  completeStandardLoginJourney,
  getAuthJourneyReturnTarget,
  getPendingAuthJourneyIntent,
  getSignupConfirmationContext,
  getSignupJourneyReturnTarget,
  prepareEmailSignupConfirmation,
  prepareGoogleLogin,
  prepareGoogleSignup,
  restartEmailSignupJourney,
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
    expect(getAuthJourneyReturnTarget()).toBe("/mensagens/abc");
    expect(getPendingAuthJourneyIntent()).toBe(AUTH_JOURNEY_INTENTS.login);

    cancelGoogleLogin();
    expect(getPendingAuthReturn()).toBeNull();
    expect(getPendingAuthJourneyIntent()).toBeNull();
  });

  it("keeps first access and original destination separate for Google signup", () => {
    prepareGoogleSignup("/mensagens/abc");

    expect(getAuthJourneyReturnTarget()).toBe(AUTH_PATHS.firstAccess);
    expect(getSignupJourneyReturnTarget()).toBe("/mensagens/abc");
    expect(getPendingSignupEmail()).toBeNull();
    expect(getPendingAuthJourneyIntent()).toBe(AUTH_JOURNEY_INTENTS.signup);

    cancelGoogleSignup();
    expect(getPendingAuthReturn()).toBeNull();
    expect(getPendingSignupRedirect()).toBeNull();
    expect(getPendingAuthJourneyIntent()).toBeNull();
  });

  it("owns email signup confirmation context and normalizes the pending email", () => {
    prepareGoogleLogin("/conta");
    prepareEmailSignupConfirmation("  ANA@EXAMPLE.COM  ", "/mensagens/abc");

    expect(getSignupConfirmationContext()).toEqual({
      email: "ana@example.com",
      returnTo: "/mensagens/abc",
    });
    expect(getPendingAuthReturn()).toBeNull();
    expect(getPendingAuthJourneyIntent()).toBeNull();
  });

  it("sanitizes unsafe signup return targets inside the journey owner", () => {
    prepareEmailSignupConfirmation("ana@example.com", "https://evil.example/path");

    expect(getSignupJourneyReturnTarget()).toBe("/");
    expect(getSignupConfirmationContext().returnTo).toBe("/");
  });

  it("restarts email signup without losing the original safe destination", () => {
    prepareEmailSignupConfirmation("ana@example.com", "/mensagens/abc");
    restartEmailSignupJourney();

    expect(getPendingSignupEmail()).toBeNull();
    expect(getSignupJourneyReturnTarget()).toBe("/mensagens/abc");
  });

  it("cleans every transient auth context after normal login", () => {
    prepareGoogleSignup("/conta");
    completeStandardLoginJourney();

    expect(getPendingAuthReturn()).toBeNull();
    expect(getPendingSignupRedirect()).toBeNull();
    expect(getPendingAuthJourneyIntent()).toBeNull();
    expect(
      window.sessionStorage.getItem(AUTH_FLOW_STORAGE_KEYS.pendingSignupEmail),
    ).toBeNull();
  });

  it("preserves signup redirect after email confirmation until first access", () => {
    prepareEmailSignupConfirmation("ana@example.com", "/mensagens/abc");
    completeEmailConfirmationLoginJourney();

    expect(getPendingAuthReturn()).toBeNull();
    expect(getSignupJourneyReturnTarget()).toBe("/mensagens/abc");
    expect(getPendingSignupEmail()).toBe("ana@example.com");
  });

  it("cleans the complete signup context only when first access finishes", () => {
    prepareEmailSignupConfirmation("ana@example.com", "/mensagens/abc");
    completeFirstAccessJourney();

    expect(getPendingAuthReturn()).toBeNull();
    expect(getPendingAuthJourneyIntent()).toBeNull();
    expect(getPendingSignupEmail()).toBeNull();
    expect(getPendingSignupRedirect()).toBeNull();
  });
});
