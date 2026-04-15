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
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder="Buscar grupos..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-teal-400/50"
      />
    </div>
  );
}
