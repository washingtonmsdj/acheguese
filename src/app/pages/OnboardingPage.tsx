import React, { useMemo, useState } from "react";
import { ArrowLeft, Search, MapPin, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useOnboarding } from "@/app/features/onboarding/hooks/useOnboarding";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const {
    neighborhoods,
    cityName,
    stateName,
    selectedNeighborhood,
    onNeighborhoodSelect,
    onConfirm,
    canConfirm,
    isLoading,
  } = useOnboarding();

  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return neighborhoods;
    return neighborhoods.filter((n) => normalize(n).includes(q));
  }, [neighborhoods, query]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b border-border/60 bg-background/90 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg font-semibold leading-tight">
              Selecione o seu bairro
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {cityName}, {stateName}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar bairro"
              aria-label="Buscar bairro"
              className="h-11 w-full rounded-full border border-border bg-muted/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>
        </div>
      </header>

      {/* List */}
      <main className="flex-1 px-4 pb-32 pt-3">
        {isLoading && neighborhoods.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 text-center text-sm text-muted-foreground">
            {query
              ? `Nenhum bairro encontrado para "${query}".`
              : "Nenhum bairro ativo. Você pode continuar pela visão municipal."}
          </div>
        ) : (
          <motion.ul
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {filtered.map((neighborhood) => {
              const isSelected = selectedNeighborhood === neighborhood;
              return (
                <li key={neighborhood}>
                  <button
                    onClick={() => onNeighborhoodSelect(neighborhood)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <MapPin className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {neighborhood}
                    </span>
                    {isSelected ? (
                      <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </main>

      {/* Sticky footer */}
      <div
        className="fixed inset-x-0 bottom-0 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
      >
        <Button
          onClick={onConfirm}
          disabled={!canConfirm || isLoading}
          className="h-12 w-full rounded-xl text-base font-semibold"
        >
          {selectedNeighborhood ? `Continuar em ${selectedNeighborhood}` : "Continuar"}
        </Button>
      </div>
    </div>
  );
}
