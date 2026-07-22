import React from "react";
import { Button } from "@/shared/components/ui/button";
import { AlertCircle } from "lucide-react";
import { FOCUS_STYLES } from "@/core/community/components/styles/accessibilityAAA";
import type { FeedCategory } from "./FeedCategoryFilter";

export const LoadingSkeleton = () => {
  const [slow, setSlow] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setSlow(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      role="status"
      aria-label="Ouvindo o bairro"
      className="space-y-4"
    >
      <span className="sr-only">
        {slow ? "Ouvindo o bairro..." : "Carregando"}
      </span>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border-b border-border/40 px-4 py-4">
          <div className="flex gap-3">
            <div
              className="h-9 w-9 rounded-full bg-muted animate-pulse"
              aria-hidden="true"
            />
            <div className="flex-1 space-y-2">
              <div
                className="h-4 w-32 bg-muted animate-pulse rounded"
                aria-hidden="true"
              />
              <div
                className="h-4 w-full bg-muted animate-pulse rounded"
                aria-hidden="true"
              />
              <div
                className="h-4 w-3/4 bg-muted animate-pulse rounded"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      ))}
      {slow && (
        <p
          aria-live="polite"
          className="text-center text-sm text-muted-foreground pt-2"
        >
          Ouvindo o bairro...
        </p>
      )}
    </div>
  );
};

export const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div
    role="alert"
    aria-live="assertive"
    className="flex flex-col items-center justify-center py-12 px-4"
  >
    <AlertCircle
      className="h-12 w-12 text-destructive mb-4"
      aria-hidden="true"
    />
    <h2 className="text-lg font-semibold text-foreground mb-2">
      Não consegui ouvir o bairro agora
    </h2>
    <p className="text-muted-foreground text-center mb-4">
      Deu um problema para trazer as publicações. Confira sua conexão.
    </p>
    <Button
      onClick={onRetry}
      className={FOCUS_STYLES.ringButton}
      aria-label="Tentar carregar o feed de novo"
    >
      Tentar de novo
    </Button>
  </div>
);

export const EmptyState = ({ filter }: { filter: FeedCategory }) => (
  <div
    role="status"
    aria-label={
      filter === "todos"
        ? "Ainda está quieto por aqui"
        : `Nada por aqui em ${filter}`
    }
    className="text-center py-12 px-4"
  >
    <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
      <AlertCircle
        className="h-7 w-7 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
    <h2 className="text-lg font-semibold text-foreground mb-2">
      {filter === "todos"
        ? "Ainda está quieto por aqui"
        : "Nada por aqui nessa categoria"}
    </h2>
    <p className="text-muted-foreground text-sm max-w-md mx-auto">
      {filter === "todos"
        ? "Publique o primeiro e puxe a conversa do bairro."
        : "Que tal começar você?"}
    </p>
  </div>
);

