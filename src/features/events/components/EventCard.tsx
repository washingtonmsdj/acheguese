/**
 * Event card
 * 
 * Card premium para listagem de eventos
 * Design inspirado em Sympla/Eventbrite
 * 
 */

import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Heart, 
  Bookmark,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Video,
  ArrowRight
} from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Event } from '../types';

interface EventCardProps {
  event: Event;
  variant?: 'default' | 'compact' | 'featured';
  onFavorite?: (eventId: string) => void;
  onClick?: (eventId: string) => void;
  isFavorited?: boolean;
  className?: string;
}

export function EventCard({ 
  event, 
  variant = 'default',
  onFavorite,
  onClick,
  isFavorited = false,
  className 
}: EventCardProps) {
  const eventDate = new Date(event.start_date);
  const isOnline = event.type === 'online' || event.type === 'hibrido';
  
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

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite?.(event.id);
  };

  const handleCardClick = () => {
    onClick?.(event.id);
  };

  // ============================================================================
  // FEATURED VARIANT
  // ============================================================================
  
  if (variant === 'featured') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
        onClick={handleCardClick}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-3xl border border-border bg-card shadow-xl transition-all hover:border-primary/50 hover:shadow-2xl",
          className
        )}
      >
        {/* Image */}
        <div className="relative aspect-[21/9] overflow-hidden">
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Badges */}
          <div className="absolute left-6 top-6 flex flex-wrap gap-2">
            <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm border-0">
              {event.category}
            </Badge>
            {event.is_free && (
              <Badge className="bg-green-500/90 text-white backdrop-blur-sm border-0 gap-1">
                <Sparkles className="h-3 w-3" />
                Gratuito
              </Badge>
            )}
            {isAlmostFull && !isSoldOut && (
              <Badge className="bg-amber-500/90 text-white backdrop-blur-sm border-0 animate-pulse">
                Ultimas vagas
              </Badge>
            )}
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/70"
          >
            <Heart className={cn("h-5 w-5", isFavorited ? "fill-red-500 text-red-500" : "text-white")} />
          </button>

          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="mb-3 text-2xl font-bold text-white line-clamp-2 leading-tight">
              {event.title}
            </h3>
            
            <div className="flex flex-wrap items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {format(eventDate, "d 'de' MMM", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {event.location.neighborhood || event.location.city}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {event.participants_count} participantes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hover Glow */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-500/10" />
        </div>
      </motion.article>
    );
  }

  // ============================================================================
  // COMPACT VARIANT
  // ============================================================================
  
  if (variant === 'compact') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        onClick={handleCardClick}
        className={cn(
          "group flex cursor-pointer gap-4 overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-lg",
          className
        )}
      >
        {/* Image */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {event.is_free && (
            <Badge className="absolute left-1 top-1 bg-green-500/90 text-white border-0 text-[10px] px-1.5 py-0.5">
              Gratis
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <h3 className="mb-1 text-sm font-bold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(eventDate, "d MMM", { locale: ptBR })}
              </span>
              <span>-</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {event.location.neighborhood || event.location.city}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {event.participants_count} participantes
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </motion.article>
    );
  }

  // ============================================================================
  // DEFAULT VARIANT
  // ============================================================================
  
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      onClick={handleCardClick}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-lg transition-all hover:border-primary/30 hover:shadow-xl",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={event.cover_image_url}
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Top Badges */}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm border-0 text-xs">
            {event.category}
          </Badge>
          {isOnline && (
            <Badge className="bg-blue-500/90 text-white backdrop-blur-sm border-0 text-xs gap-1">
              <Video className="h-3 w-3" />
              Online
            </Badge>
          )}
          {event.is_free && (
            <Badge className="bg-green-500/90 text-white backdrop-blur-sm border-0 text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              Gratuito
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/70"
        >
          <Heart className={cn("h-4 w-4", isFavorited ? "fill-red-500 text-red-500" : "text-white")} />
        </button>

        {/* Status Badge */}
        {(isAlmostFull || isSoldOut) && (
          <div className="absolute bottom-4 left-4">
            <Badge className={cn(
              "backdrop-blur-sm border-0 text-xs",
              isSoldOut ? "bg-red-500/90 text-white" : "bg-amber-500/90 text-white animate-pulse"
            )}>
              {isSoldOut ? 'Esgotado' : 'Ultimas vagas'}
            </Badge>
          </div>
        )}

        {/* Verified Organizer */}
        {event.organizer.verified && (
          <div className="absolute bottom-4 right-4">
            <div className="flex items-center gap-1 rounded-full bg-blue-600/90 px-2 py-1 text-xs text-white backdrop-blur-sm">
              <CheckCircle2 className="h-3 w-3" />
              <span className="hidden sm:inline">Verificado</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="mb-3 text-lg font-bold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {event.title}
        </h3>

        {/* Meta Info */}
        <div className="mb-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">
              {format(eventDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">
              {event.location.venue_name || event.location.neighborhood || event.location.city}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{event.participants_count} participantes</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <img
              src={event.organizer.avatar_url || '/placeholder.svg'}
              alt={event.organizer.name}
              className="h-8 w-8 rounded-full border border-border object-cover"
            />
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {event.organizer.name}
            </span>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            className="gap-2 text-primary hover:text-primary hover:bg-primary/10"
          >
            Ver detalhes
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Hover Glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5" />
      </div>
    </motion.article>
  );
}
