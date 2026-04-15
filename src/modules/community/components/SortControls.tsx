import React from "react";
import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface SortControlsProps {
  sortBy: string;
  onSortChange: (sortBy: string) => void;
}

export function SortControls({ sortBy, onSortChange }: SortControlsProps) {
  return (
    <div className="px-4 pb-2 flex items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="h-8 w-40 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_at">Mais recentes</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
