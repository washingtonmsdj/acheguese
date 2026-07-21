import { Home } from "lucide-react";
import { Link } from "react-router-dom";

interface AuthBrandHeaderProps {
  secondaryHref: string;
  secondaryLabel: string;
}

export function AuthBrandHeader({
  secondaryHref,
  secondaryLabel,
}: AuthBrandHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/92 backdrop-blur-md supports-[backdrop-filter]:bg-background/78">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-30 focus:rounded-md focus:bg-primary focus:px-3 focus:py-1.5 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow"
      >
        Pular para o conteúdo
      </a>
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80"
          aria-label="Voltar ao inicio"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_10px_24px_-14px_hsl(var(--primary))]">
            <Home className="h-4.5 w-4.5" />
          </div>
          <span className="truncate font-heading text-base font-bold text-foreground sm:text-lg">
            Achegue<span className="text-primary">-se</span>
          </span>
        </Link>

        <Link
          to={secondaryHref}
          className="shrink-0 rounded-full border border-border/70 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:border-primary/25 hover:text-primary/80"
        >
          {secondaryLabel}
        </Link>
      </div>
    </header>
  );
}
