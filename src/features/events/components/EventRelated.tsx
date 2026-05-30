/**
 * EVENT RELATED
 * 
 * Seção de eventos relacionados/similares
 * Baseado em categoria e localização
 * 
 * @version 1.0.0
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { EventCard } from './EventCard';
import type { Event } from '../types';
import { eventPublicRoutes } from '@/core/verticals/events/routes/eventPublicRoutes';

interface EventRelatedProps {
  currentEvent: Event;
  events: Event[];
  maxEvents?: number;
  title?: string;
  eventsUrl?: string;
  getEventUrl?: (eventId: string) => string;
}

export function EventRelated({ 
  currentEvent, 
  events,
  maxEvents = 4,
  title = 'Eventos Similares',
  eventsUrl = eventPublicRoutes.home(),
  getEventUrl = eventPublicRoutes.detail,
}: EventRelatedProps) {
  const navigate = useNavigate();

  // Find related events based on category and location
  const relatedEvents = useMemo(() => {
    return events
      .filter(event => {
        // Exclude current event
        if (event.id === currentEvent.id) return false;

        // Same category
        const sameCategory = event.category === currentEvent.category;

        // Same city
        const sameCity = event.location.city === currentEvent.location.city;

        // Same neighborhood (bonus)
        const sameNeighborhood = event.location.neighborhood === currentEvent.location.neighborhood;

        // Prioritize: same category + same city
        return sameCategory || sameCity || sameNeighborhood;
      })
      .sort((a, b) => {
        // Score based on similarity
        let scoreA = 0;
        let scoreB = 0;

        // Same category = +3 points
        if (a.category === currentEvent.category) scoreA += 3;
        if (b.category === currentEvent.category) scoreB += 3;

        // Same neighborhood = +2 points
        if (a.location.neighborhood === currentEvent.location.neighborhood) scoreA += 2;
        if (b.location.neighborhood === currentEvent.location.neighborhood) scoreB += 2;

        // Same city = +1 point
        if (a.location.city === currentEvent.location.city) scoreA += 1;
        if (b.location.city === currentEvent.location.city) scoreB += 1;

        return scoreB - scoreA;
      })
      .slice(0, maxEvents);
  }, [currentEvent, maxEvents, events]);

  const handleEventClick = (eventId: string) => {
    navigate(getEventUrl(eventId));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (relatedEvents.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              {title}
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              Você também pode gostar
            </h2>
            <p className="mt-2 text-muted-foreground">
              Eventos relacionados que podem te interessar
            </p>
          </div>

          {/* Events Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <EventCard
                  event={event}
                  variant="default"
                  onClick={handleEventClick}
                />
              </motion.div>
            ))}
          </div>

          {/* View All Button */}
          {events.length > maxEvents && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: relatedEvents.length * 0.1 }}
              className="mt-8 text-center"
            >
              <button
                onClick={() => navigate(eventsUrl)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 font-semibold text-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                Ver todos os eventos
                <Sparkles className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
