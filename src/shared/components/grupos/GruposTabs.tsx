import React from "react";

interface GruposTabsProps {
  tab: "todos" | "meus";
  onTabChange: (tab: "todos" | "meus") => void;
  groupsCount: number;
  myGroupsCount?: number;
}

export function GruposTabs({ tab, onTabChange, groupsCount, myGroupsCount = groupsCount }: GruposTabsProps) {
  return (
    <div className="grid min-w-0 grid-cols-2 gap-1 rounded-xl bg-white/5 p-1">
      <button
        onClick={() => onTabChange("todos")}
        className={`min-h-10 min-w-0 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
          tab === "todos"
            ? "bg-teal-500/20 text-teal-400"
            : "text-gray-400 hover:text-white"
        }`}
      >
        <span className="block truncate">Todos ({groupsCount})</span>
      </button>
      <button
        onClick={() => onTabChange("meus")}
        className={`min-h-10 min-w-0 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
          tab === "meus"
            ? "bg-teal-500/20 text-teal-400"
            : "text-gray-400 hover:text-white"
        }`}
      >
        <span className="block truncate">Meus ({myGroupsCount})</span>
      </button>
    </div>
  );
}
