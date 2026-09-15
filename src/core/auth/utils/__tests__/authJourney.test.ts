import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_EMAIL_CONFIRMATION_INTENTS,
  AUTH_FLOW_STORAGE_KEYS,
  AUTH_JOURNEY_INTENTS,
  AUTH_PATHS,
  AUTH_SIGNUP_CONFIRMATION_RESEND_COOLDOWN_MS,
} from "@/core/auth/constants/authFlow";
import { getAuthFlowSessionValue } from "@/core/auth/utils/authFlowStorage";
import {
  cancelGoogleLogin,
  cancelGoogleSignup,
  cancelUnconfirmedEmailLoginJourney,
  completeEmailConfirmationJourney,
  completeExistingGoogleSignupJourney,
  completeFirstAccessJourney,
  completeStandardLoginJourney,
  getAuthJourneyReturnTarget,
  getPendingAuthJourneyIntent,
  getSignupConfirmationContext,
  getSignupConfirmationResendRemainingMs,
  getSignupJourneyReturnTarget,
  prepareAuthenticatedEmailSignup,
  prepareEmailSignupConfirmation,
  prepareGoogleLogin,
  prepareGoogleSignup,
  prepareUnconfirmedEmailLogin,
  restartEmailSignupJourney,
  startSignupConfirmationResendCooldown,
} from "@/core/auth/utils/authJourney";

function getStored(key: string): string | null {
  return getAuthFlowSessionValue(key);
}

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
    prepareEmailSignupConfirmation("old@example.com", "/conta");
    prepareGoogleLogin("/mensagens/abc");

    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupEmail)).toBeNull();
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupRedirect)).toBeNull();
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingEmailConfirmationIntent)).toBeNull();
    expect(
      getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupConfirmationCooldownUntil),
    ).toBeNull();
    expect(getAuthJourneyReturnTarget()).toBe("/mensagens/abc");
    expect(getPendingAuthJourneyIntent()).toBe(AUTH_JOURNEY_INTENTS.login);

    cancelGoogleLogin();
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingReturn)).toBeNull();
    expect(getPendingAuthJourneyIntent()).toBeNull();
  });

  it("keeps first access and original destination separate for Google signup", () => {
    prepareGoogleSignup("/mensagens/abc");

    expect(getAuthJourneyReturnTarget()).toBe(AUTH_PATHS.firstAccess);
    expect(getSignupJourneyReturnTarget()).toBe("/mensagens/abc");
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupEmail)).toBeNull();
    expect(getPendingAuthJourneyIntent()).toBe(AUTH_JOURNEY_INTENTS.signup);

    cancelGoogleSignup();
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingReturn)).toBeNull();
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupRedirect)).toBeNull();
    expect(getPendingAuthJourneyIntent()).toBeNull();
  });

  it("cleans signup-only context when Google signup authenticates an existing account", () => {
    prepareGoogleSignup("/mensagens/abc");
    const originalReturn = getSignupJourneyReturnTarget();

    completeExistingGoogleSignupJourney();

    expect(originalReturn).toBe("/mensagens/abc");
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingReturn)).toBeNull();
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupRedirect)).toBeNull();
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupEmail)).toBeNull();
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingEmailConfirmationIntent)).toBeNull();
    expect(
      getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupConfirmationCooldownUntil),
    ).toBeNull();
    expect(getPendingAuthJourneyIntent()).toBeNull();
  });

  it("owns email signup confirmation context and normalizes the pending email", () => {
    prepareGoogleLogin("/conta");
    prepareEmailSignupConfirmation("  ANA@EXAMPLE.COM  ", "/mensagens/abc");

    expect(getSignupConfirmationContext()).toEqual({
      email: "ana@example.com",
      returnTo: "/mensagens/abc",
      intent: AUTH_EMAIL_CONFIRMATION_INTENTS.signup,
    });
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingReturn)).toBeNull();
    expect(getPendingAuthJourneyIntent()).toBeNull();
  });

  it("prepares an unconfirmed email login without faking a resend cooldown", () => {
    prepareEmailSignupConfirmation("old@example.com", "/conta");
    prepareUnconfirmedEmailLogin("  ANA@EXAMPLE.COM  ", "/mensagens/abc");

    expect(getSignupConfirmationContext()).toEqual({
      email: "ana@example.com",
      returnTo: "/mensagens/abc",
      intent: AUTH_EMAIL_CONFIRMATION_INTENTS.login,
    });
    expect(getSignupConfirmationResendRemainingMs()).toBe(0);
    expect(
      getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupConfirmationCooldownUntil),
    ).toBeNull();
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingReturn)).toBeNull();
    expect(getPendingAuthJourneyIntent()).toBeNull();
  });

  it("cancels login-origin confirmation without turning it into signup", () => {
    prepareUnconfirmedEmailLogin("ana@example.com", "/mensagens/abc");
    cancelUnconfirmedEmailLoginJourney();

    expect(getSignupConfirmationContext()).toEqual({
      email: null,
      returnTo: "/",
      intent: null,
    });
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupRedirect)).toBeNull();
  });

  it("owns immediate authenticated signup without fake confirmation state", () => {
    prepareEmailSignupConfirmation("old@example.com", "/conta");
    prepareAuthenticatedEmailSignup("/mensagens/abc");

    expect(getSignupJourneyReturnTarget()).toBe("/mensagens/abc");
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupEmail)).toBeNull();
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingEmailConfirmationIntent)).toBeNull();
    expect(
      getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupConfirmationCooldownUntil),
    ).toBeNull();
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingReturn)).toBeNull();
    expect(getPendingAuthJourneyIntent()).toBeNull();
  });

  it("sanitizes the return target for immediate authenticated signup", () => {
    prepareAuthenticatedEmailSignup("https://evil.example/path");
    expect(getSignupJourneyReturnTarget()).toBe("/");
  });

  it("persists resend cooldown from the first confirmed signup email", () => {
    prepareEmailSignupConfirmation("ana@example.com", "/mensagens/abc");

    expect(getSignupConfirmationResendRemainingMs()).toBe(
      AUTH_SIGNUP_CONFIRMATION_RESEND_COOLDOWN_MS,
    );

    vi.advanceTimersByTime(15_000);
    expect(getSignupConfirmationResendRemainingMs()).toBe(
      AUTH_SIGNUP_CONFIRMATION_RESEND_COOLDOWN_MS - 15_000,
    );

    vi.advanceTimersByTime(AUTH_SIGNUP_CONFIRMATION_RESEND_COOLDOWN_MS);
    expect(getSignupConfirmationResendRemainingMs()).toBe(0);
  });

  it("never extends resend cooldown beyond the configured limit after clock rollback", () => {
    prepareEmailSignupConfirmation("ana@example.com", "/mensagens/abc");
    vi.setSystemTime(new Date("2026-09-14T17:50:00.000Z"));

    expect(getSignupConfirmationResendRemainingMs()).toBe(
      AUTH_SIGNUP_CONFIRMATION_RESEND_COOLDOWN_MS,
    );
  });

  it("can renew the cooldown when the server still rejects a resend", () => {
    prepareEmailSignupConfirmation("ana@example.com", "/mensagens/abc");
    vi.advanceTimersByTime(AUTH_SIGNUP_CONFIRMATION_RESEND_COOLDOWN_MS);
    expect(getSignupConfirmationResendRemainingMs()).toBe(0);

    startSignupConfirmationResendCooldown();
    expect(getSignupConfirmationResendRemainingMs()).toBe(
      AUTH_SIGNUP_CONFIRMATION_RESEND_COOLDOWN_MS,
    );
  });

  it("sanitizes unsafe signup return targets inside the journey owner", () => {
    prepareEmailSignupConfirmation("ana@example.com", "https://evil.example/path");

    expect(getSignupJourneyReturnTarget()).toBe("/");
    expect(getSignupConfirmationContext().returnTo).toBe("/");
  });

  it("restarts email signup without losing the original safe destination", () => {
    prepareEmailSignupConfirmation("ana@example.com", "/mensagens/abc");
    restartEmailSignupJourney();

    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupEmail)).toBeNull();
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingEmailConfirmationIntent)).toBeNull();
    expect(
      getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupConfirmationCooldownUntil),
    ).toBeNull();
    expect(getSignupConfirmationResendRemainingMs()).toBe(0);
    expect(getSignupJourneyReturnTarget()).toBe("/mensagens/abc");
  });

  it("cleans every transient auth context after normal login", () => {
    prepareGoogleSignup("/conta");
    completeStandardLoginJourney();

    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingReturn)).toBeNull();
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupRedirect)).toBeNull();
    expect(getPendingAuthJourneyIntent()).toBeNull();
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupEmail)).toBeNull();
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingEmailConfirmationIntent)).toBeNull();
    expect(
      getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupConfirmationCooldownUntil),
    ).toBeNull();
  });

  it("cleans email confirmation state but preserves signup redirect until first access", () => {
    prepareEmailSignupConfirmation("ana@example.com", "/mensagens/abc");
    completeEmailConfirmationJourney();

    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingReturn)).toBeNull();
    expect(getSignupJourneyReturnTarget()).toBe("/mensagens/abc");
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupEmail)).toBeNull();
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingEmailConfirmationIntent)).toBeNull();
    expect(
      getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupConfirmationCooldownUntil),
    ).toBeNull();
  });

  it("cleans the complete signup context only when first access finishes", () => {
    prepareEmailSignupConfirmation("ana@example.com", "/mensagens/abc");
    completeFirstAccessJourney();

    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingReturn)).toBeNull();
    expect(getPendingAuthJourneyIntent()).toBeNull();
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupEmail)).toBeNull();
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupRedirect)).toBeNull();
    expect(getStored(AUTH_FLOW_STORAGE_KEYS.pendingEmailConfirmationIntent)).toBeNull();
    expect(
      getStored(AUTH_FLOW_STORAGE_KEYS.pendingSignupConfirmationCooldownUntil),
    ).toBeNull();
  });
});
