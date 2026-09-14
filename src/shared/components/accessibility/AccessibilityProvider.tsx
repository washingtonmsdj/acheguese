/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  applyAccessibilityPreferences,
  persistAccessibilityFontSize,
  persistAccessibilityHighContrast,
  readAccessibilityPreferences,
  type AccessibilityFontSize,
} from "@/shared/accessibility/preferences";

interface AccessibilityContextType {
  announceToScreenReader: (message: string) => void;
  focusElement: (elementId: string) => void;
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  fontSize: AccessibilityFontSize;
  setFontSize: (size: AccessibilityFontSize) => void;
}

const AccessibilityContext = createContext<
  AccessibilityContextType | undefined
>(undefined);

export function AccessibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [initialPreferences] = useState(readAccessibilityPreferences);
  const [isHighContrast, setIsHighContrast] = useState(
    initialPreferences.isHighContrast,
  );
  const [fontSize, setFontSize] = useState<AccessibilityFontSize>(
    initialPreferences.fontSize,
  );

  useEffect(() => {
    applyAccessibilityPreferences(document.body, {
      isHighContrast,
      fontSize,
    });
  }, [isHighContrast, fontSize]);

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const focusElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const toggleHighContrast = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    persistAccessibilityHighContrast(newValue);
    announceToScreenReader(
      newValue ? "Alto contraste ativado" : "Alto contraste desativado",
    );
  };

  const handleSetFontSize = (size: AccessibilityFontSize) => {
    setFontSize(size);
    persistAccessibilityFontSize(size);

    const sizeLabel =
      size === "large"
        ? "Tamanho grande"
        : size === "extra-large"
          ? "Tamanho extra grande"
          : "Tamanho normal";

    announceToScreenReader(`Fonte alterada para ${sizeLabel}`);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        announceToScreenReader,
        focusElement,
        isHighContrast,
        toggleHighContrast,
        fontSize,
        setFontSize: handleSetFontSize,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility must be used within AccessibilityProvider",
    );
  }
  return context;
}
