import React, { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, RotateCcw, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/app/features/onboarding/hooks/useOnboarding";

const INITIAL_VISIBLE = 5;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word.length > 2 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const {
    neighborhoods,
    cityName,
    stateName,
    onNeighborhoodSelect,
    onConfirm,
    isLoading,
  } = useOnboarding();

  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return neighborhoods;
    return neighborhoods.filter((n) => normalize(n).includes(q));
  }, [neighborhoods, query]);

  const hasQuery = query.trim().length > 0;
  const visible = showAll || hasQuery ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const canShowMore = !showAll && !hasQuery && filtered.length > INITIAL_VISIBLE;

  const handleSelect = (neighborhood: string) => {
    onNeighborhoodSelect(neighborhood);
    // confirm immediately, matching the concept (tap-to-enter)
    setTimeout(() => onConfirm(), 0);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-10 bg-background"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="-ml-2 flex items-center gap-1.5 rounded-full px-2 py-1 text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-[15px] font-semibold">
              {titleCase(cityName)}, {stateName.toUpperCase()}
            </span>
          </button>

          <button
            onClick={() => setShowSearch((v) => !v)}
            aria-label={showSearch ? "Fechar busca" : "Buscar bairro"}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {showSearch ? <RotateCcw className="h-[18px] w-[18px]" /> : <Search className="h-[18px] w-[18px]" />}
          </button>
        </div>

        {showSearch ? (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar bairro"
                aria-label="Buscar bairro"
                className="h-11 w-full rounded-full border border-border bg-muted/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>
          </div>
        ) : null}
      </header>

      {/* Content */}
      <main className="flex-1 px-5 pt-6">
        <h1 className="font-display text-[26px] font-semibold leading-[1.25] tracking-tight text-foreground">
          Escolha um bairro para
          <br />
          ver o que acontece por lá.
        </h1>

        <div className="mt-7">
          {isLoading && neighborhoods.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/50" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              {hasQuery
                ? `Nenhum bairro encontrado para "${query}".`
                : "Nenhum bairro ativo. Você pode continuar pela visão municipal."}
            </p>
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-border/60 bg-muted/25 px-4 divide-y divide-border/50">
              {visible.map((neighborhood) => (
                <li key={neighborhood}>
                  <button
                    onClick={() => handleSelect(neighborhood)}
                    className="group flex w-full items-center justify-between py-[18px] text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-md"
                  >
                    <span className="text-[15px] font-medium text-foreground group-hover:text-primary">
                      {neighborhood}
                    </span>
                    <ChevronRight className="h-[18px] w-[18px] text-muted-foreground/70 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {canShowMore ? (
            <div className="mt-5 flex justify-center">
              <button
                onClick={() => setShowAll(true)}
                className="rounded-full px-4 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Ver todos os bairros
              </button>
            </div>
          ) : null}

          {(showAll || hasQuery) && neighborhoods.length > 0 ? (
            <div className="mt-6 flex justify-center">
              <button
                onClick={onConfirm}
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Continuar sem escolher bairro
              </button>
            </div>
          ) : null}
        </div>

        <div style={{ height: "calc(env(safe-area-inset-bottom) + 24px)" }} />
      </main>
    </div>
  );
}
