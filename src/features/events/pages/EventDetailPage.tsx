/**
 * �x}0 EVENT DETAIL PAGE V2
 * 
 * Página de detalhes de evento - Versão Premium
 * Inspirada em Sympla, Eventbrite e plataformas profissionais
 * 
 * Features:
 * - Hero impactante com banner
 * - Seção de ingressos/inscrições
 * - Descrição rica
 * - Programação/agenda
 * - Mapa e localização
 * - Galeria de fotos
 * - FAQ
 * - Eventos relacionados
 * - CTA sticky
 * - Compartilhamento social
 * - SEO otimizado
 * - Performance AAA
 * 
 * @version 2.0.0
 * @author Kiro AI
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Image as ImageIcon, 
  HelpCircle, 
  Calendar,
  Share2,
  Heart,
  Bookmark,
  ExternalLink
} from 'lucide-react';
import { EventHero } from '../components/EventHero';
import { EventTickets } from '../components/EventTickets';
import { EventDescription } from '../components/EventDescription';
import { EventSchedule } from '../components/EventSchedule';
import { EventCTA } from '../components/EventCTA';
import { EventNotFound } from '../components/EventNotFound';
import { EventGallery } from '../components/EventGallery';
import { EventFAQ } from '../components/EventFAQ';
import { EventShareModal } from '../components/EventShareModal';
import { EventRelated } from '../components/EventRelated';
import { EventReminders } from '../components/EventReminders';
import { EventReviews } from '../components/EventReviews';
import { EventCheckin } from '../components/EventCheckin';
import { Button } from '@/shared/components/ui/button';
import { useFavorites } from '../hooks/useFavorites';
import { cn } from '@/shared/utils/cn';
import { communityEventsRuntimeService } from '@/core/community/services/CommunityEventsRuntimeService';
import { mapCommunityEventToEvent } from '../utils/eventAdapters';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EventDetailPage() {
  const { eventId } = useParams();
  const [showShareModal, setShowShareModal] = useState(false);
  const { isFavorited, toggleFavorite } = useFavorites();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event-detail-ssot', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const row = await communityEventsRuntimeService.getEventById(eventId);
      return row ? mapCommunityEventToEvent(row) : null;
    },
  });
  const { data: relatedEvents = [] } = useQuery({
    queryKey: ['event-related-ssot', event?.category, event?.id],
    enabled: Boolean(event?.category),
    queryFn: async () => {
      const rows = await communityEventsRuntimeService.getEvents({
        category: event?.category,
        upcoming: true,
      });
      return rows.map(mapCommunityEventToEvent).filter((candidate) => candidate.id !== event?.id);
    },
  });

  if (isLoading) {
    return <div className="min-h-[40vh] animate-pulse bg-muted/30" />;
  }

  // Show 404 if event not found
  if (!event) {
    return <EventNotFound eventId={eventId} />;
  }

  const isSoldOut = event.tickets.every(t => t.quantity_available === 0);
  const eventIsFavorited = isFavorited(event.id);

  const handleFavorite = () => {
    toggleFavorite(event.id);
  };

  const handleShare = () => {
    setShowShareModal(true);
    // Implement share functionality
  };

  const handleSelectTicket = (ticketId: string) => {
    console.log('Selected ticket:', ticketId);
    // Implement ticket selection
  };

  const handleCTAAction = () => {
    console.log('CTA clicked');
    // Implement CTA action
  };

  return (
    <>
      {/* SEO */}
      <Helmet>
        <title>{event.meta_title || event.title}</title>
        <meta name="description" content={event.meta_description || event.short_description} />
        <meta name="keywords" content={event.meta_keywords?.join(', ')} />
        
        {/* Open Graph */}
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={event.short_description} />
        <meta property="og:image" content={event.cover_image_url} />
        <meta property="og:type" content="event" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event.title} />
        <meta name="twitter:description" content={event.short_description} />
        <meta name="twitter:image" content={event.cover_image_url} />
      </Helmet>

      {/* Page Container */}
      <div className="min-h-screen bg-background pb-20">
        {/* Hero Section */}
        <EventHero
          event={event}
          onFavorite={handleFavorite}
          onShare={handleShare}
          isFavorited={eventIsFavorited}
        />

        {/* Main Content */}
        <div className="mx-auto max-w-7xl">
          {/* Tickets Section */}
          <EventTickets
            tickets={event.tickets}
            isFree={event.is_free}
            onSelectTicket={handleSelectTicket}
          />

          {/* Description Section */}
          <EventDescription event={event} />

          {/* Schedule Section */}
          {event.schedule && event.schedule.length > 0 && (
            <EventSchedule schedule={event.schedule} />
          )}

          {/* Gallery Section */}
          {event.gallery && event.gallery.length > 0 && (
            <EventGallery 
              images={event.gallery.map(item => item.url)} 
              title="Galeria de Fotos"
            />
          )}

          {/* FAQ Section */}
          {event.faq && event.faq.length > 0 && (
            <EventFAQ 
              faqs={event.faq.map(item => ({
                question: item.question,
                answer: item.answer
              }))} 
            />
          )}

          {/* Reminders Section */}
          <section className="py-12">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <EventReminders event={event} />
                <EventCheckin event={event} />
              </div>
            </div>
          </section>

          {/* Reviews Section */}
          <EventReviews
            eventId={event.id}
            eventTitle={event.title}
            eventDate={event.start_date}
            canReview={new Date(event.start_date) < new Date()}
          />

          {/* Location Section */}
          {event.location.type !== 'online' && (
            <section className="py-12 bg-muted/30">
              <div className="mx-auto max-w-4xl px-4 sm:px-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="mb-8">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                      <MapPin className="h-4 w-4" />
                      Localização
                    </div>
                    <h2 className="text-3xl font-bold text-foreground">
                      Como chegar
                    </h2>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-foreground mb-2">
                        {event.location.venue_name}
                      </h3>
                      <p className="text-muted-foreground">
                        {event.location.address}
                        {event.location.neighborhood && ` - ${event.location.neighborhood}`}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.location.city}, {event.location.state}
                      </p>
                    </div>

                    {event.location.instructions && (
                      <div className="mb-4 rounded-lg bg-muted/50 p-4">
                        <p className="text-sm text-muted-foreground">
                          {event.location.instructions}
                        </p>
                      </div>
                    )}

                    {event.location.latitude && event.location.longitude && (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => window.open(
                          `https://www.google.com/maps/search/?api=1&query=${event.location.latitude},${event.location.longitude}`,
                          '_blank'
                        )}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Ver no Google Maps
                      </Button>
                    )}
                  </div>
                </motion.div>
              </div>
            </section>
          )}

          {/* Organizer Section */}
          <section className="py-12">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-8">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                    <Calendar className="h-4 w-4" />
                    Organizador
                  </div>
                  <h2 className="text-3xl font-bold text-foreground">
                    Quem está organizando
                  </h2>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-start gap-4">
                    <img
                      src={event.organizer.avatar_url || '/placeholder.svg'}
                      alt={event.organizer.name}
                      className="h-16 w-16 rounded-full border-2 border-border object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground mb-1">
                        {event.organizer.name}
                      </h3>
                      {event.organizer.bio && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {event.organizer.bio}
                        </p>
                      )}
                      {event.organizer.stats && (
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>{event.organizer.stats.events_created} eventos realizados</span>
                          <span>{event.organizer.stats.total_participants.toLocaleString('pt-BR')} participantes</span>
                          {event.organizer.stats.rating && (
                            <span>⭐ {event.organizer.stats.rating.toFixed(1)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Related Events Section */}
          <EventRelated currentEvent={event} events={relatedEvents} maxEvents={4} />
        </div>

        {/* Share Modal */}
        <EventShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          eventTitle={event.title}
          eventUrl={`/eventos/${event.id}`}
          eventDescription={event.short_description}
        />

        {/* Sticky CTA */}
        <EventCTA
          cta={{
            type: 'register',
            label: event.is_free ? 'Inscrição gratuita' : 'Comprar ingresso',
            action: '/register',
            enabled: true
          }}
          isFree={event.is_free}
          isSoldOut={isSoldOut}
          onAction={handleCTAAction}
        />
      </div>
    </>
  );
}
