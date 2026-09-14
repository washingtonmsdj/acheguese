// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CONSENT_PREFERENCES_CHANGED_EVENT,
  ConsentService,
  LOCAL_CONSENT_STORAGE_KEY,
} from "./ConsentService";

describe("ConsentService local consent owner", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("fails open to a new choice when persisted JSON is malformed", async () => {
    window.localStorage.setItem(LOCAL_CONSENT_STORAGE_KEY, "{invalid-json");

    expect(ConsentService.getLocalConsentRecords()).toBeNull();
    expect(ConsentService.hasGrantedLocalConsent("analytics")).toBe(false);
    await expect(ConsentService.getExistingConsents()).resolves.toBeNull();
  });

  it("persists anonymous preferences and exposes analytics opt-in reactively", async () => {
    const listener = vi.fn();
    const removeListener = ConsentService.subscribeToLocalConsent(listener);

    await ConsentService.saveConsentPreferences({
      preferences: {
        analytics: true,
        marketing: false,
        geolocation: false,
      },
      userAgent: "vitest",
    });

    expect(ConsentService.hasGrantedLocalConsent("analytics")).toBe(true);
    expect(ConsentService.hasGrantedLocalConsent("marketing")).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);

    const persisted = ConsentService.getLocalConsentRecords();
    expect(persisted).toContainEqual({
      consent_type: "analytics",
      granted: true,
    });

    removeListener();
  });

  it("notifies subscribers when another tab changes the consent key", () => {
    const listener = vi.fn();
    const removeListener = ConsentService.subscribeToLocalConsent(listener);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: LOCAL_CONSENT_STORAGE_KEY,
        newValue: JSON.stringify([
          { consent_type: "analytics", granted: false },
        ]),
      }),
    );

    expect(listener).toHaveBeenCalledTimes(1);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "unrelated-key",
        newValue: "1",
      }),
    );
    expect(listener).toHaveBeenCalledTimes(1);

    removeListener();
    window.dispatchEvent(new Event(CONSENT_PREFERENCES_CHANGED_EVENT));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
