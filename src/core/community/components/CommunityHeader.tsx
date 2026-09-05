import React from "react";
import { LocationFilter } from "./LocationFilter";
import { SortSelector } from "./SortSelector";
import { CreatePostButton } from "./CreatePostButton";
import { QuickActionButtons } from "./QuickActionButtons";
import { useCommunityFilters } from "@/core/community-feed/hooks/useFeedFilters";
/**
 * Cabeçalho da página Comunidade
 *
 * Requirements:
 * - Requirement 1: Filtro de Localização
 * - Requirement 2: Restrição de Postagem para Empresas
 * - Requirement 3: Criar Post
 * - Requirement 4: Modos de Ordenação
 *
 * Funcionalidades:
 * - Integra LocationFilter e SortSelector
 * - Botão "Criar Post" (apenas para usuários pessoa física)
 * - Layout responsivo com sticky positioning
 */

interface CommunityHeaderProps {
  onOpenCreatePost: () => void;
}

export function CommunityHeader({ onOpenCreatePost }: CommunityHeaderProps) {
  // Use immediateFilters for UI display (instant feedback)
  // The actual queries use debounced filters automatically
  const { immediateFilters, setLocationScope, setSortBy } =
    useCommunityFilters();

  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-[10px] border-b border-border/60">
      <div className="w-full py-3 md:py-4 px-4">
        {/* Mobile Layout: Vertical stacking */}
        <div className="flex flex-col gap-3 md:hidden">
          {/* Título territorial + CTA única */}
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Feed do bairro
              </p>
              <h1 className="truncate text-lg font-semibold text-foreground">
                O que rola no bairro
              </h1>
            </div>
            <CreatePostButton onOpenModal={onOpenCreatePost} />
          </div>

          {/* Filtros verticais em mobile */}
          <div className="flex flex-col gap-2">
            <LocationFilter
              value={immediateFilters.locationScope}
              onChange={setLocationScope}
            />
            <SortSelector
              value={immediateFilters.sortBy}
              onChange={setSortBy}
            />
          </div>
        </div>

        {/* Desktop Layout: Horizontal */}
        <div className="hidden md:flex md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Feed do bairro
              </p>
              <h1 className="text-2xl font-semibold text-foreground">
                O que rola no bairro
              </h1>
            </div>
            <CreatePostButton onOpenModal={onOpenCreatePost} />
          </div>

          {/* Filtros horizontais em desktop */}
          <div className="flex items-center gap-3">
            <LocationFilter
              value={immediateFilters.locationScope}
              onChange={setLocationScope}
            />
            <SortSelector
              value={immediateFilters.sortBy}
              onChange={setSortBy}
            />
          </div>
        </div>

        {/* Tag ativa */}
        {immediateFilters.tagFilter && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Vendo só</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              #{immediateFilters.tagFilter}
            </span>
          </div>
        )}
      </div>

      {/* Ações rápidas do bairro */}
      <QuickActionButtons />
    </div>
  );
}

