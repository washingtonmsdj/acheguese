import { MapPin } from "lucide-react";

interface TerritoryFeedHeaderProps {
  territoryName: string;
  territoryType?: "bairro" | "cidade" | "comunidade";
}

/**
 * Header consistente do Feed do território.
 * Sprint UX.1 Fase 1 — toda tela mostra território ativo no topo.
 */
export function TerritoryFeedHeader({
  territoryName,
  territoryType = "bairro",
}: TerritoryFeedHeaderProps) {
  const label =
    territoryType === "cidade"
      ? "Feed da cidade"
      : territoryType === "comunidade"
        ? "Feed da comunidade"
        : "Feed do bairro";

  return (
    <header className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MapPin className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <h1 className="truncate text-base font-semibold text-foreground">
          {territoryName}
        </h1>
      </div>
    </header>
  );
}
