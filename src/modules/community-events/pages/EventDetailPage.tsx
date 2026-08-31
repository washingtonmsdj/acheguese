/**
 * Event detail page
 * 
 * Pagina de detalhes de evento
 * Inspirada em Sympla, Eventbrite e plataformas profissionais
 * 
 * Features:
 * - Hero impactante com banner
 * - Secao de ingressos/inscricoes
 * - Descricao rica
 * - Programacao/agenda
 * - Mapa e localizacao
 * - Galeria de fotos
 * - FAQ
 * - Eventos relacionados
 * - CTA sticky
 * - Compartilhamento social
 * - SEO otimizado
 * - Performance AAA
 * 
 */

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  ExternalLink,
  CheckCircle2
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
import { useToast } from '@/shared/hooks/use-toast';
import { useSessionContext } from '@/core/session';
import { useFavorites } from '../hooks/useFavorites';
import { cn } from '@/shared/utils/cn';
import { buildGoogleMapsSearchUrl } from '@/shared/utils/contactLinks';
import { openSafeExternalUrl } from '@/shared/utils/safeRedirect';
import { eventRuntimeService } from '@/core/community-events';
import { mapCommunityEventToEvent } from '../utils/eventAdapters';
import { useConfirmActionDialog } from '@/shared/hooks/useConfirmActionDialog';
import { EventEngagementService } from '@/core/community-events/services/EventEngagementService';
import { useTerritorialContextOptional } from '@/core/routing/components/TerritorialLayout';
import { useCommunityUrls } from '@/core/routing/hooks/useCommunityUrls';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EventDetailPage() {
  const { eventId } = useParams();
  const ticketsSectionRef = useRef<HTMLElement | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isParticipating, setIsParticipating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { isFavorited, toggleFavorite } = useFavorites();
  const { toast } = useToast();
  const { activeProfile } = useSessionContext();
  const territorialContext = useTerritorialContextOptional();
  const eventUrls = useCommunityUrls(territorialContext?.resolved);
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirmActionDialog();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event-detail-ssot', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const row = await eventRuntimeService.getEventById(eventId);
      return row ? mapCommunityEventToEvent(row) : null;
    },
  });
  const { data: relatedEvents = [] } = useQuery({
    queryKey: ['event-related-ssot', event?.category, event?.id],
    enabled: Boolean(event?.category),
    queryFn: async () => {
      const rows = await eventRuntimeService.getEvents({
        category: event?.category,
        upcoming: true,
      });
      return rows.map(mapCommunityEventToEvent).filter((candidate) => candidate.id !== event?.id);
    },
  });
  const { data: eventReviews = [] } = useQuery({
    queryKey: ['event-reviews', event?.id],
    enabled: Boolean(event?.id),
    queryFn: async () => {
      if (!event?.id) return [];
      return EventEngagementService.getReviews(event.id);
    },
  });

  useEffect(() => {
    let mounted = true;

    async function loadParticipationState() {
      if (!event?.id || !activeProfile?.id) {
        if (mounted) setIsParticipating(false);
        return;
      }

      const participating = await eventRuntimeService.isParticipating(
        event.id,
        activeProfile.id
      );

      if (mounted) {
        setIsParticipating(participating);
      }
    }

    loadParticipationState();

    return () => {
      mounted = false;
    };
  }, [event?.id, activeProfile?.id]);

  if (isLoading) {
    return <div className="min-h-[40vh] animate-pulse bg-muted/30" />;
  }

  // Show 404 if event not found
  if (!event) {
    return <EventNotFound eventId={eventId} />;
  }

  const isSoldOut = event.tickets.every(t => t.quantity_available === 0);
  const eventIsFavorited = isFavorited(event.id);
  const eventDetailUrl = eventUrls.eventDetail(event.id);

  const handleFavorite = () => {
    void toggleFavorite(event.id);
  };

  const handleShare = () => {
    setShowShareModal(true);
    // Implement share functionality
  };

  const handleSelectTicket = (ticketId: string) => {
    if (isRegistering || isCancelling) {
      return;
    }

    const selectedTicket = event.tickets.find((ticket) => ticket.id === ticketId);
    if (!selectedTicket) {
      toast({
        title: 'Ingresso indisponivel',
        description: 'Nao foi possivel selecionar este ingresso agora.',
        variant: 'destructive',
      });
      return;
    }

    if (!activeProfile?.id) {
      toast({
        title: 'Faca login para garantir vaga',
        description: 'Entre com sua conta para concluir a inscricao no evento.',
        variant: 'destructive',
      });
      return;
    }

    if (isParticipating) {
      toast({
        title: 'Inscricao ja confirmada',
        description: 'Voce ja esta inscrito neste evento.',
      });
      return;
    }

    setIsRegistering(true);

    eventRuntimeService
      .joinEvent(event.id, activeProfile.id)
      .then(async () => {
        setIsParticipating(true);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['event-detail-ssot', eventId] }),
          queryClient.invalidateQueries({ queryKey: ['event-related-ssot'] }),
          queryClient.invalidateQueries({ queryKey: ['events-organizer-dashboard'] }),
        ]);

        toast({
          title: selectedTicket.is_free ? 'Vaga garantida' : 'Ingresso reservado',
          description: selectedTicket.is_free
            ? `${selectedTicket.name} confirmado para este evento.`
            : `${selectedTicket.name} registrado. Confira os proximos passos no evento.`,
        });
      })
      .catch((error: unknown) => {
        toast({
          title: 'Falha ao confirmar inscricao',
          description:
            error instanceof Error
              ? error.message
              : 'Nao foi possivel concluir sua inscricao agora.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsRegistering(false);
      });
  };

  const handleCTAAction = () => {
    if (isRegistering || isCancelling) {
      return;
    }

    if (isParticipating) {
      toast({
        title: 'Inscricao ja confirmada',
        description: 'Voce ja esta inscrito neste evento.',
      });
      return;
    }

    const firstAvailableTicket = event.tickets.find(
      (ticket) => ticket.status === 'disponivel' && ticket.quantity_available > 0
    );

    if (!firstAvailableTicket) {
      ticketsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      toast({
        title: 'Sem vagas no momento',
        description: 'Este evento esta sem ingressos disponiveis.',
        variant: 'destructive',
      });
      return;
    }

    ticketsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    handleSelectTicket(firstAvailableTicket.id);
  };

  const handleCancelRegistration = async () => {
    if (!activeProfile?.id || !isParticipating || isRegistering || isCancelling) {
      return;
    }

    const confirmed = await confirm({
      title: 'Cancelar inscricao?',
      description: 'Sua vaga sera liberada para outras pessoas e voce precisara se inscrever novamente para participar.',
      confirmLabel: 'Cancelar inscricao',
      variant: 'destructive',
    });
    if (!confirmed) {
      return;
    }

    setIsCancelling(true);

    eventRuntimeService
      .leaveEvent(event.id, activeProfile.id)
      .then(async () => {
        setIsParticipating(false);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['event-detail-ssot', eventId] }),
          queryClient.invalidateQueries({ queryKey: ['event-related-ssot'] }),
          queryClient.invalidateQueries({ queryKey: ['events-organizer-dashboard'] }),
        ]);

        toast({
          title: 'Inscricao cancelada',
          description: 'Sua vaga foi liberada neste evento.',
        });
      })
      .catch((error: unknown) => {
        toast({
          title: 'Falha ao cancelar inscricao',
          description:
            error instanceof Error
              ? error.message
              : 'Nao foi possivel cancelar sua inscricao agora.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsCancelling(false);
      });
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
          {(isParticipating || isRegistering || isCancelling) && (
            <section className="pt-8">
              <div className="mx-auto max-w-4xl px-4 sm:px-6">
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-700">
                        {isRegistering
                          ? 'Confirmando sua inscricao...'
                          : isCancelling
                          ? 'Cancelando inscricao...'
                          : 'Inscricao confirmada'}
                      </p>
                      <p className="text-sm text-emerald-700/90">
                        {isRegistering
                          ? 'Estamos finalizando sua vaga neste evento.'
                          : isCancelling
                          ? 'Estamos processando o cancelamento da sua vaga.'
                          : 'Sua vaga ja esta garantida e registrada para o organizador.'}
                      </p>
                    </div>
                  </div>
                  {isParticipating && !isRegistering && (
                    <div className="mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelRegistration}
                        disabled={isCancelling}
                        className="border-emerald-600/30 bg-white/60 text-emerald-800 hover:bg-white"
                      >
                        {isCancelling ? 'Cancelando...' : 'Cancelar inscricao'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Tickets Section */}
          <section ref={ticketsSectionRef}>
            <EventTickets
              tickets={event.tickets}
              isFree={event.is_free}
              onSelectTicket={handleSelectTicket}
              disabled={isParticipating || isRegistering || isCancelling}
              disabledLabel={
                isRegistering
                  ? 'Processando...'
                  : isCancelling
                  ? 'Cancelando...'
                  : 'Inscricao confirmada'
              }
            />
          </section>

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
            reviews={eventReviews}
            canReview={new Date(event.start_date) < new Date() && Boolean(activeProfile?.id)}
            reviewerProfileId={activeProfile?.id ?? null}
            onSubmitReview={async ({ rating, comment }) => {
              if (!activeProfile?.id) {
                throw new Error('Perfil ativo necessario para avaliar.');
              }

              const savedReview = await EventEngagementService.submitReview({
                eventId: event.id,
                reviewerProfileId: activeProfile.id,
                rating,
                comment,
              });
              await queryClient.invalidateQueries({ queryKey: ['event-reviews', event.id] });
              return savedReview;
            }}
            onMarkHelpful={async (reviewId) => {
              if (!activeProfile?.id) {
                throw new Error('Perfil ativo necessario para marcar utilidade.');
              }

              await EventEngagementService.markReviewHelpful(reviewId, activeProfile.id);
              await queryClient.invalidateQueries({ queryKey: ['event-reviews', event.id] });
            }}
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
                      Localizacao
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
                        onClick={() =>
                          openSafeExternalUrl(
                            buildGoogleMapsSearchUrl(`${event.location.latitude},${event.location.longitude}`),
                            { context: "event-detail-map" },
                          )
                        }
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
                    Quem esta organizando
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
                            <span>Nota {event.organizer.stats.rating.toFixed(1)}</span>
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
          <EventRelated
            currentEvent={event}
            events={relatedEvents}
            eventsUrl={eventUrls.events}
            getEventUrl={eventUrls.eventDetail}
            maxEvents={4}
          />
        </div>

        {/* Share Modal */}
        <EventShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          eventTitle={event.title}
          eventUrl={eventDetailUrl}
          eventDescription={event.short_description}
        />

        {/* Sticky CTA */}
        <EventCTA
          cta={{
            type: 'register',
            label: isRegistering
              ? 'Processando inscricao...'
              : isCancelling
              ? 'Cancelando inscricao...'
              : isParticipating
              ? 'Inscricao confirmada'
              : event.is_free
              ? 'Inscricao gratuita'
              : 'Comprar ingresso',
            action: '/register',
            enabled: true
          }}
          isFree={event.is_free}
          isSoldOut={isSoldOut}
          disabled={isParticipating || isRegistering || isCancelling}
          onAction={handleCTAAction}
        />
      </div>
      <ConfirmDialog />
    </>
  );
}
