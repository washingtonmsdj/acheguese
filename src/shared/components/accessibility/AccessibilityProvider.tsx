import React, { createContext, useContext, useEffect, useState } from "react";

interface AccessibilityContextType {
  announceToScreenReader: (message: string) => void;
  focusElement: (elementId: string) => void;
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  fontSize: "normal" | "large" | "extra-large";
  setFontSize: (size: "normal" | "large" | "extra-large") => void;
}

const AccessibilityContext = createContext<
  AccessibilityContextType | undefined
>(undefined);

export function AccessibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "extra-large">(
    "normal",
  );

  // Load preferences from localStorage
  useEffect(() => {
    const savedContrast = localStorage.getItem("accessibility-high-contrast");
    const savedFontSize = localStorage.getItem("accessibility-font-size");

    if (savedContrast === "true") {
      setIsHighContrast(true);
    }

    if (
      savedFontSize &&
      ["normal", "large", "extra-large"].includes(savedFontSize)
    ) {
      setFontSize(savedFontSize as "normal" | "large" | "extra-large");
    }
  }, []);

  // Apply accessibility classes to body
  useEffect(() => {
    const body = document.body;

    // High contrast
    if (isHighContrast) {
      body.classList.add("accessibility-high-contrast");
    } else {
      body.classList.remove("accessibility-high-contrast");
    }

    // Font size
    body.classList.remove(
      "accessibility-font-large",
      "accessibility-font-extra-large",
    );
    if (fontSize === "large") {
      body.classList.add("accessibility-font-large");
    } else if (fontSize === "extra-large") {
      body.classList.add("accessibility-font-extra-large");
    }
  }, [isHighContrast, fontSize]);

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
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
    localStorage.setItem("accessibility-high-contrast", newValue.toString());
    announceToScreenReader(
      newValue ? "Alto contraste ativado" : "Alto contraste desativado",
    );
  };

  const handleSetFontSize = (size: "normal" | "large" | "extra-large") => {
    setFontSize(size);
    localStorage.setItem("accessibility-font-size", size);

    const sizeLabels = {
      normal: "Tamanho normal",
      large: "Tamanho grande",
      "extra-large": "Tamanho extra grande",
    };

    announceToScreenReader(`Fonte alterada para ${sizeLabels[size]}`);
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
