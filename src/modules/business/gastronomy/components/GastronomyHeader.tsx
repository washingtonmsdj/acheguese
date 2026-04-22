/**
 * GastronomyHeader — Header exclusivo da página de gastronomia.
 * Inclui ícone do módulo, tagline territorial dinâmica, barra de pesquisa
 * e atalho para favoritos (usuários autenticados).
 *
 * Território obtido via useTerritorialContext() — SSOT canônico.
 * Usuário via useSessionContext() — SSOT canônico.
 * URL de favoritos via useFriendlyModuleUrls() — SSOT canônico.
 * Search integrado via props (gerenciado pelo useGastronomyFilters da página).
 */

import { Link } from 'react-router-dom';
import { Search, UtensilsCrossed, X, Heart } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { useTerritorialContext } from '@/core/routing/components/TerritorialLayout';
import { useSessionContext } from '@/core/session';
import { useFriendlyModuleUrls } from '@/core/routing/hooks/useFriendlyModuleUrls';

interface GastronomyHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const TAGLINES = [
  (place: string) => `Sabores que fazem ${place} especial`,
  (place: string) => `O melhor da culinária em ${place}`,
  (place: string) => `Restaurantes, delivery e muito mais em ${place}`,
  (place: string) => `De onde você está em ${place}, tem algo gostoso perto`,
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getTagline(territoryName?: string): string {
  if (!territoryName) return 'Descubra restaurantes e delivery perto de você';
  const index = hashString(territoryName) % TAGLINES.length;
  return TAGLINES[index](territoryName);
}

export function GastronomyHeader({ searchQuery, onSearchChange }: GastronomyHeaderProps) {
  const territorialContext = useTerritorialContext();
  const resolved = territorialContext?.resolved ?? null;
  const { user } = useSessionContext();
  const moduleUrls = useFriendlyModuleUrls();

  const territoryName =
    resolved?.kind === 'location'
      ? resolved.location.name
      : resolved?.kind === 'group'
        ? resolved.group.name
        : undefined;

  const tagline = getTagline(territoryName);

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 h-12 sm:h-13 md:h-14 flex items-center gap-2 sm:gap-3">

        {/* Ícone — sempre visível */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-primary/15">
            <UtensilsCrossed className="h-4 w-4 text-primary" />
          </div>

          {/* Nome do módulo — sm+ */}
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-sm font-bold text-foreground leading-none">Gastronomia</span>
          {/* Tagline — md+ */}
            <span className="hidden md:block text-[11px] text-muted-foreground leading-none mt-0.5 truncate max-w-[40vw] lg:max-w-[50vw]">
              {tagline}
            </span>
          </div>
        </div>

        {/* Barra de pesquisa — ocupa o espaço restante */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              territoryName
                ? `Buscar em ${territoryName}...`
                : 'Buscar restaurantes, pratos...'
            }
            className="pl-9 pr-8 h-8 sm:h-9 rounded-xl bg-muted/60 border-border/50 text-sm focus:bg-background focus:ring-2 focus:ring-primary/30 w-full"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Limpar busca"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Favoritos — apenas para usuários autenticados */}
        {user && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5 rounded-full hover:bg-primary/10 hover:border-primary/50 transition-all duration-200 hidden sm:flex"
          >
            <Link to={moduleUrls.gastronomyFavorites}>
              <Heart className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Favoritos</span>
            </Link>
          </Button>
        )}

      </div>
    </header>
  );
}
