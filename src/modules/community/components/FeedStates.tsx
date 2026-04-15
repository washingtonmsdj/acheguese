// @ts-nocheck
import React from "react";
import { Button } from "@/shared/components/ui/button";
import { AlertCircle } from "lucide-react";
import { FOCUS_STYLES } from "@/modules/community/components/styles/accessibilityAAA";
import type { FeedCategory } from "./FeedCategoryFilter";

export const LoadingSkeleton = () => (
  <div
    role="status"
    aria-label="Carregando posts do feed"
    className="space-y-4"
  >
    <span className="sr-only">Carregando posts...</span>
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="border-b px-4 py-4">
        <div className="flex gap-3">
          <div
            className="h-9 w-9 rounded-full bg-gray-700 animate-pulse"
            aria-hidden="true"
          />
          <div className="flex-1 space-y-2">
            <div
              className="h-4 w-32 bg-gray-700 animate-pulse rounded"
              aria-hidden="true"
            />
            <div
              className="h-4 w-full bg-gray-700 animate-pulse rounded"
              aria-hidden="true"
            />
            <div
              className="h-4 w-3/4 bg-gray-700 animate-pulse rounded"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div
    role="alert"
    aria-live="assertive"
    className="flex flex-col items-center justify-center py-12 px-4"
  >
    <AlertCircle className="h-12 w-12 text-red-400 mb-4" aria-hidden="true" />
    <h2 className="text-lg font-semibold text-white mb-2">
      Erro ao carregar feed
    </h2>
    <p className="text-gray-400 text-center mb-4">
      Não foi possível carregar os posts. Verifique sua conexão.
    </p>
    <Button
      onClick={onRetry}
      className={FOCUS_STYLES.ringButton}
      aria-label="Tentar carregar posts novamente"
    >
      Tentar novamente
    </Button>
  </div>
);

export const EmptyState = ({ filter }: { filter: FeedCategory }) => (
  <div
    role="status"
    aria-label={`Nenhum post encontrado na categoria ${filter}`}
    className="text-center py-12 px-4"
  >
    <div className="w-16 h-16 mx-auto rounded-full bg-gray-800 flex items-center justify-center mb-4">
      <span className="text-2xl" role="img" aria-label="Feed vazio">
        📱
      </span>
    </div>
    <h2 className="text-lg font-semibold text-white mb-2">
      Nenhum post encontrado
    </h2>
    <p className="text-gray-400 text-sm max-w-md mx-auto">
      {filter === "todos"
        ? "Seja o primeiro a compartilhar algo com sua comunidade!"
        : `Nenhum post na categoria "${filter}" ainda.`}
    </p>
  </div>
);
