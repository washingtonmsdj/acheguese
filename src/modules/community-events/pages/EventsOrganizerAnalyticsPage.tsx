import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BarChart3, Home } from 'lucide-react';
import { EventAnalyticsCard } from '../components/EventAnalyticsCard';
import { EventNotFound } from '../components/EventNotFound';
import { eventRuntimeService } from '@/core/verticals/events';
import { mapCommunityEventToEvent } from '../utils/eventAdapters';

export default function EventsOrganizerAnalyticsPage() {
  const { eventId } = useParams<{ eventId: string }>();

  const { data: event, isLoading } = useQuery({
    queryKey: ['events-organizer-analytics', eventId],
    enabled: Boolean(eventId),
    queryFn: async () => {
      if (!eventId) return null;
      const row = await eventRuntimeService.getEventById(eventId);
      return row ? mapCommunityEventToEvent(row) : null;
    },
  });

  if (isLoading) {
    return <div className="min-h-[30vh] animate-pulse bg-muted/30" />;
  }

  if (!event) {
    return <EventNotFound eventId={eventId} message="Evento nao encontrado para analytics." />;
  }

  return (
    <>
      <Helmet>
        <title>Analytics do Evento | Central | Achegue-se</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="flex items-center gap-1 transition-colors hover:text-foreground">
                <Home className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Inicio</span>
              </Link>
              <span>/</span>
              <Link to="/central/eventos" className="transition-colors hover:text-foreground">
                Meus Eventos
              </Link>
              <span>/</span>
              <span className="font-medium text-foreground">Analytics</span>
            </nav>

            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
                <p className="text-sm text-muted-foreground">Analise de desempenho do evento</p>
              </div>
            </div>
          </div>
        </div>

        <section className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <EventAnalyticsCard event={event} />
          </div>
        </section>
      </div>
    </>
  );
}

