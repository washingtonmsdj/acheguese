import { describe, expect, it, vi } from "vitest";
import {
  ACCESSIBILITY_STORAGE_KEYS,
  applyAccessibilityPreferences,
  persistAccessibilityFontSize,
  persistAccessibilityHighContrast,
  readAccessibilityPreferences,
} from "@/shared/accessibility/preferences";

describe("accessibility preferences", () => {
  it("reads canonical persisted preferences and rejects invalid font sizes", () => {
    const validStorage = {
      getItem: vi.fn((key: string) => {
        if (key === ACCESSIBILITY_STORAGE_KEYS.highContrast) return "true";
        if (key === ACCESSIBILITY_STORAGE_KEYS.fontSize) return "extra-large";
        return null;
      }),
      setItem: vi.fn(),
    };

    expect(readAccessibilityPreferences(validStorage)).toEqual({
      isHighContrast: true,
      fontSize: "extra-large",
    });

    const invalidStorage = {
      getItem: vi.fn((key: string) =>
        key === ACCESSIBILITY_STORAGE_KEYS.fontSize ? "giant" : null,
      ),
      setItem: vi.fn(),
    };

    expect(readAccessibilityPreferences(invalidStorage)).toEqual({
      isHighContrast: false,
      fontSize: "normal",
    });
  });

  it("applies the same body classes for lean and provider runtimes", () => {
    const classList = {
      toggle: vi.fn(),
      remove: vi.fn(),
      add: vi.fn(),
    };

    applyAccessibilityPreferences(
      { classList: classList as unknown as DOMTokenList },
      { isHighContrast: true, fontSize: "large" },
    );

    expect(classList.toggle).toHaveBeenCalledWith(
      "accessibility-high-contrast",
      true,
    );
    expect(classList.remove).toHaveBeenCalledWith(
      "accessibility-font-large",
      "accessibility-font-extra-large",
    );
    expect(classList.add).toHaveBeenCalledWith("accessibility-font-large");
  });

  it("writes only through the canonical storage keys", () => {
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };

    persistAccessibilityHighContrast(true, storage);
    persistAccessibilityFontSize("extra-large", storage);

    expect(storage.setItem).toHaveBeenNthCalledWith(
      1,
      ACCESSIBILITY_STORAGE_KEYS.highContrast,
      "true",
    );
    expect(storage.setItem).toHaveBeenNthCalledWith(
      2,
      ACCESSIBILITY_STORAGE_KEYS.fontSize,
      "extra-large",
    );
  });
});
