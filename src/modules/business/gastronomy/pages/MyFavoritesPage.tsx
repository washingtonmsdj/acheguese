/**
 * MyFavoritesPage — Página de favoritos de gastronomia do usuário
 *
 * Rota: /gastronomia/favoritos
 * Requer autenticação — redireciona para login se não autenticado.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Heart, Loader2, Search, Tag, X } from 'lucide-react';

import { gastronomyPublicRoutes } from '@/core/verticals/gastronomy/routes/gastronomyPublicRoutes';
import { useSessionContext } from '@/core/session';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { PLATFORM_BRAND } from '@/shared/config/brand';
import { FavoriteBusinessCard } from '../components/FavoriteBusinessCard';
import { useUserFavorites } from '../hooks/useFavorites';

const emptyStateClass =
  'rounded-2xl border border-dashed border-territory-border bg-territory-surface p-8 text-center shadow-sm sm:p-12';

export default function MyFavoritesPage() {
  const { user } = useSessionContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: favorites = [], isLoading } = useUserFavorites({
    userId: user?.id ?? '',
    enabled: !!user?.id,
  });

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-territory-canvas px-4 text-territory-ink">
        <section className="w-full max-w-md rounded-3xl border border-territory-border bg-territory-surface p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-territory-brand/10 text-territory-brand">
            <Heart className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-heading text-xl font-bold">Entre para ver seus favoritos</h1>
          <p className="mt-2 text-sm leading-5 text-territory-muted">
            Seus restaurantes salvos ficam disponíveis depois do login.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="bg-territory-brand text-territory-on-image hover:bg-territory-brand/90">
              <Link to="/login" state={{ redirectTo: gastronomyPublicRoutes.favorites() }}>
                Entrar
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"
            >
              <Link to={gastronomyPublicRoutes.home()}>Explorar gastronomia</Link>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-territory-canvas text-territory-ink"
        role="status"
      >
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-territory-brand" aria-hidden="true" />
          <p className="text-sm text-territory-muted">Carregando favoritos...</p>
        </div>
      </div>
    );
  }

  const allTags = Array.from(
    new Set<string>(favorites.flatMap((fav) => fav.tags ?? [])),
  ).sort();

  const filtered = favorites.filter((fav) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        fav.business_name.toLowerCase().includes(q) ||
        fav.cuisine_type?.toLowerCase().includes(q) ||
        fav.business_description?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedTags.length > 0) {
      const hasTags = selectedTags.every((tag) => (fav.tags ?? []).includes(tag));
      if (!hasTags) return false;
    }
    return true;
  });

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  return (
    <>
      <Helmet>
        <title>Meus Favoritos | {PLATFORM_BRAND.name}</title>
        <meta name="description" content="Seus restaurantes favoritos" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-territory-canvas text-territory-ink">
        <header className="border-b border-territory-border bg-territory-surface">
          <div className="container mx-auto px-4 py-7 sm:py-8">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-territory-brand/10 text-territory-brand">
                <Heart className="h-6 w-6 fill-current" aria-hidden="true" />
              </span>
              <div>
                <h1 className="font-heading text-2xl font-bold tracking-tight">Meus Favoritos</h1>
                <p className="text-sm text-territory-muted">
                  {favorites.length}{' '}
                  {favorites.length === 1 ? 'estabelecimento salvo' : 'estabelecimentos salvos'}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {favorites.length > 0 ? (
            <section className="mb-6 space-y-4" aria-label="Filtros dos favoritos">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-muted"
                  aria-hidden="true"
                />
                <Input
                  placeholder="Buscar nos favoritos..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="border-territory-border bg-territory-surface pl-9 pr-10 text-territory-ink placeholder:text-territory-muted focus-visible:ring-territory-brand"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-territory-muted transition-colors hover:bg-territory-raised hover:text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
                    aria-label="Limpar busca"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>

              {allTags.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-territory-muted">
                    <Tag className="h-4 w-4" aria-hidden="true" />
                    <span>Filtrar por tags:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => {
                      const selected = selectedTags.includes(tag);
                      return (
                        <Badge
                          key={tag}
                          variant="outline"
                          className={
                            selected
                              ? 'cursor-pointer select-none border-territory-brand bg-territory-brand text-territory-on-image hover:bg-territory-brand/90'
                              : 'cursor-pointer select-none border-territory-border bg-territory-surface text-territory-ink hover:border-territory-brand/40 hover:bg-territory-raised'
                          }
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                        </Badge>
                      );
                    })}
                    {selectedTags.length > 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTags([])}
                        className="h-7 px-2 text-xs text-territory-brand hover:bg-territory-brand/10 hover:text-territory-brand"
                      >
                        Limpar
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((fav) => (
                <FavoriteBusinessCard key={fav.business_id} favorite={fav} />
              ))}
            </div>
          ) : favorites.length > 0 ? (
            <section className={emptyStateClass}>
              <Search className="mx-auto h-12 w-12 text-territory-muted/45" aria-hidden="true" />
              <h2 className="mt-4 font-heading font-bold">Nenhum resultado</h2>
              <p className="mt-2 text-sm text-territory-muted">Tente ajustar os filtros.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTags([]);
                }}
                className="mt-4 border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"
              >
                Limpar filtros
              </Button>
            </section>
          ) : (
            <section className={emptyStateClass}>
              <Heart className="mx-auto h-12 w-12 text-territory-muted/45" aria-hidden="true" />
              <h2 className="mt-4 font-heading font-bold">Nenhum favorito ainda</h2>
              <p className="mt-2 text-sm text-territory-muted">
                Salve restaurantes para acessá-los rapidamente.
              </p>
              <Button
                asChild
                className="mt-4 bg-territory-sun text-territory-ink hover:bg-territory-sun/90"
              >
                <Link to={gastronomyPublicRoutes.home()}>Explorar gastronomia</Link>
              </Button>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
