import { useState } from "react";
import { ChevronRight, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { cn } from "@/shared/utils/cn";
import type { PublicHeaderNavItem } from "./publicHeaderNavigation";

type PublicHeaderMobileMenuProps = {
  items: readonly PublicHeaderNavItem[];
  className?: string;
  activeItemId?: string;
};

function isCurrentItem(pathname: string, item: PublicHeaderNavItem, activeItemId?: string): boolean {
  if (activeItemId) return item.id === activeItemId;
  if (item.href === "/") return pathname === "/";

  const itemPath = item.href.split("?")[0]?.replace(/\/$/, "") || "/";
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export function PublicHeaderMobileMenu({
  items,
  className,
  activeItemId,
}: PublicHeaderMobileMenuProps) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/80 bg-background/70 text-foreground backdrop-blur-md transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            className,
          )}
          aria-label="Abrir menu principal"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[min(88vw,22rem)] overflow-y-auto border-border bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5 font-sans"
        data-public-header-mobile-menu="true"
      >
        <SheetHeader className="border-b border-border pb-4 text-left">
          <SheetTitle className="font-display text-lg">Explorar Achegue-se</SheetTitle>
        </SheetHeader>

        <nav className="mt-3 grid gap-1.5" aria-label="Menu principal mobile">
          {items.map((item) => {
            const active = isCurrentItem(pathname, item, activeItemId);
            const Icon = item.icon;
            return (
              <Link
                key={`${item.id}-${item.href}`}
                to={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex min-h-14 items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                )}
                aria-current={active ? "page" : undefined}
                data-public-header-nav-item={item.id}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors",
                    active && "bg-primary/15 text-primary",
                  )}
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-5">{item.label}</span>
                  <span className="block truncate text-xs font-normal leading-4 text-muted-foreground">
                    {item.description}
                  </span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
