import React from "react";
import { Home, Check } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { motion } from "framer-motion";

interface NeighborhoodSelectorProps {
  neighborhoods: string[];
  selectedNeighborhood: string;
  onNeighborhoodSelect: (neighborhood: string) => void;
}

export function NeighborhoodSelector({
  neighborhoods,
  selectedNeighborhood,
  onNeighborhoodSelect,
}: NeighborhoodSelectorProps) {
  return (
    <div className="px-4 flex-1">
      <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
        <Home className="h-4 w-4 text-muted-foreground" />
        Em qual neighborhood você mora?
      </p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        {neighborhoods.map((neighborhood) => {
          const isSelected = selectedNeighborhood === neighborhood;

          return (
            <button
              key={neighborhood}
              onClick={() => onNeighborhoodSelect(neighborhood)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left",
                isSelected
                  ? "bg-primary/10 border-primary ring-1 ring-primary/30"
                  : "bg-card hover:border-primary/40 border-border",
              )}
            >
              <div className="flex-1">
                <span className="text-sm font-medium">{neighborhood}</span>
              </div>

              <div
                className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 transition-all",
                  isSelected
                    ? "bg-primary border-primary"
                    : "border-muted-foreground/30",
                )}
              >
                {isSelected && (
                  <Check className="h-3 w-3 text-primary-foreground" />
                )}
              </div>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}
