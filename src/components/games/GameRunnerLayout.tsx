import { ReactNode } from "react";
import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GameRunnerLayout({
  title,
  subtitle,
  children,
  rightActions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  rightActions?: ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <Link to="/games" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Voltar
              </Link>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-foreground">{title}</div>
                {subtitle ? <div className="truncate text-xs text-muted-foreground">{subtitle}</div> : null}
              </div>
            </div>
          </div>

          {rightActions ? <div className={cn("flex items-center gap-2")}>{rightActions}</div> : null}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}
