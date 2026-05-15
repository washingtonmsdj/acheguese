/**
 * 🎭 EVENT HERO V2
 * 
 * Hero section premium para página de evento
 * Inspirado em Sympla/Eventbrite com design moderno
 * 
 * @version 2.0.0
 */

import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Heart, 
  Share2, 
  Bookmark,
  Video,
  Globe,
  CheckCircle2,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Event } from '../types';

interface EventHeroProps {
  event: Event;
  onFavorite?: () => void;
  onShare?: () => void;
  isFavorited?: boolean;
  className?: string;
}

export function EventHero({ 
  event, 
  onFavorite, 
  onShare, 
  isFavorited = false,
  className 
}: EventHeroProps) {
  const eventDate = new Date(event.start_date);
  const isOnline = event.type === 'online' || event.type === 'hibrido';
  const isPresencial = event.type === 'presencial' || event.type === 'hibrido';
  
  const availableTickets = event.tickets.reduce(
    (acc, ticket) => acc + ticket.quantity_available, 
    0
  );
  const totalCapacity = event.capacity || event.tickets.reduce(
    (acc, ticket) => acc + ticket.quantity_total, 
    0
  );
  const occupancyRate = totalCapacity > 0 ? ((totalCapacity - availableTickets) / totalCapacity) * 100 : 0;
  const isAlmostFull = occupancyRate >= 80;
  const isSoldOut = availableTickets === 0;

  return (
    <section className={cn("relative overflow-hidden", className)}>
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={event.banner_image_url || event.cover_image_url}
          alt={event.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2">
            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4 flex flex-wrap gap-2"
            >
              {/* Category Badge */}
              <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm border-0 text-sm px-3 py-1">
                {event.category}
              </Badge>

              {/* Type Badge */}
              {isOnline && (
                <Badge className="bg-blue-500/90 text-white backdrop-blur-sm border-0 text-sm px-3 py-1 gap-1.5">
                  <Video className="h-3.5 w-3.5" />
                  Online
                </Badge>
              )}
              {isPresencial && (
                <Badge className="bg-emerald-500/90 text-white backdrop-blur-sm border-0 text-sm px-3 py-1 gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Presencial
                </Badge>
              )}

              {/* Free Badge */}
              {event.is_free && (
                <Badge className="bg-green-500/90 text-white backdrop-blur-sm border-0 text-sm px-3 py-1 gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Gratuito
                </Badge>
              )}

              {/* Status Badges */}
              {isAlmostFull && !isSoldOut && (
                <Badge className="bg-amber-500/90 text-white backdrop-blur-sm border-0 text-sm px-3 py-1 gap-1.5 animate-pulse">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Últimas vagas
                </Badge>
              )}
              {isSoldOut && (
                <Badge className="bg-red-500/90 text-white backdrop-blur-sm border-0 text-sm px-3 py-1">
                  Esgotado
                </Badge>
              )}

              {/* Verified Organizer */}
              {event.organizer.verified && (
                <Badge className="bg-blue-600/90 text-white backdrop-blur-sm border-0 text-sm px-3 py-1 gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Organizador verificado
                </Badge>
              )}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-3 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl"
            >
              {event.title}
            </motion.h1>

            {/* Subtitle */}
            {event.subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-6 text-lg text-white/80 sm:text-xl"
              >
                {event.subtitle}
              </motion.p>
            )}

            {/* Key Info Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {/* Date */}
              <div className="flex items-start gap-3 rounded-xl bg-black/30 p-4 backdrop-blur-sm border border-white/10">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white/60">Data</p>
                  <p className="text-sm font-bold text-white">
                    {format(eventDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-white/80">
                    {format(eventDate, 'yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-start gap-3 rounded-xl bg-black/30 p-4 backdrop-blur-sm border border-white/10">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white/60">Horário</p>
                  <p className="text-sm font-bold text-white">
                    {format(eventDate, 'HH:mm', { locale: ptBR })}
                  </p>
                  {event.duration_minutes && (
                    <p className="text-xs text-white/80">
                      Duração: {event.duration_minutes} min
                    </p>
                  )}
                </div>
              </div>

              {/* Location */}
              {isPresencial && event.location.venue_name && (
                <div className="flex items-start gap-3 rounded-xl bg-black/30 p-4 backdrop-blur-sm border border-white/10 sm:col-span-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20">
                    <MapPin className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white/60">Local</p>
                    <p className="text-sm font-bold text-white">
                      {event.location.venue_name}
                    </p>
                    {event.location.address && (
                      <p className="text-xs text-white/80 truncate">
                        {event.location.address}
                        {event.location.neighborhood && ` - ${event.location.neighborhood}`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Online Platform */}
              {isOnline && event.location.online_platform && (
                <div className="flex items-start gap-3 rounded-xl bg-black/30 p-4 backdrop-blur-sm border border-white/10 sm:col-span-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
                    <Globe className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/60">Plataforma</p>
                    <p className="text-sm font-bold text-white">
                      {event.location.online_platform}
                    </p>
                    <p className="text-xs text-white/80">
                      Link enviado após inscrição
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Organizer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-6 flex items-center gap-3 rounded-xl bg-black/30 p-4 backdrop-blur-sm border border-white/10"
            >
              <img
                src={event.organizer.avatar_url || '/placeholder.svg'}
                alt={event.organizer.name}
                className="h-12 w-12 rounded-full border-2 border-white/20 object-cover"
              />
              <div className="flex-1">
                <p className="text-xs font-medium text-white/60">Organizado por</p>
                <p className="text-sm font-bold text-white flex items-center gap-1.5">
                  {event.organizer.name}
                  {event.organizer.verified && (
                    <CheckCircle2 className="h-4 w-4 text-blue-400" />
                  )}
                </p>
                {event.organizer.stats && (
                  <p className="text-xs text-white/70">
                    {event.organizer.stats.events_created} eventos • {event.organizer.stats.total_participants} participantes
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Actions */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="sticky top-4 rounded-2xl bg-card/95 p-6 backdrop-blur-lg border border-border shadow-2xl"
            >
              {/* Participants Count */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{event.participants_count} participantes</span>
                </div>
                {!isSoldOut && availableTickets > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {availableTickets} vagas
                  </Badge>
                )}
              </div>

              {/* Progress Bar */}
              {totalCapacity > 0 && (
                <div className="mb-6">
                  <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                    <span>Ocupação</span>
                    <span>{Math.round(occupancyRate)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${occupancyRate}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={cn(
                        "h-full rounded-full",
                        occupancyRate >= 90 ? "bg-red-500" :
                        occupancyRate >= 70 ? "bg-amber-500" :
                        "bg-primary"
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Social Actions */}
              <div className="mb-6 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onFavorite}
                  className="flex-1 gap-2"
                >
                  <Heart className={cn("h-4 w-4", isFavorited && "fill-red-500 text-red-500")} />
                  Favoritar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShare}
                  className="flex-1 gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </Button>
              </div>

              {/* Views Counter */}
              <div className="text-center text-xs text-muted-foreground">
                {event.views_count.toLocaleString('pt-BR')} visualizações
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
