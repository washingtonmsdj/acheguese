import { describe, expect, it } from "vitest";

import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
import {
  getAuthCallbackError,
  hasAuthCallbackMarker,
  hasPasswordRecoverySessionMarker,
  isExpiredPasswordRecoveryError,
  isOAuthTermsCallbackError,
  isPasswordRecoveryCallback,
} from "@/core/auth/utils/authCallback";

describe("authCallback", () => {
  it("keeps Google cancellation inside the terms flow", () => {
    expect(
      isOAuthTermsCallbackError(
        AUTH_PATHS.termsAcceptance,
        "?error=access_denied&error_description=provider-text",
        "",
      ),
    ).toBe(true);
    expect(
      isExpiredPasswordRecoveryError("?error=access_denied", ""),
    ).toBe(false);
  });

  it("recognizes otp_expired only when the callback is password recovery", () => {
    expect(
      isExpiredPasswordRecoveryError(
        "?mode=recovery",
        "#error=access_denied&error_code=otp_expired",
      ),
    ).toBe(true);
    expect(
      isExpiredPasswordRecoveryError(
        "?confirmed=1",
        "#error=access_denied&error_code=otp_expired",
      ),
    ).toBe(false);
    expect(
      isExpiredPasswordRecoveryError(
        "",
        "#error=access_denied&error_code=otp_expired",
      ),
    ).toBe(false);
    expect(
      isExpiredPasswordRecoveryError(
        "?mode=recovery",
        "#error=server_error&error_code=provider_failure",
      ),
    ).toBe(false);
  });

  it("recognizes recovery markers in query or hash", () => {
    expect(isPasswordRecoveryCallback("?mode=recovery", "")).toBe(true);
    expect(isPasswordRecoveryCallback("", "#type=recovery")).toBe(true);
    expect(hasPasswordRecoverySessionMarker("?code=abc", "")).toBe(true);
    expect(
      hasPasswordRecoverySessionMarker("", "#access_token=token&type=recovery"),
    ).toBe(true);
    expect(hasPasswordRecoverySessionMarker("?mode=request", "")).toBe(false);
  });

  it("classifies only real auth callback markers, not ordinary page anchors", () => {
    expect(hasAuthCallbackMarker("", "#main-content")).toBe(false);
    expect(hasAuthCallbackMarker("", "#entry-community-title")).toBe(false);
    expect(hasAuthCallbackMarker("?code=abc", "")).toBe(true);
    expect(hasAuthCallbackMarker("?mode=recovery", "")).toBe(true);
    expect(hasAuthCallbackMarker("", "#type=recovery")).toBe(true);
    expect(hasAuthCallbackMarker("", "#access_token=token")).toBe(true);
    expect(hasAuthCallbackMarker("", "#refresh_token=token")).toBe(true);
    expect(hasAuthCallbackMarker("?error=access_denied", "")).toBe(true);
    expect(hasAuthCallbackMarker("", "#error_code=otp_expired")).toBe(true);
  });

  it("does not expose arbitrary provider descriptions through its error contract", () => {
    expect(
      getAuthCallbackError(
        "?error=access_denied&error_description=do-not-reflect",
        "",
      ),
    ).toEqual({ error: "access_denied", errorCode: "" });
  });
});
