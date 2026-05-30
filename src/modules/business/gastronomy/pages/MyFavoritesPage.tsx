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

export default function MyFavoritesPage() {
  const { user } = useSessionContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: favorites = [], isLoading } = useUserFavorites({
    userId: user?.id ?? '',
    enabled: !!user?.id,
  });

  // Redirecionar para login se não autenticado
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-xl border border-dashed p-8 text-center">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h1 className="mt-4 text-xl font-semibold">Entre para ver seus favoritos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seus restaurantes salvos ficam disponíveis depois do login.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link to="/login" state={{ redirectTo: gastronomyPublicRoutes.favorites() }}>
                Entrar
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={gastronomyPublicRoutes.home()}>Explorar gastronomia</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando favoritos...</p>
        </div>
      </div>
    );
  }

  // Tags únicas de todos os favoritos
  const allTags = Array.from(
    new Set<string>(favorites.flatMap((fav) => fav.tags ?? [])),
  ).sort();

  // Filtrar por busca e tags
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
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-6 w-6 fill-primary text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Meus Favoritos</h1>
                <p className="text-sm text-muted-foreground">
                  {favorites.length}{' '}
                  {favorites.length === 1 ? 'estabelecimento salvo' : 'estabelecimentos salvos'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Filtros — só exibe se houver favoritos */}
          {favorites.length > 0 && (
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar nos favoritos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {allTags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Tag className="h-4 w-4" />
                    <span>Filtrar por tags:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                        className="cursor-pointer select-none"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {selectedTags.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTags([])}
                        className="h-6 px-2 text-xs"
                      >
                        Limpar
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Grid de favoritos */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((fav) => (
                <FavoriteBusinessCard key={fav.business_id} favorite={fav} />
              ))}
            </div>
          ) : favorites.length > 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center">
              <Search className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <h3 className="mt-4 font-semibold">Nenhum resultado</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Tente ajustar os filtros
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTags([]);
                }}
                className="mt-4"
              >
                Limpar filtros
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-12 text-center">
              <Heart className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <h3 className="mt-4 font-semibold">Nenhum favorito ainda</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Salve restaurantes para acessá-los rapidamente
              </p>
              <Button asChild className="mt-4">
                <Link to={gastronomyPublicRoutes.home()}>Explorar gastronomia</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
