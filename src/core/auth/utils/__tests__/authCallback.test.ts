import { describe, expect, it } from "vitest";

import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
import {
  getAuthCallbackError,
  hasAuthCallbackMarker,
  hasPendingAuthCallbackExchange,
  hasPendingPkceCode,
  isExpiredPasswordRecoveryError,
  isOAuthTermsCallbackError,
  isPasswordRecoveryCallback,
  isPasswordRecoveryRouteIntent,
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

  it("recognizes otp_expired only when the navigation belongs to password recovery", () => {
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

  it("owns pending PKCE code detection for every auth callback surface", () => {
    expect(hasPendingPkceCode("?code=abc")).toBe(true);
    expect(hasPendingPkceCode("?confirmed=1&code=abc")).toBe(true);
    expect(hasPendingPkceCode("?mode=recovery&code=abc")).toBe(true);
    expect(hasPendingPkceCode("?confirmed=1")).toBe(false);
    expect(hasPendingPkceCode("")).toBe(false);
  });

  it("recognizes pending PKCE and legacy implicit-session exchanges", () => {
    expect(hasPendingAuthCallbackExchange("?code=abc", "")).toBe(true);
    expect(hasPendingAuthCallbackExchange("", "#code=abc")).toBe(true);
    expect(
      hasPendingAuthCallbackExchange(
        "",
        "#access_token=access&refresh_token=refresh&type=signup",
      ),
    ).toBe(true);
    expect(
      hasPendingAuthCallbackExchange("?access_token=access", ""),
    ).toBe(true);
    expect(hasPendingAuthCallbackExchange("?confirmed=1", "")).toBe(false);
    expect(hasPendingAuthCallbackExchange("", "#main-content")).toBe(false);
  });

  it("separates recovery route intent from real callback evidence", () => {
    expect(isPasswordRecoveryRouteIntent("?mode=recovery", "")).toBe(true);
    expect(isPasswordRecoveryRouteIntent("", "#type=recovery")).toBe(true);
    expect(isPasswordRecoveryRouteIntent("?mode=request", "")).toBe(false);

    expect(isPasswordRecoveryCallback("?mode=recovery", "")).toBe(false);
    expect(
      isPasswordRecoveryCallback("?mode=recovery&code=abc", ""),
    ).toBe(true);
    expect(
      isPasswordRecoveryCallback(
        "?mode=recovery",
        "#error=access_denied&error_code=otp_expired",
      ),
    ).toBe(true);
    expect(isPasswordRecoveryCallback("", "#type=recovery")).toBe(true);
  });

  it("classifies only real auth callback markers, not ordinary anchors or route intent", () => {
    expect(hasAuthCallbackMarker("", "#main-content")).toBe(false);
    expect(hasAuthCallbackMarker("", "#entry-community-title")).toBe(false);
    expect(hasAuthCallbackMarker("?mode=recovery", "")).toBe(false);
    expect(hasAuthCallbackMarker("?code=abc", "")).toBe(true);
    expect(hasAuthCallbackMarker("?mode=recovery&code=abc", "")).toBe(true);
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
