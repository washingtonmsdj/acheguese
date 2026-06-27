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
    <header className="border-b border-border/70 bg-card/75 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
          aria-label="Voltar ao início"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_10px_24px_-14px_hsl(var(--primary))]">
            <Home className="h-4.5 w-4.5" />
          </div>
          <span className="font-heading text-base font-bold text-foreground sm:text-lg">
            Achegue<span className="text-primary">-se</span>
          </span>
        </Link>

        <Link
          to={secondaryHref}
          className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          {secondaryLabel}
        </Link>
      </div>
    </header>
  );
}
