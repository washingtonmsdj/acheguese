import React from "react";
import { cn } from "@/shared/utils/cn";
import { ArrowDownWideNarrow, Flame, Clock } from "lucide-react";
export type FeedSort = "recentes" | "populares";

interface Props {
  sort: FeedSort;
  onSortChange: (s: FeedSort) => void;
}

export function FeedSortSelect({ sort, onSortChange }: Props) {
  return (
    <div className="flex items-center gap-1.5 pb-2">
      <ArrowDownWideNarrow className="h-3.5 w-3.5 text-muted-foreground" />
      <button
        onClick={() => onSortChange("recentes")}
        className={cn(
          "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all",
          sort === "recentes"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Clock className="h-3 w-3" /> Recentes
      </button>
      <button
        onClick={() => onSortChange("populares")}
        className={cn(
          "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all",
          sort === "populares"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Flame className="h-3 w-3" /> Populares
      </button>
    </div>
  );
}
