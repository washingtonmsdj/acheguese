import React from "react";
import { Search } from "lucide-react";

interface GruposSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function GruposSearch({
  searchQuery,
  onSearchChange,
}: GruposSearchProps) {
  return (
    <div className="relative min-w-0">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder="Buscar grupos..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-teal-400/50 focus:outline-none"
      />
    </div>
  );
}
