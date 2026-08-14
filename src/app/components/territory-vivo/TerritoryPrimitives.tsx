import type { FormEvent, ReactNode } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/shared/utils/cn";
import { TerritorySurface } from "@/shared/components/territory-vivo/TerritorySurface";

export {
  TerritorySectionHeading,
  TerritorySurface,
} from "@/shared/components/territory-vivo/TerritorySurface";

interface TerritorySearchProps {
  id: string;
  label: string;
  placeholder: string;
  onSubmit: (query: string) => void;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  autoFocus?: boolean;
  submitLabel?: string;
  className?: string;
}

export function TerritorySearch({
  id,
  label,
  placeholder,
  onSubmit,
  value,
  defaultValue,
  onChange,
  autoFocus = false,
  submitLabel = "Buscar",
  className,
}: TerritorySearchProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = String(
      new FormData(event.currentTarget).get("q") ?? "",
    ).trim();
    onSubmit(query);
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={cn("relative", className)}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-territory-muted"
        aria-hidden="true"
      />
      <input
        id={id}
        name="q"
        type="search"
        autoFocus={autoFocus}
        autoComplete="off"
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
        placeholder={placeholder}
        className="h-14 w-full rounded-territory border border-territory-border bg-territory-surface pl-12 pr-14 text-base text-territory-ink shadow-territory-highlight outline-none transition placeholder:text-territory-muted/80 hover:border-territory-brand/30 focus:border-territory-brand/60"
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl bg-territory-brand text-[hsl(var(--territory-canvas))] transition-colors hover:bg-territory-brand-strong"
        aria-label={submitLabel}
      >
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}

interface TerritoryStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  className?: string;
  testId?: string;
}

export function TerritoryState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
  testId,
}: TerritoryStateProps) {
  return (
    <TerritorySurface
      tone="inset"
      className={cn("p-5 sm:p-6", className)}
      data-testid={testId}
      role="status"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-territory bg-territory-brand/12 text-territory-brand">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-base font-semibold text-territory-ink">
            {title}
          </p>
          <p className="mt-1 text-sm leading-6 text-territory-muted">
            {description}
          </p>
        </div>
        {primaryAction || secondaryAction ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            {primaryAction ? (
              <Link
                to={primaryAction.href}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-territory-brand px-4 text-sm font-semibold text-[hsl(var(--territory-canvas))] hover:bg-territory-brand-strong"
              >
                {primaryAction.label}
              </Link>
            ) : null}
            {secondaryAction ? (
              <Link
                to={secondaryAction.href}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-territory-border bg-territory-surface px-4 text-sm font-semibold text-territory-ink hover:border-territory-brand/35"
              >
                {secondaryAction.label}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </TerritorySurface>
  );
}
