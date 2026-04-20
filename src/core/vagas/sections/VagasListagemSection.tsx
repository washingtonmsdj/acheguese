/**
 * VagasListagemSection - Listagem de vagas
 * 
 * SSOT: Section modular
 * Sem gambiarras: Props tipadas
 */

import { Zap, Star, ChevronDown, Loader2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { VagaCardEnhanced } from "../components/VagaCardEnhanced";
import {
  VagasLoading,
  VagasEmpty,
  VagasError,
} from "../components/VagasStates";
import type { VagasListagemSectionProps } from "./types";

export function VagasListagemSection({
  vagas,
  vagasUrgentes,
  vagasDestaque,
  total,
  hasMore,
  isLoading,
  isError,
  isFetchingNextPage,
  hasActiveFilters,
  clearFilters,
  fetchNextPage,
  onVagaClick,
}: VagasListagemSectionProps) {
  // Estados de loading/error/empty
  if (isLoading) {
    return <VagasLoading />;
  }

  if (isError) {
    return <VagasError onRetry={() => window.location.reload()} />;
  }

  if (vagas.length === 0) {
    return (
      <VagasEmpty hasFilters={hasActiveFilters} onClearFilters={clearFilters} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Vagas Urgentes */}
      {vagasUrgentes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-destructive" />
              <h2 className="text-lg font-bold text-foreground">
                Vagas Urgentes
              </h2>
              <Badge variant="secondary">{vagasUrgentes.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {vagasUrgentes.map((vaga) => (
                <VagaCardEnhanced
                  key={vaga.id}
                  vaga={vaga}
                  variant="compact"
                  onClick={() => onVagaClick(vaga.slug)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Grid de vagas */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        {/* Vagas em Destaque (quando não há filtros) */}
        {!hasActiveFilters && vagasDestaque.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium text-muted-foreground">
                Destaques
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vagasDestaque.map((vaga) => (
                <VagaCardEnhanced
                  key={vaga.id}
                  vaga={vaga}
                  variant="featured"
                  onClick={() => onVagaClick(vaga.slug)}
                />
              ))}
            </div>
            <Separator className="my-6" />
          </div>
        )}

        {/* Todas as vagas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vagas.map((vaga) => (
            <VagaCardEnhanced
              key={vaga.id}
              vaga={vaga}
              variant="list"
              onClick={() => onVagaClick(vaga.slug)}
            />
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  Ver mais vagas
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
