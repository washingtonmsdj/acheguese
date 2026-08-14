import type { HTMLAttributes } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/shared/utils/cn";

type SurfaceTone = "default" | "raised" | "highlight" | "inset";

interface TerritorySurfaceProps extends HTMLAttributes<HTMLDivElement> {
  tone?: SurfaceTone;
}

const SURFACE_TONES: Record<SurfaceTone, string> = {
  default: "border border-territory-border bg-territory-surface",
  raised:
    "border border-territory-border bg-territory-surface shadow-territory-highlight",
  highlight:
    "border border-territory-brand/20 bg-[linear-gradient(135deg,hsl(var(--territory-brand)/0.13),hsl(var(--territory-surface))_56%)] shadow-territory-highlight",
  inset: "border border-territory-border/70 bg-territory-raised",
};

export function TerritorySurface({
  tone = "default",
  className,
  ...props
}: TerritorySurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-territory-highlight",
        SURFACE_TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

interface TerritorySectionHeadingProps {
  id?: string;
  title: string;
  description?: string;
  eyebrow?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}

export function TerritorySectionHeading({
  id,
  title,
  description,
  eyebrow,
  href,
  linkLabel = "Ver tudo",
  className,
}: TerritorySectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-4 flex items-end justify-between gap-4 sm:mb-5",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-territory-brand">
            {eyebrow}
          </p>
        ) : null}
        <h2
          id={id}
          className="font-heading text-xl font-semibold leading-tight tracking-[-0.02em] text-territory-ink sm:text-2xl"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-territory-muted">
            {description}
          </p>
        ) : null}
      </div>
      {href ? (
        <Link
          to={href}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-territory-brand transition-colors hover:bg-territory-brand/10 hover:text-territory-brand-strong"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
