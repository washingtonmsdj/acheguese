/**
 * ViewToggle - Toggle entre Anúncios e Vendedores
 */

import { memo } from "react";
import { ShoppingBag, Store } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/shared/utils/cn";
import type { ViewMode } from "@/modules/classifieds/hooks/useClassificadosPage";

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  adsCount?: number;
  sellersCount?: number;
}

export const ClassifiedsViewToggle = memo(function ClassifiedsViewToggle({
  mode,
  onChange,
  adsCount,
  sellersCount,
}: ViewToggleProps) {
  const tabs = [
    {
      id: "anuncios" as ViewMode,
      label: "Anúncios",
      icon: ShoppingBag,
      count: adsCount,
    },
    {
      id: "vendedores" as ViewMode,
      label: "Vendedores",
      icon: Store,
      count: sellersCount,
    },
  ];

  return (
    <div className="flex gap-1 p-1 bg-muted rounded-xl">
      {tabs.map((tab) => {
        const isActive = mode === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/70"
            )}
            aria-pressed={isActive}
          >
            {isActive && (
              <motion.div
                layoutId="classifieds-view-toggle"
                className="absolute inset-0 bg-background rounded-lg shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                  isActive ? "bg-primary/10 text-primary" : "bg-muted-foreground/10 text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
});


