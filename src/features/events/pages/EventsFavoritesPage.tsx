/**
 * EVENTS FAVORITES PAGE
 *
 * Página de eventos favoritos do usuário
 * Lista todos os eventos salvos
 *
 * @version 1.0.0
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Heart, Home, Sparkles, Trash2 } from 'lucide-react';
import { EventCard } from '../components/EventCard';
import { Button } from '@/shared/components/ui/button';
import { useFavorites } from '../hooks/useFavorites';
import { communityEventsRuntimeService } from '@/core/community/services/CommunityEventsRuntimeService';
import { mapCommunityEventToEvent } from '../utils/eventAdapters';
import { useConfirmActionDialog } from '@/shared/hooks/useConfirmActionDialog';

export default function EventsFavoritesPage() {
  const navigate = useNavigate();
  const { favorites, removeFavorite, clearFavorites, isLoading } = useFavorites();
  const { confirm, ConfirmDialog } = useConfirmActionDialog();
  const { data: events = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ['events-favorites', favorites],
    enabled: favorites.length > 0,
    queryFn: async () => {
      const rows = await Promise.all(favorites.map((eventId) => communityEventsRuntimeService.getEventById(eventId)));
      return rows.filter(Boolean).map((event) => mapCommunityEventToEvent(event!));
    },
  });

  const favoriteEvents = useMemo(() => {
    return events.filter((event) => favorites.includes(event.id));
  }, [events, favorites]);

  const handleEventClick = (eventId: string) => {
    navigate(`/eventos/${eventId}`);
  };

  const handleRemoveFavorite = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFavorite(eventId);
  };

  const handleClearAll = async () => {
    const confirmed = await confirm({
      title: 'Limpar favoritos?',
      description: 'Todos os eventos salvos serao removidos da sua lista de favoritos.',
      confirmLabel: 'Limpar favoritos',
      variant: 'destructive',
    });

    if (confirmed) {
      clearFavorites();
    }
  };

  return (
    <>
      {/* SEO */}
      <Helmet>
        <title>Meus Favoritos | Eventos | Achegue-se</title>
        <meta name="description" content="Seus eventos favoritos salvos" />
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Page Container */}
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Breadcrumbs */}
        <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="flex items-center gap-1 transition-colors hover:text-foreground">
                <Home className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Início</span>
              </Link>
              <span>/</span>
              <Link to="/eventos" className="transition-colors hover:text-foreground">
                Eventos
              </Link>
              <span>/</span>
              <span className="font-medium text-foreground">Favoritos</span>
            </nav>
          </div>
        </div>

        {/* Header */}
        <section className="border-b border-border/50 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              {/* Icon */}
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 shadow-lg">
                  <Heart className="h-8 w-8 fill-white text-white" />
                </div>
              </div>

              {/* Title */}
              <h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">
                Meus Favoritos
              </h1>

              {/* Subtitle */}
              <p className="mx-auto max-w-2xl text-muted-foreground">
                {favoriteEvents.length === 0
                  ? 'Você ainda não tem eventos favoritos'
                  : `${favoriteEvents.length} ${favoriteEvents.length === 1 ? 'evento salvo' : 'eventos salvos'}`}
              </p>

              {/* Clear All Button */}
              {favoriteEvents.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Limpar todos
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            {isLoading || isLoadingEvents ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : favoriteEvents.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                  <Heart className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  Nenhum favorito ainda
                </h3>
                <p className="mb-6 text-muted-foreground">
                  Comece a salvar eventos que você gosta para vê-los aqui
                </p>
                <Button onClick={() => navigate('/eventos')} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Explorar eventos
                </Button>
              </motion.div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {favoriteEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group relative"
                  >
                    <EventCard
                      event={event}
                      variant="default"
                      onClick={handleEventClick}
                    />
                    {/* Remove Button */}
                    <button
                      onClick={(e) => handleRemoveFavorite(event.id, e)}
                      className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-destructive/90 text-white opacity-0 shadow-lg backdrop-blur-sm transition-all hover:bg-destructive group-hover:opacity-100"
                      title="Remover dos favoritos"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      <ConfirmDialog />
    </>
  );
}
