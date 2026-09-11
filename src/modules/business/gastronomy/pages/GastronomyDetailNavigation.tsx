import { useRef } from "react";
import { ShoppingBag, Store, Truck } from "lucide-react";

import { ScrollArea, ScrollBar } from "@/shared/components/ui/scroll-area";
import { Separator } from "@/shared/components/ui/separator";
import { cn } from "@/shared/utils/cn";

import type { MenuCategory } from "../types";
import { formatBrl } from "../utils/currency";

interface ServiceBarProps {
  profile: {
    delivery_enabled: boolean;
    takeout_enabled: boolean;
    dine_in_enabled: boolean;
    delivery_fee?: number;
    minimum_order?: number;
  };
}

export function ServiceBar({ profile }: ServiceBarProps) {
  const serviceModes = [
    profile.delivery_enabled && {
      label: "Entrega",
      icon: Truck,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    profile.takeout_enabled && {
      label: "Retirada",
      icon: ShoppingBag,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    profile.dine_in_enabled && {
      label: "No local",
      icon: Store,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ].filter(Boolean) as Array<{
    label: string;
    icon: typeof Truck;
    color: string;
    bgColor: string;
  }>;
  const normalizedServiceModes =
    serviceModes.length > 0
      ? serviceModes
      : [
          {
            label: "No local",
            icon: Store,
            color: "text-muted-foreground",
            bgColor: "bg-muted/60",
          },
        ];

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            {normalizedServiceModes.map((mode) => (
              <div
                key={mode.label}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium",
                  mode.bgColor,
                  mode.color,
                )}
              >
                <mode.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{mode.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 text-sm">
            {profile.delivery_enabled && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="text-muted-foreground/70">Taxa:</span>
                <span className="font-medium text-foreground">
                  {formatBrl(profile.delivery_fee ?? 0)}
                </span>
              </div>
            )}
            {profile.minimum_order && profile.minimum_order > 0 && (
              <>
                {profile.delivery_enabled && (
                  <Separator orientation="vertical" className="h-4" />
                )}
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="text-muted-foreground/70">Min:</span>
                  <span className="font-medium text-foreground">
                    {formatBrl(profile.minimum_order)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CategoryNavProps {
  categories: MenuCategory[];
  activeCategory: string | null;
  onSelect: (id: string) => void;
  itemCounts: Record<string, number>;
}

export function CategoryNav({
  categories,
  activeCategory,
  onSelect,
  itemCounts,
}: CategoryNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="sticky top-[73px] z-20 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollArea className="w-full">
          <div ref={scrollRef} className="flex gap-2 py-3">
            {categories.map((category) => {
              const count = itemCounts[category.id] ?? 0;
              const isActive = activeCategory === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onSelect(category.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-muted/70",
                  )}
                >
                  {category.name}
                  {count > 0 && (
                    <span
                      className={cn(
                        "ml-1.5 text-xs",
                        isActive
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground/60",
                      )}
                    >
                      {count}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute -bottom-3 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
