/**
 * ModuleHeader — SSOT para headers de módulos
 * 
 * Header sticky reutilizável para todos os módulos da plataforma.
 * Inclui ícone, nome do módulo, tagline territorial dinâmica e busca.
 * 
 * SSOT:
 * - Território via useTerritorialContext()
 * - Usuário via useSessionContext()
 * - Search gerenciado pela página via props
 * 
 * Usado por: Gastronomia, Empresas, Serviços, Classificados, etc.
 */

import { Link } from 'react-router-dom';
import { Search, X, Heart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { useTerritorialContextOptional } from '@/core/routing/components/TerritorialLayout';
import { useSessionContext } from '@/core/session';

export interface ModuleHeaderProps {
  /** Nome do módulo (ex: "Gastronomia", "Empresas") */
  moduleName: string;
  /** Ícone do módulo */
  moduleIcon: LucideIcon;
  /** Query de busca atual */
  searchQuery: string;
  /** Callback quando a busca muda */
  onSearchChange: (value: string) => void;
  /** Placeholder customizado para o campo de busca */
  searchPlaceholder?: string;
  /** Taglines territoriais customizadas (opcional) */
  taglines?: ((place: string) => string)[];
  /** Link para página de favoritos (opcional) */
  favoritesLink?: string;
  /** Mostrar botão de favoritos (default: false) */
  showFavorites?: boolean;
}

const DEFAULT_TAGLINES = [
  (place: string) => `Descubra o melhor de ${place}`,
  (place: string) => `Tudo que você precisa em ${place}`,
  (place: string) => `Conectando você com ${place}`,
  (place: string) => `O que há de novo em ${place}`,
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getTagline(
  territoryName: string | undefined,
  moduleName: string,
  customTaglines?: ((place: string) => string)[]
): string {
  if (!territoryName) {
    return `Descubra ${moduleName.toLowerCase()} perto de você`;
  }
  
  const taglines = customTaglines ?? DEFAULT_TAGLINES;
  const index = hashString(territoryName) % taglines.length;
  return taglines[index](territoryName);
}

export function ModuleHeader({
  moduleName,
  moduleIcon: ModuleIcon,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  taglines,
  favoritesLink,
  showFavorites = false,
}: ModuleHeaderProps) {
  const territorialContext = useTerritorialContextOptional();
  const resolved = territorialContext?.resolved ?? null;
  const { user } = useSessionContext();

  const territoryName =
    resolved?.kind === 'location'
      ? resolved.location.name
      : resolved?.kind === 'group'
        ? resolved.group.name
        : undefined;

  const tagline = getTagline(territoryName, moduleName, taglines);
  
  const placeholder = searchPlaceholder ?? (
    territoryName
      ? `Buscar em ${territoryName}...`
      : `Buscar ${moduleName.toLowerCase()}...`
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 h-12 sm:h-13 md:h-14 flex items-center gap-2 sm:gap-3">

        {/* Ícone — sempre visível */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-primary/15">
            <ModuleIcon className="h-4 w-4 text-primary" />
          </div>

          {/* Nome do módulo — sm+ */}
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-sm font-bold text-foreground leading-none">
              {moduleName}
            </span>
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
            placeholder={placeholder}
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

        {/* Favoritos — apenas se habilitado e usuário autenticado */}
        {showFavorites && user && favoritesLink && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5 rounded-full hover:bg-primary/10 hover:border-primary/50 transition-all duration-200 hidden sm:flex"
          >
            <Link to={favoritesLink}>
              <Heart className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Favoritos</span>
            </Link>
          </Button>
        )}

      </div>
    </header>
  );
}
