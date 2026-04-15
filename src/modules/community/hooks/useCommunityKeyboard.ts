import { useEffect } from "react";

interface KeyboardHandlers {
  onSearch: () => void;
  onEscape: () => void;
}

export function useCommunityKeyboard({ onSearch, onEscape }: KeyboardHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K para busca
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onSearch();
      }

      // ESC para fechar modais
      if (e.key === "Escape") {
        onEscape();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSearch, onEscape]);
}
