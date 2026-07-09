/**
 * 📅 EVENTS CALENDAR PAGE
 *
 * Página de visualização de eventos em calendário
 *
 * @version 1.0.0
 */

import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Calendar, Home, List, Map } from 'lucide-react';
import { EventCalendar } from '../components/EventCalendar';
import { Button } from '@/shared/components/ui/button';
import { eventRuntimeService } from '@/core/verticals/events';
import { mapCommunityEventToEvent } from '../utils/eventAdapters';
import { useTerritorialContextOptional } from '@/core/routing/components/TerritorialLayout';
import { useCommunityUrls } from '@/core/routing/hooks/useCommunityUrls';
import { useEventTerritoryFilter } from '../hooks/useEventTerritoryFilter';

export default function EventsCalendarPage() {
  const navigate = useNavigate();
  const territorialContext = useTerritorialContextOptional();
  const eventUrls = useCommunityUrls(territorialContext?.resolved);
  const territoryFilter = useEventTerritoryFilter(
    territorialContext?.resolved,
    territorialContext?.activeMemberIds,
  );
  const { data: events = [] } = useQuery({
    queryKey: ['events-calendar', territoryFilter],
    queryFn: async () => {
      const rows = await eventRuntimeService.getEvents({
        upcoming: true,
        territoryFilter,
      });
      return rows.map(mapCommunityEventToEvent);
    },
  });

  const handleEventClick = (eventId: string) => {
    navigate(eventUrls.eventDetail(eventId));
  };

  return (
    <>
      {/* SEO */}
      <Helmet>
        <title>Calendário de Eventos | Achegue-se</title>
        <meta name="description" content="Visualize todos os eventos em um calendário interativo" />
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
              <Link to={eventUrls.events} className="transition-colors hover:text-foreground">
                Eventos
              </Link>
              <span>/</span>
              <span className="font-medium text-foreground">Calendário</span>
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
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* Title */}
              <h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">
                Calendário de Eventos
              </h1>

              {/* Subtitle */}
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Visualize todos os eventos organizados por data
              </p>

              {/* View toggles */}
              <div className="mt-6 flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(eventUrls.events)}
                  className="gap-2"
                >
                  <List className="h-4 w-4" />
                  Lista
                </Button>
                <Button variant="default" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendário
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(eventUrls.eventMap)}
                  className="gap-2"
                >
                  <Map className="h-4 w-4" />
                  Mapa
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Calendar */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <EventCalendar
                events={events}
                onEventClick={handleEventClick}
              />
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
