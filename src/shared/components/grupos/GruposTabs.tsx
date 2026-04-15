import React from "react";

interface GruposTabsProps {
  tab: "todos" | "meus";
  onTabChange: (tab: "todos" | "meus") => void;
  groupsCount: number;
}

export function GruposTabs({ tab, onTabChange, groupsCount }: GruposTabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
      <button
        onClick={() => onTabChange("todos")}
        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
          tab === "todos"
            ? "bg-teal-500/20 text-teal-400"
            : "text-gray-400 hover:text-white"
        }`}
      >
        Todos ({groupsCount})
      </button>
      <button
        onClick={() => onTabChange("meus")}
        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
          tab === "meus"
            ? "bg-teal-500/20 text-teal-400"
            : "text-gray-400 hover:text-white"
        }`}
      >
        Meus Grupos ({groupsCount})
      </button>
    </div>
  );
}
