import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_FLOW_STORAGE_KEYS,
  AUTH_PASSWORD_RECOVERY_RESEND_COOLDOWN_MS,
} from "@/core/auth/constants/authFlow";
import { getAuthFlowSessionValue } from "@/core/auth/utils/authFlowStorage";
import {
  getPasswordRecoveryResendRemainingMs,
  startPasswordRecoveryResendCooldown,
} from "@/core/auth/utils/authJourney";

describe("password recovery resend cooldown", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T16:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    window.sessionStorage.clear();
  });

  it("persists the resend window for the normalized email across reload-style reads", () => {
    startPasswordRecoveryResendCooldown("  ANA@EXAMPLE.COM  ");

    expect(
      getAuthFlowSessionValue(AUTH_FLOW_STORAGE_KEYS.passwordRecoveryResendEmail),
    ).toBe("ana@example.com");
    expect(getPasswordRecoveryResendRemainingMs("ana@example.com")).toBe(
      AUTH_PASSWORD_RECOVERY_RESEND_COOLDOWN_MS,
    );

    vi.advanceTimersByTime(15_000);
    expect(getPasswordRecoveryResendRemainingMs("ANA@example.com")).toBe(
      AUTH_PASSWORD_RECOVERY_RESEND_COOLDOWN_MS - 15_000,
    );
  });

  it("does not block correcting the recovery address", () => {
    startPasswordRecoveryResendCooldown("ana@example.com");

    expect(getPasswordRecoveryResendRemainingMs("outro@example.com")).toBe(0);
    expect(getPasswordRecoveryResendRemainingMs("")).toBe(0);
  });

  it("never extends the wait beyond the canonical window after clock rollback", () => {
    startPasswordRecoveryResendCooldown("ana@example.com");
    vi.setSystemTime(new Date("2026-09-15T15:50:00.000Z"));

    expect(getPasswordRecoveryResendRemainingMs("ana@example.com")).toBe(
      AUTH_PASSWORD_RECOVERY_RESEND_COOLDOWN_MS,
    );
  });

  it("can renew the local window after the Auth server still reports rate limit", () => {
    startPasswordRecoveryResendCooldown("ana@example.com");
    vi.advanceTimersByTime(AUTH_PASSWORD_RECOVERY_RESEND_COOLDOWN_MS);
    expect(getPasswordRecoveryResendRemainingMs("ana@example.com")).toBe(0);

    startPasswordRecoveryResendCooldown("ana@example.com");
    expect(getPasswordRecoveryResendRemainingMs("ana@example.com")).toBe(
      AUTH_PASSWORD_RECOVERY_RESEND_COOLDOWN_MS,
    );
  });
});
