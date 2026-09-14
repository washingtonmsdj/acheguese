export type AccessibilityFontSize = "normal" | "large" | "extra-large";

export interface AccessibilityPreferences {
  isHighContrast: boolean;
  fontSize: AccessibilityFontSize;
}

type AccessibilityStorage = Pick<Storage, "getItem" | "setItem">;

export const ACCESSIBILITY_STORAGE_KEYS = {
  highContrast: "accessibility-high-contrast",
  fontSize: "accessibility-font-size",
} as const;

const ACCESSIBILITY_FONT_SIZE_CLASSES = {
  large: "accessibility-font-large",
  "extra-large": "accessibility-font-extra-large",
} as const;

const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  isHighContrast: false,
  fontSize: "normal",
};

function getBrowserStorage(): AccessibilityStorage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isAccessibilityFontSize(value: string | null): value is AccessibilityFontSize {
  return value === "normal" || value === "large" || value === "extra-large";
}

export function readAccessibilityPreferences(
  storage: AccessibilityStorage | null = getBrowserStorage(),
): AccessibilityPreferences {
  if (!storage) return { ...DEFAULT_ACCESSIBILITY_PREFERENCES };

  try {
    const highContrast =
      storage.getItem(ACCESSIBILITY_STORAGE_KEYS.highContrast) === "true";
    const storedFontSize = storage.getItem(ACCESSIBILITY_STORAGE_KEYS.fontSize);

    return {
      isHighContrast: highContrast,
      fontSize: isAccessibilityFontSize(storedFontSize)
        ? storedFontSize
        : DEFAULT_ACCESSIBILITY_PREFERENCES.fontSize,
    };
  } catch {
    return { ...DEFAULT_ACCESSIBILITY_PREFERENCES };
  }
}

export function applyAccessibilityPreferences(
  body: Pick<HTMLElement, "classList">,
  preferences: AccessibilityPreferences,
): void {
  body.classList.toggle(
    "accessibility-high-contrast",
    preferences.isHighContrast,
  );
  body.classList.remove(
    ACCESSIBILITY_FONT_SIZE_CLASSES.large,
    ACCESSIBILITY_FONT_SIZE_CLASSES["extra-large"],
  );

  if (preferences.fontSize === "large") {
    body.classList.add(ACCESSIBILITY_FONT_SIZE_CLASSES.large);
  } else if (preferences.fontSize === "extra-large") {
    body.classList.add(ACCESSIBILITY_FONT_SIZE_CLASSES["extra-large"]);
  }
}

export function persistAccessibilityHighContrast(
  value: boolean,
  storage: AccessibilityStorage | null = getBrowserStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(ACCESSIBILITY_STORAGE_KEYS.highContrast, String(value));
  } catch {
    // Persistence is optional. The current in-memory preference remains valid.
  }
}

export function persistAccessibilityFontSize(
  value: AccessibilityFontSize,
  storage: AccessibilityStorage | null = getBrowserStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(ACCESSIBILITY_STORAGE_KEYS.fontSize, value);
  } catch {
    // Persistence is optional. The current in-memory preference remains valid.
  }
}
