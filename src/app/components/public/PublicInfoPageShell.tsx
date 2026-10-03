import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/shared/components/ui/button";

type PublicInfoPageShellWidth = "standard" | "wide";

interface PublicInfoPageShellProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly onBack: () => void;
  readonly children: ReactNode;
  readonly width?: PublicInfoPageShellWidth;
}

export function PublicInfoPageShell({
  eyebrow,
  title,
  description,
  onBack,
  children,
  width = "standard",
}: PublicInfoPageShellProps) {
  const maxWidthClass = width === "wide" ? "max-w-6xl" : "max-w-5xl";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--territory-brand)/0.08),transparent_26%),linear-gradient(180deg,hsl(var(--territory-canvas)),hsl(var(--territory-surface-raised)/0.26))] text-territory-ink">
      <main
        id="main-content"
        tabIndex={-1}
        className={`mx-auto w-full ${maxWidthClass} px-4 pb-10 pt-4 focus:outline-none sm:px-6 sm:pt-6 lg:px-8`}
      >
        <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-territory-border/60 bg-territory-canvas/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:mb-6 sm:rounded-3xl sm:border sm:bg-territory-surface/85 sm:px-5 sm:shadow-sm">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
              onClick={onBack}
              type="button"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-territory-muted">
                {eyebrow}
              </p>
              <h1 className="truncate text-xl font-bold tracking-tight text-territory-ink sm:text-2xl">
                {title}
              </h1>
              <p className="mt-1 text-xs text-territory-muted sm:text-sm">
                {description}
              </p>
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
