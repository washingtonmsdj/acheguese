import React from "react";
import { Check, Home } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/shared/utils/cn";

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
    <div className="flex-1 px-4">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-medium">
        <Home className="h-4 w-4 text-muted-foreground" />
        Em qual bairro você mora?
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
                "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <div className="flex-1">
                <span className="text-sm font-medium">{neighborhood}</span>
              </div>

              <div
                className={cn(
                  "ml-3 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  isSelected ? "border-primary bg-primary" : "border-muted-foreground/30",
                )}
              >
                {isSelected ? <Check className="h-3 w-3 text-primary-foreground" /> : null}
              </div>
            </button>
          );
        })}

        {neighborhoods.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
            Nenhum bairro ativo encontrado para seleção. Você pode continuar pela visão municipal.
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
